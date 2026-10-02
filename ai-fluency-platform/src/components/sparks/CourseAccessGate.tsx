"use client";

import { useCourseAccess } from "@/lib/sparks/use-course-access";
import { CoursePaywall } from "./CoursePaywall";
import coursesData from "../../../content/courses.json";
import type { CourseInfo } from "@/types/content";

const courses = coursesData as CourseInfo[];

interface CourseAccessGateProps {
  courseId: string;
  children: React.ReactNode;
}

/**
 * Client-side entitlement gate for soft navigations. The authoritative check
 * runs on the server in src/app/learn/[...slug]/page.tsx -- this only keeps a
 * client-routed lesson from flashing before that check has run.
 */
export function CourseAccessGate({ courseId, children }: CourseAccessGateProps) {
  const { hasAccess, resolved } = useCourseAccess(courseId);

  // `hasAccess` starts optimistically true, so rendering children before the
  // unlock list settles would flash the lesson to someone without access.
  if (!resolved) return null;
  if (hasAccess) return <>{children}</>;

  const info = courses.find((c) => c.id === courseId);

  return (
    <CoursePaywall
      courseId={courseId}
      courseTitle={info?.title || courseId}
      courseDescription={info?.description || ""}
    />
  );
}
