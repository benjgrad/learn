/**
 * The four read-only MCP tools. Nothing here writes.
 *
 * Data tools emit compact JSON; get_lesson emits markdown. Models parse JSON
 * without inventing a module_path, but read and re-teach prose far better than
 * prose wrapped in JSON.
 */
import fs from "fs";
import path from "path";
import {
  getCourses,
  getCurriculum,
  getModuleBySlugPath,
  getLevelTitle,
} from "@/lib/content";
import type { CurriculumData, ModuleMeta } from "@/types/content";
import { canViewCourse, getViewablePrivateCourses } from "@/lib/private-courses";
import type { McpIdentity } from "./auth";
import {
  completedPaths,
  getInteractionsForModule,
  getModuleProgress,
  getQuestionHistory,
  getSparkBalance,
  getUserXp,
  type QuestionHistoryRow,
} from "./data";
import {
  findNextIncomplete,
  getLevelOrder,
  getOrderedModules,
  modulePathOf,
} from "./progress";
import { renderBlocks } from "./render";

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export const TOOLS = [
  {
    name: "get_progress",
    description:
      "Where the user is in their Palestra learning. Returns the lesson they should do next (derived from their completed lessons in curriculum order), per-course completion counts, XP, streaks, spark balance, and how many review questions are due from lessons they have completed. Call this first when the user asks 'where was I', 'what should I study next', or 'how am I doing'. Every module_path it returns can be passed straight to get_lesson.",
    inputSchema: {
      type: "object",
      properties: {
        course: {
          type: "string",
          description:
            "Optional course id (e.g. 'ai-fluency', 'cfa-1', 'claude-code'). Omit for every course the user has started.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "list_curriculum",
    description:
      "The course catalogue, or the full lesson map of one course annotated with the user's completion state. Call with no arguments to list every available course. Call with a course id to see its levels and each lesson's title, module_path, and whether it is done. Use the returned module_path values with get_lesson.",
    inputSchema: {
      type: "object",
      properties: {
        course: {
          type: "string",
          description: "Course id. Omit to list all courses.",
        },
        level: {
          type: "string",
          description:
            "Optional level slug ('foundations', 'level-1', ...) to narrow to one level. Requires course.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_lesson",
    description:
      "The full text of one Palestra lesson as markdown, plus the user's completion state for it. Get valid module_path values from get_progress or list_curriculum.",
    inputSchema: {
      type: "object",
      properties: {
        module_path: {
          type: "string",
          description:
            "Lesson path in the form 'course/level/slug', e.g. 'ai-fluency/foundations/what-is-ai-fluency'. Root-level pages take the form 'course/slug', e.g. 'ai-fluency/glossary'.",
        },
        include_my_responses: {
          type: "boolean",
          description:
            "Include the user's own past submissions to this lesson's exercises and the AI feedback they received. Default false.",
        },
        include_all_problems: {
          type: "boolean",
          description:
            "Include every problem in practice and drill sets rather than the first five. Default false; can be very long.",
        },
      },
      required: ["module_path"],
      additionalProperties: false,
    },
  },
  {
    name: "get_review_questions",
    description:
      "Multiple-choice review questions carrying the user's spaced-repetition state (Leitner box 0-5, next due date, whether it is due now, past accuracy). Use this to quiz the user. By default it draws only from lessons they have completed and returns what is due today or overdue, shakiest first - matching the platform's own daily quiz.",
    inputSchema: {
      type: "object",
      properties: {
        course: { type: "string", description: "Filter to one course id." },
        module_path: {
          type: "string",
          description: "Filter to one lesson, e.g. 'cfa-1/level-3/time-value-of-money'.",
        },
        only_due: {
          type: "boolean",
          description:
            "Only questions due today or overdue, including ones never seen. Default true.",
        },
        limit: {
          type: "integer",
          description: "Max questions to return. Default 10, max 50.",
          minimum: 1,
          maximum: 50,
        },
        include_answers: {
          type: "boolean",
          description:
            "Include correct_index and explanation. Default true; set false to quiz without spoilers in context.",
        },
        include_unstudied: {
          type: "boolean",
          description:
            "Also draw from lessons the user has not completed yet. Default false - normally you should only review studied material. Ignored when module_path is given.",
        },
      },
      additionalProperties: false,
    },
  },
] as const;

export async function callTool(
  name: string,
  args: Record<string, unknown>,
  identity: McpIdentity
): Promise<ToolResult> {
  // Every tool that takes a course reads content by id, and an unpriced course
  // counts as free, so a private course must be refused here for everyone but
  // its owner -- with the same error as a course that doesn't exist.
  const requested =
    name === "get_lesson"
      ? str(args.module_path)?.replace(/^\/+/, "").split("/")[0]
      : str(args.course);
  if (requested && !(await canViewCourse(requested, identity.userId))) {
    return err(unknownCourse(requested));
  }

  switch (name) {
    case "get_progress":
      return getProgress(identity, str(args.course));
    case "list_curriculum":
      return listCurriculum(identity, str(args.course), str(args.level));
    case "get_lesson":
      return getLesson(identity, args);
    case "get_review_questions":
      return getReviewQuestions(identity, args);
    default:
      return err(`Unknown tool: ${name}`);
  }
}

// ---------------------------------------------------------------- helpers

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function json(value: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function text(value: string): ToolResult {
  return { content: [{ type: "text", text: value }] };
}

function err(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

function unknownCourse(courseId: string): string {
  return `Unknown course '${courseId}'. Valid ids: ${getCourses()
    .map((c) => c.id)
    .join(", ")}.`;
}

/** getCurriculum throws when a course has no curriculum.json. */
function safeCurriculum(courseId: string): CurriculumData | null {
  try {
    return getCurriculum(courseId);
  } catch {
    return null;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function briefly(courseId: string, mod: ModuleMeta) {
  return {
    module_path: modulePathOf(courseId, mod),
    title: mod.title,
    description: mod.description,
    level: mod.level,
  };
}

// ---------------------------------------------------------------- tools

async function getProgress(
  identity: McpIdentity,
  courseFilter?: string
): Promise<ToolResult> {
  const [progressRows, xp, sparks, history] = await Promise.all([
    getModuleProgress(identity),
    getUserXp(identity),
    getSparkBalance(identity),
    getQuestionHistory(identity),
  ]);

  const done = completedPaths(progressRows);
  const catalogue = getCourses().filter(
    (c) => !courseFilter || c.id === courseFilter
  );

  if (courseFilter && catalogue.length === 0) {
    return err(
      `Unknown course '${courseFilter}'. Call list_curriculum with no arguments to see valid course ids.`
    );
  }

  const lastCompletedAt = new Map<string, string>();
  for (const row of progressRows) {
    if (!row.completed || !row.completed_at) continue;
    const courseId = row.module_path.split("/")[0];
    const prev = lastCompletedAt.get(courseId);
    if (!prev || row.completed_at > prev) {
      lastCompletedAt.set(courseId, row.completed_at);
    }
  }

  const courses = [];
  for (const course of catalogue) {
    const curriculum = safeCurriculum(course.id);
    if (!curriculum) continue;

    const modules = getOrderedModules(curriculum);
    const completed = modules.filter((m) =>
      done.has(modulePathOf(course.id, m))
    ).length;
    if (completed === 0 && !courseFilter) continue; // only courses actually started

    const next = findNextIncomplete(course.id, curriculum, done);
    courses.push({
      course: course.id,
      title: course.title,
      completed,
      total: modules.length,
      last_completed_at: lastCompletedAt.get(course.id) ?? null,
      next_lesson: next ? briefly(course.id, next) : null,
    });
  }

  // The course touched most recently is the one they're actually working on.
  const active = courses
    .filter((c) => c.last_completed_at && c.next_lesson)
    .sort((a, b) =>
      (b.last_completed_at as string).localeCompare(a.last_completed_at as string)
    )[0];

  const currentLesson = active?.next_lesson
    ? {
        ...active.next_lesson,
        course: active.course,
        level_title: getLevelTitle(active.course, active.next_lesson.level),
      }
    : null;

  // Same scope get_review_questions uses by default, so the two tools agree:
  // questions attached to lessons this user has actually completed.
  const now = today();
  const byId = new Map(history.map((h) => [h.question_id, h]));
  const dueCount = loadReviewQuestions().filter((q) => {
    if (!done.has(q.modulePath)) return false;
    const h = byId.get(q.id);
    return !h || !h.next_due || h.next_due <= now;
  }).length;

  return json({
    current_lesson: currentLesson,
    courses,
    totals: {
      lessons_completed: done.size,
      xp: xp?.total_xp ?? 0,
      daily_streak: xp?.daily_streak ?? 0,
      longest_streak: xp?.longest_streak ?? 0,
      last_quiz_date: xp?.last_quiz_date ?? null,
      sparks,
      questions_due_for_review: dueCount,
    },
    note:
      currentLesson === null
        ? "No lessons completed yet. Use list_curriculum to pick a course to start."
        : undefined,
  });
}

async function listCurriculum(
  identity: McpIdentity,
  courseFilter?: string,
  levelFilter?: string
): Promise<ToolResult> {
  const progressRows = await getModuleProgress(identity);
  const done = completedPaths(progressRows);

  if (!courseFilter) {
    const viewable = [...getCourses(), ...(await getViewablePrivateCourses(identity.userId))];
    const courses = viewable.map((c) => {
      const curriculum = safeCurriculum(c.id);
      const modules = curriculum ? getOrderedModules(curriculum) : [];
      const completed = modules.filter((m) => done.has(modulePathOf(c.id, m)))
        .length;
      return {
        course: c.id,
        title: c.title,
        description: c.description,
        completed,
        total: modules.length,
        started: completed > 0,
      };
    });
    return json({ courses });
  }

  const curriculum = safeCurriculum(courseFilter);
  if (!curriculum) {
    return err(unknownCourse(courseFilter));
  }

  const levelSlugs = getLevelOrder(curriculum);
  if (levelFilter && !levelSlugs.includes(levelFilter)) {
    return err(
      `Unknown level '${levelFilter}' in ${courseFilter}. Valid levels: ${levelSlugs.join(", ")}.`
    );
  }

  const completedAt = new Map(
    progressRows
      .filter((r) => r.completed)
      .map((r) => [r.module_path, r.completed_at] as const)
  );

  const levels = levelSlugs
    .filter((slug) => !levelFilter || slug === levelFilter)
    .map((slug) => {
      const info = curriculum.levels.find(
        (l) => (l.level === 0 ? "foundations" : `level-${l.level}`) === slug
      );
      const modules = (curriculum.modules[slug] ?? [])
        .filter((m) => !m.isIndex)
        .map((m) => {
          const modulePath = modulePathOf(courseFilter, m);
          return {
            module_path: modulePath,
            title: m.title,
            description: m.description,
            order: m.order,
            is_checkpoint: m.isCheckpoint,
            completed: done.has(modulePath),
            completed_at: completedAt.get(modulePath) ?? null,
          };
        });
      return {
        level_slug: slug,
        title: info?.title ?? slug,
        subtitle: info?.subtitle,
        completed: modules.filter((m) => m.completed).length,
        total: modules.length,
        modules,
      };
    });

  return json({ course: courseFilter, levels });
}

async function getLesson(
  identity: McpIdentity,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const modulePath = str(args.module_path);
  if (!modulePath) return err("module_path is required.");

  const parts = modulePath.replace(/^\/+|\/+$/g, "").split("/");
  const [courseId, ...slugParts] = parts;
  if (!courseId || slugParts.length === 0 || slugParts.length > 2) {
    return err(
      `Malformed module_path '${modulePath}'. Expected 'course/level/slug' (or 'course/slug' for root pages).`
    );
  }

  const lesson = getModuleBySlugPath(courseId, slugParts);
  if (!lesson) {
    const curriculum = safeCurriculum(courseId);
    const hint = curriculum
      ? ` Levels in ${courseId}: ${getLevelOrder(curriculum).join(", ")}. Use list_curriculum for exact paths.`
      : ` Unknown course '${courseId}'. Call list_curriculum with no arguments for valid ids.`;
    return err(`No lesson at '${modulePath}'.${hint}`);
  }

  const [progressRows, xp] = await Promise.all([
    getModuleProgress(identity),
    getUserXp(identity),
  ]);
  const row = progressRows.find((r) => r.module_path === modulePath);

  const status = row?.completed
    ? `Completed ${(row.completed_at ?? "").slice(0, 10) || "(date unknown)"}`
    : "Not yet completed";

  const parts_ = [
    `# ${lesson.meta.title}`,
    `_${lesson.meta.description}_`,
    `**${courseId} · ${getLevelTitle(courseId, lesson.meta.level)} · ${status}**`,
    "---",
    renderBlocks(lesson.blocks, {
      provider: xp?.provider ?? "claude-code",
      includeAllProblems: args.include_all_problems === true,
    }),
  ];

  if (lesson.reviewQuestions?.length) {
    const qs = lesson.reviewQuestions.map((q, i) => {
      const opts = q.options
        .map((o, j) => `  ${j === q.correctIndex ? "*" : "-"} ${o}`)
        .join("\n");
      return `**${i + 1}. ${q.question}**\n\n${opts}\n\n${q.explanation}`;
    });
    parts_.push(`## Review questions\n\n${qs.join("\n\n")}`);
  }

  if (args.include_my_responses === true) {
    const interactions = await getInteractionsForModule(identity, modulePath);
    if (interactions.length === 0) {
      parts_.push("## Your past responses\n\n_None recorded for this lesson._");
    } else {
      const rendered = interactions.map((r) => {
        const bits = [`### ${r.interaction_type} #${r.interaction_index}`];
        if (r.user_input) bits.push(`**You wrote:**\n\n${r.user_input}`);
        if (r.ai_feedback) bits.push(`**Feedback:**\n\n${r.ai_feedback}`);
        return bits.join("\n\n");
      });
      parts_.push(`## Your past responses\n\n${rendered.join("\n\n")}`);
    }
  }

  return text(parts_.join("\n\n"));
}

// ------------------------------------------------- review questions

interface ReviewQuestion {
  id: string;
  modulePath: string;
  courseId: string;
  lessonTitle: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ~1.2MB of JSON; parsing it per call is pure waste. Generated by
// scripts/build-review-questions.ts and copied into the image by Dockerfile.
let reviewCache: ReviewQuestion[] | null = null;

function loadReviewQuestions(): ReviewQuestion[] {
  if (reviewCache) return reviewCache;
  const file = path.join(process.cwd(), "public", "review-questions.json");
  if (!fs.existsSync(file)) {
    reviewCache = [];
    return reviewCache;
  }
  reviewCache = JSON.parse(fs.readFileSync(file, "utf-8")) as ReviewQuestion[];
  return reviewCache;
}

async function getReviewQuestions(
  identity: McpIdentity,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const courseFilter = str(args.course);
  const pathFilter = str(args.module_path);
  const onlyDue = args.only_due !== false;
  const includeAnswers = args.include_answers !== false;
  // Asking for one specific lesson is an explicit request; honour it either way.
  const studiedOnly = args.include_unstudied !== true && !pathFilter;
  const limit = Math.min(
    50,
    Math.max(1, typeof args.limit === "number" ? args.limit : 10)
  );

  let pool = loadReviewQuestions();
  if (courseFilter) pool = pool.filter((q) => q.courseId === courseFilter);
  if (pathFilter) pool = pool.filter((q) => q.modulePath === pathFilter);

  if (pool.length === 0) {
    const which = pathFilter ?? courseFilter;
    return json({
      total_matching: 0,
      returned: 0,
      questions: [],
      note: which
        ? `No review questions exist for '${which}'. Drill-only courses (e.g. texas-holdem) and checkpoint, index, practice-only and exam-bank lessons have none by design.`
        : "No review questions are available. Has `npm run build:review` been run?",
    });
  }

  const [history, progressRows] = await Promise.all([
    getQuestionHistory(identity),
    studiedOnly ? getModuleProgress(identity) : Promise.resolve([]),
  ]);

  // Mirrors the platform's own daily quiz, which draws only from completed
  // lessons (src/components/review/DailyQuizProvider.tsx).
  if (studiedOnly) {
    const done = completedPaths(progressRows);
    const studied = pool.filter((q) => done.has(q.modulePath));
    if (studied.length === 0) {
      return json({
        total_matching: 0,
        returned: 0,
        questions: [],
        note: `No completed lessons${courseFilter ? ` in '${courseFilter}'` : ""} have review questions yet. Complete a lesson first, or pass include_unstudied: true to quiz on material not yet studied.`,
      });
    }
    pool = studied;
  }

  const byId = new Map(history.map((h) => [h.question_id, h]));
  const now = today();

  const annotated = pool.map((q) => {
    const h = byId.get(q.id);
    return { q, h, due: !h || !h.next_due || h.next_due <= now };
  });

  const matching = onlyDue ? annotated.filter((a) => a.due) : annotated;

  // Never-seen first, then longest overdue, then shakiest Leitner box.
  const sorted = [...matching].sort((a, b) => {
    if (!a.h !== !b.h) return a.h ? 1 : -1;
    if (a.h && b.h) {
      const cmp = (a.h.next_due ?? "").localeCompare(b.h.next_due ?? "");
      if (cmp !== 0) return cmp;
      return a.h.box - b.h.box;
    }
    return 0;
  });

  return json({
    scope: studiedOnly ? "completed lessons only" : "all lessons",
    total_matching: matching.length,
    due_for_review: matching.filter((a) => a.h).length,
    never_seen: matching.filter((a) => !a.h).length,
    returned: Math.min(limit, sorted.length),
    questions: sorted.slice(0, limit).map(({ q, h, due }) => ({
      id: q.id,
      module_path: q.modulePath,
      lesson_title: q.lessonTitle,
      question: q.question,
      options: q.options,
      ...(includeAnswers
        ? { correct_index: q.correctIndex, explanation: q.explanation }
        : {}),
      srs: srsOf(h, due),
    })),
  });
}

function srsOf(h: QuestionHistoryRow | undefined, due: boolean) {
  if (!h) return { seen: false, due };
  return {
    seen: true,
    due,
    box: h.box,
    next_due: h.next_due,
    last_seen: h.last_seen,
    total_seen: h.total_seen,
    total_correct: h.total_correct,
  };
}
