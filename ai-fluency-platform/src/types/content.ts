export interface ModuleMeta {
  title: string;
  description: string;
  level: string;
  slug: string;
  order: number;
  isCheckpoint: boolean;
  isIndex: boolean;
  isPracticeOnly?: boolean;
  isExamBank?: boolean;
  cfaTopic?: string;
  cfaLOS?: string[];
}

export interface PracticeProblem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "basic" | "intermediate" | "advanced";
  cfaTopic?: string;
  learningOutcome?: string;
}

export interface DrillProblem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "basic" | "intermediate" | "advanced";
  cards?: {
    hand?: string[];
    hand1?: string[];
    hand2?: string[];
    board?: string[];
    displayAs?: "hand" | "board" | "both" | "versus";
  };
}

export interface CourseInfo {
  id: string;
  title: string;
  description: string;
  color: string;
  isDrillCourse?: boolean;
}

export interface LessonReviewQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  encourageCorrect: string;
  encourageIncorrect: string;
}

export interface ModuleContent {
  meta: ModuleMeta;
  blocks: ContentBlock[];
  reviewQuestions?: LessonReviewQuestion[];
}

export type ContentBlock =
  | { type: "markdown"; content: string }
  | { type: "predictPrompt"; prompt: string }
  | { type: "explainBack"; prompt: string }
  | { type: "tryItYourself"; title: string; solution: string }
  | { type: "calibrationCheck"; question: string; answer: string }
  | { type: "reflectPrompt"; questions: string[] }
  | { type: "connectPrompt"; prompt: string }
  | { type: "keyTakeaway"; content: string }
  | {
      type: "practiceSet";
      title: string;
      vignette?: string;
      problems: PracticeProblem[];
    }
  | {
      type: "drillSet";
      title: string;
      instructions?: string;
      problems?: DrillProblem[];
      generator?: string;
      problemCount?: number;
      passThreshold: number;
      timeLimitSeconds: number;
    }
  | { type: "pixelAgentTeam" }
  | {
      type: "providerContent";
      context?: string;
      providers: {
        "claude-code"?: string;
        "codex"?: string;
        "cline"?: string;
        "gemini"?: string;
      };
    };

export interface LevelInfo {
  level: number;
  title: string;
  subtitle: string;
  color: string;
  description: string;
  moduleCount: number;
  levelLabel?: string; // "Level" (default) or "Topic" for CFA courses
  passThreshold?: number;
  timeLimitSeconds?: number;
}

export interface CurriculumData {
  levels: LevelInfo[];
  modules: Record<string, ModuleMeta[]>;
}

export interface Competency {
  id: string;
  name: string;
  definition: string;
  professionalApplication: string;
  icon: string;
  levels: Record<string, string>;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
  author: string;
  description: string;
  levels: number[];
  tags: string[];
}
