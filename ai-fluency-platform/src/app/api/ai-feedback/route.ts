import { NextRequest } from "next/server";
import { checkAndIncrementUsage, rateLimitResponse } from "@/lib/rate-limit";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function buildSystemPrompt(
  type: string,
  params: Record<string, string>,
  courseName?: string
): string | null {
  const courseLabels: Record<string, string> = {
    "ai-fluency": "AI Fluency",
    "cfa-1": "CFA Level I",
    "cfa-2": "CFA Level II",
    "cfa-3": "CFA Level III",
  };
  const courseLabel = courseLabels[courseName || ""] || "learning";

  const prompts: Record<string, (p: Record<string, string>) => string> = {
    explainBack: (p) =>
      `You are a supportive learning coach for a ${courseLabel} curriculum. The learner was asked to explain: "${p.prompt}". Evaluate their explanation for accuracy and completeness. Always start by acknowledging what they got right. If their explanation is strong, affirm it and add a deeper insight, related concept, or practical tip they might not have considered. If there are gaps or misconceptions, gently address them. Always give substantive feedback — never just "correct" or "good job" alone. 2-3 short paragraphs max.`,
    tryItYourself: (p) =>
      `You are a supportive learning coach for a ${courseLabel} curriculum. The exercise was: "${p.title}". The expected approach is: "${p.solution}". The learner submitted their response. Compare their approach. Always start by highlighting strengths in their approach. If it's strong, affirm what they did well and share an additional insight, edge case, or refinement they could consider. Note meaningful differences from the expected approach and explain why they matter. Always give substantive feedback — never just "correct" or "good job" alone. Be encouraging, not grading. 2-3 short paragraphs max.`,
    calibrationCheck: (p) =>
      `You are a supportive learning coach for a ${courseLabel} curriculum. The question was: "${p.question}". The correct answer is: "${p.answer}". The learner wants to discuss this further. Help them understand more deeply. Be conversational. Always provide a substantive response that deepens their understanding. 2-3 short paragraphs max.`,
    predictPrompt: (p) =>
      `You are a supportive learning coach for a ${courseLabel} curriculum. The learner was asked to predict: "${p.prompt}". Evaluate their prediction — was their intuition on the right track? Always start by highlighting what they got right. If their prediction was accurate, affirm it and expand with a deeper insight, real-world example, or nuance they might find interesting. If there were misconceptions, gently correct them and explain the actual answer. Always give substantive feedback — never just "correct" or "good job" alone. Be encouraging and help them learn. 2-3 short paragraphs max.`,
    reflectPrompt: (p) =>
      `You are a supportive learning coach for a ${courseLabel} curriculum. The learner was asked to reflect on these questions: ${p.questions}. Evaluate their reflections for depth and insight. Always start by affirming thoughtful observations. If their reflections are strong, expand on them with deeper connections, real-world applications, or thought-provoking follow-up ideas. Gently expand on areas they could explore further, and connect their reflections back to the core concepts. Always give substantive feedback — never just "good reflection" alone. Be encouraging and thought-provoking. 2-3 short paragraphs max.`,
    practiceSet: (p) =>
      `You are a supportive exam tutor for a ${courseLabel} curriculum. The learner just answered a practice problem. The question was: "${p.question}". The correct answer is: "${p.correctAnswer}". The full explanation is: "${p.explanation}". The learner selected: "${p.userAnswer}". Help them understand why the correct answer is right. If they got it wrong, explain the specific misconception their answer represents. Use the Socratic method — guide them to the insight rather than just stating it. 2-3 short paragraphs max.`,
  };

  const builder = prompts[type];
  return builder ? builder(params) : null;
}

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limiting
  const rateLimit = await checkAndIncrementUsage(request);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const body = await request.json();
    const {
      type,
      moduleTitle,
      courseName,
      prompt,
      title,
      solution,
      question,
      answer,
      correctAnswer,
      explanation,
      userAnswer,
      userInput,
    } = body;

    const systemPrompt = buildSystemPrompt(
      type,
      { prompt, title, solution, question, answer, questions: question, correctAnswer, explanation, userAnswer },
      courseName
    );

    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Unknown feedback type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Module: ${moduleTitle}\n\nMy response:\n${userInput}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(error, { status: response.status });
    }

    // Transform Anthropic SSE stream to our expected format
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close();
          return;
        }
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`)
                  );
                }
              } catch {
                // skip non-JSON lines
              }
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Authenticated": String(rateLimit.authenticated),
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
