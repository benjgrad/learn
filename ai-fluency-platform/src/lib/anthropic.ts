import { logger } from "./logger";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1";

const HARDCODED_FALLBACKS: Record<string, string> = {
  fast: "claude-haiku-4-5-20251001",
  strong: "claude-sonnet-4-20250514",
};

// In-memory cache for resolved model IDs
let modelCache: { fast: string; strong: string } | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface ModelInfo {
  id: string;
  display_name: string;
  created_at: string;
}

async function fetchActiveModels(): Promise<ModelInfo[]> {
  const response = await fetch(`${ANTHROPIC_API_URL}/models?limit=1000`, {
    headers: {
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!response.ok) {
    throw new Error(`Models API returned ${response.status}`);
  }

  const body = await response.json();
  return body.data as ModelInfo[];
}

function pickLatest(models: ModelInfo[], family: string): string | null {
  const matches = models
    .filter((m) => m.id.includes(family))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return matches[0]?.id ?? null;
}

async function resolveModelsFromAPI(): Promise<{ fast: string; strong: string } | null> {
  try {
    const models = await fetchActiveModels();
    const fast = pickLatest(models, "haiku");
    const strong = pickLatest(models, "sonnet");
    if (fast && strong) {
      return { fast, strong };
    }
    logger.warn("model_resolution_incomplete", {
      fast: fast ?? "not found",
      strong: strong ?? "not found",
    });
    return null;
  } catch (err) {
    logger.error("models_api_failed", { error: String(err) });
    return null;
  }
}

export async function resolveModel(tier: "fast" | "strong"): Promise<string> {
  // 1. Check cache
  if (modelCache && Date.now() < cacheExpiresAt) {
    return modelCache[tier];
  }

  // 2. Try Models API
  const resolved = await resolveModelsFromAPI();
  if (resolved) {
    modelCache = resolved;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    logger.info("models_resolved", { source: "api", ...resolved });
    return resolved[tier];
  }

  // 3. Fall back to env var
  const envKey = tier === "fast" ? "AI_MODEL_FAST" : "AI_MODEL_STRONG";
  const envModel = process.env[envKey];
  if (envModel) {
    logger.warn("model_fallback", { source: "env", tier, model: envModel });
    return envModel;
  }

  // 4. Fall back to hardcoded
  const hardcoded = HARDCODED_FALLBACKS[tier];
  logger.warn("model_fallback", { source: "hardcoded", tier, model: hardcoded });
  return hardcoded;
}

export interface AnthropicStreamOptions {
  tier: "fast" | "strong";
  max_tokens: number;
  system: string;
  messages: Array<{ role: string; content: string }>;
}

export async function streamAnthropicResponse(
  options: AnthropicStreamOptions
): Promise<{ response: Response; model: string }> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const model = await resolveModel(options.tier);
  const startTime = Date.now();

  const response = await fetch(`${ANTHROPIC_API_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.max_tokens,
      stream: true,
      system: options.system,
      messages: options.messages,
    }),
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("anthropic_request_failed", {
      model,
      tier: options.tier,
      status: response.status,
      latencyMs,
      error: errorBody,
    });
    throw new AnthropicError(errorBody, response.status);
  }

  logger.info("anthropic_request", {
    model,
    tier: options.tier,
    status: response.status,
    latencyMs,
  });

  // Transform Anthropic SSE stream to simplified format
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

  return {
    response: new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    }),
    model,
  };
}

export class AnthropicError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
