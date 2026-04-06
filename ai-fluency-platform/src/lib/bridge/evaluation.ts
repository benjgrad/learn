// Bridge hand evaluation functions (SAYC / Standard American)

import { cardRank, cardSuit, handBySuit, rankValue } from "./cards";

const HCP_VALUES: Record<string, number> = {
  A: 4, K: 3, Q: 2, J: 1,
};

/** Count high card points: A=4, K=3, Q=2, J=1. */
export function countHCP(hand: string[]): number {
  return hand.reduce((sum, card) => sum + (HCP_VALUES[cardRank(card)] ?? 0), 0);
}

/** Suit lengths as { S: n, H: n, D: n, C: n }. */
export function suitLengths(hand: string[]): Record<string, number> {
  const lengths: Record<string, number> = { S: 0, H: 0, D: 0, C: 0 };
  for (const card of hand) {
    lengths[cardSuit(card)]++;
  }
  return lengths;
}

/** Length of a specific suit in the hand. */
export function suitLength(hand: string[], suit: string): number {
  return hand.filter((c) => cardSuit(c) === suit).length;
}

/** Length points: 1 point for each card beyond 4 in any suit. */
export function countLengthPoints(hand: string[]): number {
  const lengths = suitLengths(hand);
  let pts = 0;
  for (const suit of ["S", "H", "D", "C"]) {
    if (lengths[suit] > 4) {
      pts += lengths[suit] - 4;
    }
  }
  return pts;
}

/** Shortness points: void=3, singleton=2, doubleton=1. */
export function countShortnessPoints(hand: string[]): number {
  const lengths = suitLengths(hand);
  let pts = 0;
  for (const suit of ["S", "H", "D", "C"]) {
    if (lengths[suit] === 0) pts += 3;
    else if (lengths[suit] === 1) pts += 2;
    else if (lengths[suit] === 2) pts += 1;
  }
  return pts;
}

/**
 * Distributional points: length points (default for opener).
 * Shortness points are used for responder with fit.
 */
export function countDistributionalPoints(hand: string[]): number {
  return countLengthPoints(hand);
}

/** Total points = HCP + length points. */
export function totalPoints(hand: string[]): number {
  return countHCP(hand) + countLengthPoints(hand);
}

/**
 * Quick tricks per suit:
 * AK = 2, AQ = 1.5, A (alone) = 1, KQ = 1, Kx (K + at least one other) = 0.5
 */
export function countQuickTricks(hand: string[]): number {
  const suits = handBySuit(hand);
  let total = 0;

  for (const suitCards of [suits.spades, suits.hearts, suits.diamonds, suits.clubs]) {
    const ranks = suitCards.map((c) => cardRank(c));
    const hasA = ranks.includes("A");
    const hasK = ranks.includes("K");
    const hasQ = ranks.includes("Q");

    if (hasA && hasK) {
      total += 2;
    } else if (hasA && hasQ) {
      total += 1.5;
    } else if (hasA) {
      total += 1;
    } else if (hasK && hasQ) {
      total += 1;
    } else if (hasK && ranks.length >= 2) {
      total += 0.5;
    }
  }
  return total;
}

/**
 * Hand shape: returns suit lengths sorted descending.
 * e.g. [5, 4, 3, 1] or [4, 3, 3, 3]
 */
export function handShape(hand: string[]): [number, number, number, number] {
  const lengths = suitLengths(hand);
  const vals = [lengths.S, lengths.H, lengths.D, lengths.C];
  vals.sort((a, b) => b - a);
  return vals as [number, number, number, number];
}

/**
 * Balanced hand: 4333, 4432, or 5332.
 * No singleton, no void, at most one doubleton.
 */
export function isBalanced(hand: string[]): boolean {
  const shape = handShape(hand);
  const shapeStr = shape.join("");
  return shapeStr === "4333" || shapeStr === "4432" || shapeStr === "5332";
}

/** Returns the longest suit and its length. Tie-break: higher-ranking suit wins. */
export function longestSuit(hand: string[]): { suit: string; length: number } {
  const lengths = suitLengths(hand);
  let best = "C";
  let bestLen = lengths.C;
  for (const suit of ["D", "H", "S"]) {
    if (lengths[suit] > bestLen || (lengths[suit] === bestLen && suitValue(suit) > suitValue(best))) {
      best = suit;
      bestLen = lengths[suit];
    }
  }
  return { suit: best, length: bestLen };
}

function suitValue(suit: string): number {
  const order: Record<string, number> = { C: 0, D: 1, H: 2, S: 3 };
  return order[suit] ?? 0;
}

/** Count cards of a given rank in the hand. */
export function countRank(hand: string[], rank: string): number {
  return hand.filter((c) => cardRank(c) === rank).length;
}

/** Check if a suit has at least `n` high cards (A, K, Q, J, T). */
export function suitQuality(hand: string[], suit: string): number {
  const suitCards = hand.filter((c) => cardSuit(c) === suit);
  const highCards = ["A", "K", "Q", "J", "T"];
  return suitCards.filter((c) => highCards.includes(cardRank(c))).length;
}

/**
 * Playing tricks: rough estimate for strong hand evaluation.
 * Count expected tricks from each suit.
 */
export function estimatePlayingTricks(hand: string[]): number {
  const suits = handBySuit(hand);
  let tricks = 0;

  for (const suitCards of [suits.spades, suits.hearts, suits.diamonds, suits.clubs]) {
    const ranks = suitCards.map((c) => cardRank(c));
    const len = ranks.length;
    if (len === 0) continue;

    // Top tricks from honors
    let topTricks = 0;
    if (ranks.includes("A")) topTricks++;
    if (ranks.includes("K") && len >= 2) topTricks++;
    if (ranks.includes("Q") && len >= 3) topTricks++;

    // Length tricks (cards beyond 3)
    const lengthTricks = Math.max(0, len - 3);

    tricks += topTricks + lengthTricks;
  }

  return tricks;
}
