/**
 * What an MCP client can read once a user grants it access. Shown on the OAuth
 * consent screen and again in settings -- one list so the promise made at
 * consent time and the description afterwards cannot drift apart.
 */
export const TOOL_SUMMARY = [
  "Your course progress and completed lessons",
  "The curriculum catalogue and lesson content",
  "Your review questions and spaced-repetition schedule",
  "Your past exercise responses and the AI feedback on them",
] as const;
