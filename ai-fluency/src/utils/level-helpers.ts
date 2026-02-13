import levels from '../data/levels.json';

export interface Level {
  level: number;
  title: string;
  subtitle: string;
  color: string;
  description: string;
  moduleCount: number;
}

export function getAllLevels(): Level[] {
  return levels as Level[];
}

export function getLevelByNumber(levelNumber: number): Level | undefined {
  return (levels as Level[]).find((l) => l.level === levelNumber);
}

export function getLevelTitle(levelNumber: number): string {
  const level = getLevelByNumber(levelNumber);
  return level ? level.title : `Level ${levelNumber}`;
}

export function getLevelColor(levelNumber: number): string {
  const level = getLevelByNumber(levelNumber);
  return level ? level.color : '#6b7280';
}

export function getLevelSubtitle(levelNumber: number): string {
  const level = getLevelByNumber(levelNumber);
  return level ? level.subtitle : '';
}

export function getPreviousLevel(levelNumber: number): Level | undefined {
  if (levelNumber <= 0) return undefined;
  return getLevelByNumber(levelNumber - 1);
}

export function getNextLevel(levelNumber: number): Level | undefined {
  if (levelNumber >= 7) return undefined;
  return getLevelByNumber(levelNumber + 1);
}

export function getAdjacentLevels(levelNumber: number): {
  previous: Level | undefined;
  current: Level | undefined;
  next: Level | undefined;
} {
  return {
    previous: getPreviousLevel(levelNumber),
    current: getLevelByNumber(levelNumber),
    next: getNextLevel(levelNumber),
  };
}

export function getTotalModuleCount(): number {
  return (levels as Level[]).reduce((sum, l) => sum + l.moduleCount, 0);
}

export function isValidLevel(levelNumber: number): boolean {
  return levelNumber >= 0 && levelNumber <= 7;
}

export function getLevelRange(): { min: number; max: number } {
  return { min: 0, max: 7 };
}
