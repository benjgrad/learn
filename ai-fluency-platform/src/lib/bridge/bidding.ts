// SAYC (Standard American Yellow Card) bidding logic for drill generators

import {
  cardRank,
  cardSuit,
  handBySuit,
  SUIT_ORDER,
} from "./cards";
import {
  countHCP,
  totalPoints,
  countLengthPoints,
  countShortnessPoints,
  isBalanced,
  suitLength,
  suitLengths,
  longestSuit,
  suitQuality,
  estimatePlayingTricks,
  handShape,
} from "./evaluation";

/**
 * Determine the SAYC opening bid for a hand.
 * Returns: "Pass", "1C", "1D", "1H", "1S", "1NT", "2C", "2D", "2H", "2S",
 *          "3C", "3D", "3H", "3S", etc.
 */
export function determineOpening(hand: string[]): string {
  const hcp = countHCP(hand);
  const tp = totalPoints(hand);
  const bal = isBalanced(hand);
  const lengths = suitLengths(hand);
  const playingTricks = estimatePlayingTricks(hand);

  // Strong 2C: 22+ HCP or 9+ playing tricks with a strong hand
  if (hcp >= 22 || (hcp >= 17 && playingTricks >= 9)) {
    return "2C";
  }

  // 1NT: 15-17 HCP, balanced
  if (hcp >= 15 && hcp <= 17 && bal) {
    return "1NT";
  }

  // 2NT: 20-21 HCP, balanced
  if (hcp >= 20 && hcp <= 21 && bal) {
    return "2NT";
  }

  // Weak 2: 6-10 HCP, 6-card suit (not clubs), not balanced
  if (hcp >= 6 && hcp <= 10) {
    for (const suit of ["S", "H", "D"]) {
      if (lengths[suit] === 6 && suitQuality(hand, suit) >= 2) {
        return `2${suit}`;
      }
    }
  }

  // 3-level preempt: 6-10 HCP, 7-card suit
  if (hcp >= 6 && hcp <= 10) {
    for (const suit of ["S", "H", "D", "C"]) {
      if (lengths[suit] >= 7) {
        return `3${suit}`;
      }
    }
  }

  // Not enough to open
  if (tp < 13) {
    // Rule of 20: HCP + length of two longest suits >= 20
    const shape = handShape(hand);
    if (hcp + shape[0] + shape[1] >= 20 && hcp >= 10) {
      // Open using normal rules below
    } else {
      return "Pass";
    }
  }

  // 1 of a suit: 13-21 total points (or rule of 20)
  return chooseSuitOpening(hand, lengths);
}

/**
 * Choose which suit to open at the 1-level.
 * 5-card major system, longest suit, etc.
 */
function chooseSuitOpening(
  hand: string[],
  lengths: Record<string, number>
): string {
  // With a 5+ card major, open it (longer major first; with equal length, higher)
  if (lengths.S >= 5 && lengths.S >= lengths.H) return "1S";
  if (lengths.H >= 5) return "1H";

  // With two 5+ card suits (both minors), open the longer; if equal, 1D
  if (lengths.D >= 5 && lengths.D > lengths.C) return "1D";
  if (lengths.C >= 5 && lengths.C > lengths.D) return "1C";
  if (lengths.D >= 5 && lengths.C >= 5) return "1D";

  // Only 4-card suits remain for majors; need 5 to open a major
  // Open longest minor
  if (lengths.D > lengths.C) return "1D";
  if (lengths.C > lengths.D) return "1C";

  // Equal length minors:
  // 4-4 in minors → open 1D
  // 3-3 in minors → open 1C (with 4-4 in majors, 3-3 in minors)
  if (lengths.D === 4 && lengths.C === 4) return "1D";
  if (lengths.D === 3 && lengths.C === 3) return "1C";

  // Fallback
  return "1C";
}

/** Bid value for comparison: converts "1C"=5, "1D"=6, ..., "7NT"=39 */
function bidLevel(bid: string): number {
  if (bid === "Pass" || bid === "Dbl" || bid === "Rdbl") return 0;
  const level = parseInt(bid[0]);
  const strain = bid.slice(1);
  const strainOrder: Record<string, number> = { C: 0, D: 1, H: 2, S: 3, NT: 4 };
  return (level - 1) * 5 + (strainOrder[strain] ?? 0) + 1;
}

/**
 * Determine response to partner's opening bid (basic SAYC).
 * hand: responder's hand
 * opening: partner's opening bid
 * Returns the recommended response.
 */
export function determineResponse(hand: string[], opening: string): string {
  const hcp = countHCP(hand);
  const tp = totalPoints(hand);
  const lengths = suitLengths(hand);

  // Response to 1NT
  if (opening === "1NT") {
    return respondToOneNT(hand, hcp, lengths);
  }

  // Response to 2C (strong forcing)
  if (opening === "2C") {
    return respondToTwoClubs(hand, hcp, lengths);
  }

  // Response to weak 2 (2D, 2H, 2S)
  if (opening.match(/^2[DHS]$/)) {
    return respondToWeakTwo(hand, hcp, lengths, opening);
  }

  // Response to 1 of a major (1H, 1S)
  if (opening === "1H" || opening === "1S") {
    return respondToOneMajor(hand, hcp, tp, lengths, opening);
  }

  // Response to 1 of a minor (1C, 1D)
  if (opening === "1C" || opening === "1D") {
    return respondToOneMinor(hand, hcp, tp, lengths, opening);
  }

  // Response to 2NT
  if (opening === "2NT") {
    return respondToTwoNT(hand, hcp, lengths);
  }

  // Response to 3-level preempt
  if (opening.match(/^3[CDHS]$/)) {
    return respondToPreempt(hand, hcp, lengths, opening);
  }

  return "Pass";
}

function respondToOneNT(
  hand: string[],
  hcp: number,
  lengths: Record<string, number>
): string {
  // 0-7: Pass (usually)
  if (hcp < 8) {
    // With 5+ major, transfer (escape)
    if (lengths.H >= 5) return "2D"; // Jacoby transfer to hearts
    if (lengths.S >= 5) return "2H"; // Jacoby transfer to spades
    return "Pass";
  }

  // 8-9: Invitational
  if (hcp <= 9) {
    // Stayman with 4-card major
    if (lengths.H >= 4 || lengths.S >= 4) return "2C";
    // Jacoby transfer with 5+ major
    if (lengths.H >= 5) return "2D";
    if (lengths.S >= 5) return "2H";
    return "2NT"; // Invitational raise
  }

  // 10-15: Game values
  if (hcp <= 15) {
    // Stayman with 4-card major
    if (lengths.H >= 4 || lengths.S >= 4) {
      // With 5+ card major, prefer transfer
      if (lengths.H >= 5) return "2D";
      if (lengths.S >= 5) return "2H";
      return "2C"; // Stayman
    }
    if (lengths.H >= 5) return "2D";
    if (lengths.S >= 5) return "2H";
    return "3NT";
  }

  // 16+: Slam interest
  if (lengths.H >= 5) return "2D"; // Transfer then bid again
  if (lengths.S >= 5) return "2H";
  return "4NT"; // Quantitative (invitational to 6NT)
}

function respondToTwoClubs(
  hand: string[],
  hcp: number,
  lengths: Record<string, number>
): string {
  // 0-7: 2D waiting
  if (hcp < 8) {
    return "2D";
  }

  // 8+ with a good 5+ card suit: positive response
  for (const suit of ["S", "H", "D"]) {
    if (lengths[suit] >= 5 && hcp >= 8) {
      return `2${suit}`;
    }
  }

  // 8+ balanced: 2NT
  if (hcp >= 8) {
    return "2NT";
  }

  return "2D";
}

function respondToWeakTwo(
  hand: string[],
  hcp: number,
  lengths: Record<string, number>,
  opening: string
): string {
  const suit = opening[1];

  // Raise with 3+ card support (preemptive or constructive)
  if (lengths[suit] >= 3) {
    if (hcp >= 15) return `4${suit}`; // Game
    if (hcp >= 8) return `3${suit}`; // Competitive raise
    return "Pass";
  }

  // 2NT feature ask with 15+ HCP (Ogust or feature)
  if (hcp >= 15) {
    return "2NT";
  }

  // Strong hand without fit: new suit forcing
  if (hcp >= 16) {
    // Bid longest suit
    for (const s of ["S", "H", "D", "C"]) {
      if (s !== suit && lengths[s] >= 5) {
        // Must be at higher bidding level
        const newBid = `3${s}`;
        if (bidLevel(newBid) > bidLevel(opening)) return newBid;
      }
    }
  }

  return "Pass";
}

function respondToOneMajor(
  hand: string[],
  hcp: number,
  tp: number,
  lengths: Record<string, number>,
  opening: string
): string {
  const suit = opening[1]; // H or S
  const support = lengths[suit];

  // Not enough to respond
  if (hcp < 6) return "Pass";

  // Raise with support
  if (support >= 3) {
    const supportPts = hcp + countShortnessPoints(hand);
    if (supportPts >= 13) return `4${suit}`; // Game raise
    if (supportPts >= 10) return `3${suit}`; // Limit raise (invitational)
    if (supportPts >= 6) return `2${suit}`; // Simple raise
  }

  // 1NT: 6-10 HCP, no fit, no new suit to bid at 1-level
  // New suit at 1-level
  if (opening === "1H" && lengths.S >= 4 && hcp >= 6) {
    return "1S";
  }

  // New suit at 2-level (10+ points, 4+ card suit)
  if (hcp >= 10) {
    // Bid longest suit at 2 level
    for (const s of ["C", "D"]) {
      if (lengths[s] >= 4) return `2${s}`;
    }
    if (opening === "1S" && lengths.H >= 5) return "2H";
  }

  // 1NT forcing (by unpassed hand) or semi-forcing
  if (hcp >= 6 && hcp <= 10) {
    return "1NT";
  }

  // Strong hand without fit: bid new suit
  if (hcp >= 10) {
    for (const s of ["C", "D", "H", "S"]) {
      if (s !== suit && lengths[s] >= 4) {
        const bid = bidLevel(`2${s}`) > bidLevel(opening) ? `2${s}` : `1${s}`;
        if (bidLevel(bid) > bidLevel(opening)) return bid;
      }
    }
  }

  return "1NT";
}

function respondToOneMinor(
  hand: string[],
  hcp: number,
  tp: number,
  lengths: Record<string, number>,
  opening: string
): string {
  // Not enough to respond
  if (hcp < 6) return "Pass";

  // Bid 4-card major up the line
  if (lengths.H >= 4 && hcp >= 6) return "1H";
  if (lengths.S >= 4 && hcp >= 6) return "1S";

  // Raise partner's minor with support
  const suit = opening[1]; // C or D
  if (lengths[suit] >= 4) {
    if (hcp >= 13) return `3${suit}`; // Limit raise / forcing
    if (hcp >= 6) return `2${suit}`; // Simple raise
  }

  // NT responses
  if (hcp >= 13 && hcp <= 15 && isBalanced(hand)) return "2NT";
  if (hcp >= 16 && hcp <= 18 && isBalanced(hand)) return "3NT";

  // Bid a new minor
  if (opening === "1C" && lengths.D >= 4 && hcp >= 6) return "1D";

  // 1NT with 6-10 balanced
  if (hcp >= 6 && hcp <= 10) return "1NT";

  return "1NT";
}

function respondToTwoNT(
  hand: string[],
  hcp: number,
  lengths: Record<string, number>
): string {
  // 2NT shows 20-21 balanced
  if (hcp < 4) return "Pass";

  // Stayman
  if ((lengths.H >= 4 || lengths.S >= 4) && hcp >= 4) return "3C";

  // Transfer with 5+ major
  if (lengths.H >= 5) return "3D";
  if (lengths.S >= 5) return "3H";

  // Raise to game
  if (hcp >= 4 && hcp <= 10) return "3NT";

  // Slam interest
  if (hcp >= 11) return "4NT"; // Quantitative

  return "3NT";
}

function respondToPreempt(
  hand: string[],
  hcp: number,
  lengths: Record<string, number>,
  opening: string
): string {
  const suit = opening[1];

  // Raise with fit
  if (lengths[suit] >= 3) {
    if (hcp >= 15) {
      const gameLevel = suit === "C" || suit === "D" ? "5" : "4";
      return `${gameLevel}${suit}`;
    }
    return `4${suit}`;
  }

  // 3NT with stoppers and values
  if (hcp >= 16 && isBalanced(hand)) return "3NT";

  return "Pass";
}

/**
 * Determine opener's rebid after hearing responder's bid.
 * Simple version for drill generation.
 */
export function determineRebid(
  hand: string[],
  opening: string,
  response: string
): string {
  const hcp = countHCP(hand);
  const tp = totalPoints(hand);
  const lengths = suitLengths(hand);

  // Partner passed — auction over
  if (response === "Pass") return "Pass";

  // After 1NT opening and Stayman (2C)
  if (opening === "1NT" && response === "2C") {
    if (lengths.H >= 4 && lengths.S >= 4) return "2H"; // Bid hearts first
    if (lengths.H >= 4) return "2H";
    if (lengths.S >= 4) return "2S";
    return "2D"; // Denies 4-card major
  }

  // After 1NT opening and Jacoby Transfer
  if (opening === "1NT" && response === "2D") return "2H"; // Complete transfer
  if (opening === "1NT" && response === "2H") return "2S"; // Complete transfer

  // After 1-of-a-suit opening
  if (opening.match(/^1[CDHS]$/)) {
    const openedSuit = opening[1];

    // Responder raised our suit
    if (response === `2${openedSuit}`) {
      if (tp >= 19) return `4${openedSuit}`; // Jump to game
      if (tp >= 16) return `3${openedSuit}`; // Invite
      return "Pass";
    }

    // Responder bid 1NT (6-10)
    if (response === "1NT") {
      if (tp >= 19) return "2NT"; // Invite with extra
      // Rebid 6-card suit
      if (lengths[openedSuit] >= 6) return `2${openedSuit}`;
      // Bid new suit
      for (const s of ["C", "D", "H", "S"]) {
        if (s !== openedSuit && lengths[s] >= 4) {
          const bid = `2${s}`;
          if (bidLevel(bid) > bidLevel(response)) return bid;
        }
      }
      return "Pass";
    }

    // Responder bid new suit
    if (response.match(/^[12][CDHS]$/)) {
      const respSuit = response.slice(-1);
      // Support responder's suit with 4+
      if (lengths[respSuit] >= 4) {
        if (tp >= 16) return `3${respSuit}`;
        return `2${respSuit}`;
      }
      // Rebid own suit with 6+
      if (lengths[openedSuit] >= 6) {
        return `2${openedSuit}`;
      }
      // Bid new suit
      for (const s of ["C", "D", "H", "S"]) {
        if (s !== openedSuit && s !== respSuit && lengths[s] >= 4) {
          const bid = `2${s}`;
          if (bidLevel(bid) > bidLevel(response) || bidLevel(bid) > bidLevel(opening)) return bid;
        }
      }
      // 1NT rebid with balanced minimum
      if (hcp >= 12 && hcp <= 14 && isBalanced(hand)) return "1NT";
      // Rebid own suit
      return `2${openedSuit}`;
    }
  }

  return "Pass";
}
