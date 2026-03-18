import { NextRequest } from "next/server";
import { checkAndIncrementUsage, rateLimitResponse } from "@/lib/rate-limit";
import { MODELS } from "@/lib/models";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MAX_MESSAGES = 30;

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const rateLimit = await checkAndIncrementUsage(request);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const { courseId, studiedTopics, messages, difficulty, focusAreas } =
      await request.json();

    const topicList = (studiedTopics || [])
      .filter((t: { completed: boolean }) => t.completed)
      .map(
        (t: { levelTitle: string; moduleTitle: string }) =>
          `- ${t.levelTitle}: ${t.moduleTitle}`
      )
      .join("\n");

    const focusSection =
      focusAreas && focusAreas.length > 0
        ? `\n\nThe learner wants to focus on these areas specifically: ${focusAreas.join(", ")}.`
        : "";

    const systemPrompt = `You are a technical interviewer conducting a practice interview on ${courseId.replace(/-/g, " ")} topics. Your tone is professional but encouraging — like a senior engineer who genuinely wants the candidate to succeed.

The learner has studied these topics:
${topicList || "(No topics completed yet)"}

Difficulty level: ${difficulty || "intermediate"}${focusSection}

## Interview Rules

1. **Question Format Rotation** — Rotate through these 6 formats. NEVER use the same format twice in a row:
   - Open-ended design: "How would you design..."
   - Scenario-based: "You're on-call and notice... what do you do?"
   - Trade-off analysis: "Compare approach A vs B for this situation..."
   - Estimation: "How would you estimate the storage/bandwidth/compute needed for..."
   - Debugging: "A system is experiencing X symptoms. Walk me through diagnosis..."
   - Follow-up drilling: Dig deeper into the candidate's previous answer

2. **Question Quality** — Questions must require inference and synthesis across concepts, not rote recall. Draw connections between topics the learner has studied.

3. **After Each Answer** — Provide 2-3 sentences of specific evaluation (what was strong, what was missing or could be improved), then either ask a follow-up (~40% of the time) or move to a new question.

4. **Adaptive Difficulty** — If the learner gives strong answers, increase complexity. If they struggle, provide a hint and simplify.

5. **First Message** — Introduce yourself briefly, set expectations (you'll ask a series of questions, they should think out loud), then ask your first question.

6. **When asked to end** — If the conversation includes "[END_INTERVIEW]", provide a comprehensive final evaluation with:
   - Overall performance summary (2-3 sentences)
   - **Strengths**: 3-4 specific things they did well with examples from the conversation
   - **Areas to Improve**: 3-4 specific gaps with actionable study recommendations
   - **Score**: Rate performance as one of: Needs Practice / Developing / Solid / Strong / Exceptional
   - Keep the tone constructive and motivating

Keep responses concise. Questions should be 2-4 sentences. Evaluations should be 2-3 sentences before the next question.`;

    const recentMessages = messages.slice(-MAX_MESSAGES);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELS.strong,
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages: recentMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(error, { status: response.status });
    }

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
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.text
                ) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`
                    )
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
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
