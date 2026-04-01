import type {
  ModuleProgressState,
  InteractionState,
} from "@/types/progress";
import type { XpStore, QuizHistoryEntry, QuestionRecord } from "@/types/review";

// --- Module Progress ---

function mergeInteraction(
  local: InteractionState | undefined,
  db: InteractionState | undefined
): InteractionState {
  if (!local) return db!;
  if (!db) return local;

  // If only one side is completed, take it
  if (local.completed && !db.completed) return local;
  if (db.completed && !local.completed) return db;

  // Both completed — keep the earlier completedAt (first completion)
  if (local.completedAt && db.completedAt) {
    return local.completedAt <= db.completedAt ? local : db;
  }
  return local.completedAt ? local : db;
}

function mergeModule(
  local: ModuleProgressState | undefined,
  db: ModuleProgressState | undefined
): ModuleProgressState {
  if (!local) return db!;
  if (!db) return local;

  // Merge interactions at the key level
  const allKeys = new Set([
    ...Object.keys(local.interactions),
    ...Object.keys(db.interactions),
  ]);
  const interactions: Record<string, InteractionState> = {};
  for (const key of allKeys) {
    interactions[key] = mergeInteraction(
      local.interactions[key],
      db.interactions[key]
    );
  }

  const completed = local.completed || db.completed;

  // completedAt: earliest non-null timestamp
  let completedAt: string | undefined;
  if (local.completedAt && db.completedAt) {
    completedAt =
      local.completedAt <= db.completedAt ? local.completedAt : db.completedAt;
  } else {
    completedAt = local.completedAt || db.completedAt;
  }

  return {
    modulePath: local.modulePath || db.modulePath,
    levelId: local.levelId || db.levelId,
    completed,
    completedAt,
    interactions,
  };
}

export function mergeModuleProgress(
  local: Record<string, ModuleProgressState>,
  db: Record<string, ModuleProgressState>
): Record<string, ModuleProgressState> {
  const allKeys = new Set([...Object.keys(local), ...Object.keys(db)]);
  const merged: Record<string, ModuleProgressState> = {};
  for (const key of allKeys) {
    merged[key] = mergeModule(local[key], db[key]);
  }
  return merged;
}

// --- XP Data ---

export function mergeXpData(
  local: XpStore | null,
  db: { totalXp: number; dailyStreak: number; lastQuizDate: string | null; longestStreak: number } | null,
  localQuizHistory: QuizHistoryEntry[],
  dbQuizSessions: QuizHistoryEntry[]
): XpStore {
  const defaultXp: XpStore = {
    totalXp: 0,
    dailyStreak: 0,
    lastQuizDate: null,
    longestStreak: 0,
    quizHistory: [],
  };

  if (!local && !db) return { ...defaultXp, quizHistory: mergeQuizSessions(localQuizHistory, dbQuizSessions) };
  if (!local) return { ...db!, quizHistory: mergeQuizSessions(localQuizHistory, dbQuizSessions) };
  if (!db) return { ...local, quizHistory: mergeQuizSessions(localQuizHistory, dbQuizSessions) };

  const totalXp = Math.max(local.totalXp, db.totalXp);
  const longestStreak = Math.max(local.longestStreak, db.longestStreak);

  // lastQuizDate: more recent
  let lastQuizDate: string | null;
  if (local.lastQuizDate && db.lastQuizDate) {
    lastQuizDate = local.lastQuizDate >= db.lastQuizDate ? local.lastQuizDate : db.lastQuizDate;
  } else {
    lastQuizDate = local.lastQuizDate || db.lastQuizDate;
  }

  // dailyStreak: from whichever has more recent lastQuizDate
  let dailyStreak: number;
  if (local.lastQuizDate && db.lastQuizDate) {
    if (local.lastQuizDate > db.lastQuizDate) {
      dailyStreak = local.dailyStreak;
    } else if (db.lastQuizDate > local.lastQuizDate) {
      dailyStreak = db.dailyStreak;
    } else {
      dailyStreak = Math.max(local.dailyStreak, db.dailyStreak);
    }
  } else if (local.lastQuizDate) {
    dailyStreak = local.dailyStreak;
  } else if (db.lastQuizDate) {
    dailyStreak = db.dailyStreak;
  } else {
    dailyStreak = Math.max(local.dailyStreak, db.dailyStreak);
  }

  return {
    totalXp,
    dailyStreak,
    lastQuizDate,
    longestStreak,
    quizHistory: mergeQuizSessions(localQuizHistory, dbQuizSessions),
  };
}

function mergeQuizSessions(
  local: QuizHistoryEntry[],
  db: QuizHistoryEntry[]
): QuizHistoryEntry[] {
  const byDate = new Map<string, QuizHistoryEntry>();

  for (const entry of local) {
    byDate.set(entry.date, entry);
  }
  for (const entry of db) {
    const existing = byDate.get(entry.date);
    if (!existing || entry.questionsAnswered > existing.questionsAnswered) {
      byDate.set(entry.date, entry);
    }
  }

  return [...byDate.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);
}

// --- Quiz Question History ---

export function mergeQuizQuestionHistory(
  local: Record<string, QuestionRecord>,
  db: Record<string, QuestionRecord>
): Record<string, QuestionRecord> {
  const allKeys = new Set([...Object.keys(local), ...Object.keys(db)]);
  const merged: Record<string, QuestionRecord> = {};

  for (const key of allKeys) {
    const l = local[key];
    const d = db[key];

    if (!l) {
      merged[key] = d;
      continue;
    }
    if (!d) {
      merged[key] = l;
      continue;
    }

    const totalSeen = Math.max(l.totalSeen, d.totalSeen);
    const totalCorrect = Math.max(l.totalCorrect, d.totalCorrect);

    // Authority: side with higher totalSeen, tiebreak by more recent lastSeen
    let authority: QuestionRecord;
    if (l.totalSeen > d.totalSeen) {
      authority = l;
    } else if (d.totalSeen > l.totalSeen) {
      authority = d;
    } else {
      authority = l.lastSeen >= d.lastSeen ? l : d;
    }

    // lastSeen: always take more recent
    const lastSeen = l.lastSeen >= d.lastSeen ? l.lastSeen : d.lastSeen;

    merged[key] = {
      lastSeen,
      nextDue: authority.nextDue,
      box: authority.box,
      correctStreak: authority.correctStreak,
      totalSeen,
      totalCorrect,
    };
  }

  return merged;
}
