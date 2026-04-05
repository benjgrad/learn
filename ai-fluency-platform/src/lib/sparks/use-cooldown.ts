"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { isSparkGatingEnabled } from "./feature-flags";
import {
  getCooldownState,
  recordLessonUsed,
  skipCooldown,
  getTimeRemaining,
} from "./cooldown";

export function useCooldown(courseId: string) {
  const { user } = useAuth();
  const email = user?.email;
  const gated = isSparkGatingEnabled(email);

  const [canAccess, setCanAccess] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lessonsUsedToday, setLessonsUsedToday] = useState(0);

  const refresh = useCallback(() => {
    if (!gated) {
      setCanAccess(true);
      setTimeRemaining(0);
      setLessonsUsedToday(0);
      return;
    }
    const state = getCooldownState(courseId);
    const remaining = getTimeRemaining(courseId);
    setTimeRemaining(remaining);
    setLessonsUsedToday(state?.lessonsUsedToday ?? 0);
    setCanAccess(remaining <= 0);
  }, [courseId, gated]);

  useEffect(() => {
    refresh();
    if (!gated) return;
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [refresh, gated]);

  const recordUsed = useCallback(() => {
    if (!gated) return;
    recordLessonUsed(courseId, email);
    refresh();
  }, [courseId, email, gated, refresh]);

  const skip = useCallback(
    (userId: string) => {
      if (!gated) return { success: true, newBalance: 0 };
      const result = skipCooldown(courseId, userId, email);
      if (result.success) {
        refresh();
      }
      return result;
    },
    [courseId, email, gated, refresh]
  );

  return {
    canAccess,
    timeRemaining,
    lessonsUsedToday,
    recordUsed,
    skip,
  };
}
