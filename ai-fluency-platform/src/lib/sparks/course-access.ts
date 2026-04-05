"use client";

import type { CourseUnlock } from "@/types/sparks";
import { SPARK_CONFIG, getEffectiveConfig } from "./config";
import { isSparkGatingEnabled } from "./feature-flags";
import { spendSparks, getBalance } from "./store";
import { syncSparkSpend } from "./db-sync";
import { generateIdempotencyKey } from "./idempotency";

const UNLOCKS_KEY = "aif_course_unlocks";

function getUnlocks(): CourseUnlock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(UNLOCKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted data
  }
  return [];
}

function saveUnlocks(unlocks: CourseUnlock[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(UNLOCKS_KEY, JSON.stringify(unlocks));
}

export function getCourseCost(courseId: string, userEmail?: string | null): number {
  const config = getEffectiveConfig(userEmail);
  if (config.freeCourses.includes(courseId)) return 0;
  return config.coursePrices[courseId] ?? 0;
}

export function getUnlockedCourses(): CourseUnlock[] {
  return getUnlocks();
}

export function canAccessCourse(courseId: string, userEmail?: string | null): boolean {
  if (!isSparkGatingEnabled(userEmail)) return true;
  const config = getEffectiveConfig(userEmail);
  if (config.freeCourses.includes(courseId)) return true;
  const unlocks = getUnlocks();
  return unlocks.some((u) => u.courseId === courseId);
}

export function unlockCourse(
  courseId: string,
  userId: string,
  userEmail?: string | null
): { success: boolean; newBalance: number } {
  // Already unlocked?
  if (canAccessCourse(courseId, userEmail)) {
    return { success: true, newBalance: getBalance() };
  }

  const cost = getCourseCost(courseId, userEmail);
  if (cost === 0) {
    // Free course — just record the unlock
    const unlocks = getUnlocks();
    unlocks.push({
      courseId,
      unlockedAt: new Date().toISOString(),
      unlockMethod: "free",
      sparkCost: 0,
    });
    saveUnlocks(unlocks);
    return { success: true, newBalance: getBalance() };
  }

  const idempotencyKey = generateIdempotencyKey(userId, "course_unlock", courseId);
  const result = spendSparks(cost, "course_unlock", idempotencyKey, { courseId });

  if (result.success) {
    const unlocks = getUnlocks();
    unlocks.push({
      courseId,
      unlockedAt: new Date().toISOString(),
      unlockMethod: "sparks",
      sparkCost: cost,
    });
    saveUnlocks(unlocks);

    syncSparkSpend("course_unlock", cost, idempotencyKey, { courseId });
  }

  return result;
}
