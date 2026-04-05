"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  canAccessCourse,
  unlockCourse as unlockCourseStore,
  getCourseCost,
} from "./course-access";

export function useCourseAccess(courseId: string) {
  const { user } = useAuth();
  const email = user?.email;
  const [hasAccess, setHasAccess] = useState(true);
  const [cost, setCost] = useState(0);

  const refresh = useCallback(() => {
    setHasAccess(canAccessCourse(courseId, email));
    setCost(getCourseCost(courseId, email));
  }, [courseId, email]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unlock = useCallback(
    (userId: string) => {
      const result = unlockCourseStore(courseId, userId, email);
      if (result.success) {
        setHasAccess(true);
      }
      return result;
    },
    [courseId, email]
  );

  return {
    hasAccess,
    cost,
    unlock,
  };
}
