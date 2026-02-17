import { NextRequest } from "next/server";
import { checkAndIncrementUsage, rateLimitResponse } from "@/lib/rate-limit";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MAX_MESSAGES = 20;

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
        messages: recentMessages,
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
