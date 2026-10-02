import { getCourses } from "@/lib/content";
import { getViewablePrivateCourses } from "@/lib/private-courses";

export async function GET() {
  const courses = [...getCourses(), ...(await getViewablePrivateCourses())];
  return Response.json(courses);
}
