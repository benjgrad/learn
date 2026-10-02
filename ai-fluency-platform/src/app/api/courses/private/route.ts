import { getViewablePrivateCourses } from "@/lib/private-courses";

/** The viewer's private courses: empty for everyone but the owner. */
export async function GET() {
  return Response.json(await getViewablePrivateCourses(), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
