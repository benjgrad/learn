import type { ReviewQuestion } from "@/types/review";

/**
 * Every review question this viewer may see: the public static file plus any
 * private courses' questions, which only the owner receives from the API.
 * A failed private fetch degrades to public-only rather than failing the quiz.
 */
export async function loadReviewQuestions(): Promise<ReviewQuestion[]> {
  const [publicRes, privateRes] = await Promise.all([
    fetch("/review-questions.json"),
    fetch("/api/review-questions/private").catch(() => null),
  ]);
  if (!publicRes.ok) throw new Error(`review-questions.json: ${publicRes.status}`);
  const questions: ReviewQuestion[] = await publicRes.json();
  if (privateRes?.ok) {
    questions.push(...((await privateRes.json()) as ReviewQuestion[]));
  }
  return questions;
}
