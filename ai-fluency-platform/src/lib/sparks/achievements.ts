"use client";

import type { AchievementCriteria, UserAchievement } from "@/types/sparks";

const ACHIEVEMENTS_KEY = "aif_achievements";

export interface AchievementContext {
  lessonsCompleted: number;
  currentStreak: number;
  coursesCompleted: number;
  quizPerfect: boolean;
  quizStreakDays: number;
  hasPurchased: boolean;
  coursesCreated: number;
}

interface AchievementEntry {
  id: string;
  name: string;
  sparkReward: number;
  criteria: AchievementCriteria;
}

// Client-side achievement definitions (mirrors DB seed data)
export const ACHIEVEMENT_LIST: AchievementEntry[] = [
  { id: "first_lesson", name: "First Steps", sparkReward: 10, criteria: { type: "lessons_completed", count: 1 } },
  { id: "lessons_10", name: "Getting Started", sparkReward: 25, criteria: { type: "lessons_completed", count: 10 } },
  { id: "lessons_50", name: "Dedicated Learner", sparkReward: 50, criteria: { type: "lessons_completed", count: 50 } },
  { id: "lessons_100", name: "Century Club", sparkReward: 100, criteria: { type: "lessons_completed", count: 100 } },
  { id: "streak_3", name: "On a Roll", sparkReward: 15, criteria: { type: "streak", days: 3 } },
  { id: "streak_7", name: "Week Warrior", sparkReward: 30, criteria: { type: "streak", days: 7 } },
  { id: "streak_14", name: "Fortnight Focus", sparkReward: 50, criteria: { type: "streak", days: 14 } },
  { id: "streak_30", name: "Monthly Master", sparkReward: 100, criteria: { type: "streak", days: 30 } },
  { id: "course_complete_1", name: "Course Conqueror", sparkReward: 50, criteria: { type: "courses_completed", count: 1 } },
  { id: "course_complete_3", name: "Triple Threat", sparkReward: 100, criteria: { type: "courses_completed", count: 3 } },
  { id: "quiz_perfect", name: "Perfect Score", sparkReward: 20, criteria: { type: "quiz_perfect" } },
  { id: "quiz_streak_7", name: "Quiz Machine", sparkReward: 40, criteria: { type: "quiz_streak", days: 7 } },
  { id: "first_purchase", name: "First Investment", sparkReward: 10, criteria: { type: "purchase" } },
  { id: "creator_first", name: "Course Creator", sparkReward: 75, criteria: { type: "courses_created", count: 1 } },
];

function matchesCriteria(criteria: AchievementCriteria, context: AchievementContext): boolean {
  switch (criteria.type) {
    case "lessons_completed":
      return context.lessonsCompleted >= criteria.count;
    case "streak":
      return context.currentStreak >= criteria.days;
    case "courses_completed":
      return context.coursesCompleted >= criteria.count;
    case "quiz_perfect":
      return context.quizPerfect;
    case "quiz_streak":
      return context.quizStreakDays >= criteria.days;
    case "purchase":
      return context.hasPurchased;
    case "courses_created":
      return context.coursesCreated >= criteria.count;
    default:
      return false;
  }
}

export function getEarnedAchievements(): UserAchievement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted data
  }
  return [];
}

function saveEarnedAchievements(achievements: UserAchievement[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
}

export function recordAchievement(id: string): void {
  const earned = getEarnedAchievements();
  if (earned.some((a) => a.achievementId === id)) return;
  earned.push({ achievementId: id, earnedAt: new Date().toISOString() });
  saveEarnedAchievements(earned);
}

/**
 * Check which achievements should be newly awarded given the current user context.
 * Returns only achievements not yet earned.
 */
export function checkAchievements(
  context: AchievementContext
): { id: string; name: string; sparkReward: number }[] {
  const earned = getEarnedAchievements();
  const earnedIds = new Set(earned.map((a) => a.achievementId));

  const newlyEarned: { id: string; name: string; sparkReward: number }[] = [];

  for (const achievement of ACHIEVEMENT_LIST) {
    if (earnedIds.has(achievement.id)) continue;
    if (matchesCriteria(achievement.criteria, context)) {
      newlyEarned.push({
        id: achievement.id,
        name: achievement.name,
        sparkReward: achievement.sparkReward,
      });
    }
  }

  return newlyEarned;
}
