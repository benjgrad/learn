// Central model configuration
// Using "-latest" aliases so the API always resolves to the newest
// non-deprecated version in each family. This prevents outages when
// date-pinned model versions are retired.

export const MODELS = {
  /** Fast / cheap — used for feedback, chat */
  fast: "claude-haiku-4-5-latest",
  /** Capable — used for interviews, complex tasks */
  strong: "claude-sonnet-4-latest",
} as const;
