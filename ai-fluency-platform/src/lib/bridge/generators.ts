import {
  dealHand,
  sortHand,
  formatHand,
  handBySuit,
  shuffleArray,
  pickRandom,
  randomInt,
  createDeck,
  cardRank,
  cardSuit,
  SUITS,
  RANKS,
} from "./cards";
import {
  countHCP,
  countLengthPoints,
  countShortnessPoints,
  totalPoints,
  countQuickTricks,
  handShape,
  isBalanced,
  suitLengths,
  suitLength,
  longestSuit,
  suitQuality,
  estimatePlayingTricks,
} from "./evaluation";
import {
  determineOpening,
  determineResponse,
  determineRebid,
} from "./bidding";
import {
  selectOpeningLead,
  hasSequence,
  topOfSequence,
} from "./leads";
import {
  CONVENTIONS,
  identifyConvention,
} from "./conventions";
import {
  isGameContract,
  isSlamContract,
  contractScore,
  penaltyScore,
} from "./scoring";
import type { DrillProblem } from "@/types/content";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BridgeGeneratorType =
  | "hcp-count"
  | "distribution-count"
  | "total-points"
  | "hand-shape"
  | "quick-tricks"
  | "mixed-evaluation"
  | "opening-bid"
  | "one-nt-decision"
  | "opening-bid-mixed"
  | "respond-major"
  | "respond-minor"
  | "respond-nt"
  | "response-mixed"
  | "opener-rebid"
  | "full-uncontested-auction"
  | "opening-lead-nt"
  | "opening-lead-suit"
  | "ace-asking"
  | "takeout-double"
  | "convention-id"
  | "sacrifice-decision";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const GENERATORS: Record<BridgeGeneratorType, () => DrillProblem> = {
  "hcp-count": generateHCPCount,
  "distribution-count": generateDistributionCount,
  "total-points": generateTotalPoints,
  "hand-shape": generateHandShape,
  "quick-tricks": generateQuickTricks,
  "mixed-evaluation": generateMixedEvaluation,
  "opening-bid": generateOpeningBid,
  "one-nt-decision": generateOneNTDecision,
  "opening-bid-mixed": generateOpeningBidMixed,
  "respond-major": generateRespondMajor,
  "respond-minor": generateRespondMinor,
  "respond-nt": generateRespondNT,
  "response-mixed": generateResponseMixed,
  "opener-rebid": generateOpenerRebid,
  "full-uncontested-auction": generateFullAuction,
  "opening-lead-nt": generateOpeningLeadNT,
  "opening-lead-suit": generateOpeningLeadSuit,
  "ace-asking": generateAceAsking,
  "takeout-double": generateTakeoutDouble,
  "convention-id": generateConventionId,
  "sacrifice-decision": generateSacrificeDecision,
};

export function generateBridgeProblems(
  type: BridgeGeneratorType,
  count: number
): DrillProblem[] {
  const gen = GENERATORS[type];
  const problems: DrillProblem[] = [];
  for (let i = 0; i < count; i++) {
    problems.push({ ...gen(), id: `gen-bridge-${type}-${i}-${Date.now()}` });
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate unique numeric distractors around the correct answer. */
function numericDistractors(correct: number, count: number, min = 0, max = 40, step = 1): number[] {
  const options = new Set<number>([correct]);
  const candidates = [correct - step, correct + step, correct - 2 * step, correct + 2 * step, correct - 3 * step, correct + 3 * step];
  for (const c of shuffleArray(candidates)) {
    if (options.size >= count) break;
    if (c >= min && c <= max && c !== correct) options.add(c);
  }
  // Fill if needed
  let offset = 1;
  while (options.size < count) {
    if (correct + offset * step <= max && !options.has(correct + offset * step)) options.add(correct + offset * step);
    if (correct - offset * step >= min && !options.has(correct - offset * step)) options.add(correct - offset * step);
    offset++;
    if (offset > 20) break;
  }
  return shuffleArray([...options]).slice(0, count);
}

/** Generate unique half-step distractors (for quick tricks). */
function halfStepDistractors(correct: number, count: number): number[] {
  const options = new Set<number>([correct]);
  const candidates = [correct - 0.5, correct + 0.5, correct - 1, correct + 1, correct + 1.5, correct - 1.5];
  for (const c of shuffleArray(candidates)) {
    if (options.size >= count) break;
    if (c >= 0 && c <= 13) options.add(c);
  }
  let offset = 1;
  while (options.size < count) {
    if (correct + offset * 0.5 <= 13 && !options.has(correct + offset * 0.5)) options.add(correct + offset * 0.5);
    if (correct - offset * 0.5 >= 0 && !options.has(correct - offset * 0.5)) options.add(correct - offset * 0.5);
    offset++;
    if (offset > 20) break;
  }
  return shuffleArray([...options]).slice(0, count);
}

/** Build options array with labels A-D. */
function makeOptions(values: (string | number)[]): string[] {
  return values.map((v, i) => `${String.fromCharCode(65 + i)}) ${v}`);
}

/** Find the correct answer label given options and the correct value. */
function findCorrectLabel(options: string[], correctValue: string | number): string {
  const idx = options.findIndex((o) => o.includes(String(correctValue)));
  return String.fromCharCode(65 + (idx >= 0 ? idx : 0));
}

/** Generate a hand that meets a predicate (retry up to maxAttempts). */
function generateHandMatching(predicate: (hand: string[]) => boolean, maxAttempts = 200): string[] {
  for (let i = 0; i < maxAttempts; i++) {
    const hand = dealHand();
    if (predicate(hand)) return hand;
  }
  return dealHand(); // Fallback
}

/** Make a formatted question hand string. */
function handDisplay(hand: string[]): string {
  return formatHand(sortHand(hand));
}

// ---------------------------------------------------------------------------
// EVALUATION GENERATORS
// ---------------------------------------------------------------------------

function generateHCPCount(): DrillProblem {
  const hand = dealHand();
  const sorted = sortHand(hand);
  const correct = countHCP(hand);
  const distractors = numericDistractors(correct, 4, 0, 37);
  const options = makeOptions(distractors);

  return {
    id: "",
    question: `How many High Card Points (HCP) does this hand have?\n\n${handDisplay(hand)}`,
    options,
    correctAnswer: findCorrectLabel(options, correct),
    explanation: `Count A=4, K=3, Q=2, J=1. This hand has ${correct} HCP.`,
    difficulty: "basic",
    cards: {
      south: sorted,
      displayAs: "bridge-single",
    },
  };
}

function generateDistributionCount(): DrillProblem {
  const hand = generateHandMatching((h) => countLengthPoints(h) > 0);
  const sorted = sortHand(hand);
  const correct = countLengthPoints(hand);
  const distractors = numericDistractors(correct, 4, 0, 10);
  const options = makeOptions(distractors);

  return {
    id: "",
    question: `How many length points does this hand have? (1 point for each card beyond 4 in a suit)\n\n${handDisplay(hand)}`,
    options,
    correctAnswer: findCorrectLabel(options, correct),
    explanation: `Length points: +1 for each card beyond 4 in any suit. This hand has ${correct} length point(s). Shape: ${handShape(hand).join("-")}.`,
    difficulty: "basic",
    cards: {
      south: sorted,
      displayAs: "bridge-single",
    },
  };
}

function generateTotalPoints(): DrillProblem {
  const hand = dealHand();
  const sorted = sortHand(hand);
  const hcp = countHCP(hand);
  const lp = countLengthPoints(hand);
  const correct = hcp + lp;
  const distractors = numericDistractors(correct, 4, 0, 40);
  const options = makeOptions(distractors);

  return {
    id: "",
    question: `What is the total point count (HCP + length points) for this hand?\n\n${handDisplay(hand)}`,
    options,
    correctAnswer: findCorrectLabel(options, correct),
    explanation: `HCP: ${hcp}, Length points: ${lp}. Total: ${correct}.`,
    difficulty: "basic",
    cards: {
      south: sorted,
      displayAs: "bridge-single",
    },
  };
}

function generateHandShape(): DrillProblem {
  const hand = dealHand();
  const sorted = sortHand(hand);
  const bal = isBalanced(hand);
  const shape = handShape(hand);
  const shapeStr = shape.join("-");
  const correctAnswer = bal ? "Balanced" : "Unbalanced";

  // Build descriptive options
  const balancedOpt = `A) Balanced (${bal ? shapeStr : "4-3-3-3 / 4-4-3-2 / 5-3-3-2"})`;
  const unbalancedOpt = `B) Unbalanced (${!bal ? shapeStr : "contains singleton/void"})`;
  const shapeOptC = `C) Semi-balanced`;
  const shapeOptD = `D) Cannot determine`;

  const options = [balancedOpt, unbalancedOpt, shapeOptC, shapeOptD];

  return {
    id: "",
    question: `Is this hand balanced or unbalanced? What is its shape?\n\n${handDisplay(hand)}`,
    options,
    correctAnswer: bal ? "A" : "B",
    explanation: `The shape is ${shapeStr}. Balanced hands are 4-3-3-3, 4-4-3-2, or 5-3-3-2. This hand is ${correctAnswer.toLowerCase()}.`,
    difficulty: "basic",
    cards: {
      south: sorted,
      displayAs: "bridge-single",
    },
  };
}

function generateQuickTricks(): DrillProblem {
  const hand = generateHandMatching((h) => countQuickTricks(h) >= 1);
  const sorted = sortHand(hand);
  const correct = countQuickTricks(hand);
  const distractors = halfStepDistractors(correct, 4);
  const options = makeOptions(distractors);

  return {
    id: "",
    question: `How many quick tricks does this hand have?\n(AK=2, AQ=1.5, A=1, KQ=1, Kx=0.5)\n\n${handDisplay(hand)}`,
    options,
    correctAnswer: findCorrectLabel(options, correct),
    explanation: `Quick tricks: AK=2, AQ=1.5, A=1, KQ=1, Kx=0.5. This hand has ${correct} quick trick(s).`,
    difficulty: "intermediate",
    cards: {
      south: sorted,
      displayAs: "bridge-single",
    },
  };
}

function generateMixedEvaluation(): DrillProblem {
  const generators = [generateHCPCount, generateDistributionCount, generateTotalPoints, generateHandShape, generateQuickTricks];
  return pickRandom(generators)();
}

// ---------------------------------------------------------------------------
// OPENING BID GENERATORS
// ---------------------------------------------------------------------------

function generateOpeningBid(): DrillProblem {
  // Generate a hand that opens (13+ points)
  const hand = generateHandMatching((h) => {
    const bid = determineOpening(h);
    return bid !== "Pass";
  });
  const sorted = sortHand(hand);
  const correct = determineOpening(hand);
  const hcp = countHCP(hand);
  const tp = totalPoints(hand);

  // Generate plausible wrong answers
  const allOpenings = ["1C", "1D", "1H", "1S", "1NT", "2C", "2D", "2H", "2S", "2NT"];
  const distractors = new Set<string>([correct]);
  // Add plausible alternatives
  if (correct.startsWith("1")) {
    for (const bid of ["1C", "1D", "1H", "1S", "1NT"]) {
      if (bid !== correct) distractors.add(bid);
    }
  } else {
    for (const bid of allOpenings) {
      if (bid !== correct) distractors.add(bid);
    }
  }
  const opts = shuffleArray([...distractors]).slice(0, 4);
  if (!opts.includes(correct)) opts[0] = correct;
  const shuffled = shuffleArray(opts);
  const options = makeOptions(shuffled);

  return {
    id: "",
    question: `What should you open with this hand? (${hcp} HCP, ${tp} total points)\n\n${handDisplay(hand)}`,
    options,
    correctAnswer: findCorrectLabel(options, correct),
    explanation: `With ${hcp} HCP and ${tp} total points, shape ${handShape(hand).join("-")}, the correct opening is ${correct}. ${isBalanced(hand) ? "Hand is balanced." : "Hand is unbalanced."}`,
    difficulty: "intermediate",
    cards: {
      south: sorted,
      displayAs: "bridge-single",
    },
  };
}

function generateOneNTDecision(): DrillProblem {
  // Generate a balanced hand in the 14-18 HCP range
  const hand = generateHandMatching((h) => {
    const hcp = countHCP(h);
    return hcp >= 14 && hcp <= 18 && (isBalanced(h) || handShape(h)[0] <= 5);
  });
  const sorted = sortHand(hand);
  const hcp = countHCP(hand);
  const bal = isBalanced(hand);
  const correct = hcp >= 15 && hcp <= 17 && bal;

  let reason: string;
  if (correct) {
    reason = `Yes — ${hcp} HCP and balanced (${handShape(hand).join("-")}). This is a textbook 1NT opening.`;
  } else if (!bal) {
    reason = `No — the hand is unbalanced (${handShape(hand).join("-")}). 1NT requires a balanced hand.`;
  } else if (hcp < 15) {
    reason = `No — only ${hcp} HCP. 1NT requires 15-17 HCP.`;
  } else {
    reason = `No — ${hcp} HCP is too strong for 1NT (15-17). Consider 2NT (20-21) or 2C (22+).`;
  }

  const options = [
    "A) Yes — open 1NT",
    "B) No — too few HCP for 1NT",
    "C) No — hand is unbalanced",
    "D) No — too many HCP for 1NT",
  ];

  let correctAnswer: string;
  if (correct) {
    correctAnswer = "A";
  } else if (!bal) {
    correctAnswer = "C";
  } else if (hcp < 15) {
    correctAnswer = "B";
  } else {
    correctAnswer = "D";
  }

  return {
    id: "",
    question: `Should you open this hand 1NT? (${hcp} HCP)\n\n${handDisplay(hand)}`,
    options,
    correctAnswer,
    explanation: reason,
    difficulty: "intermediate",
    cards: {
      south: sorted,
      displayAs: "bridge-single",
    },
  };
}

function generateOpeningBidMixed(): DrillProblem {
  const hand = dealHand();
  const sorted = sortHand(hand);
  const correct = determineOpening(hand);
  const hcp = countHCP(hand);
  const tp = totalPoints(hand);

  // Always include Pass as an option
  const allBids = ["Pass", "1C", "1D", "1H", "1S", "1NT", "2C", "2D", "2H", "2S", "3C", "3D", "3H", "3S"];
  const distractors = new Set<string>([correct]);
  // Add relevant alternatives
  if (correct === "Pass") {
    distractors.add("1C");
    distractors.add("1D");
    distractors.add("1H");
  } else {
    distractors.add("Pass");
    for (const bid of allBids) {
      if (bid !== correct) distractors.add(bid);
    }
  }
  const opts = shuffleArray([...distractors]).slice(0, 4);
  if (!opts.includes(correct)) opts[0] = correct;
  const shuffled = shuffleArray(opts);
  const options = makeOptions(shuffled);

  return {
    id: "",
    question: `What is your opening bid? (${hcp} HCP, ${tp} total points)\n\n${handDisplay(hand)}`,
    options,
    correctAnswer: findCorrectLabel(options, correct),
    explanation: `With ${hcp} HCP, ${tp} total points, and shape ${handShape(hand).join("-")}, the correct bid is ${correct}.`,
    difficulty: "intermediate",
    cards: {
      south: sorted,
      displayAs: "bridge-single",
    },
  };
}

// ---------------------------------------------------------------------------
// RESPONSE GENERATORS
// ---------------------------------------------------------------------------

function generateRespondMajor(): DrillProblem {
  // Generate opener hand that opens 1H or 1S
  const openerHand = generateHandMatching((h) => {
    const bid = determineOpening(h);
    return bid === "1H" || bid === "1S";
  });
  const opening = determineOpening(openerHand);
  const suit = opening[1];

  // Generate responder hand from remaining cards
  const deck = createDeck().filter((c) => !openerHand.includes(c));
  const responderHand = shuffleArray(deck).slice(0, 13);
  const sorted = sortHand(responderHand);
  const correct = determineResponse(responderHand, opening);
  const hcp = countHCP(responderHand);

  const possibleResponses = [
    "Pass", `2${suit}`, `3${suit}`, `4${suit}`, "1NT", "1S",
    "2C", "2D", "2H", "2NT", "3NT",
  ].filter((b) => b !== `1${suit}`); // Can't bid same as opening at same level

  const distractors = new Set<string>([correct]);
  for (const b of shuffleArray(possibleResponses)) {
    if (distractors.size >= 4) break;
    if (b !== correct) distractors.add(b);
  }
  const opts = shuffleArray([...distractors]).slice(0, 4);
  if (!opts.includes(correct)) opts[0] = correct;
  const shuffled = shuffleArray(opts);
  const options = makeOptions(shuffled);

  return {
    id: "",
    question: `Partner opens ${opening}. What is your response? (${hcp} HCP)\n\n${handDisplay(responderHand)}`,
    options,
    correctAnswer: findCorrectLabel(options, correct),
    explanation: `With ${hcp} HCP and ${suitLength(responderHand, suit)} ${suit === "H" ? "hearts" : "spades"}, the correct response to ${opening} is ${correct}.`,
    difficulty: "intermediate",
    cards: {
      south: sorted,
      auction: [opening, "Pass"],
      displayAs: "bridge-bidding",
    },
  };
}

function generateRespondMinor(): DrillProblem {
  const openerHand = generateHandMatching((h) => {
    const bid = determineOpening(h);
    return bid === "1C" || bid === "1D";
  });
  const opening = determineOpening(openerHand);

  const deck = createDeck().filter((c) => !openerHand.includes(c));
  const responderHand = shuffleArray(deck).slice(0, 13);
  const sorted = sortHand(responderHand);
  const correct = determineResponse(responderHand, opening);
  const hcp = countHCP(responderHand);

  const possibleResponses = [
    "Pass", "1D", "1H", "1S", "1NT", "2C", "2D", "2NT", "3C", "3D", "3NT",
  ];

  const distractors = new Set<string>([correct]);
  for (const b of shuffleArray(possibleResponses)) {
    if (distractors.size >= 4) break;
    if (b !== correct) distractors.add(b);
  }
  const opts = shuffleArray([...distractors]).slice(0, 4);
  if (!opts.includes(correct)) opts[0] = correct;
  const shuffled = shuffleArray(opts);
  const options = makeOptions(shuffled);

  return {
    id: "",
    question: `Partner opens ${opening}. What is your response? (${hcp} HCP)\n\n${handDisplay(responderHand)}`,
    options,
    correctAnswer: findCorrectLabel(options, correct),
    explanation: `With ${hcp} HCP responding to ${opening}, the correct response is ${correct}.`,
    difficulty: "intermediate",
    cards: {
      south: sorted,
      auction: [opening, "Pass"],
      displayAs: "bridge-bidding",
    },
  };
}

function generateRespondNT(): DrillProblem {
  // Generate 1NT opener (15-17 balanced)
  const openerHand = generateHandMatching((h) => {
    return countHCP(h) >= 15 && countHCP(h) <= 17 && isBalanced(h);
  });

  const deck = createDeck().filter((c) => !openerHand.includes(c));
  const responderHand = shuffleArray(deck).slice(0, 13);
  const sorted = sortHand(responderHand);
  const correct = determineResponse(responderHand, "1NT");
  const hcp = countHCP(responderHand);
  const lengths = suitLengths(responderHand);

  const possibleResponses = [
    "Pass", "2C", "2D", "2H", "2NT", "3NT", "4NT",
  ];

  const distractors = new Set<string>([correct]);
  for (const b of shuffleArray(possibleResponses)) {
    if (distractors.size >= 4) break;
    if (b !== correct) distractors.add(b);
  }
  const opts = shuffleArray([...distractors]).slice(0, 4);
  if (!opts.includes(correct)) opts[0] = correct;
  const shuffled = shuffleArray(opts);
  const options = makeOptions(shuffled);

  let conventionHint = "";
  if (correct === "2C") conventionHint = " (Stayman — asking for a 4-card major)";
  if (correct === "2D") conventionHint = " (Jacoby Transfer — showing 5+ hearts)";
  if (correct === "2H") conventionHint = " (Jacoby Transfer — showing 5+ spades)";

  return {
    id: "",
    question: `Partner opens 1NT (15-17 HCP). What is your response? (${hcp} HCP)\n\n${handDisplay(responderHand)}`,
    options,
    correctAnswer: findCorrectLabel(options, correct),
    explanation: `With ${hcp} HCP, the correct response to 1NT is ${correct}${conventionHint}. Spades: ${lengths.S}, Hearts: ${lengths.H}, Diamonds: ${lengths.D}, Clubs: ${lengths.C}.`,
    difficulty: "intermediate",
    cards: {
      south: sorted,
      auction: ["1NT", "Pass"],
      displayAs: "bridge-bidding",
    },
  };
}

function generateResponseMixed(): DrillProblem {
  const generators = [generateRespondMajor, generateRespondMinor, generateRespondNT];
  return pickRandom(generators)();
}

// ---------------------------------------------------------------------------
// OPENER REBID
// ---------------------------------------------------------------------------

function generateOpenerRebid(): DrillProblem {
  // Generate opener's hand with a 1-level opening
  const openerHand = generateHandMatching((h) => {
    const bid = determineOpening(h);
    return bid.match(/^1[CDHS]$/) !== null;
  });
  const opening = determineOpening(openerHand);
  const sorted = sortHand(openerHand);

  // Generate responder's hand
  const deck = createDeck().filter((c) => !openerHand.includes(c));
  const responderHand = shuffleArray(deck).slice(0, 13);
  const response = determineResponse(responderHand, opening);

  // Skip if responder passes
  if (response === "Pass") {
    return generateOpenerRebid(); // Retry
  }

  const rebid = determineRebid(openerHand, opening, response);
  const hcp = countHCP(openerHand);
  const tp = totalPoints(openerHand);

  const possibleRebids = [
    "Pass", "1NT", "2C", "2D", "2H", "2S", "2NT",
    `3${opening[1]}`, `4${opening[1]}`, "3NT",
  ];

  const distractors = new Set<string>([rebid]);
  for (const b of shuffleArray(possibleRebids)) {
    if (distractors.size >= 4) break;
    if (b !== rebid) distractors.add(b);
  }
  const opts = shuffleArray([...distractors]).slice(0, 4);
  if (!opts.includes(rebid)) opts[0] = rebid;
  const shuffled = shuffleArray(opts);
  const options = makeOptions(shuffled);

  return {
    id: "",
    question: `You opened ${opening}, partner responded ${response}. What is your rebid? (${hcp} HCP, ${tp} TP)\n\n${handDisplay(openerHand)}`,
    options,
    correctAnswer: findCorrectLabel(options, rebid),
    explanation: `After opening ${opening} and hearing ${response}, with ${hcp} HCP and shape ${handShape(openerHand).join("-")}, the correct rebid is ${rebid}.`,
    difficulty: "advanced",
    cards: {
      south: sorted,
      auction: [opening, "Pass", response, "Pass"],
      displayAs: "bridge-bidding",
    },
  };
}

// ---------------------------------------------------------------------------
// FULL AUCTION (simplified)
// ---------------------------------------------------------------------------

function generateFullAuction(): DrillProblem {
  // Generate two hands (opener + responder), determine final contract
  const openerHand = generateHandMatching((h) => {
    const bid = determineOpening(h);
    return bid !== "Pass" && bid.match(/^1[CDHSN]/) !== null;
  });
  const opening = determineOpening(openerHand);

  const deck = createDeck().filter((c) => !openerHand.includes(c));
  const responderHand = shuffleArray(deck).slice(0, 13);
  const response = determineResponse(responderHand, opening);

  if (response === "Pass") {
    return generateFullAuction(); // Retry for more interesting auctions
  }

  const rebid = determineRebid(openerHand, opening, response);

  // Determine approximate final contract from the auction
  const auction = [opening, "Pass", response, "Pass"];
  if (rebid !== "Pass") {
    auction.push(rebid, "Pass");
  }
  // Find the last non-Pass bid as the "final contract"
  let finalContract = opening;
  for (const bid of auction) {
    if (bid !== "Pass" && bid !== "Dbl" && bid !== "Rdbl") {
      finalContract = bid;
    }
  }

  const openerHCP = countHCP(openerHand);
  const responderHCP = countHCP(responderHand);
  const combinedHCP = openerHCP + responderHCP;

  // Generate reasonable contract alternatives
  const level = parseInt(finalContract[0]) || 1;
  const strain = finalContract.slice(1);
  const alternatives = new Set<string>([finalContract]);

  // Add nearby contracts
  if (level < 7) alternatives.add(`${level + 1}${strain}`);
  if (level > 1) alternatives.add(`${level - 1}${strain}`);
  alternatives.add(`${Math.min(level + 1, 7)}NT`);
  alternatives.add("Pass");
  if (strain === "H" || strain === "S") alternatives.add(`${level}NT`);

  const opts = shuffleArray([...alternatives]).slice(0, 4);
  if (!opts.includes(finalContract)) opts[0] = finalContract;
  const shuffled = shuffleArray(opts);
  const options = makeOptions(shuffled);

  return {
    id: "",
    question: `With ${combinedHCP} combined HCP, what should the final contract be?\n\nOpener: ${handDisplay(openerHand)}\nResponder: ${handDisplay(responderHand)}`,
    options,
    correctAnswer: findCorrectLabel(options, finalContract),
    explanation: `Opener has ${openerHCP} HCP, responder has ${responderHCP} HCP (${combinedHCP} combined). The auction goes: ${auction.join(" - ")}. Final contract: ${finalContract}.`,
    difficulty: "advanced",
    cards: {
      south: sortHand(responderHand),
      north: sortHand(openerHand),
      displayAs: "bridge-bidding",
    },
  };
}

// ---------------------------------------------------------------------------
// OPENING LEAD GENERATORS
// ---------------------------------------------------------------------------

function generateOpeningLeadNT(): DrillProblem {
  const hand = dealHand();
  const sorted = sortHand(hand);
  const lead = selectOpeningLead(hand, { strain: "NT", level: 3 });
  const leadSuit = cardSuit(lead);
  const leadRank = cardRank(lead);
  const suits = handBySuit(hand);

  // Build distractors from other cards in hand
  const otherCards = sorted.filter((c) => c !== lead);
  const distractors = new Set<string>([lead]);
  // Add a card from each other suit
  for (const suit of ["S", "H", "D", "C"]) {
    const suitCards = otherCards.filter((c) => cardSuit(c) === suit);
    if (suitCards.length > 0 && distractors.size < 4) {
      distractors.add(pickRandom(suitCards));
    }
  }
  while (distractors.size < 4 && otherCards.length > 0) {
    distractors.add(pickRandom(otherCards));
  }

  const opts = shuffleArray([...distractors]).slice(0, 4);
  if (!opts.includes(lead)) opts[0] = lead;
  const shuffled = shuffleArray(opts);
  const options = makeOptions(shuffled);

  return {
    id: "",
    question: `Opponents bid 1NT - 3NT. What is your opening lead?\n\n${handDisplay(hand)}`,
    options,
    correctAnswer: findCorrectLabel(options, lead),
    explanation: `Against NT, lead 4th from your longest and strongest suit. The correct lead is the ${leadRank} of ${leadSuit === "S" ? "spades" : leadSuit === "H" ? "hearts" : leadSuit === "D" ? "diamonds" : "clubs"}.`,
    difficulty: "intermediate",
    cards: {
      south: sorted,
      auction: ["1NT", "Pass", "3NT", "Pass", "Pass", "Pass"],
      displayAs: "bridge-bidding",
    },
  };
}

function generateOpeningLeadSuit(): DrillProblem {
  const trumpSuit = pickRandom(["S", "H", "D", "C"]);
  const trumpName = trumpSuit === "S" ? "spades" : trumpSuit === "H" ? "hearts" : trumpSuit === "D" ? "diamonds" : "clubs";
  const level = trumpSuit === "S" || trumpSuit === "H" ? 4 : 5;

  const hand = dealHand();
  const sorted = sortHand(hand);
  const lead = selectOpeningLead(hand, { strain: trumpSuit, level });

  const otherCards = sorted.filter((c) => c !== lead);
  const distractors = new Set<string>([lead]);
  for (const suit of ["S", "H", "D", "C"]) {
    const suitCards = otherCards.filter((c) => cardSuit(c) === suit);
    if (suitCards.length > 0 && distractors.size < 4) {
      distractors.add(pickRandom(suitCards));
    }
  }
  while (distractors.size < 4 && otherCards.length > 0) {
    distractors.add(pickRandom(otherCards));
  }

  const opts = shuffleArray([...distractors]).slice(0, 4);
  if (!opts.includes(lead)) opts[0] = lead;
  const shuffled = shuffleArray(opts);
  const options = makeOptions(shuffled);

  return {
    id: "",
    question: `Opponents bid ${level}${trumpSuit} (${trumpName}). What is your opening lead?\n\n${handDisplay(hand)}`,
    options,
    correctAnswer: findCorrectLabel(options, lead),
    explanation: `Against a suit contract, prefer: top of a sequence, a singleton, or 4th from longest side suit. Lead: ${lead}.`,
    difficulty: "intermediate",
    cards: {
      south: sorted,
      auction: [`${level}${trumpSuit}`, "Pass", "Pass", "Pass"],
      displayAs: "bridge-bidding",
    },
  };
}

// ---------------------------------------------------------------------------
// ACE-ASKING (simplified)
// ---------------------------------------------------------------------------

function generateAceAsking(): DrillProblem {
  // Generate a strong hand with slam interest
  const hand = generateHandMatching((h) => {
    const hcp = countHCP(h);
    const tp = totalPoints(h);
    return hcp >= 16 && tp >= 18 && !isBalanced(h);
  });
  const sorted = sortHand(hand);
  const hcp = countHCP(hand);
  const tp = totalPoints(hand);
  const qt = countQuickTricks(hand);

  // Partner opened 1 of a suit, we raised, now considering slam
  const longest = longestSuit(hand);
  const fitSuit = longest.suit;
  const fitName = fitSuit === "S" ? "spades" : fitSuit === "H" ? "hearts" : fitSuit === "D" ? "diamonds" : "clubs";

  // Count aces
  const aces = hand.filter((c) => cardRank(c) === "A").length;
  const shouldAsk = tp >= 33 || (tp >= 30 && aces >= 2);

  const options = [
    `A) Bid 4NT (Blackwood) — ask for aces`,
    `B) Bid game (${fitSuit === "H" || fitSuit === "S" ? "4" : "5"}${fitSuit})`,
    `C) Bid 5NT — ask for kings`,
    `D) Pass and defend`,
  ];

  const correctAnswer = shouldAsk ? "A" : "B";

  return {
    id: "",
    question: `You have agreed on ${fitName} as trump. With ${tp} total points, should you use Blackwood?\n\n${handDisplay(hand)}`,
    options,
    correctAnswer,
    explanation: shouldAsk
      ? `With ${tp} total points and ${aces} ace(s), slam is likely. Bid 4NT to check for aces before committing to slam.`
      : `With ${tp} total points, game is the right level. Not enough combined strength for slam.`,
    difficulty: "advanced",
    cards: {
      south: sorted,
      auction: [`1${fitSuit}`, "Pass", `3${fitSuit}`, "Pass"],
      displayAs: "bridge-bidding",
    },
  };
}

// ---------------------------------------------------------------------------
// TAKEOUT DOUBLE
// ---------------------------------------------------------------------------

function generateTakeoutDouble(): DrillProblem {
  // Opponent opens, we need to decide: double, overcall, or pass
  const oppSuit = pickRandom(["C", "D", "H", "S"]);
  const oppOpening = `1${oppSuit}`;

  const hand = dealHand();
  const sorted = sortHand(hand);
  const hcp = countHCP(hand);
  const lengths = suitLengths(hand);

  // Determine action
  let correct: string;
  let explanation: string;

  // Takeout double: 12+ HCP, short in opponent's suit, support for unbid suits
  const oppSuitLen = lengths[oppSuit];
  const unbidSuits = ["S", "H", "D", "C"].filter((s) => s !== oppSuit);
  const unbidSupport = unbidSuits.every((s) => lengths[s] >= 3);

  if (hcp >= 12 && oppSuitLen <= 2 && unbidSupport) {
    correct = "Double";
    explanation = `With ${hcp} HCP, shortness in ${oppSuit}, and support for all unbid suits, make a takeout double.`;
  } else if (hcp >= 8) {
    // Check for overcall: 5+ card suit, 8-16 HCP
    let overcallSuit: string | null = null;
    for (const s of ["S", "H", "D", "C"]) {
      if (s !== oppSuit && lengths[s] >= 5) {
        overcallSuit = s;
        break;
      }
    }
    if (overcallSuit && hcp >= 8 && hcp <= 16) {
      const overcallLevel = overcallSuit > oppSuit ? "1" : "2";
      correct = `${overcallLevel}${overcallSuit}`;
      explanation = `With ${hcp} HCP and a ${lengths[overcallSuit]}-card ${overcallSuit} suit, overcall ${correct}.`;
    } else if (hcp >= 12 && oppSuitLen <= 2) {
      correct = "Double";
      explanation = `With ${hcp} HCP and shortness in their suit, double for takeout.`;
    } else {
      correct = "Pass";
      explanation = `With ${hcp} HCP and no clear action (no 5-card suit for overcall, no ideal shape for double), pass.`;
    }
  } else {
    correct = "Pass";
    explanation = `With only ${hcp} HCP, pass.`;
  }

  const possibleActions = ["Double", "Pass", "1NT"];
  for (const s of ["S", "H", "D", "C"]) {
    if (s !== oppSuit) {
      possibleActions.push(s > oppSuit ? `1${s}` : `2${s}`);
    }
  }

  const distractors = new Set<string>([correct]);
  for (const a of shuffleArray(possibleActions)) {
    if (distractors.size >= 4) break;
    if (a !== correct) distractors.add(a);
  }
  const opts = shuffleArray([...distractors]).slice(0, 4);
  if (!opts.includes(correct)) opts[0] = correct;
  const shuffled = shuffleArray(opts);
  const options = makeOptions(shuffled);

  return {
    id: "",
    question: `RHO opens ${oppOpening}. What is your action? (${hcp} HCP)\n\n${handDisplay(hand)}`,
    options,
    correctAnswer: findCorrectLabel(options, correct),
    explanation,
    difficulty: "advanced",
    cards: {
      south: sorted,
      auction: [oppOpening],
      displayAs: "bridge-bidding",
    },
  };
}

// ---------------------------------------------------------------------------
// CONVENTION IDENTIFICATION
// ---------------------------------------------------------------------------

function generateConventionId(): DrillProblem {
  // Pick a convention and show its auction
  const convention = pickRandom(CONVENTIONS);
  const auction = pickRandom(convention.exampleAuctions);

  // Generate wrong answers from other conventions
  const otherConventions = CONVENTIONS.filter((c) => c.name !== convention.name);
  const distractors = new Set<string>([convention.name]);
  for (const c of shuffleArray(otherConventions)) {
    if (distractors.size >= 4) break;
    distractors.add(c.name);
  }
  const opts = shuffleArray([...distractors]).slice(0, 4);
  if (!opts.includes(convention.name)) opts[0] = convention.name;
  const shuffled = shuffleArray(opts);
  const options = makeOptions(shuffled);

  const auctionStr = auction
    .map((bid, i) => {
      const positions = ["South", "West", "North", "East"];
      return `${positions[i % 4]}: ${bid}`;
    })
    .join(", ");

  return {
    id: "",
    question: `What convention is being used in this auction?\n\n${auctionStr}`,
    options,
    correctAnswer: findCorrectLabel(options, convention.name),
    explanation: `${convention.name}: ${convention.description}`,
    difficulty: "intermediate",
    cards: {
      auction: auction,
      displayAs: "bridge-bidding",
    },
  };
}

// ---------------------------------------------------------------------------
// SACRIFICE DECISION
// ---------------------------------------------------------------------------

function generateSacrificeDecision(): DrillProblem {
  // Simplified: opponents bid game, we're considering sacrificing
  const vulChoices = [
    { ns: false, ew: true, label: "Favorable (they vul, we not)" },
    { ns: true, ew: false, label: "Unfavorable (we vul, they not)" },
    { ns: false, ew: false, label: "Neither vulnerable" },
    { ns: true, ew: true, label: "Both vulnerable" },
  ];
  const vul = pickRandom(vulChoices);

  const oppSuit = pickRandom(["S", "H"]);
  const oppContract = `4${oppSuit}`;
  const oppScore = contractScore(4, oppSuit, false, false, vul.ew, 0);

  // Our sacrifice level
  const ourSuit = oppSuit === "S" ? "H" : "S"; // Different major
  const ourMinor = pickRandom(["C", "D"]);
  const sacrificeContract = `5${ourMinor}`;

  // How many tricks down?
  const down = randomInt(1, 4);
  const penaltyUndoubled = penaltyScore(down, vul.ns, false, false);
  const penaltyDoubled = penaltyScore(down, vul.ns, true, false);

  const shouldSacrifice = penaltyDoubled < oppScore;

  const options = [
    `A) Sacrifice at ${sacrificeContract} — penalty (${penaltyDoubled} doubled) is less than their game (${oppScore})`,
    `B) Pass and defend — penalty would be too expensive`,
    `C) Double their ${oppContract}`,
    `D) Bid ${sacrificeContract} only if not vulnerable`,
  ];

  let correctAnswer: string;
  if (shouldSacrifice) {
    correctAnswer = "A";
  } else {
    correctAnswer = "B";
  }

  return {
    id: "",
    question: `Opponents bid ${oppContract}. Vulnerability: ${vul.label}. You expect to go down ${down} trick(s) in ${sacrificeContract}. Should you sacrifice?`,
    options,
    correctAnswer,
    explanation: `Their game scores ${oppScore}. Your sacrifice doubled down ${down} costs ${penaltyDoubled}. ${shouldSacrifice ? "Sacrifice is profitable!" : "Defending is better — the penalty exceeds their game value."}`,
    difficulty: "advanced",
    cards: {
      displayAs: "bridge-bidding",
    },
  };
}
