import { rankValue, cardRank, cardSuit } from "./cards";

export type HandTier = "premium" | "strong" | "playable" | "marginal" | "trash";
export type Position = "early" | "middle" | "late" | "blinds";

export const POSITION_NAMES: Record<Position, string> = {
  early: "Early Position (UTG/UTG+1)",
  middle: "Middle Position (MP/HJ)",
  late: "Late Position (CO/BTN)",
  blinds: "Blinds (SB/BB)",
};

export const TIER_LABELS: Record<HandTier, string> = {
  premium: "Premium",
  strong: "Strong",
  playable: "Playable",
  marginal: "Marginal",
  trash: "Trash",
};

/**
 * Classify a starting hand by tier.
 */
export function classifyHand(card1: string, card2: string): HandTier {
  const r1 = rankValue(cardRank(card1));
  const r2 = rankValue(cardRank(card2));
  const suited = cardSuit(card1) === cardSuit(card2);
  const high = Math.max(r1, r2);
  const low = Math.min(r1, r2);
  const gap = high - low;
  const pair = r1 === r2;

  // Premium: AA, KK, QQ, AKs
  if (pair && high >= 12) return "premium"; // QQ+
  if (high === 14 && low === 13 && suited) return "premium"; // AKs

  // Strong: JJ, TT, AKo, AQs, AJs, KQs
  if (pair && high >= 10) return "strong"; // JJ, TT
  if (high === 14 && low === 13) return "strong"; // AKo
  if (high === 14 && low >= 11 && suited) return "strong"; // AQs, AJs
  if (high === 13 && low === 12 && suited) return "strong"; // KQs

  // Playable: 99-77, AQ-ATo, KQ-KJo, suited connectors T9s+, AXs
  if (pair && high >= 7) return "playable"; // 99-77
  if (high === 14 && low >= 10) return "playable"; // AQ-ATo
  if (high === 13 && low >= 11) return "playable"; // KQ-KJo
  if (suited && gap === 1 && low >= 9) return "playable"; // T9s, JTs, QJs
  if (high === 14 && suited) return "playable"; // AXs

  // Marginal: 66-22, suited connectors, suited one-gappers, KTo, QJo
  if (pair) return "marginal"; // 66-22
  if (suited && gap <= 2 && low >= 5) return "marginal"; // suited connectors/one-gappers
  if (high === 13 && low === 10) return "marginal"; // KTo
  if (high === 12 && low === 11) return "marginal"; // QJo
  if (suited && high >= 11) return "marginal"; // other suited broadways

  return "trash";
}

/**
 * Recommend an action based on hand and position.
 */
export function recommendAction(
  card1: string,
  card2: string,
  position: Position
): "raise" | "call" | "fold" {
  const tier = classifyHand(card1, card2);

  switch (position) {
    case "early":
      if (tier === "premium") return "raise";
      if (tier === "strong") return "raise";
      return "fold";

    case "middle":
      if (tier === "premium") return "raise";
      if (tier === "strong") return "raise";
      if (tier === "playable") return "raise";
      return "fold";

    case "late":
      if (tier === "premium") return "raise";
      if (tier === "strong") return "raise";
      if (tier === "playable") return "raise";
      if (tier === "marginal") return "call";
      return "fold";

    case "blinds":
      if (tier === "premium") return "raise";
      if (tier === "strong") return "raise";
      if (tier === "playable") return "call";
      if (tier === "marginal") return "call";
      return "fold";
  }
}
