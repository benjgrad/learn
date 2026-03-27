import { NextRequest } from "next/server";
import { checkAndIncrementUsage, rateLimitResponse } from "@/lib/rate-limit";
import { streamAnthropicResponse, AnthropicError } from "@/lib/anthropic";

const MAX_MESSAGES = 20;

export async function POST(request: NextRequest) {
  const rateLimit = await checkAndIncrementUsage(request);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const { moduleTitle, levelTitle, courseName, messages } =
      await request.json();

    const courseLabels: Record<string, string> = {
      "ai-fluency": "AI Fluency",
      "cfa-1": "CFA Level I",
      "cfa-2": "CFA Level II",
      "cfa-3": "CFA Level III",
    };
    const courseLabel = courseLabels[courseName || ""] || "learning";
    const isCfa = courseName?.startsWith("cfa-");
    const courseExtra = isCfa
      ? " Use CFA Institute terminology and standards where appropriate. You may generate additional practice problems if the learner requests them."
      : "";

    const systemPrompt = `You are a helpful learning assistant for the ${courseLabel} curriculum. The learner is studying "${moduleTitle}" in "${levelTitle}". Answer questions about this topic. If they ask about unrelated topics, gently redirect them back to the module content. Keep responses concise and educational.${courseExtra}`;

    const recentMessages = messages.slice(-MAX_MESSAGES);

    const { response } = await streamAnthropicResponse({
      tier: "fast",
      max_tokens: 1024,
      system: systemPrompt,
      messages: recentMessages,
    });

    // Add rate limit headers to the stream response
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
