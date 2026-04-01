"use client";

import type {
  ProgressStore,
  ModuleProgressState,
  InteractionState,
  DrillAttempt,
} from "@/types/progress";
import { syncProgress } from "./db-sync";

const PROGRESS_KEY = "aif_progress";

let migrationRun = false;

function getStore(): ProgressStore {
  if (typeof window === "undefined") return { modules: {} };
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const store = JSON.parse(raw);
      // Run migration once per session
      if (!migrationRun) {
        migrationRun = true;
        const storeAny = store as unknown as Record<string, unknown>;
        if (!storeAny.migrated || !storeAny.migratedTopics) {
          // Defer migration to after this call completes
          setTimeout(() => migrateProgressKeys(), 0);
        }
      }
      return store;
    }
  } catch {
    // Corrupted data
  }
  return { modules: {} };
}

function saveStore(store: ProgressStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
}

export function getModuleProgress(
  modulePath: string
): ModuleProgressState | null {
  const store = getStore();
  return store.modules[modulePath] || null;
}

export function getInteraction(
  modulePath: string,
  interactionKey: string
): InteractionState | null {
  const progress = getModuleProgress(modulePath);
  if (!progress) return null;
  return progress.interactions[interactionKey] || null;
}

export function markInteraction(
  modulePath: string,
  levelId: string,
  interactionKey: string,
  data: Partial<InteractionState>
): void {
  const store = getStore();

  if (!store.modules[modulePath]) {
    store.modules[modulePath] = {
      modulePath,
      levelId,
      completed: false,
      interactions: {},
    };
  }

  const existing = store.modules[modulePath].interactions[interactionKey];
  store.modules[modulePath].interactions[interactionKey] = {
    ...existing,
    ...data,
    completed: true,
    completedAt: new Date().toISOString(),
  };

  saveStore(store);

  // Sync to DB (fire-and-forget)
  const mod = store.modules[modulePath];
  syncProgress(modulePath, levelId, mod.completed, mod.completedAt, mod.interactions);
}

export function markModuleComplete(
  modulePath: string,
  levelId: string
): void {
  const store = getStore();

  if (!store.modules[modulePath]) {
    store.modules[modulePath] = {
      modulePath,
      levelId,
      completed: false,
      interactions: {},
    };
  }

  store.modules[modulePath].completed = true;
  store.modules[modulePath].completedAt = new Date().toISOString();

  saveStore(store);

  // Sync to DB (fire-and-forget)
  const mod = store.modules[modulePath];
  syncProgress(modulePath, levelId, mod.completed, mod.completedAt, mod.interactions);
}

export function isModuleComplete(modulePath: string): boolean {
  const progress = getModuleProgress(modulePath);
  return progress?.completed || false;
}

export function getCompletedInteractionCount(modulePath: string): number {
  const progress = getModuleProgress(modulePath);
  if (!progress) return 0;
  return Object.values(progress.interactions).filter((i) => i.completed).length;
}

export function getLevelCompletionCount(levelId: string): number {
  const store = getStore();
  return Object.values(store.modules).filter(
    (m) => m.levelId === levelId && m.completed
  ).length;
}

export function getAllProgress(): ProgressStore {
  return getStore();
}

export function storeDrillAttempt(
  modulePath: string,
  levelId: string,
  drillKey: string,
  attempt: DrillAttempt
): void {
  const store = getStore();

  if (!store.modules[modulePath]) {
    store.modules[modulePath] = {
      modulePath,
      levelId,
      completed: false,
      interactions: {},
    };
  }

  const mod = store.modules[modulePath];
  if (!mod.drillAttempts) mod.drillAttempts = {};
  if (!mod.drillAttempts[drillKey]) mod.drillAttempts[drillKey] = [];
  mod.drillAttempts[drillKey].push(attempt);

  saveStore(store);
  syncProgress(modulePath, levelId, mod.completed, mod.completedAt, mod.interactions);
}

export function markDrillPassed(
  modulePath: string,
  levelId: string,
  drillKey: string,
  attempt: DrillAttempt,
  allDrillKeys: string[]
): void {
  const store = getStore();

  if (!store.modules[modulePath]) {
    store.modules[modulePath] = {
      modulePath,
      levelId,
      completed: false,
      interactions: {},
    };
  }

  const mod = store.modules[modulePath];
  if (!mod.drillAttempts) mod.drillAttempts = {};
  if (!mod.drillAttempts[drillKey]) mod.drillAttempts[drillKey] = [];
  mod.drillAttempts[drillKey].push(attempt);

  if (!mod.drillPassed) mod.drillPassed = {};
  mod.drillPassed[drillKey] = true;

  // Mark interaction as complete too
  mod.interactions[drillKey] = {
    completed: true,
    completedAt: new Date().toISOString(),
  };

  // Auto-complete module if all drills are passed
  const allPassed = allDrillKeys.every((key) => mod.drillPassed?.[key]);
  if (allPassed) {
    mod.completed = true;
    mod.completedAt = new Date().toISOString();
  }

  saveStore(store);
  syncProgress(modulePath, levelId, mod.completed, mod.completedAt, mod.interactions);
}

export function isDrillPassed(modulePath: string, drillKey: string): boolean {
  const progress = getModuleProgress(modulePath);
  return progress?.drillPassed?.[drillKey] || false;
}

export function getDrillAttempts(modulePath: string, drillKey: string): DrillAttempt[] {
  const progress = getModuleProgress(modulePath);
  return progress?.drillAttempts?.[drillKey] || [];
}

export function isLevelFullyPassed(
  course: string,
  levelSlug: string,
  modules: { slug: string; isIndex?: boolean }[]
): boolean {
  const nonIndexModules = modules.filter((m) => !m.isIndex);
  if (nonIndexModules.length === 0) return false;
  return nonIndexModules.every((m) =>
    isModuleComplete(`${course}/${levelSlug}/${m.slug}`)
  );
}

// -- Practice session tracking for drill courses --

const PRACTICE_SESSIONS_REQUIRED = 5;
const DAILY_PRACTICE_LIMIT = 2; // per level per day

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function incrementPracticeSession(
  modulePath: string,
  levelId: string,
  drillKey: string
): void {
  const store = getStore();

  if (!store.modules[modulePath]) {
    store.modules[modulePath] = {
      modulePath,
      levelId,
      completed: false,
      interactions: {},
    };
  }

  const mod = store.modules[modulePath];
  if (!mod.practiceSessionCount) mod.practiceSessionCount = {};
  mod.practiceSessionCount[drillKey] =
    (mod.practiceSessionCount[drillKey] || 0) + 1;

  if (!mod.practiceSessionDates) mod.practiceSessionDates = {};
  if (!mod.practiceSessionDates[drillKey]) mod.practiceSessionDates[drillKey] = [];
  mod.practiceSessionDates[drillKey].push(getToday());

  saveStore(store);
  syncProgress(modulePath, levelId, mod.completed, mod.completedAt, mod.interactions);
}

export function getPracticeSessionCount(
  modulePath: string,
  drillKey: string
): number {
  const progress = getModuleProgress(modulePath);
  return progress?.practiceSessionCount?.[drillKey] || 0;
}

export function isTestUnlocked(
  modulePath: string,
  drillKey: string
): boolean {
  return getPracticeSessionCount(modulePath, drillKey) >= PRACTICE_SESSIONS_REQUIRED;
}

/**
 * Count practice sessions done today across ALL drills in a level.
 */
export function getPracticeSessionsToday(
  course: string,
  levelSlug: string,
  moduleMetaList: { slug: string; isIndex?: boolean }[]
): number {
  const today = getToday();
  let count = 0;

  for (const mod of moduleMetaList) {
    if (mod.isIndex) continue;
    const modPath = `${course}/${levelSlug}/${mod.slug}`;
    const progress = getModuleProgress(modPath);
    if (!progress?.practiceSessionDates) continue;

    for (const dates of Object.values(progress.practiceSessionDates)) {
      count += dates.filter((d) => d === today).length;
    }
  }

  return count;
}

export function canPracticeToday(
  course: string,
  levelSlug: string,
  moduleMetaList: { slug: string; isIndex?: boolean }[]
): boolean {
  return getPracticeSessionsToday(course, levelSlug, moduleMetaList) < DAILY_PRACTICE_LIMIT;
}

export function getMasteryLevel(
  modulePath: string,
  drillKey: string
): import("@/types/progress").MasteryLevel {
  if (isDrillPassed(modulePath, drillKey)) return "mastered";
  const sessions = getPracticeSessionCount(modulePath, drillKey);
  if (sessions >= PRACTICE_SESSIONS_REQUIRED) return "almost-ready";
  if (sessions > 0) return "practicing";
  return "not-started";
}

// Migration map: old CFA single-level paths -> new topic-level paths
import cfaLevelMigration from "./cfa-level-migration.json";

// One-time migration: prefix existing progress keys with course ID
// and remap CFA single-level paths to topic-level paths
export function migrateProgressKeys() {
  const store = getStore();
  const storeAny = store as unknown as Record<string, unknown>;
  const needsCoursePrefix = !storeAny.migrated;
  const needsTopicSplit = !storeAny.migratedTopics;

  if (!needsCoursePrefix && !needsTopicSplit) return;

  const cfaPrefixes = [
    "quant-", "econ-", "fi-", "fsa-", "eq-", "corp-", "deriv-",
    "alt-", "pm-", "ethics-", "index",
  ];
  const cfaL2Prefixes = [...cfaPrefixes.filter(p => p !== "index")];
  const cfaL3Prefixes = [
    "aa-", "deriv-", "pc-", "perf-", "ethics-", "pw-pm-", "pw-pw-", "pw-mk-", "index",
  ];

  const migration = cfaLevelMigration as Record<string, string>;
  const newModules: Record<string, ModuleProgressState> = {};

  for (const [key, value] of Object.entries(store.modules)) {
    let newKey = key;

    // Phase 1: Add course prefix to 2-part keys
    if (needsCoursePrefix && key.split("/").length === 2) {
      const [level, slug] = key.split("/");
      if (level === "level-2" && cfaL2Prefixes.some(p => slug.startsWith(p))) {
        newKey = `cfa-2/${key}`;
      } else if (level === "level-3" && cfaL3Prefixes.some(p => slug.startsWith(p))) {
        newKey = `cfa-3/${key}`;
      } else if (level === "level-1" && cfaPrefixes.some(p => slug.startsWith(p))) {
        newKey = `cfa-1/${key}`;
      } else {
        newKey = `ai-fluency/${key}`;
      }
    }

    // Phase 2: Remap CFA single-level to topic-level
    if (needsTopicSplit && migration[newKey]) {
      newKey = migration[newKey];
    }

    newModules[newKey] = { ...value, modulePath: newKey };
  }

  store.modules = newModules;
  storeAny.migrated = true;
  storeAny.migratedTopics = true;
  saveStore(store);
}
