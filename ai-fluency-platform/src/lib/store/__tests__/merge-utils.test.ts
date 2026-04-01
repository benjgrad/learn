import { describe, it, expect } from "vitest";
import {
  mergeModuleProgress,
  mergeXpData,
  mergeQuizQuestionHistory,
} from "../merge-utils";
import type { ModuleProgressState } from "@/types/progress";
import type { QuestionRecord } from "@/types/review";

describe("mergeModuleProgress", () => {
  it("preserves local-only modules", () => {
    const local: Record<string, ModuleProgressState> = {
      "ai/level-1/intro": {
        modulePath: "ai/level-1/intro",
        levelId: "level-1",
        completed: true,
        completedAt: "2025-01-01T00:00:00Z",
        interactions: {},
      },
    };
    const result = mergeModuleProgress(local, {});
    expect(result["ai/level-1/intro"].completed).toBe(true);
  });

  it("preserves db-only modules", () => {
    const db: Record<string, ModuleProgressState> = {
      "ai/level-2/advanced": {
        modulePath: "ai/level-2/advanced",
        levelId: "level-2",
        completed: false,
        interactions: { "predict-0": { completed: true, completedAt: "2025-02-01T00:00:00Z" } },
      },
    };
    const result = mergeModuleProgress({}, db);
    expect(result["ai/level-2/advanced"].interactions["predict-0"].completed).toBe(true);
  });

  it("merges same module — completed wins", () => {
    const local: Record<string, ModuleProgressState> = {
      "ai/level-1/intro": {
        modulePath: "ai/level-1/intro",
        levelId: "level-1",
        completed: true,
        completedAt: "2025-01-15T00:00:00Z",
        interactions: {},
      },
    };
    const db: Record<string, ModuleProgressState> = {
      "ai/level-1/intro": {
        modulePath: "ai/level-1/intro",
        levelId: "level-1",
        completed: false,
        interactions: {},
      },
    };
    const result = mergeModuleProgress(local, db);
    expect(result["ai/level-1/intro"].completed).toBe(true);
    expect(result["ai/level-1/intro"].completedAt).toBe("2025-01-15T00:00:00Z");
  });

  it("takes earlier completedAt", () => {
    const local: Record<string, ModuleProgressState> = {
      "m": {
        modulePath: "m", levelId: "l", completed: true,
        completedAt: "2025-03-01T00:00:00Z", interactions: {},
      },
    };
    const db: Record<string, ModuleProgressState> = {
      "m": {
        modulePath: "m", levelId: "l", completed: true,
        completedAt: "2025-01-01T00:00:00Z", interactions: {},
      },
    };
    const result = mergeModuleProgress(local, db);
    expect(result["m"].completedAt).toBe("2025-01-01T00:00:00Z");
  });

  it("merges interactions — completed wins over incomplete", () => {
    const local: Record<string, ModuleProgressState> = {
      "m": {
        modulePath: "m", levelId: "l", completed: false, interactions: {
          "predict-0": { completed: true, userInput: "local answer", completedAt: "2025-01-01T00:00:00Z" },
          "explain-0": { completed: false },
        },
      },
    };
    const db: Record<string, ModuleProgressState> = {
      "m": {
        modulePath: "m", levelId: "l", completed: false, interactions: {
          "predict-0": { completed: false },
          "explain-0": { completed: true, userInput: "db answer", completedAt: "2025-02-01T00:00:00Z" },
        },
      },
    };
    const result = mergeModuleProgress(local, db);
    expect(result["m"].interactions["predict-0"].completed).toBe(true);
    expect(result["m"].interactions["predict-0"].userInput).toBe("local answer");
    expect(result["m"].interactions["explain-0"].completed).toBe(true);
    expect(result["m"].interactions["explain-0"].userInput).toBe("db answer");
  });

  it("merges interactions from different keys", () => {
    const local: Record<string, ModuleProgressState> = {
      "m": {
        modulePath: "m", levelId: "l", completed: false, interactions: {
          "predict-0": { completed: true, completedAt: "2025-01-01T00:00:00Z" },
        },
      },
    };
    const db: Record<string, ModuleProgressState> = {
      "m": {
        modulePath: "m", levelId: "l", completed: false, interactions: {
          "explain-0": { completed: true, completedAt: "2025-02-01T00:00:00Z" },
        },
      },
    };
    const result = mergeModuleProgress(local, db);
    expect(Object.keys(result["m"].interactions)).toHaveLength(2);
    expect(result["m"].interactions["predict-0"].completed).toBe(true);
    expect(result["m"].interactions["explain-0"].completed).toBe(true);
  });

  it("handles empty inputs", () => {
    expect(mergeModuleProgress({}, {})).toEqual({});
  });
});

describe("mergeXpData", () => {
  it("takes max totalXp and longestStreak", () => {
    const result = mergeXpData(
      { totalXp: 100, dailyStreak: 3, lastQuizDate: "2025-01-10", longestStreak: 5, quizHistory: [] },
      { totalXp: 200, dailyStreak: 1, lastQuizDate: "2025-01-08", longestStreak: 7 },
      [], []
    );
    expect(result.totalXp).toBe(200);
    expect(result.longestStreak).toBe(7);
  });

  it("dailyStreak follows more recent lastQuizDate", () => {
    const result = mergeXpData(
      { totalXp: 100, dailyStreak: 5, lastQuizDate: "2025-01-10", longestStreak: 5, quizHistory: [] },
      { totalXp: 100, dailyStreak: 2, lastQuizDate: "2025-01-08", longestStreak: 5 },
      [], []
    );
    expect(result.dailyStreak).toBe(5);
    expect(result.lastQuizDate).toBe("2025-01-10");
  });

  it("dailyStreak takes max when same date", () => {
    const result = mergeXpData(
      { totalXp: 100, dailyStreak: 3, lastQuizDate: "2025-01-10", longestStreak: 5, quizHistory: [] },
      { totalXp: 100, dailyStreak: 5, lastQuizDate: "2025-01-10", longestStreak: 5 },
      [], []
    );
    expect(result.dailyStreak).toBe(5);
  });

  it("handles null lastQuizDate on one side", () => {
    const result = mergeXpData(
      { totalXp: 50, dailyStreak: 2, lastQuizDate: "2025-01-05", longestStreak: 2, quizHistory: [] },
      { totalXp: 0, dailyStreak: 0, lastQuizDate: null, longestStreak: 0 },
      [], []
    );
    expect(result.lastQuizDate).toBe("2025-01-05");
    expect(result.dailyStreak).toBe(2);
  });

  it("handles both null", () => {
    const result = mergeXpData(null, null, [], []);
    expect(result.totalXp).toBe(0);
  });

  it("merges quiz sessions by date — higher questionsAnswered wins", () => {
    const result = mergeXpData(
      { totalXp: 100, dailyStreak: 1, lastQuizDate: "2025-01-10", longestStreak: 1, quizHistory: [] },
      { totalXp: 100, dailyStreak: 1, lastQuizDate: "2025-01-10", longestStreak: 1 },
      [
        { date: "2025-01-10", questionsAnswered: 5, correctCount: 3, xpEarned: 15 },
        { date: "2025-01-09", questionsAnswered: 3, correctCount: 2, xpEarned: 10 },
      ],
      [
        { date: "2025-01-10", questionsAnswered: 7, correctCount: 5, xpEarned: 20 },
        { date: "2025-01-08", questionsAnswered: 4, correctCount: 3, xpEarned: 12 },
      ]
    );
    expect(result.quizHistory).toHaveLength(3);
    const jan10 = result.quizHistory.find((e) => e.date === "2025-01-10")!;
    expect(jan10.questionsAnswered).toBe(7);
  });
});

describe("mergeQuizQuestionHistory", () => {
  it("preserves one-sided entries", () => {
    const local: Record<string, QuestionRecord> = {
      q1: { lastSeen: "2025-01-01", nextDue: "2025-01-02", box: 1, correctStreak: 1, totalSeen: 1, totalCorrect: 1 },
    };
    const db: Record<string, QuestionRecord> = {
      q2: { lastSeen: "2025-01-03", nextDue: "2025-01-04", box: 2, correctStreak: 2, totalSeen: 2, totalCorrect: 2 },
    };
    const result = mergeQuizQuestionHistory(local, db);
    expect(result.q1.box).toBe(1);
    expect(result.q2.box).toBe(2);
  });

  it("takes max totalSeen and totalCorrect", () => {
    const local: Record<string, QuestionRecord> = {
      q1: { lastSeen: "2025-01-01", nextDue: "2025-01-02", box: 1, correctStreak: 1, totalSeen: 5, totalCorrect: 3 },
    };
    const db: Record<string, QuestionRecord> = {
      q1: { lastSeen: "2025-01-03", nextDue: "2025-01-10", box: 3, correctStreak: 3, totalSeen: 8, totalCorrect: 6 },
    };
    const result = mergeQuizQuestionHistory(local, db);
    expect(result.q1.totalSeen).toBe(8);
    expect(result.q1.totalCorrect).toBe(6);
  });

  it("authority follows higher totalSeen for box/correctStreak/nextDue", () => {
    const local: Record<string, QuestionRecord> = {
      q1: { lastSeen: "2025-01-05", nextDue: "2025-01-06", box: 1, correctStreak: 1, totalSeen: 3, totalCorrect: 2 },
    };
    const db: Record<string, QuestionRecord> = {
      q1: { lastSeen: "2025-01-03", nextDue: "2025-01-10", box: 4, correctStreak: 4, totalSeen: 10, totalCorrect: 8 },
    };
    const result = mergeQuizQuestionHistory(local, db);
    expect(result.q1.box).toBe(4);
    expect(result.q1.correctStreak).toBe(4);
    expect(result.q1.nextDue).toBe("2025-01-10");
    // lastSeen always takes more recent
    expect(result.q1.lastSeen).toBe("2025-01-05");
  });

  it("tiebreaks by more recent lastSeen when totalSeen equal", () => {
    const local: Record<string, QuestionRecord> = {
      q1: { lastSeen: "2025-01-05", nextDue: "2025-01-08", box: 2, correctStreak: 2, totalSeen: 5, totalCorrect: 4 },
    };
    const db: Record<string, QuestionRecord> = {
      q1: { lastSeen: "2025-01-03", nextDue: "2025-01-10", box: 3, correctStreak: 3, totalSeen: 5, totalCorrect: 3 },
    };
    const result = mergeQuizQuestionHistory(local, db);
    // local has more recent lastSeen, so it's the authority
    expect(result.q1.box).toBe(2);
    expect(result.q1.nextDue).toBe("2025-01-08");
  });

  it("handles empty inputs", () => {
    expect(mergeQuizQuestionHistory({}, {})).toEqual({});
  });
});
