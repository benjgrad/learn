import type { ModuleMeta } from "@/types/content";

/**
 * Canonical lesson order within a level: the level's index page first, then
 * modules by their `order` field.
 *
 * Every render site used to take the raw array order from curriculum.json, so a
 * level whose `order` values were missing or duplicated displayed its lessons
 * scrambled -- and, because getAdjacentModules builds prev/next from the same
 * array, the lesson-to-lesson navigation and the "finish the previous lesson"
 * gate inherited the same wrong sequence. Sorting at every read boundary means
 * bad data can no longer reorder the UI.
 */
export function byModuleOrder(a: ModuleMeta, b: ModuleMeta): number {
  if (!!a.isIndex !== !!b.isIndex) return a.isIndex ? -1 : 1;
  return (a.order ?? 0) - (b.order ?? 0);
}

export function sortModules(modules: ModuleMeta[]): ModuleMeta[] {
  return [...modules].sort(byModuleOrder);
}
