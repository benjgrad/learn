/**
 * Walking a curriculum in lesson order to find where the user left off.
 *
 * There is no server-side bookmark column anywhere in the schema -- "current
 * lesson" is derived. This mirrors findNextIncompleteModule in
 * src/components/dashboard/CourseCard.tsx, which is the source of truth for
 * what the dashboard shows. Kept as a local copy rather than a shared helper:
 * deduplicating against a client component every dashboard render depends on
 * is a bigger change than the ~15 lines it saves.
 */
import type { CurriculumData, ModuleMeta } from "@/types/content";

/**
 * Level slugs in curriculum order.
 *
 * Load-bearing: curriculum.modules also holds "root" and "resources" keys
 * (getting-started, glossary, and friends). Deriving the order from levels[]
 * rather than Object.keys(modules) is what excludes them.
 */
export function getLevelOrder(curriculum: CurriculumData): string[] {
  return curriculum.levels.map((l) =>
    l.level === 0 ? "foundations" : `level-${l.level}`
  );
}

/** Every sequential lesson in a course, in order, index pages filtered out. */
export function getOrderedModules(curriculum: CurriculumData): ModuleMeta[] {
  const ordered: ModuleMeta[] = [];
  for (const levelSlug of getLevelOrder(curriculum)) {
    const mods = curriculum.modules[levelSlug];
    if (mods) ordered.push(...mods.filter((m) => !m.isIndex));
  }
  return ordered;
}

/**
 * module_progress.module_path for a lesson. Uses mod.level from the module
 * meta rather than the level key it was found under -- matching both the
 * client and how the path is written on the way in.
 */
export function modulePathOf(courseId: string, mod: ModuleMeta): string {
  return `${courseId}/${mod.level}/${mod.slug}`;
}

/** First lesson with no completed row, or null if the course is finished. */
export function findNextIncomplete(
  courseId: string,
  curriculum: CurriculumData,
  completed: Set<string>
): ModuleMeta | null {
  for (const mod of getOrderedModules(curriculum)) {
    if (!completed.has(modulePathOf(courseId, mod))) return mod;
  }
  return null;
}
