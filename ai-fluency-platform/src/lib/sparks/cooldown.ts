"use client";

import type { CooldownState } from "@/types/sparks";
import { SPARK_CONFIG, getEffectiveConfig } from "./config";
import { spendSparks } from "./store";
import { syncSparkSpend } from "./db-sync";
import { generateIdempotencyKey } from "./idempotency";

const COOLDOWN_KEY = "aif_cooldowns";

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getCooldowns(): Record<string, CooldownState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted data
  }
  return {};
}

function saveCooldowns(cooldowns: Record<string, CooldownState>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COOLDOWN_KEY, JSON.stringify(cooldowns));
}

function getCooldownKey(courseId: string): string {
  const today = getTodayString();
  return `${courseId}:${today}`;
}

export function getCooldownState(courseId: string): CooldownState | null {
  const cooldowns = getCooldowns();
  const key = getCooldownKey(courseId);
  return cooldowns[key] ?? null;
}

export function recordLessonUsed(courseId: string, email?: string | null): CooldownState {
  const config = getEffectiveConfig(email);
  const cooldowns = getCooldowns();
  const key = getCooldownKey(courseId);
  const today = getTodayString();

  const existing = cooldowns[key] ?? {
    courseId,
    lessonsUsedToday: 0,
    nextLessonAvailable: null,
    cooldownDate: today,
  };

  existing.lessonsUsedToday += 1;

  if (existing.lessonsUsedToday >= config.freeLessonsPerDay) {
    const nextAvailable = new Date();
    nextAvailable.setHours(nextAvailable.getHours() + config.cooldownHours);
    existing.nextLessonAvailable = nextAvailable.toISOString();
  }

  cooldowns[key] = existing;
  saveCooldowns(cooldowns);
  return existing;
}

export function skipCooldown(
  courseId: string,
  userId: string,
  email?: string | null
): { success: boolean; newBalance: number } {
  const config = getEffectiveConfig(email);
  const idempotencyKey = generateIdempotencyKey(
    userId,
    "cooldown_skip",
    `${courseId}:${getTodayString()}`
  );

  const result = spendSparks(
    config.cooldownSkipCost,
    "cooldown_skip",
    idempotencyKey,
    { courseId }
  );

  if (result.success) {
    const cooldowns = getCooldowns();
    const key = getCooldownKey(courseId);
    if (cooldowns[key]) {
      cooldowns[key].nextLessonAvailable = null;
      saveCooldowns(cooldowns);
    }

    syncSparkSpend(
      "cooldown_skip",
      config.cooldownSkipCost,
      idempotencyKey,
      { courseId }
    );
  }

  return result;
}

export function getTimeRemaining(courseId: string): number {
  const state = getCooldownState(courseId);
  if (!state?.nextLessonAvailable) return 0;

  const remaining = new Date(state.nextLessonAvailable).getTime() - Date.now();
  return Math.max(0, remaining);
}
