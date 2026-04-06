// Bridge card utilities
// Card format: "{rank}{suit}" e.g. "AS" = Ace of Spades, "TD" = Ten of Diamonds
// Ranks: 2-9, T, J, Q, K, A
// Suits: C < D < H < S (ascending for bidding)

export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
export const SUITS = ["C", "D", "H", "S"] as const;

export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];

export const SUIT_NAMES: Record<string, string> = {
  S: "spades",
  H: "hearts",
  D: "diamonds",
  C: "clubs",
};

export const SUIT_ORDER: Record<string, number> = { C: 0, D: 1, H: 2, S: 3 };
export const RANK_ORDER: Record<string, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  T: 10, J: 11, Q: 12, K: 13, A: 14,
};

export const FULL_DECK: string[] = RANKS.flatMap((r) =>
  SUITS.map((s) => `${r}${s}`)
);

export function cardRank(card: string): string {
  return card[0];
}

export function cardSuit(card: string): string {
  return card[1];
}

export function rankValue(rank: string): number {
  return RANK_ORDER[rank] ?? 0;
}

export function suitValue(suit: string): number {
  return SUIT_ORDER[suit] ?? 0;
}

/** Fisher-Yates shuffle (returns new array). */
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

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Deal four hands of 13 cards each. Returns [north, east, south, west]. */
export function dealFourHands(): [string[], string[], string[], string[]] {
  const deck = createDeck();
  return [
    deck.slice(0, 13),
    deck.slice(13, 26),
    deck.slice(26, 39),
    deck.slice(39, 52),
  ];
}

/** Deal a single 13-card hand from a shuffled deck. */
export function dealHand(): string[] {
  const deck = createDeck();
  return deck.slice(0, 13);
}

/**
 * Sort a bridge hand by suit (S, H, D, C) then rank descending within suit.
 */
export function sortHand(hand: string[]): string[] {
  return [...hand].sort((a, b) => {
    const suitDiff = suitValue(cardSuit(b)) - suitValue(cardSuit(a));
    if (suitDiff !== 0) return suitDiff;
    return rankValue(cardRank(b)) - rankValue(cardRank(a));
  });
}

/**
 * Organize hand by suit, each suit sorted rank descending.
 */
export function handBySuit(hand: string[]): {
  spades: string[];
  hearts: string[];
  diamonds: string[];
  clubs: string[];
} {
  const sorted = sortHand(hand);
  return {
    spades: sorted.filter((c) => cardSuit(c) === "S"),
    hearts: sorted.filter((c) => cardSuit(c) === "H"),
    diamonds: sorted.filter((c) => cardSuit(c) === "D"),
    clubs: sorted.filter((c) => cardSuit(c) === "C"),
  };
}

/** Pretty-print a hand organized by suit. */
export function formatHand(hand: string[]): string {
  const suits = handBySuit(hand);
  const fmt = (cards: string[]) => cards.map((c) => cardRank(c)).join("") || "—";
  return `♠ ${fmt(suits.spades)}  ♥ ${fmt(suits.hearts)}  ♦ ${fmt(suits.diamonds)}  ♣ ${fmt(suits.clubs)}`;
}
