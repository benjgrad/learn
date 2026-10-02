"use client";

import { CourseLockedBanner } from "./CourseLockedBanner";
import { useCourseAccess } from "@/lib/sparks/use-course-access";

interface CourseAccessWrapperProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  children: React.ReactNode;
}

export function CourseAccessWrapper({
  courseId,
  courseTitle,
  courseDescription,
  children,
}: CourseAccessWrapperProps) {
  const { hasAccess, resolved } = useCourseAccess(courseId);
  const locked = resolved && !hasAccess;

  // The outline is always browsable. Only the unlock CTA is conditional --
  // lesson access itself is enforced on the /learn route by CourseAccessGate.
  return (
    <>
      {locked && (
        <CourseLockedBanner
          courseId={courseId}
          courseTitle={courseTitle}
          courseDescription={courseDescription}
        />
      )}
      {children}
    </>
  );
}
