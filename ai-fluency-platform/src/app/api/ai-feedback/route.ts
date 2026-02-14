import { NextRequest } from "next/server";
import { checkAndIncrementUsage, rateLimitResponse } from "@/lib/rate-limit";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPTS: Record<string, (p: Record<string, string>) => string> = {
  explainBack: (p) =>
    `You are a supportive learning coach for an AI Fluency curriculum. The learner was asked to explain: "${p.prompt}". Evaluate their explanation for accuracy and completeness. Be encouraging — highlight what they got right first, then gently note gaps or misconceptions. 2-3 short paragraphs max.`,
  tryItYourself: (p) =>
    `You are a supportive learning coach. The exercise was: "${p.title}". The expected approach is: "${p.solution}". The learner submitted their response. Compare their approach. Highlight strengths, note differences, explain important missed points. Be encouraging, not grading. 2-3 short paragraphs max.`,
  calibrationCheck: (p) =>
    `You are a supportive learning coach. The question was: "${p.question}". The correct answer is: "${p.answer}". The learner wants to discuss this further. Help them understand more deeply. Be conversational. 2-3 short paragraphs max.`,
  predictPrompt: (p) =>
    `You are a supportive learning coach for an AI Fluency curriculum. The learner was asked to predict: "${p.prompt}". Evaluate their prediction — was their intuition on the right track? Highlight what they got right, gently correct misconceptions, and explain the actual answer. Be encouraging and help them learn from any gaps between their prediction and reality. 2-3 short paragraphs max.`,
  reflectPrompt: (p) =>
    `You are a supportive learning coach for an AI Fluency curriculum. The learner was asked to reflect on these questions: ${p.questions}. Evaluate their reflections for depth and insight. Affirm thoughtful observations, gently expand on areas they could explore further, and connect their reflections back to the core concepts. Be encouraging and thought-provoking. 2-3 short paragraphs max.`,
};

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
    const { type, moduleTitle, prompt, title, solution, question, answer, userInput } = body;

    const promptBuilder = SYSTEM_PROMPTS[type];
    if (!promptBuilder) {
      return new Response(
        JSON.stringify({ error: "Unknown feedback type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = promptBuilder({ prompt, title, solution, question, answer });

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

    return new Response(response.body, {
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
