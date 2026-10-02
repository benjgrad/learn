"use client";

import { CooldownGate } from "./CooldownGate";
import { LessonLockGate } from "./LessonLockGate";
import { CourseAccessGate } from "./CourseAccessGate";

interface LessonGateWrapperProps {
  courseId: string;
  prevModulePath: string | null;
  children: React.ReactNode;
}

export function LessonGateWrapper({
  courseId,
  prevModulePath,
  children,
}: LessonGateWrapperProps) {
  return (
    <CourseAccessGate courseId={courseId}>
      <CooldownGate courseId={courseId}>
        <LessonLockGate prevModulePath={prevModulePath} course={courseId}>
          {children}
        </LessonLockGate>
      </CooldownGate>
    </CourseAccessGate>
  );
}
