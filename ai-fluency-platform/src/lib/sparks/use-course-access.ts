"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  canAccessCourse,
  unlockCourse as unlockCourseStore,
  getCourseCost,
} from "./course-access";
import { ensureUnlocksSynced } from "./unlock-sync";

export function useCourseAccess(courseId: string) {
  const { user, loading } = useAuth();
  const email = user?.email;
  const userId = user?.id;
  const [hasAccess, setHasAccess] = useState(true);
  const [cost, setCost] = useState(0);
  const [synced, setSynced] = useState(false);

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

  // Entitlements live in the database; localStorage is only a cache of them.
  // Pull it up to date before letting anything act on `hasAccess`.
  useEffect(() => {
    if (loading) return;
    let active = true;
    ensureUnlocksSynced(userId).then(() => {
      if (!active) return;
      refresh();
      setSynced(true);
    });
    return () => {
      active = false;
    };
  }, [loading, userId, refresh]);

  // SyncProvider and ensureUnlocksSynced both signal writes this way.
  useEffect(() => {
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const unlock = useCallback(
    async (unlockUserId: string) => {
      const result = await unlockCourseStore(courseId, unlockUserId, email);
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
    // False until auth has settled and the unlock list has been reconciled
    // with the server. `hasAccess` optimistically starts true to avoid
    // flashing a paywall at users who do have access, so anything that hides
    // content must wait for this before trusting `hasAccess`.
    resolved: !loading && synced,
  };
}
