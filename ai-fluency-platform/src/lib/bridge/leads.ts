// Opening lead selection logic

import {
  cardRank,
  cardSuit,
  handBySuit,
  rankValue,
  sortHand,
  RANK_ORDER,
} from "./cards";
import { suitLengths, suitLength } from "./evaluation";

interface AuctionSummary {
  strain: string; // "NT", "S", "H", "D", "C"
  level: number;
}

/**
 * Select the recommended opening lead card from the hand.
 */
export function selectOpeningLead(
  hand: string[],
  auction: AuctionSummary
): string {
  if (auction.strain === "NT") {
    return leadAgainstNT(hand);
  }
  return leadAgainstSuit(hand, auction.strain);
}

/**
 * Lead against notrump: 4th from longest and strongest.
 * With a sequence (3+ touching honors), lead top of sequence.
 */
function leadAgainstNT(hand: string[]): string {
  const suits = handBySuit(hand);
  const suitEntries: [string, string[]][] = [
    ["S", suits.spades],
    ["H", suits.hearts],
    ["D", suits.diamonds],
    ["C", suits.clubs],
  ];

  // Find longest suit (tie-break: more honors, then higher suit)
  let bestSuit = "S";
  let bestCards = suits.spades;
  let bestLen = suits.spades.length;
  let bestHonors = countHonors(suits.spades);

  for (const [suit, cards] of suitEntries) {
    const len = cards.length;
    const honors = countHonors(cards);
    if (
      len > bestLen ||
      (len === bestLen && honors > bestHonors) ||
      (len === bestLen && honors === bestHonors)
    ) {
      bestSuit = suit;
      bestCards = cards;
      bestLen = len;
      bestHonors = honors;
    }
  }

  // Check for top-of-sequence leads
  const seqCard = topOfSequence(bestCards);
  if (seqCard) return seqCard;

  // 4th from longest and strongest
  if (bestCards.length >= 4) {
    return bestCards[3]; // 4th highest (sorted descending)
  }

  // With 3-card suit, lead low
  if (bestCards.length >= 1) {
    return bestCards[bestCards.length - 1]; // Lowest
  }

  // Fallback: lead first card of sorted hand
  return sortHand(hand)[0];
}

/**
 * Lead against a suit contract.
 * Priority: top of sequence > singleton > partner's suit > 4th best.
 */
function leadAgainstSuit(hand: string[], trumpSuit: string): string {
  const suits = handBySuit(hand);
  const suitEntries: [string, string[]][] = [
    ["S", suits.spades],
    ["H", suits.hearts],
    ["D", suits.diamonds],
    ["C", suits.clubs],
  ];

  // Don't lead trumps by default; filter out trump suit for side-suit leads
  const sideSuits = suitEntries.filter(([s]) => s !== trumpSuit);

  // 1. Look for top-of-sequence in a side suit (AK, KQ, QJ, JT)
  for (const [suit, cards] of sideSuits) {
    if (cards.length >= 2) {
      const seq = topOfSequence(cards);
      if (seq) return seq;
    }
  }

  // 2. Look for singleton in a side suit (not trump, not the suit with just an A)
  for (const [suit, cards] of sideSuits) {
    if (cards.length === 1 && cardRank(cards[0]) !== "A") {
      return cards[0];
    }
  }

  // 3. Lead 4th best from longest side suit
  let longestSide: string[] = [];
  for (const [suit, cards] of sideSuits) {
    if (cards.length > longestSide.length) {
      longestSide = cards;
    }
  }

  if (longestSide.length >= 4) {
    return longestSide[3]; // 4th highest
  }

  // 4. Lead top of a doubleton
  for (const [suit, cards] of sideSuits) {
    if (cards.length === 2) {
      return cards[0]; // Top of doubleton
    }
  }

  // Fallback: lead lowest from longest side suit
  if (longestSide.length > 0) {
    return longestSide[longestSide.length - 1];
  }

  // Last resort: lead a trump
  const trumpCards = suitEntries.find(([s]) => s === trumpSuit)?.[1] ?? [];
  if (trumpCards.length > 0) {
    return trumpCards[trumpCards.length - 1]; // Low trump
  }

  return sortHand(hand)[0];
}

/** Count honor cards (A, K, Q, J, T) in a set of cards. */
function countHonors(cards: string[]): number {
  const honors = ["A", "K", "Q", "J", "T"];
  return cards.filter((c) => honors.includes(cardRank(c))).length;
}

/**
 * Find top-of-sequence lead. A sequence is 3+ touching honors, or AK (2 is enough).
 * Returns the top card of the sequence, or null if no sequence found.
 */
export function topOfSequence(cards: string[]): string | null {
  if (cards.length < 2) return null;

  const ranks = cards.map((c) => cardRank(c));
  const vals = cards.map((c) => rankValue(cardRank(c)));

  // AK combination: always lead A (or K depending on partnership, we lead A)
  if (ranks[0] === "A" && ranks[1] === "K") {
    return cards[0]; // Ace from AK
  }

  // 3+ card sequence from top (KQJ, QJT, etc.)
  for (let i = 0; i < vals.length - 2; i++) {
    if (vals[i] - vals[i + 1] === 1 && vals[i + 1] - vals[i + 2] === 1) {
      return cards[i]; // Top of sequence
    }
  }

  // 2-card sequences (KQ, QJ, JT) — lead top
  if (vals[0] - vals[1] === 1 && vals[0] >= RANK_ORDER["J"]) {
    return cards[0];
  }

  return null;
}

/**
 * Check if cards in a suit contain a sequence of touching honors.
 */
export function hasSequence(cards: string[]): boolean {
  return topOfSequence(cards) !== null;
}
