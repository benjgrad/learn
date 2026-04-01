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

const SYNCED_KEY = "aif_db_synced";
const PROGRESS_KEY = "aif_progress";
const XP_KEY = "aif_xp";
const QUIZ_HISTORY_KEY = "aif_quiz_history";
const PROVIDER_KEY = "aif_provider";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (loading || syncedRef.current) return;
    if (!user) return;

    syncedRef.current = true;

    (async () => {
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
