"use client";

import { useCourseAccess } from "@/lib/sparks/use-course-access";
import { CoursePaywall } from "./CoursePaywall";

interface CourseUnlockGateProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  children: React.ReactNode;
}

export function CourseUnlockGate({
  courseId,
  courseTitle,
  courseDescription,
  children,
}: CourseUnlockGateProps) {
  const { hasAccess, resolved } = useCourseAccess(courseId);

  if (!resolved) return null;
  if (hasAccess) return <>{children}</>;

  return (
    <CoursePaywall
      courseId={courseId}
      courseTitle={courseTitle}
      courseDescription={courseDescription}
    />
  );
}
