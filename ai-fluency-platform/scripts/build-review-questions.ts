import * as fs from "fs";
import * as path from "path";

interface LessonReviewQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  encourageCorrect: string;
  encourageIncorrect: string;
}

interface ReviewQuestion extends LessonReviewQuestion {
  id: string;
  modulePath: string;
  courseId: string;
  lessonTitle: string;
}

const CONTENT_DIR = path.join(__dirname, "..", "content");
const OUTPUT_FILE = path.join(__dirname, "..", "public", "review-questions.json");

const COURSES = [
  "ai-fluency",
  "cfa-1",
  "cfa-2",
  "cfa-3",
  "claude-code",
  "system-design",
  "web-fundamentals",
  "react-literacy",
  "texas-holdem",
  "contract-bridge",
];

function findLessonFiles(courseDir: string): string[] {
  const files: string[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name));
      } else if (
        entry.name.endsWith(".json") &&
        entry.name !== "curriculum.json" &&
        entry.name !== "courses.json"
      ) {
        files.push(path.join(dir, entry.name));
      }
    }
  }

  walk(courseDir);
  return files;
}

function main() {
  const allQuestions: ReviewQuestion[] = [];
  let questionId = 0;
  let lessonsWithQuestions = 0;
  let lessonsWithout = 0;

  for (const courseId of COURSES) {
    const courseDir = path.join(CONTENT_DIR, courseId);
    const files = findLessonFiles(courseDir);

    for (const file of files) {
      try {
        const raw = fs.readFileSync(file, "utf-8");
        const lesson = JSON.parse(raw);
        const meta = lesson.meta;

        if (!meta || !meta.slug) continue;
        if (meta.isIndex || meta.isCheckpoint) continue;
        if (meta.isPracticeOnly || meta.isExamBank) continue;

        const reviewQuestions: LessonReviewQuestion[] =
          lesson.reviewQuestions || [];

        if (reviewQuestions.length === 0) {
          lessonsWithout++;
          continue;
        }

        lessonsWithQuestions++;

        for (const q of reviewQuestions) {
          questionId++;
          allQuestions.push({
            id: `rq-${courseId}-${questionId}`,
            modulePath: `${courseId}/${meta.level}/${meta.slug}`,
            courseId,
            lessonTitle: meta.title,
            ...q,
          });
        }
      } catch {
        console.warn(`Warning: Could not parse ${file}`);
      }
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2));

  console.log(`\nBuild complete:`);
  console.log(`  ${allQuestions.length} review questions extracted`);
  console.log(`  ${lessonsWithQuestions} lessons with questions`);
  console.log(`  ${lessonsWithout} lessons missing questions`);
  console.log(`  Output: ${OUTPUT_FILE}`);
}

main();
