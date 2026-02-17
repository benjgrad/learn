import type {
  ModuleContent,
  CurriculumData,
  Competency,
  Resource,
  ModuleMeta,
  CourseInfo,
} from "@/types/content";
import fs from "fs";
import path from "path";

const CONTENT_ROOT = path.join(process.cwd(), "content");

function courseDir(course: string): string {
  return path.join(CONTENT_ROOT, course);
}

export function getCourses(): CourseInfo[] {
  const raw = fs.readFileSync(
    path.join(CONTENT_ROOT, "courses.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

export function getCurriculum(course: string): CurriculumData {
  const raw = fs.readFileSync(
    path.join(courseDir(course), "curriculum.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

export function getModule(
  course: string,
  level: string,
  slug: string
): ModuleContent | null {
  const filePath = path.join(courseDir(course), level, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function getModuleBySlugPath(
  course: string,
  slugParts: string[]
): ModuleContent | null {
  if (slugParts.length === 1) {
    // Root-level pages like getting-started, glossary
    const filePath = path.join(courseDir(course), `${slugParts[0]}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  if (slugParts.length === 2) {
    return getModule(course, slugParts[0], slugParts[1]);
  }
  return null;
}

export function getAllModulePaths(): string[][] {
  const courses = getCourses();
  const paths: string[][] = [];

  for (const course of courses) {
    const curriculumPath = path.join(
      courseDir(course.id),
      "curriculum.json"
    );
    if (!fs.existsSync(curriculumPath)) continue;

    const curriculum = getCurriculum(course.id);

    for (const [level, modules] of Object.entries(curriculum.modules)) {
      if (level === "root") {
        for (const mod of modules) {
          paths.push([course.id, mod.slug]);
        }
      } else {
        for (const mod of modules) {
          paths.push([course.id, level, mod.slug]);
        }
      }
    }
  }

  return paths;
}

export function getAdjacentModules(
  course: string,
  level: string,
  slug: string
): { prev: ModuleMeta | null; next: ModuleMeta | null } {
  const curriculum = getCurriculum(course);
  const allModules: ModuleMeta[] = [];

  // Build ordered list from curriculum level order
  const levelOrder = curriculum.levels.map((l) =>
    l.level === 0 ? "foundations" : `level-${l.level}`
  );

  for (const l of levelOrder) {
    const mods = curriculum.modules[l];
    if (mods) {
      // Filter out index pages from navigation
      allModules.push(...mods.filter((m) => !m.isIndex));
    }
  }

  const currentIndex = allModules.findIndex(
    (m) => m.level === level && m.slug === slug
  );

  return {
    prev: currentIndex > 0 ? allModules[currentIndex - 1] : null,
    next:
      currentIndex < allModules.length - 1
        ? allModules[currentIndex + 1]
        : null,
  };
}

export function getLevelModules(course: string, level: string): ModuleMeta[] {
  const curriculum = getCurriculum(course);
  return curriculum.modules[level] || [];
}

export function getCompetencies(course: string): Competency[] {
  const filePath = path.join(courseDir(course), "competencies.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function getResources(course: string): Resource[] {
  const filePath = path.join(courseDir(course), "resources.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function getLevelColor(course: string, levelSlug: string): string {
  const curriculum = getCurriculum(course);
  const levelNum =
    levelSlug === "foundations" ? 0 : parseInt(levelSlug.replace("level-", ""));
  const level = curriculum.levels.find((l) => l.level === levelNum);
  return level?.color || "#6b7280";
}

export function getLevelTitle(course: string, levelSlug: string): string {
  const curriculum = getCurriculum(course);
  const levelNum =
    levelSlug === "foundations" ? 0 : parseInt(levelSlug.replace("level-", ""));
  const level = curriculum.levels.find((l) => l.level === levelNum);
  return level?.title || levelSlug;
}
