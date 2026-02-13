import resources from '../data/resources.json';

export type ResourceType = 'book' | 'course' | 'video' | 'article' | 'tool' | 'podcast' | 'newsletter';

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  author: string;
  description: string;
  levels: number[];
  tags: string[];
}

export function getAllResources(): Resource[] {
  return resources as Resource[];
}

export function getResourceById(id: string): Resource | undefined {
  return (resources as Resource[]).find((r) => r.id === id);
}

export function filterByType(type: ResourceType): Resource[] {
  return (resources as Resource[]).filter((r) => r.type === type);
}

export function filterByLevel(level: number): Resource[] {
  return (resources as Resource[]).filter((r) => r.levels.includes(level));
}

export function filterByTag(tag: string): Resource[] {
  return (resources as Resource[]).filter((r) => r.tags.includes(tag));
}

export function filterResources(options: {
  type?: ResourceType;
  level?: number;
  tag?: string;
}): Resource[] {
  let filtered = resources as Resource[];

  if (options.type) {
    filtered = filtered.filter((r) => r.type === options.type);
  }
  if (options.level !== undefined) {
    filtered = filtered.filter((r) => r.levels.includes(options.level!));
  }
  if (options.tag) {
    filtered = filtered.filter((r) => r.tags.includes(options.tag!));
  }

  return filtered;
}

export function sortByTitle(items: Resource[]): Resource[] {
  return [...items].sort((a, b) => a.title.localeCompare(b.title));
}

export function sortByType(items: Resource[]): Resource[] {
  return [...items].sort((a, b) => a.type.localeCompare(b.type));
}

export function sortByAuthor(items: Resource[]): Resource[] {
  return [...items].sort((a, b) => a.author.localeCompare(b.author));
}

export function getResourceTypes(): ResourceType[] {
  const types = new Set((resources as Resource[]).map((r) => r.type));
  return Array.from(types).sort() as ResourceType[];
}

export function getAllTags(): string[] {
  const tags = new Set((resources as Resource[]).flatMap((r) => r.tags));
  return Array.from(tags).sort();
}

export function getResourceCountByType(): Record<ResourceType, number> {
  const counts = {} as Record<ResourceType, number>;
  for (const r of resources as Resource[]) {
    counts[r.type] = (counts[r.type] || 0) + 1;
  }
  return counts;
}

export function getResourceCountByLevel(): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const r of resources as Resource[]) {
    for (const level of r.levels) {
      counts[level] = (counts[level] || 0) + 1;
    }
  }
  return counts;
}
