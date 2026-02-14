import type {
  ModuleContent,
  CurriculumData,
  Competency,
  Resource,
  ModuleMeta,
} from "@/types/content";
import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");

export function getCurriculum(): CurriculumData {
  const raw = fs.readFileSync(
    path.join(CONTENT_DIR, "curriculum.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

export function getModule(level: string, slug: string): ModuleContent | null {
  const filePath = path.join(CONTENT_DIR, level, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function getModuleBySlugPath(slugParts: string[]): ModuleContent | null {
  if (slugParts.length === 1) {
    // Root-level pages like getting-started, glossary
    const filePath = path.join(CONTENT_DIR, `${slugParts[0]}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  if (slugParts.length === 2) {
    return getModule(slugParts[0], slugParts[1]);
  }
  return null;
}

export function getAllModulePaths(): string[][] {
  const curriculum = getCurriculum();
  const paths: string[][] = [];

  for (const [level, modules] of Object.entries(curriculum.modules)) {
    if (level === "root") {
      for (const mod of modules) {
        paths.push([mod.slug]);
      }
    } else {
      for (const mod of modules) {
        paths.push([level, mod.slug]);
      }
    }
  }

  return paths;
}

export function getAdjacentModules(
  level: string,
  slug: string
): { prev: ModuleMeta | null; next: ModuleMeta | null } {
  const curriculum = getCurriculum();
  const allModules: ModuleMeta[] = [];

  // Build ordered list of all modules across all levels
  const levelOrder = [
    "foundations",
    "level-1",
    "level-2",
    "level-3",
    "level-4",
    "level-5",
    "level-6",
    "level-7",
  ];

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

export function getLevelModules(level: string): ModuleMeta[] {
  const curriculum = getCurriculum();
  return curriculum.modules[level] || [];
}

export function getCompetencies(): Competency[] {
  const raw = fs.readFileSync(
    path.join(CONTENT_DIR, "competencies.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

export function getResources(): Resource[] {
  const raw = fs.readFileSync(
    path.join(CONTENT_DIR, "resources.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

export function getLevelColor(levelSlug: string): string {
  const curriculum = getCurriculum();
  const levelNum = levelSlug === "foundations" ? 0 : parseInt(levelSlug.replace("level-", ""));
  const level = curriculum.levels.find((l) => l.level === levelNum);
  return level?.color || "#6b7280";
}

export function getLevelTitle(levelSlug: string): string {
  const curriculum = getCurriculum();
  const levelNum = levelSlug === "foundations" ? 0 : parseInt(levelSlug.replace("level-", ""));
  const level = curriculum.levels.find((l) => l.level === levelNum);
  return level?.title || levelSlug;
}
