import { rankValue, cardRank, cardSuit } from "./cards";

export enum HandRank {
  HIGH_CARD = 0,
  ONE_PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9,
}

export const HAND_NAMES: Record<HandRank, string> = {
  [HandRank.HIGH_CARD]: "High Card",
  [HandRank.ONE_PAIR]: "One Pair",
  [HandRank.TWO_PAIR]: "Two Pair",
  [HandRank.THREE_OF_A_KIND]: "Three of a Kind",
  [HandRank.STRAIGHT]: "Straight",
  [HandRank.FLUSH]: "Flush",
  [HandRank.FULL_HOUSE]: "Full House",
  [HandRank.FOUR_OF_A_KIND]: "Four of a Kind",
  [HandRank.STRAIGHT_FLUSH]: "Straight Flush",
  [HandRank.ROYAL_FLUSH]: "Royal Flush",
};

export interface HandResult {
  rank: HandRank;
  name: string;
  bestFiveCards: string[];
  // Numeric values for comparison: [handRank, ...tiebreakers]
  score: number[];
}

/**
 * Evaluate the best 5-card hand from 5-7 cards.
 */
export function evaluateHand(cards: string[]): HandResult {
  if (cards.length === 5) {
    return evaluateFive(cards);
  }

  // For 6-7 cards, check all C(n,5) combinations
  const combos = combinations(cards, 5);
  let best: HandResult | null = null;

  for (const combo of combos) {
    const result = evaluateFive(combo);
    if (!best || compareScores(result.score, best.score) > 0) {
      best = result;
    }
  }

  return best!;
}

/**
 * Compare two HandResults. Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function compareHands(a: HandResult, b: HandResult): number {
  return compareScores(a.score, b.score);
}

function compareScores(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function evaluateFive(cards: string[]): HandResult {
  const ranks = cards.map((c) => rankValue(cardRank(c)));
  const suits = cards.map((c) => cardSuit(c));

  // Sort ranks descending
  const sorted = [...ranks].sort((a, b) => b - a);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check for straight
  const straightHigh = getStraightHigh(sorted);
  const isStraight = straightHigh > 0;

  // Group by rank
  const groups = getGroups(sorted);
  // groups sorted by [count desc, value desc]

  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        rank: HandRank.ROYAL_FLUSH,
        name: HAND_NAMES[HandRank.ROYAL_FLUSH],
        bestFiveCards: cards,
        score: [HandRank.ROYAL_FLUSH, 14],
      };
    }
    return {
      rank: HandRank.STRAIGHT_FLUSH,
      name: HAND_NAMES[HandRank.STRAIGHT_FLUSH],
      bestFiveCards: cards,
      score: [HandRank.STRAIGHT_FLUSH, straightHigh],
    };
  }

  if (groups[0].count === 4) {
    return {
      rank: HandRank.FOUR_OF_A_KIND,
      name: HAND_NAMES[HandRank.FOUR_OF_A_KIND],
      bestFiveCards: cards,
      score: [HandRank.FOUR_OF_A_KIND, groups[0].value, groups[1].value],
    };
  }

  if (groups[0].count === 3 && groups[1].count === 2) {
    return {
      rank: HandRank.FULL_HOUSE,
      name: HAND_NAMES[HandRank.FULL_HOUSE],
      bestFiveCards: cards,
      score: [HandRank.FULL_HOUSE, groups[0].value, groups[1].value],
    };
  }

  if (isFlush) {
    return {
      rank: HandRank.FLUSH,
      name: HAND_NAMES[HandRank.FLUSH],
      bestFiveCards: cards,
      score: [HandRank.FLUSH, ...sorted],
    };
  }

  if (isStraight) {
    return {
      rank: HandRank.STRAIGHT,
      name: HAND_NAMES[HandRank.STRAIGHT],
      bestFiveCards: cards,
      score: [HandRank.STRAIGHT, straightHigh],
    };
  }

  if (groups[0].count === 3) {
    return {
      rank: HandRank.THREE_OF_A_KIND,
      name: HAND_NAMES[HandRank.THREE_OF_A_KIND],
      bestFiveCards: cards,
      score: [
        HandRank.THREE_OF_A_KIND,
        groups[0].value,
        groups[1].value,
        groups[2].value,
      ],
    };
  }

  if (groups[0].count === 2 && groups[1].count === 2) {
    const highPair = Math.max(groups[0].value, groups[1].value);
    const lowPair = Math.min(groups[0].value, groups[1].value);
    return {
      rank: HandRank.TWO_PAIR,
      name: HAND_NAMES[HandRank.TWO_PAIR],
      bestFiveCards: cards,
      score: [HandRank.TWO_PAIR, highPair, lowPair, groups[2].value],
    };
  }

  if (groups[0].count === 2) {
    return {
      rank: HandRank.ONE_PAIR,
      name: HAND_NAMES[HandRank.ONE_PAIR],
      bestFiveCards: cards,
      score: [
        HandRank.ONE_PAIR,
        groups[0].value,
        groups[1].value,
        groups[2].value,
        groups[3].value,
      ],
    };
  }

  return {
    rank: HandRank.HIGH_CARD,
    name: HAND_NAMES[HandRank.HIGH_CARD],
    bestFiveCards: cards,
    score: [HandRank.HIGH_CARD, ...sorted],
  };
}

/**
 * Returns the high card of the straight, or 0 if not a straight.
 * Handles A-2-3-4-5 (wheel) where high is 5.
 */
function getStraightHigh(sorted: number[]): number {
  const unique = [...new Set(sorted)];
  if (unique.length < 5) return 0;

  // Normal straight check
  if (unique[0] - unique[4] === 4) return unique[0];

  // Ace-low straight (wheel): A-5-4-3-2
  if (
    unique[0] === 14 &&
    unique[1] === 5 &&
    unique[2] === 4 &&
    unique[3] === 3 &&
    unique[4] === 2
  ) {
    return 5;
  }

  return 0;
}

interface RankGroup {
  value: number;
  count: number;
}

/**
 * Groups sorted ranks by count (descending), then value (descending).
 */
function getGroups(sorted: number[]): RankGroup[] {
  const counts = new Map<number, number>();
  for (const r of sorted) {
    counts.set(r, (counts.get(r) || 0) + 1);
  }

  const groups: RankGroup[] = [];
  for (const [value, count] of counts) {
    groups.push({ value, count });
  }

  // Sort by count desc, then value desc
  groups.sort((a, b) => b.count - a.count || b.value - a.value);
  return groups;
}

/**
 * Generate all C(n, k) combinations from an array.
 */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];

  const result: T[][] = [];
  const first = arr[0];
  const rest = arr.slice(1);

  // Include first element
  for (const combo of combinations(rest, k - 1)) {
    result.push([first, ...combo]);
  }

  // Exclude first element
  for (const combo of combinations(rest, k)) {
    result.push(combo);
  }

  return result;
}
