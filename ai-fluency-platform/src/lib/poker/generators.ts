import {
  createDeck,
  drawCards,
  shuffleArray,
  pickRandom,
  randomInt,
  SUITS,
  RANKS,
  rankValue,
  cardRank,
  cardSuit,
} from "./cards";
import {
  evaluateHand,
  compareHands,
  HandRank,
  HAND_NAMES,
} from "./hand-evaluator";
import { countOuts, getOutCards } from "./outs";
import { ruleOfTwo, ruleOfFour, potOdds, expectedValueCall, expectedValueBluff } from "./odds";
import {
  classifyHand,
  recommendAction,
  TIER_LABELS,
  POSITION_NAMES,
  type Position,
  type HandTier,
} from "./starting-hands";
import type { DrillProblem } from "@/types/content";

export type GeneratorType =
  | "hand-rankings"
  | "rank-hands"
  | "count-outs"
  | "combo-outs"
  | "rule-of-2"
  | "rule-of-4"
  | "pot-odds"
  | "call-or-fold"
  | "ev-call"
  | "ev-bluff"
  | "starting-hands"
  | "position-play"
  | "mixed";

const GENERATORS: Record<GeneratorType, () => DrillProblem> = {
  "hand-rankings": generateHandRankingProblem,
  "rank-hands": generateRankHandsProblem,
  "count-outs": generateCountOutsProblem,
  "combo-outs": generateComboOutsProblem,
  "rule-of-2": generateRuleOfTwoProblem,
  "rule-of-4": generateRuleOfFourProblem,
  "pot-odds": generatePotOddsProblem,
  "call-or-fold": generateCallOrFoldProblem,
  "ev-call": generateEVCallProblem,
  "ev-bluff": generateEVBluffProblem,
  "starting-hands": generateStartingHandsProblem,
  "position-play": generatePositionPlayProblem,
  mixed: generateMixedProblem,
};

export function generateProblems(
  type: GeneratorType,
  count: number
): DrillProblem[] {
  // For hand-ranking problems, ensure diversity of hand types
  if (type === "hand-rankings") {
    return generateDiverseHandRankingProblems(count);
  }
  if (type === "rank-hands") {
    return generateDiverseRankHandsProblems(count);
  }

  const gen = GENERATORS[type];
  const problems: DrillProblem[] = [];
  for (let i = 0; i < count; i++) {
    problems.push({ ...gen(), id: `gen-${type}-${i}-${Date.now()}` });
  }
  return problems;
}

/**
 * Ensures each batch covers a diverse mix of hand types.
 */
function generateDiverseHandRankingProblems(count: number): DrillProblem[] {
  // Target hand ranks to cycle through, ensuring diversity
  const targetRanks = [
    HandRank.HIGH_CARD,
    HandRank.ONE_PAIR,
    HandRank.TWO_PAIR,
    HandRank.THREE_OF_A_KIND,
    HandRank.STRAIGHT,
    HandRank.FLUSH,
    HandRank.FULL_HOUSE,
    HandRank.FOUR_OF_A_KIND,
    HandRank.STRAIGHT_FLUSH,
    HandRank.ROYAL_FLUSH,
  ];
  const shuffledTargets = shuffleArray(targetRanks);
  const problems: DrillProblem[] = [];

  for (let i = 0; i < count; i++) {
    const target = shuffledTargets[i % shuffledTargets.length];
    const problem = generateConstructedHandProblem(target);
    problems.push({ ...problem, id: `gen-hand-rankings-${i}-${Date.now()}` });
  }
  return problems;
}

/**
 * Ensures rank-hands problems cover diverse matchups.
 */
function generateDiverseRankHandsProblems(count: number): DrillProblem[] {
  // Create diverse matchups: different rank vs different rank, same rank (kicker battle), split pots
  const matchups: [HandRank, HandRank][] = [
    [HandRank.ONE_PAIR, HandRank.TWO_PAIR],
    [HandRank.TWO_PAIR, HandRank.THREE_OF_A_KIND],
    [HandRank.STRAIGHT, HandRank.FLUSH],
    [HandRank.FLUSH, HandRank.FULL_HOUSE],
    [HandRank.THREE_OF_A_KIND, HandRank.STRAIGHT],
    [HandRank.ONE_PAIR, HandRank.FLUSH],
    [HandRank.HIGH_CARD, HandRank.ONE_PAIR],
    [HandRank.FULL_HOUSE, HandRank.FOUR_OF_A_KIND],
    [HandRank.TWO_PAIR, HandRank.FLUSH],
    [HandRank.ONE_PAIR, HandRank.STRAIGHT],
  ];
  const shuffledMatchups = shuffleArray(matchups);
  const problems: DrillProblem[] = [];

  for (let i = 0; i < count; i++) {
    // Mix constructed matchups with random ones for variety
    if (i < shuffledMatchups.length) {
      const problem = generateConstructedRankProblem(shuffledMatchups[i]);
      problems.push({ ...problem, id: `gen-rank-hands-${i}-${Date.now()}` });
    } else {
      const problem = generateRankHandsProblem();
      problems.push({ ...problem, id: `gen-rank-hands-${i}-${Date.now()}` });
    }
  }
  return problems;
}

// -- Hand Rankings Generator --

/**
 * Construct cards that produce a specific target hand rank.
 * This ensures diversity instead of random dealing (which gives 80%+ high card / one pair).
 */
function constructHandForRank(target: HandRank): { hand: string[]; board: string[] } {
  const suits = shuffleArray([...SUITS]);
  const ranks = shuffleArray([...RANKS]);

  switch (target) {
    case HandRank.ROYAL_FLUSH: {
      const s = suits[0];
      const hand = [`A${s}`, `K${s}`];
      const board = [`Q${s}`, `J${s}`, `T${s}`];
      return { hand, board };
    }
    case HandRank.STRAIGHT_FLUSH: {
      const s = suits[0];
      const startIdx = randomInt(0, 7); // 2 through 9 high
      const r = RANKS.slice(startIdx, startIdx + 5);
      const hand = [`${r[0]}${s}`, `${r[1]}${s}`];
      const board = [`${r[2]}${s}`, `${r[3]}${s}`, `${r[4]}${s}`];
      return { hand, board };
    }
    case HandRank.FOUR_OF_A_KIND: {
      const r = ranks[0];
      const hand = [`${r}${suits[0]}`, `${r}${suits[1]}`];
      const kicker = ranks.find((x) => x !== r)!;
      const board = [`${r}${suits[2]}`, `${r}${suits[3]}`, `${kicker}${suits[0]}`];
      return { hand, board };
    }
    case HandRank.FULL_HOUSE: {
      const tripRank = ranks[0];
      const pairRank = ranks[1];
      const hand = [`${tripRank}${suits[0]}`, `${tripRank}${suits[1]}`];
      const board = [`${tripRank}${suits[2]}`, `${pairRank}${suits[0]}`, `${pairRank}${suits[1]}`];
      return { hand, board };
    }
    case HandRank.FLUSH: {
      const s = suits[0];
      // Pick 5 non-consecutive ranks to avoid straight flush
      const flushRanks: string[] = [];
      const available = shuffleArray([...RANKS]);
      for (const r of available) {
        if (flushRanks.length >= 5) break;
        flushRanks.push(r);
      }
      // Verify it's not a straight flush by checking for 5 consecutive
      const vals = flushRanks.map((r) => rankValue(r)).sort((a, b) => a - b);
      if (vals[4] - vals[0] === 4) {
        // Swap one to break the straight
        flushRanks[0] = available.find((r) => !flushRanks.includes(r))!;
      }
      const hand = [`${flushRanks[0]}${s}`, `${flushRanks[1]}${s}`];
      const otherSuit = suits[1];
      const board = [
        `${flushRanks[2]}${s}`,
        `${flushRanks[3]}${s}`,
        `${flushRanks[4]}${s}`,
        // Add a non-flush card to the board so it's not obvious
        `${ranks.find((r) => !flushRanks.includes(r))!}${otherSuit}`,
      ];
      return { hand, board };
    }
    case HandRank.STRAIGHT: {
      const startIdx = randomInt(0, 8); // 2 through T high
      const straightRanks = RANKS.slice(startIdx, startIdx + 5);
      // Assign different suits to avoid flush
      const hand = [`${straightRanks[0]}${suits[0]}`, `${straightRanks[1]}${suits[1]}`];
      const board = [
        `${straightRanks[2]}${suits[2]}`,
        `${straightRanks[3]}${suits[3]}`,
        `${straightRanks[4]}${suits[0]}`,
      ];
      return { hand, board };
    }
    case HandRank.THREE_OF_A_KIND: {
      const tripRank = ranks[0];
      const k1 = ranks[1];
      const k2 = ranks[2];
      const hand = [`${tripRank}${suits[0]}`, `${tripRank}${suits[1]}`];
      const board = [`${tripRank}${suits[2]}`, `${k1}${suits[3]}`, `${k2}${suits[0]}`];
      return { hand, board };
    }
    case HandRank.TWO_PAIR: {
      const p1 = ranks[0];
      const p2 = ranks[1];
      const kicker = ranks[2];
      const hand = [`${p1}${suits[0]}`, `${p2}${suits[1]}`];
      const board = [`${p1}${suits[2]}`, `${p2}${suits[3]}`, `${kicker}${suits[0]}`];
      return { hand, board };
    }
    case HandRank.ONE_PAIR: {
      const pairRank = ranks[0];
      const k1 = ranks[1];
      const k2 = ranks[2];
      const k3 = ranks[3];
      // Ensure kickers don't form a better hand — spread suits
      const hand = [`${pairRank}${suits[0]}`, `${k1}${suits[1]}`];
      const board = [`${pairRank}${suits[2]}`, `${k2}${suits[3]}`, `${k3}${suits[0]}`];
      return { hand, board };
    }
    case HandRank.HIGH_CARD:
    default: {
      // Non-connected, non-suited cards
      const hcRanks = [ranks[0], ranks[2], ranks[4], ranks[6], ranks[8]];
      const hand = [`${hcRanks[0]}${suits[0]}`, `${hcRanks[1]}${suits[1]}`];
      const board = [
        `${hcRanks[2]}${suits[2]}`,
        `${hcRanks[3]}${suits[3]}`,
        `${hcRanks[4]}${suits[0]}`,
      ];
      return { hand, board };
    }
  }
}

function generateConstructedHandProblem(target: HandRank): DrillProblem {
  const { hand, board } = constructHandForRank(target);
  const result = evaluateHand([...hand, ...board]);
  const correct = result.name;

  // Adjacent hand ranks as distractors (more challenging)
  const adjacentRanks = [target - 1, target + 1, target - 2, target + 2]
    .filter((r) => r >= 0 && r <= 9 && r !== target)
    .map((r) => HAND_NAMES[r as HandRank]);
  const distractors = shuffleArray(adjacentRanks).slice(0, 3);
  // Fill if we don't have enough
  const allRankNames = Object.values(HAND_NAMES);
  while (distractors.length < 3) {
    const filler = pickRandom(allRankNames.filter((n) => n !== correct && !distractors.includes(n)));
    distractors.push(filler);
  }

  const options = shuffleArray([correct, ...distractors]);
  const correctLetter = String.fromCharCode(65 + options.indexOf(correct));

  return {
    id: "",
    question: "What is the best hand that can be made from these cards?",
    cards: { hand, board, displayAs: "both" },
    options: options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`),
    correctAnswer: correctLetter,
    explanation: `The best hand is **${correct}**.`,
    difficulty: target >= HandRank.FLUSH ? "advanced" : target >= HandRank.STRAIGHT ? "intermediate" : "basic",
  };
}

function generateHandRankingProblem(): DrillProblem {
  const target = pickRandom([
    HandRank.HIGH_CARD, HandRank.ONE_PAIR, HandRank.TWO_PAIR,
    HandRank.THREE_OF_A_KIND, HandRank.STRAIGHT, HandRank.FLUSH,
    HandRank.FULL_HOUSE, HandRank.FOUR_OF_A_KIND,
  ]);
  return generateConstructedHandProblem(target);
}

// -- Rank Hands Generator --

function generateConstructedRankProblem([rank1, rank2]: [HandRank, HandRank]): DrillProblem {
  // Build a board + two hands where the hands evaluate to the target ranks
  // Strategy: construct a board, then build hands that make the target rank with that board
  // Simpler approach: generate many random deals and pick one that matches
  for (let attempt = 0; attempt < 100; attempt++) {
    const deck = createDeck();
    const h1 = drawCards(deck, 2);
    const h2 = drawCards(deck, 2);
    const board = drawCards(deck, 5);

    const r1 = evaluateHand([...h1, ...board]);
    const r2 = evaluateHand([...h2, ...board]);

    if (r1.rank === rank1 && r2.rank === rank2) {
      return makeRankProblem(h1, h2, board, r1, r2);
    }
    if (r1.rank === rank2 && r2.rank === rank1) {
      return makeRankProblem(h2, h1, board, r2, r1);
    }
  }
  // Fallback to random
  return generateRankHandsProblem();
}

function makeRankProblem(
  hand1: string[], hand2: string[], board: string[],
  result1: ReturnType<typeof evaluateHand>, result2: ReturnType<typeof evaluateHand>
): DrillProblem {
  const cmp = compareHands(result1, result2);
  let correctAnswer: string;
  let correctText: string;
  if (cmp > 0) {
    correctAnswer = "A";
    correctText = `Player 1 wins with ${result1.name} over Player 2's ${result2.name}.`;
  } else if (cmp < 0) {
    correctAnswer = "B";
    correctText = `Player 2 wins with ${result2.name} over Player 1's ${result1.name}.`;
  } else {
    correctAnswer = "C";
    correctText = `It's a split pot — both players have ${result1.name} with identical kickers.`;
  }

  return {
    id: "",
    question: `**Player 1** holds ${formatCards(hand1)}. **Player 2** holds ${formatCards(hand2)}. The board is ${formatCards(board)}. Who wins?`,
    cards: { board, displayAs: "board" },
    options: ["A) Player 1 wins", "B) Player 2 wins", "C) Split pot"],
    correctAnswer,
    explanation: correctText,
    difficulty: cmp === 0 ? "advanced" : Math.abs(result1.rank - result2.rank) > 2 ? "basic" : "intermediate",
  };
}

function generateRankHandsProblem(): DrillProblem {
  const deck = createDeck();
  const hand1 = drawCards(deck, 2);
  const hand2 = drawCards(deck, 2);
  const board = drawCards(deck, 5);

  const result1 = evaluateHand([...hand1, ...board]);
  const result2 = evaluateHand([...hand2, ...board]);
  return makeRankProblem(hand1, hand2, board, result1, result2);
}

// -- Count Outs Generators --

function generateCountOutsProblem(): DrillProblem {
  // Construct a specific draw scenario
  return pickRandom([
    generateFlushDrawOuts,
    generateStraightDrawOuts,
    generateOvercardOuts,
  ])();
}

function generateFlushDrawOuts(): DrillProblem {
  // Create a flush draw: 4 cards of same suit on flop
  const suit = pickRandom([...SUITS]);
  const suitRanks = shuffleArray([...RANKS]);
  const flushCards = suitRanks.slice(0, 4);

  // 2 in hand, 2 on board of the flush suit
  const hand = [
    `${flushCards[0]}${suit}`,
    `${flushCards[1]}${suit}`,
  ];
  // Board has 2 of the suit + 1 off-suit
  const otherSuits = SUITS.filter((s) => s !== suit);
  const offRank = pickRandom(RANKS.filter((r) => !flushCards.includes(r)));
  const board = [
    `${flushCards[2]}${suit}`,
    `${flushCards[3]}${suit}`,
    `${offRank}${pickRandom([...otherSuits])}`,
  ];

  // 9 flush outs (13 - 4 already showing)
  const outs = 9;

  return makeOutsProblem(hand, board, outs, "flush draw", "basic");
}

function generateStraightDrawOuts(): DrillProblem {
  // Open-ended straight draw: 4 consecutive ranks
  const startIdx = randomInt(1, 8); // 3-T (index 1-8, so values 3-T giving room for both ends)
  const ranks = RANKS.slice(startIdx, startIdx + 4);

  // Assign random suits, making sure no flush draw
  const cards = ranks.map((r, i) => `${r}${SUITS[i % 4]}`);

  const hand = [cards[0], cards[1]];
  const offRank = pickRandom(
    RANKS.filter((r) => !ranks.includes(r) && Math.abs(RANKS.indexOf(r) - startIdx) > 4)
  );
  const board = [cards[2], cards[3], `${offRank}${pickRandom([...SUITS])}`];

  const outs = 8; // Open-ended straight draw

  return makeOutsProblem(hand, board, outs, "open-ended straight draw", "intermediate");
}

function generateOvercardOuts(): DrillProblem {
  // Two overcards (e.g., AK on a low board)
  const deck = createDeck();
  const highRanks = ["A", "K", "Q"];
  const h1Rank = pickRandom(highRanks);
  const h2Rank = pickRandom(highRanks.filter((r) => r !== h1Rank));

  const hand = [
    `${h1Rank}${pickRandom([...SUITS])}`,
    `${h2Rank}${pickRandom([...SUITS])}`,
  ];

  // Board with low cards
  const lowRanks = shuffleArray(["2", "3", "4", "5", "6", "7", "8"]);
  const boardSuits = shuffleArray([...SUITS]);
  const board = lowRanks.slice(0, 3).map((r, i) => `${r}${boardSuits[i % 4]}`);

  // Overcards = 6 outs (3 per overcard)
  const actualOuts = countOuts(hand, board);

  return makeOutsProblem(hand, board, actualOuts, "overcards", "basic");
}

function makeOutsProblem(
  hand: string[],
  board: string[],
  correctOuts: number,
  drawType: string,
  difficulty: "basic" | "intermediate" | "advanced"
): DrillProblem {
  // Generate plausible wrong answers
  const wrongOuts = new Set<number>();
  wrongOuts.add(Math.max(1, correctOuts - randomInt(2, 4)));
  wrongOuts.add(correctOuts + randomInt(2, 4));
  wrongOuts.add(correctOuts + randomInt(5, 8));
  // Remove correct if accidentally added
  wrongOuts.delete(correctOuts);

  const wrongArray = [...wrongOuts].slice(0, 3);
  while (wrongArray.length < 3) {
    wrongArray.push(correctOuts + wrongArray.length + 3);
  }

  const allOptions = shuffleArray([correctOuts, ...wrongArray]);
  const correctIdx = allOptions.indexOf(correctOuts);
  const correctLetter = String.fromCharCode(65 + correctIdx);

  return {
    id: "",
    question: `You have a **${drawType}**. How many outs do you have to improve your hand?`,
    cards: { hand, board, displayAs: "both" },
    options: allOptions.map(
      (o, i) => `${String.fromCharCode(65 + i)}) ${o} outs`
    ),
    correctAnswer: correctLetter,
    explanation: `With a ${drawType}, you have **${correctOuts} outs** to improve your hand.`,
    difficulty,
  };
}

function generateComboOutsProblem(): DrillProblem {
  // Flush draw + overcards or flush draw + straight draw
  const suit = pickRandom([...SUITS]);

  // Create flush draw with overcard
  const handRanks = shuffleArray(["A", "K", "Q"]);
  const hand = [
    `${handRanks[0]}${suit}`,
    `${pickRandom(["T", "J", "9"])}${suit}`,
  ];

  // Board with 2 of the suit, low cards
  const boardFlushRanks = shuffleArray(
    RANKS.filter((r) => r !== handRanks[0] && rankValue(r) <= 8)
  );
  const otherSuits = SUITS.filter((s) => s !== suit);
  const board = [
    `${boardFlushRanks[0]}${suit}`,
    `${boardFlushRanks[1]}${suit}`,
    `${pickRandom(["3", "4", "5"])}${pickRandom([...otherSuits])}`,
  ];

  const actualOuts = countOuts(hand, board);

  return makeOutsProblem(hand, board, actualOuts, "combo draw (flush + overcards)", "advanced");
}

// -- Rule of 2 and 4 Generators --

function generateRuleOfTwoProblem(): DrillProblem {
  const outs = randomInt(2, 15);
  const approxProb = ruleOfTwo(outs);

  const wrongProbs = shuffleArray([
    approxProb + randomInt(4, 10),
    Math.max(2, approxProb - randomInt(4, 10)),
    outs * 4, // Common mistake: using rule of 4 instead
  ]).slice(0, 3);

  // Remove any that match correct
  const cleaned = wrongProbs.filter((w) => w !== approxProb).slice(0, 3);
  while (cleaned.length < 3) cleaned.push(approxProb + cleaned.length * 5 + 5);

  const allOptions = shuffleArray([approxProb, ...cleaned]);
  const correctIdx = allOptions.indexOf(approxProb);
  const correctLetter = String.fromCharCode(65 + correctIdx);

  return {
    id: "",
    question: `You have **${outs} outs** on the **turn** (one card to come). Using the Rule of 2, what is the approximate probability of hitting your hand?`,
    options: allOptions.map(
      (o, i) => `${String.fromCharCode(65 + i)}) ~${o}%`
    ),
    correctAnswer: correctLetter,
    explanation: `Rule of 2: ${outs} outs × 2 = **~${approxProb}%**. With one card to come, multiply your outs by 2 for a quick probability estimate.`,
    difficulty: outs <= 6 ? "basic" : outs <= 10 ? "intermediate" : "advanced",
  };
}

function generateRuleOfFourProblem(): DrillProblem {
  const outs = randomInt(2, 15);
  const approxProb = ruleOfFour(outs);

  const wrongProbs = shuffleArray([
    approxProb + randomInt(6, 14),
    Math.max(2, approxProb - randomInt(6, 14)),
    outs * 2, // Common mistake: using rule of 2 instead
  ]).slice(0, 3);

  const cleaned = wrongProbs.filter((w) => w !== approxProb).slice(0, 3);
  while (cleaned.length < 3) cleaned.push(approxProb + cleaned.length * 7 + 5);

  const allOptions = shuffleArray([approxProb, ...cleaned]);
  const correctIdx = allOptions.indexOf(approxProb);
  const correctLetter = String.fromCharCode(65 + correctIdx);

  return {
    id: "",
    question: `You have **${outs} outs** on the **flop** (two cards to come). Using the Rule of 4, what is the approximate probability of hitting your hand?`,
    options: allOptions.map(
      (o, i) => `${String.fromCharCode(65 + i)}) ~${o}%`
    ),
    correctAnswer: correctLetter,
    explanation: `Rule of 4: ${outs} outs × 4 = **~${approxProb}%**. With two cards to come, multiply your outs by 4 for a quick probability estimate.`,
    difficulty: outs <= 6 ? "basic" : outs <= 10 ? "intermediate" : "advanced",
  };
}

// -- Pot Odds Generator --

function generatePotOddsProblem(): DrillProblem {
  const potSizes = [20, 30, 40, 50, 60, 80, 100, 120, 150, 200];
  const betSizes = [10, 15, 20, 25, 30, 40, 50, 60, 75, 100];
  const pot = pickRandom(potSizes);
  const bet = pickRandom(betSizes.filter((b) => b <= pot));

  const correctOdds = Math.round(potOdds(pot, bet));

  const wrongOdds = shuffleArray([
    Math.round((bet / pot) * 100), // Common mistake: bet/pot instead of bet/(pot+bet)
    correctOdds + randomInt(5, 15),
    Math.max(5, correctOdds - randomInt(5, 15)),
  ])
    .filter((w) => w !== correctOdds)
    .slice(0, 3);

  while (wrongOdds.length < 3) wrongOdds.push(correctOdds + wrongOdds.length * 8 + 5);

  const allOptions = shuffleArray([correctOdds, ...wrongOdds]);
  const correctIdx = allOptions.indexOf(correctOdds);
  const correctLetter = String.fromCharCode(65 + correctIdx);

  return {
    id: "",
    question: `The pot is **$${pot}**. Your opponent bets **$${bet}**. What are your pot odds (the percentage you need to call)?`,
    options: allOptions.map(
      (o, i) => `${String.fromCharCode(65 + i)}) ~${o}%`
    ),
    correctAnswer: correctLetter,
    explanation: `Pot odds = call / (pot + call) = $${bet} / ($${pot} + $${bet}) = $${bet} / $${pot + bet} = **~${correctOdds}%**.`,
    difficulty: correctOdds <= 25 ? "basic" : "intermediate",
  };
}

// -- Call or Fold Generator --

function generateCallOrFoldProblem(): DrillProblem {
  const outs = randomInt(4, 15);
  const winProb = ruleOfTwo(outs); // Using turn scenario (rule of 2)
  const pot = pickRandom([40, 60, 80, 100, 120, 150]);
  const bet = pickRandom([10, 15, 20, 25, 30, 40, 50].filter((b) => b <= pot / 2));
  const odds = Math.round(potOdds(pot, bet));

  const shouldCall = winProb > odds;
  const correctAnswer = shouldCall ? "A" : "B";

  const drawDesc = outs === 9 ? "a flush draw" : outs === 8 ? "an open-ended straight draw" : `${outs} outs`;

  return {
    id: "",
    question: `You have **${drawDesc}** (${outs} outs) on the turn. The pot is **$${pot}** and your opponent bets **$${bet}**. What should you do?`,
    options: [
      "A) Call — the pot odds are in your favor",
      "B) Fold — the pot odds are against you",
    ],
    correctAnswer,
    explanation: `Your win probability ≈ ${outs} × 2 = **${winProb}%**. Pot odds = $${bet} / $${pot + bet} = **~${odds}%**. Since your win probability (${winProb}%) is ${shouldCall ? "greater" : "less"} than the pot odds (${odds}%), you should **${shouldCall ? "call" : "fold"}**.`,
    difficulty: Math.abs(winProb - odds) > 10 ? "basic" : "advanced",
  };
}

// -- EV Generators --

function generateEVCallProblem(): DrillProblem {
  const winProb = pickRandom([0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]);
  const pot = pickRandom([40, 60, 80, 100, 120, 150, 200]);
  const call = pickRandom([10, 15, 20, 25, 30, 40, 50].filter((c) => c <= pot / 2));

  const ev = expectedValueCall(winProb, pot, call);
  const correctEV = Math.round(ev);

  const wrongEVs = shuffleArray([
    correctEV + randomInt(10, 30),
    correctEV - randomInt(10, 30),
    -correctEV, // Sign flip mistake
  ])
    .filter((w) => w !== correctEV)
    .slice(0, 3);

  while (wrongEVs.length < 3) wrongEVs.push(correctEV + wrongEVs.length * 15 + 10);

  const allOptions = shuffleArray([correctEV, ...wrongEVs]);
  const correctIdx = allOptions.indexOf(correctEV);
  const correctLetter = String.fromCharCode(65 + correctIdx);

  const winPct = Math.round(winProb * 100);

  return {
    id: "",
    question: `The pot is **$${pot}**, you must call **$${call}**, and you estimate a **${winPct}%** chance of winning. What is the EV of calling?`,
    options: allOptions.map(
      (o, i) =>
        `${String.fromCharCode(65 + i)}) ${o >= 0 ? "+" : ""}$${o}`
    ),
    correctAnswer: correctLetter,
    explanation: `EV = (${winPct}% × $${pot}) - (${100 - winPct}% × $${call}) = $${(winProb * pot).toFixed(0)} - $${((1 - winProb) * call).toFixed(0)} = **${correctEV >= 0 ? "+" : ""}$${correctEV}**.${correctEV >= 0 ? " This is a profitable call!" : " This call loses money long-term."}`,
    difficulty: Math.abs(correctEV) < 10 ? "advanced" : "intermediate",
  };
}

function generateEVBluffProblem(): DrillProblem {
  const foldProb = pickRandom([0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7]);
  const pot = pickRandom([30, 40, 50, 60, 80, 100]);
  const bet = pickRandom([20, 25, 30, 40, 50, 60].filter((b) => b <= pot));

  const ev = expectedValueBluff(foldProb, pot, bet);
  const correctEV = Math.round(ev);

  const wrongEVs = shuffleArray([
    correctEV + randomInt(8, 25),
    correctEV - randomInt(8, 25),
    -correctEV,
  ])
    .filter((w) => w !== correctEV)
    .slice(0, 3);

  while (wrongEVs.length < 3) wrongEVs.push(correctEV + wrongEVs.length * 12 + 8);

  const allOptions = shuffleArray([correctEV, ...wrongEVs]);
  const correctIdx = allOptions.indexOf(correctEV);
  const correctLetter = String.fromCharCode(65 + correctIdx);

  const foldPct = Math.round(foldProb * 100);

  return {
    id: "",
    question: `You bluff **$${bet}** into a **$${pot}** pot. You estimate your opponent folds **${foldPct}%** of the time. What is the EV of this bluff?`,
    options: allOptions.map(
      (o, i) =>
        `${String.fromCharCode(65 + i)}) ${o >= 0 ? "+" : ""}$${o}`
    ),
    correctAnswer: correctLetter,
    explanation: `EV = (${foldPct}% × $${pot}) - (${100 - foldPct}% × $${bet}) = $${(foldProb * pot).toFixed(0)} - $${((1 - foldProb) * bet).toFixed(0)} = **${correctEV >= 0 ? "+" : ""}$${correctEV}**.${correctEV >= 0 ? " This bluff is profitable!" : " This bluff loses money long-term."}`,
    difficulty: Math.abs(correctEV) < 5 ? "advanced" : "intermediate",
  };
}

// -- Starting Hands Generator --

function generateStartingHandsProblem(): DrillProblem {
  const deck = createDeck();
  const hand = drawCards(deck, 2);
  const tier = classifyHand(hand[0], hand[1]);
  const tierLabel = TIER_LABELS[tier];

  const allTiers: HandTier[] = ["premium", "strong", "playable", "marginal", "trash"];
  const wrongTiers = shuffleArray(allTiers.filter((t) => t !== tier)).slice(0, 3);
  const wrongLabels = wrongTiers.map((t) => TIER_LABELS[t]);

  const allOptions = shuffleArray([tierLabel, ...wrongLabels]);
  const correctIdx = allOptions.indexOf(tierLabel);
  const correctLetter = String.fromCharCode(65 + correctIdx);

  const r1 = cardRank(hand[0]);
  const r2 = cardRank(hand[1]);
  const suited = cardSuit(hand[0]) === cardSuit(hand[1]);
  const handName = r1 === r2 ? `a pair of ${r1}s` : `${r1}${r2}${suited ? " suited" : " offsuit"}`;

  return {
    id: "",
    question: `How would you classify this starting hand?`,
    cards: { hand, displayAs: "hand" },
    options: allOptions.map(
      (o, i) => `${String.fromCharCode(65 + i)}) ${o}`
    ),
    correctAnswer: correctLetter,
    explanation: `${handName} is classified as **${tierLabel}**. ${getTierExplanation(tier)}`,
    difficulty: tier === "premium" || tier === "trash" ? "basic" : "intermediate",
  };
}

function getTierExplanation(tier: HandTier): string {
  switch (tier) {
    case "premium": return "These are the strongest starting hands — raise from any position.";
    case "strong": return "Very strong hands — raise from most positions.";
    case "playable": return "Solid hands — raise from middle and late position.";
    case "marginal": return "Speculative hands — only play from late position or the blinds.";
    case "trash": return "Weak hands — fold from most positions.";
  }
}

// -- Position Play Generator --

function generatePositionPlayProblem(): DrillProblem {
  const positions: Position[] = ["early", "middle", "late", "blinds"];
  const position = pickRandom(positions);
  const posName = POSITION_NAMES[position];

  // Generate a hand that isn't premium (those are always raise, boring)
  let hand: string[];
  let action: string;
  let attempts = 0;
  do {
    const deck = createDeck();
    hand = drawCards(deck, 2);
    action = recommendAction(hand[0], hand[1], position);
    attempts++;
  } while (classifyHand(hand[0], hand[1]) === "premium" && attempts < 20);

  const allActions = ["raise", "call", "fold"];
  // For positions where call isn't recommended, still show it as option
  const wrongActions = allActions.filter((a) => a !== action);

  const options = shuffleArray([action, ...wrongActions]);
  const correctIdx = options.indexOf(action);
  const correctLetter = String.fromCharCode(65 + correctIdx);

  const tier = classifyHand(hand[0], hand[1]);

  return {
    id: "",
    question: `You're in **${posName}** with this hand. No one has raised before you. What should you do?`,
    cards: { hand, displayAs: "hand" },
    options: options.map(
      (o, i) => `${String.fromCharCode(65 + i)}) ${o.charAt(0).toUpperCase() + o.slice(1)}`
    ),
    correctAnswer: correctLetter,
    explanation: `This is a **${TIER_LABELS[tier]}** hand. From ${posName.toLowerCase()}, the correct play is to **${action}**. ${getPositionExplanation(position, tier)}`,
    difficulty: position === "early" || position === "late" ? "basic" : "intermediate",
  };
}

function getPositionExplanation(position: Position, tier: HandTier): string {
  if (position === "early") {
    return "Early position means many players still act after you — play only your strongest hands.";
  }
  if (position === "middle") {
    return "Middle position lets you widen your range slightly, but you still have players behind you.";
  }
  if (position === "late") {
    return "Late position is powerful — you see what everyone does before you act. You can play more hands.";
  }
  return "From the blinds, you already have money invested. Defend with playable hands, but don't overcommit.";
}

// -- Mixed Generator --

function generateMixedProblem(): DrillProblem {
  const types: GeneratorType[] = [
    "hand-rankings",
    "rank-hands",
    "count-outs",
    "rule-of-2",
    "rule-of-4",
    "pot-odds",
    "call-or-fold",
    "ev-call",
    "ev-bluff",
    "starting-hands",
    "position-play",
  ];
  const type = pickRandom(types);
  return GENERATORS[type]();
}

// -- Helpers --

function formatCards(cards: string[]): string {
  return cards
    .map((c) => {
      const rank = cardRank(c);
      const suit = cardSuit(c);
      const suitSymbol = { h: "♥", d: "♦", c: "♣", s: "♠" }[suit] || suit;
      return `${rank}${suitSymbol}`;
    })
    .join(" ");
}
