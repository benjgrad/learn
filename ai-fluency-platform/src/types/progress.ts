export interface InteractionState {
  completed: boolean;
  userInput?: string;
  aiFeedback?: string;
  completedAt?: string;
}

export interface ModuleProgressState {
  modulePath: string;
  levelId: string;
  completed: boolean;
  completedAt?: string;
  interactions: Record<string, InteractionState>;
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
