import { NextRequest } from "next/server";
import { checkAndIncrementUsage, rateLimitResponse } from "@/lib/rate-limit";
import { streamAnthropicResponse, AnthropicError } from "@/lib/anthropic";

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

    const { response } = await streamAnthropicResponse({
      tier: "fast",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Module: ${moduleTitle}\n\nMy response:\n${userInput}`,
        },
      ],
    });

    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set(
      "X-RateLimit-Authenticated",
      String(rateLimit.authenticated)
    );

    return response;
  } catch (error) {
    if (error instanceof AnthropicError) {
      return new Response(error.message, { status: error.status });
    }
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
