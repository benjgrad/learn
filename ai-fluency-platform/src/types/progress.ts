export interface InteractionState {
  completed: boolean;
  userInput?: string;
  aiFeedback?: string;
  completedAt?: string;
}

export type MasteryLevel = "not-started" | "practicing" | "almost-ready" | "mastered";

export interface DrillAttempt {
  attemptNumber: number;
  startedAt: string;
  completedAt: string;
  totalProblems: number;
  correctCount: number;
  accuracy: number;
  timeUsedSeconds: number;
  passed: boolean;
  mode: "practice" | "test";
}

export interface ModuleProgressState {
  modulePath: string;
  levelId: string;
  completed: boolean;
  completedAt?: string;
  interactions: Record<string, InteractionState>;
  drillAttempts?: Record<string, DrillAttempt[]>;
  drillPassed?: Record<string, boolean>;
  practiceSessionCount?: Record<string, number>;
  practiceSessionDates?: Record<string, string[]>;
}

export interface ProgressStore {
  modules: Record<string, ModuleProgressState>;
  lastSynced?: string;
}

export interface LevelProgress {
  levelId: string;
  totalModules: number;
  completedModules: number;
  percentage: number;
}
