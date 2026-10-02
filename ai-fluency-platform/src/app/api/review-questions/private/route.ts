import fs from "fs";
import path from "path";
import type { ReviewQuestion } from "@/types/review";
import { getViewablePrivateCourses } from "@/lib/private-courses";

const PRIVATE_QUESTIONS = path.join(process.cwd(), "content", "private-review-questions.json");

/**
 * Review questions for the private courses this viewer may see. Everyone else
 * gets an empty list, which the quiz merges as a no-op. /api/* is NetworkOnly
 * in the service worker, so these are never cached on a shared device.
 */
export async function GET() {
  const courses = await getViewablePrivateCourses();
  if (courses.length === 0 || !fs.existsSync(PRIVATE_QUESTIONS)) {
    return Response.json([]);
  }
  const allowed = new Set(courses.map((c) => c.id));
  const questions: ReviewQuestion[] = JSON.parse(fs.readFileSync(PRIVATE_QUESTIONS, "utf-8"));
  return Response.json(questions.filter((q) => allowed.has(q.courseId)), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
