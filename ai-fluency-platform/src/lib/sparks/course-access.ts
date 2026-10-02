"use client";

import type { CourseUnlock } from "@/types/sparks";
import { getEffectiveConfig } from "./config";
import { isSparkGatingEnabled } from "./feature-flags";
import {
  spendSparks,
  getBalance,
  getSparkStore,
  saveSparkStore,
  clearPendingTransaction,
} from "./store";
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

/**
 * Union the given unlocks into local storage, keeping the existing entry when
 * a course is present on both sides. Returns the unlocks that were only held
 * locally, so the caller can push them to the server.
 */
export function mergeUnlocks(incoming: CourseUnlock[]): CourseUnlock[] {
  const local = getUnlocks();
  const incomingIds = new Set(incoming.map((u) => u.courseId));
  const localOnly = local.filter((u) => !incomingIds.has(u.courseId));

  saveUnlocks([...incoming, ...localOnly]);
  return localOnly;
}

export function canAccessCourse(courseId: string, userEmail?: string | null): boolean {
  if (!isSparkGatingEnabled(userEmail)) return true;
  const config = getEffectiveConfig(userEmail);
  if (config.freeCourses.includes(courseId)) return true;
  const unlocks = getUnlocks();
  return unlocks.some((u) => u.courseId === courseId);
}

export async function unlockCourse(
  courseId: string,
  userId: string,
  userEmail?: string | null
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  // Already unlocked?
  if (canAccessCourse(courseId, userEmail)) {
    return { success: true, newBalance: getBalance() };
  }

  const cost = getCourseCost(courseId, userEmail);
  if (cost === 0) {
    // Free courses are granted by config on both client and server, so there
    // is nothing to persist -- just stop the gate from asking again.
    recordUnlock(courseId, "free", 0);
    return { success: true, newBalance: getBalance() };
  }

  const idempotencyKey = generateIdempotencyKey(userId, "course_unlock", courseId);
  const result = spendSparks(cost, "course_unlock", idempotencyKey, { courseId });

  if (!result.success) {
    return {
      success: false,
      newBalance: result.newBalance,
      error: "Not enough Sparks to unlock this course.",
    };
  }

  // Persist the entitlement. Unlocks used to live only in localStorage, which
  // meant a cleared cache or a second browser lost a course the user had paid
  // for -- the spend was recorded but the unlock was not. This route writes
  // both, and dedupes the spend on the same idempotency key, so it is safe
  // even though we already debited locally.
  try {
    const res = await fetch("/api/sparks/unlock-course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      refundLocalSpend(cost, idempotencyKey);
      return {
        success: false,
        newBalance: getBalance(),
        error: data.error ?? "Could not save your unlock. Please try again.",
      };
    }

    // The server is the source of truth for the balance now that it has
    // applied the spend.
    if (typeof data.newBalance === "number") {
      const store = getSparkStore();
      store.balance = data.newBalance;
      saveSparkStore(store);
    }
  } catch {
    refundLocalSpend(cost, idempotencyKey);
    return {
      success: false,
      newBalance: getBalance(),
      error: "Could not reach the server. Please try again.",
    };
  }

  // The spend is durable server-side; drop the pending marker so a later
  // unlock attempt for this course is not silently rejected as a duplicate.
  clearPendingTransaction(idempotencyKey);
  recordUnlock(courseId, "sparks", cost);

  return { success: true, newBalance: getBalance() };
}

function recordUnlock(
  courseId: string,
  unlockMethod: "sparks" | "free",
  sparkCost: number
): void {
  const unlocks = getUnlocks();
  if (unlocks.some((u) => u.courseId === courseId)) return;
  unlocks.push({
    courseId,
    unlockedAt: new Date().toISOString(),
    unlockMethod,
    sparkCost,
  });
  saveUnlocks(unlocks);
}

function refundLocalSpend(cost: number, idempotencyKey: string): void {
  const store = getSparkStore();
  store.balance += cost;
  store.lifetimeSpent = Math.max(0, store.lifetimeSpent - cost);
  saveSparkStore(store);
  clearPendingTransaction(idempotencyKey);
}
