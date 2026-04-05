"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  canAccessCourse,
  unlockCourse as unlockCourseStore,
  getCourseCost,
} from "./course-access";

export function useCourseAccess(courseId: string) {
  const { user, loading } = useAuth();
  const email = user?.email;
  const [hasAccess, setHasAccess] = useState(true);
  const [cost, setCost] = useState(0);

  const refresh = useCallback(() => {
    // Don't gate until we know who the user is
    if (loading) {
      setHasAccess(true);
      setCost(0);
      return;
    }
    setHasAccess(canAccessCourse(courseId, email));
    setCost(getCourseCost(courseId, email));
  }, [courseId, email, loading]);

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
