"use client";

import type { CourseUnlock } from "@/types/sparks";
import { mergeUnlocks } from "./course-access";

// One in-flight sync per signed-in user. Several gates can mount at once on a
// lesson page and they all need the same answer.
let inFlight: { userId: string; promise: Promise<void> } | null = null;

/**
 * Reconcile course entitlements with the database.
 *
 * Unlocks were historically written to localStorage only, so the two sides can
 * disagree in both directions: the server holds courses this browser has never
 * seen, and this browser may hold legacy unlocks that were never persisted.
 * Union them and push anything the server is missing.
 */
export function ensureUnlocksSynced(userId: string | null | undefined): Promise<void> {
  if (!userId) return Promise.resolve();
  if (inFlight?.userId === userId) return inFlight.promise;

  const promise = (async () => {
    try {
      const res = await fetch("/api/sparks/unlock-course");
      if (!res.ok) return;

      const data = await res.json();
      const serverUnlocks: CourseUnlock[] = data.unlocks ?? [];
      const localOnly = mergeUnlocks(serverUnlocks);

      // Only purchased unlocks are worth pushing up -- free courses are
      // granted by config and need no row. `reconcileOnly` makes the server
      // refuse to spend, so an unattended sync can never charge anyone.
      await Promise.all(
        localOnly
          .filter((u) => u.unlockMethod === "sparks")
          .map((u) =>
            fetch("/api/sparks/unlock-course", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ courseId: u.courseId, reconcileOnly: true }),
            }).catch(() => {})
          )
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    } catch {
      // Best-effort: fall back to whatever is in localStorage. The server
      // check on /learn is the real gate, so a failed sync cannot grant access
      // that the user does not have.
    }
  })();

  inFlight = { userId, promise };
  return promise;
}
