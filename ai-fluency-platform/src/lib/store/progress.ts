"use client";

import type {
  ProgressStore,
  ModuleProgressState,
  InteractionState,
} from "@/types/progress";

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
