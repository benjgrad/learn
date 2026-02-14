"use client";

export class RateLimitError extends Error {
  authenticated: boolean;
  limit: number;

  constructor(body: { authenticated: boolean; limit: number }) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
    this.authenticated = body.authenticated;
    this.limit = body.limit;
  }
}

let lastRemainingUses: number | null = null;

export function getLastRemainingUses(): number | null {
  return lastRemainingUses;
}

export async function streamAIResponse(
  endpoint: string,
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  onDone?: () => void
): Promise<void> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    const errorBody = await response.json();
    throw new RateLimitError(errorBody);
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI request failed: ${error}`);
  }

  // Track remaining uses from response headers
  const remaining = response.headers.get("X-RateLimit-Remaining");
  if (remaining !== null) {
    lastRemainingUses = parseInt(remaining, 10);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    // Parse SSE format
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") {
          onDone?.();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            onChunk(parsed.text);
          }
        } catch {
          // If not JSON, treat as raw text
          onChunk(data);
        }
      }
    }
  }

  onDone?.();
}
