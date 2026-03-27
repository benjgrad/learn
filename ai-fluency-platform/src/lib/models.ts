// Model resolution is now handled dynamically by src/lib/anthropic.ts
// which queries the Anthropic Models API, with env var and hardcoded fallbacks.
//
// API routes should use streamAnthropicResponse({ tier: "fast" | "strong", ... })
// instead of referencing model IDs directly.

export type ModelTier = "fast" | "strong";
