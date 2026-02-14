// Supabase Edge Function: AI Feedback
// Proxies requests to Claude API for exercise feedback

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const SYSTEM_PROMPTS: Record<string, (p: Record<string, string>) => string> = {
  explainBack: (p) =>
    `You are a supportive learning coach for an AI Fluency curriculum. The learner was asked to explain: "${p.prompt}". Evaluate their explanation for accuracy and completeness. Be encouraging — highlight what they got right first, then gently note gaps or misconceptions. 2-3 short paragraphs max.`,
  tryItYourself: (p) =>
    `You are a supportive learning coach. The exercise was: "${p.title}". The expected approach is: "${p.solution}". The learner submitted their response. Compare their approach. Highlight strengths, note differences, explain important missed points. Be encouraging, not grading. 2-3 short paragraphs max.`,
  calibrationCheck: (p) =>
    `You are a supportive learning coach. The question was: "${p.question}". The correct answer is: "${p.answer}". The learner wants to discuss this further. Help them understand more deeply. Be conversational. 2-3 short paragraphs max.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { type, moduleTitle, prompt, title, solution, question, answer, userInput } =
      await req.json();

    const promptBuilder = SYSTEM_PROMPTS[type];
    if (!promptBuilder) {
      return new Response(JSON.stringify({ error: "Unknown feedback type" }), {
        status: 400,
      });
    }

    const systemPrompt = promptBuilder({ prompt, title, solution, question, answer });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY!,
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

    // Stream the response back as SSE
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
    });
  }
});
