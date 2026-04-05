const GATED_EMAILS = ["ben@grady.cloud"];

export function isSparkGatingEnabled(email: string | null | undefined): boolean {
  return !!email && GATED_EMAILS.includes(email);
}

export const LESSON_SKIP_COST = 10;
export const PRACTICE_SKIP_COST = 15;
