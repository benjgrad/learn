import { FULL_DECK } from "./cards";
import { evaluateHand, compareHands } from "./hand-evaluator";

/**
 * Count how many unseen cards would improve the hand.
 */
export function countOuts(hand: string[], board: string[]): number {
  return getOutCards(hand, board).length;
}

/**
 * Get all cards in the deck that would improve the player's hand.
 */
export function getOutCards(hand: string[], board: string[]): string[] {
  const known = new Set([...hand, ...board]);
  const currentHand = evaluateHand([...hand, ...board]);
  const outs: string[] = [];

  for (const card of FULL_DECK) {
    if (known.has(card)) continue;
    const newHand = evaluateHand([...hand, ...board, card]);
    if (compareHands(newHand, currentHand) > 0) {
      outs.push(card);
    }
  }

  return outs;
}

export interface DrawInfo {
  type: string;
  outs: number;
  description: string;
}

/**
 * Identify common draw types in a hand.
 */
export function identifyDrawTypes(hand: string[], board: string[]): DrawInfo[] {
  const draws: DrawInfo[] = [];
  const allCards = [...hand, ...board];
  const totalOuts = countOuts(hand, board);

  // Check for flush draw (4 cards of same suit)
  const suitCounts: Record<string, number> = {};
  for (const c of allCards) {
    const s = c.slice(-1);
    suitCounts[s] = (suitCounts[s] || 0) + 1;
  }
  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count === 4) {
      const known = new Set(allCards);
      const flushOuts = FULL_DECK.filter(
        (c) => c.slice(-1) === suit && !known.has(c)
      ).length;
      draws.push({
        type: "flush-draw",
        outs: flushOuts,
        description: `Flush draw (${flushOuts} outs)`,
      });
    }
  }

  // Check for straight draws by looking at rank gaps
  const ranks = allCards
    .map((c) => {
      const r = c.slice(0, -1);
      const vals = [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "T",
        "J",
        "Q",
        "K",
        "A",
      ].indexOf(r);
      return vals + 2;
    })
    .sort((a, b) => a - b);

  const uniqueRanks = [...new Set(ranks)];

  // Open-ended straight draw: 4 consecutive ranks
  for (let i = 0; i <= uniqueRanks.length - 4; i++) {
    if (uniqueRanks[i + 3] - uniqueRanks[i] === 3) {
      // Check it's not already a straight (5 consecutive)
      const hasFifth =
        (i > 0 && uniqueRanks[i - 1] === uniqueRanks[i] - 1) ||
        (i + 4 < uniqueRanks.length &&
          uniqueRanks[i + 4] === uniqueRanks[i + 3] + 1);
      if (!hasFifth) {
        // Open-ended if both ends are valid (2-A range)
        const low = uniqueRanks[i];
        const high = uniqueRanks[i + 3];
        if (low > 2 && high < 14) {
          draws.push({
            type: "open-ended-straight-draw",
            outs: 8,
            description: "Open-ended straight draw (8 outs)",
          });
        } else {
          draws.push({
            type: "gutshot",
            outs: 4,
            description: "Gutshot straight draw (4 outs)",
          });
        }
      }
    }
  }

  // If no specific draws found but there are outs, label generically
  if (draws.length === 0 && totalOuts > 0) {
    draws.push({
      type: "overcards",
      outs: totalOuts,
      description: `Overcards/improvement (${totalOuts} outs)`,
    });
  }

  return draws;
}
