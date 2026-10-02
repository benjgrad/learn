import { getCurriculum } from "@/lib/content";
import { canViewCourse } from "@/lib/private-courses";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ course: string }> }
) {
  const { course } = await params;
  // Same 404 as a missing course, so a private course's existence isn't revealed.
  if (!(await canViewCourse(course))) {
    return Response.json({ error: "Course not found" }, { status: 404 });
  }
  try {
    const curriculum = getCurriculum(course);
    return Response.json(curriculum);
  } catch {
    return Response.json({ error: "Course not found" }, { status: 404 });
  }
}
