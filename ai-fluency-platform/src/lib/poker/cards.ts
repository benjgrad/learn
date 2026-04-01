export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
export const SUITS = ["h", "d", "c", "s"] as const;

export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];

export const FULL_DECK: string[] = RANKS.flatMap((r) =>
  SUITS.map((s) => `${r}${s}`)
);

export function rankValue(rank: string): number {
  const idx = RANKS.indexOf(rank as Rank);
  return idx + 2; // "2" = 2, "A" = 14
}

export function cardRank(card: string): string {
  return card.slice(0, -1);
}

export function cardSuit(card: string): string {
  return card.slice(-1);
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createDeck(): string[] {
  return shuffleArray([...FULL_DECK]);
}

export function drawCards(deck: string[], n: number): string[] {
  return deck.splice(0, n);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
