"use client";

import { CooldownGate } from "./CooldownGate";
import { LessonLockGate } from "./LessonLockGate";

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
    <CooldownGate courseId={courseId}>
      <LessonLockGate prevModulePath={prevModulePath} course={courseId}>
        {children}
      </LessonLockGate>
    </CooldownGate>
  );
}
