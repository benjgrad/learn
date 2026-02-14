"use client";

import type {
  ProgressStore,
  ModuleProgressState,
  InteractionState,
} from "@/types/progress";

const PROGRESS_KEY = "aif_progress";

function getStore(): ProgressStore {
  if (typeof window === "undefined") return { modules: {} };
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
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
