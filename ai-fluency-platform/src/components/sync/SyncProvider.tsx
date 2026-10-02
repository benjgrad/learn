"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import type { ModuleProgressState } from "@/types/progress";
import type { XpStore, QuizHistoryEntry, QuestionRecord } from "@/types/review";
import {
  mergeModuleProgress,
  mergeXpData,
  mergeQuizQuestionHistory,
} from "@/lib/store/merge-utils";
import { ensureUnlocksSynced } from "@/lib/sparks/unlock-sync";

const SYNCED_KEY = "aif_db_synced";
const PROGRESS_KEY = "aif_progress";
const XP_KEY = "aif_xp";
const QUIZ_HISTORY_KEY = "aif_quiz_history";
const PROVIDER_KEY = "aif_provider";
const SPARKS_KEY = "aif_sparks";
const STREAK_KEY = "aif_streak_v2";
const ACHIEVEMENTS_KEY = "aif_achievements";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (loading || syncedRef.current) return;
    if (!user) return;

    syncedRef.current = true;

    (async () => {
      // Course entitlements first, and outside the block below: they are what
      // stands between a paying user and their courses, so a failing
      // /api/user-data must not skip them.
      await ensureUnlocksSynced(user.id);

      try {
        // 1. Fetch all DB state
        const res = await fetch("/api/user-data");
        if (!res.ok) return;
        const dbData = await res.json();

        // 2. Read localStorage
        const localProgress = safeJsonParse(localStorage.getItem(PROGRESS_KEY));
        const localXp = safeJsonParse(localStorage.getItem(XP_KEY));
        const localQuizHistory = safeJsonParse(
          localStorage.getItem(QUIZ_HISTORY_KEY)
        );
        const localProvider = localStorage.getItem(PROVIDER_KEY);

        // 3. Deep-merge: union of both sides, never lose progress
        const mergedModules = mergeModuleProgress(
          ((localProgress?.modules as Record<string, ModuleProgressState>) || {}),
          ((dbData.progress?.modules as Record<string, ModuleProgressState>) || {})
        );

        const mergedXp = mergeXpData(
          localXp as XpStore | null,
          dbData.xp || null,
          ((localXp as XpStore | null)?.quizHistory || []) as QuizHistoryEntry[],
          (dbData.quizSessions || []) as QuizHistoryEntry[]
        );

        const mergedQuestions = mergeQuizQuestionHistory(
          ((localQuizHistory?.questions as Record<string, QuestionRecord>) || {}),
          ((dbData.quizHistory?.questions as Record<string, QuestionRecord>) || {})
        );

        // 4. Write merged state to localStorage (preserve migration flags)
        localStorage.setItem(
          PROGRESS_KEY,
          JSON.stringify({ ...localProgress, modules: mergedModules })
        );
        localStorage.setItem(XP_KEY, JSON.stringify(mergedXp));
        localStorage.setItem(
          QUIZ_HISTORY_KEY,
          JSON.stringify({ questions: mergedQuestions })
        );

        if (dbData.provider && dbData.provider !== "claude-code") {
          localStorage.setItem(PROVIDER_KEY, dbData.provider);
        }

        // 5. Push merged state back to DB so both sides stay in sync
        fetch("/api/user-data/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            progress: { modules: mergedModules },
            xp: mergedXp,
            quizHistory: { questions: mergedQuestions },
            provider: localProvider || dbData.provider || "claude-code",
          }),
        }).catch(() => {});

        // ── Restore Sparks economy data from server on fresh install ──

        // Sparks balance
        try {
          const localSparks = safeJsonParse(localStorage.getItem(SPARKS_KEY));
          const isFreshSparks =
            !localSparks || localSparks.balance === 1000;

          if (isFreshSparks) {
            const sparksRes = await fetch("/api/sparks/balance");
            if (sparksRes.ok) {
              const sparksData = await sparksRes.json();
              // Only restore if server has non-default data
              if (
                sparksData.balance !== undefined &&
                (sparksData.lifetimeEarned > 1000 ||
                  sparksData.lifetimeSpent > 0 ||
                  sparksData.balance !== 1000)
              ) {
                localStorage.setItem(
                  SPARKS_KEY,
                  JSON.stringify({
                    balance: sparksData.balance ?? 1000,
                    lifetimeEarned: sparksData.lifetimeEarned ?? 1000,
                    lifetimeSpent: sparksData.lifetimeSpent ?? 0,
                    pendingTransactions: [],
                  })
                );
              }
            }
          }
        } catch {
          // Best-effort
        }

        // Streak state
        try {
          const localStreak = safeJsonParse(localStorage.getItem(STREAK_KEY));
          const isFreshStreak =
            !localStreak || localStreak.currentStreak === 0;

          if (isFreshStreak) {
            const streakRes = await fetch("/api/sparks/streak");
            if (streakRes.ok) {
              const streakData = await streakRes.json();
              if (
                streakData.currentStreak > 0 ||
                streakData.longestStreak > 0
              ) {
                localStorage.setItem(
                  STREAK_KEY,
                  JSON.stringify({
                    currentStreak: streakData.currentStreak ?? 0,
                    longestStreak: streakData.longestStreak ?? 0,
                    lastActivityDate: streakData.lastActivityDate ?? null,
                    freezesRemaining: streakData.freezesRemaining ?? 0,
                    graceDaysUsed: streakData.graceDaysUsed ?? 0,
                    streakAtGraceStart: 0,
                  })
                );
              }
            }
          }
        } catch {
          // Best-effort
        }

        // Achievements
        try {
          const localAchievements = safeJsonParse(
            localStorage.getItem(ACHIEVEMENTS_KEY)
          );
          const isFreshAchievements =
            !localAchievements ||
            (Array.isArray(localAchievements)
              ? localAchievements.length === 0
              : true);

          if (isFreshAchievements) {
            const achievementsRes = await fetch("/api/sparks/achievements");
            if (achievementsRes.ok) {
              const achievementsData = await achievementsRes.json();
              const earned = (achievementsData.achievements ?? [])
                .filter(
                  (a: { earned: boolean }) => a.earned
                )
                .map(
                  (a: { id: string; earnedAt: string | null }) => ({
                    achievementId: a.id,
                    earnedAt: a.earnedAt ?? new Date().toISOString(),
                  })
                );

              if (earned.length > 0) {
                localStorage.setItem(
                  ACHIEVEMENTS_KEY,
                  JSON.stringify(earned)
                );
              }
            }
          }
        } catch {
          // Best-effort
        }

        localStorage.setItem(SYNCED_KEY, "true");

        // Trigger re-render in components that listen for storage changes
        window.dispatchEvent(new Event("storage"));
      } catch {
        // Sync is best-effort — app works fine with localStorage alone
      }
    })();
  }, [user, loading]);

  return <>{children}</>;
}

function safeJsonParse(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
