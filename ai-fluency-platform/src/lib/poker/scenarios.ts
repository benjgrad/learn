export interface DecisionPoint {
  prompt: string;
  board: string[];
  potSize: number;
  betToCall?: number;
  options: { action: string; label: string }[];
  correctAction: string;
  explanation: string;
  concepts: string[];
}

export interface DecisionScenario {
  id: string;
  title: string;
  position: string;
  holeCards: [string, string];
  stackSize: number;
  blinds: string;
  narrative: string;
  decisions: DecisionPoint[];
}

export const SCENARIOS: DecisionScenario[] = [
  {
    id: "premium-in-position",
    title: "Premium Pair on the Button",
    position: "Button (BTN)",
    holeCards: ["Ah", "As"],
    stackSize: 200,
    blinds: "$1/$2",
    narrative: "You're on the button in a $1/$2 cash game with $200. Everyone folds to you. You look down at pocket Aces.",
    decisions: [
      {
        prompt: "Action is on you preflop. What do you do?",
        board: [],
        potSize: 3,
        options: [
          { action: "raise", label: "Raise to $6" },
          { action: "call", label: "Call $2" },
          { action: "fold", label: "Fold" },
        ],
        correctAction: "raise",
        explanation: "Pocket Aces is the best starting hand in poker. You should always raise with them — limping risks letting weaker hands see a cheap flop and potentially outdraw you. A raise to 3x the big blind ($6) is standard.",
        concepts: ["starting-hands", "position"],
      },
      {
        prompt: "The big blind calls your raise. The flop comes K♠ 7♦ 2♣. The BB checks to you. The pot is $13. What do you do?",
        board: ["Ks", "7d", "2c"],
        potSize: 13,
        options: [
          { action: "raise", label: "Bet $9" },
          { action: "call", label: "Check behind" },
        ],
        correctAction: "raise",
        explanation: "You have an overpair (AA) on a dry board (K-7-2 with no flush or straight draws). This is one of the best spots to continuation bet. You likely have the best hand, and you want to extract value. Betting ~2/3 pot ($9) is standard.",
        concepts: ["hand-rankings", "position"],
      },
    ],
  },
  {
    id: "flush-draw-decision",
    title: "Flush Draw on the Flop",
    position: "Cutoff (CO)",
    holeCards: ["Kh", "9h"],
    stackSize: 150,
    blinds: "$1/$2",
    narrative: "You're in the cutoff with $150. You raised to $6 preflop and the big blind called. Time to see the flop.",
    decisions: [
      {
        prompt: "The flop comes Q♥ 7♥ 3♣. The BB checks. Pot is $13. What do you do?",
        board: ["Qh", "7h", "3c"],
        potSize: 13,
        options: [
          { action: "raise", label: "Bet $9" },
          { action: "call", label: "Check behind" },
        ],
        correctAction: "raise",
        explanation: "You have a flush draw (9 outs) plus a King overcard (3 more outs = 12 total). Using the Rule of 4, that's ~48% equity with two cards to come. You have a very strong semi-bluff here — you can win by making your flush OR by your opponent folding. Betting is the better play.",
        concepts: ["count-outs", "rule-of-4", "position"],
      },
      {
        prompt: "The BB calls. The turn is the 4♠ (no help). BB checks again. Pot is $31. What do you do?",
        board: ["Qh", "7h", "3c", "4s"],
        potSize: 31,
        betToCall: 0,
        options: [
          { action: "raise", label: "Bet $20" },
          { action: "call", label: "Check behind" },
        ],
        correctAction: "call",
        explanation: "Now you only have one card to come. Rule of 2: 9 outs × 2 = ~18%. Your flush draw is less likely to hit, and if you bet and get raised, you're in trouble. Checking gives you a free card to see the river. This is the disciplined play.",
        concepts: ["rule-of-2", "pot-odds"],
      },
    ],
  },
  {
    id: "fold-discipline",
    title: "Marginal Hand Out of Position",
    position: "Under the Gun (UTG)",
    holeCards: ["Jc", "Ts"],
    stackSize: 200,
    blinds: "$1/$2",
    narrative: "You're first to act (UTG) in a $1/$2 game with a full table of 9 players. You look down at J♣ T♠.",
    decisions: [
      {
        prompt: "You're UTG. 8 players still act after you. What do you do with J♣ T♠ offsuit?",
        board: [],
        potSize: 3,
        options: [
          { action: "raise", label: "Raise to $6" },
          { action: "call", label: "Limp in for $2" },
          { action: "fold", label: "Fold" },
        ],
        correctAction: "fold",
        explanation: "JTo is a marginal hand, and from UTG you have 8 players left to act — any of them could wake up with a premium hand. In early position, you should only play premium and strong hands. Fold here and wait for a better spot. Discipline in early position is what separates winning players.",
        concepts: ["starting-hands", "position"],
      },
    ],
  },
  {
    id: "pot-odds-call",
    title: "River Decision with Pot Odds",
    position: "Big Blind (BB)",
    holeCards: ["Td", "9d"],
    stackSize: 180,
    blinds: "$1/$2",
    narrative: "You defended your big blind with T♦ 9♦ against a button raise. You've been drawing to a straight.",
    decisions: [
      {
        prompt: "The board is 8♣ 7♠ 2♥ K♦. You have an open-ended straight draw (8 outs). Your opponent bets $15 into a $30 pot. Should you call?",
        board: ["8c", "7s", "2h", "Kd"],
        potSize: 30,
        betToCall: 15,
        options: [
          { action: "call", label: "Call $15" },
          { action: "fold", label: "Fold" },
        ],
        correctAction: "call",
        explanation: "Your pot odds: $15 / ($30 + $15) = 33%. Your win probability (Rule of 2): 8 outs × 2 = ~16%. Wait — 16% < 33%, so normally you'd fold. But consider implied odds: if you hit your straight on the river, you'll likely win a big pot. With implied odds factored in, this is a close call that many pros would make. The key is recognizing the math and making a deliberate decision.",
        concepts: ["pot-odds", "rule-of-2", "count-outs"],
      },
      {
        prompt: "You called. The river is the 6♦! You made your straight (T-9-8-7-6). Your opponent bets $25 into a $60 pot. What do you do?",
        board: ["8c", "7s", "2h", "Kd", "6d"],
        potSize: 60,
        betToCall: 25,
        options: [
          { action: "raise", label: "Raise to $70" },
          { action: "call", label: "Call $25" },
        ],
        correctAction: "raise",
        explanation: "You have a straight — one of the strongest possible hands on this board. When you have a big hand, you want to extract maximum value. Raising gives your opponent a chance to call (or even re-raise) with a weaker hand like top pair or two pair. If you just call, you leave money on the table.",
        concepts: ["hand-rankings", "ev-call"],
      },
    ],
  },
  {
    id: "bluff-ev",
    title: "Bluff Opportunity",
    position: "Button (BTN)",
    holeCards: ["7s", "6s"],
    stackSize: 200,
    blinds: "$1/$2",
    narrative: "You raised from the button with 7♠ 6♠ — a speculative suited connector. Only the big blind called.",
    decisions: [
      {
        prompt: "The flop comes A♣ K♦ 3♥ — completely missed your hand. The BB checks. Pot is $13. What do you do?",
        board: ["Ac", "Kd", "3h"],
        potSize: 13,
        options: [
          { action: "raise", label: "Bet $8 (bluff)" },
          { action: "call", label: "Check behind" },
          { action: "fold", label: "Give up" },
        ],
        correctAction: "raise",
        explanation: "This is a great bluff spot! You raised preflop, so your opponent expects you to have strong cards. An A-K board hits your perceived range hard. A continuation bet of ~$8 will take this pot down a large percentage of the time. EV of bluff: if opponent folds 60% of the time, EV = (0.6 × $13) - (0.4 × $8) = $7.80 - $3.20 = +$4.60. Even when you miss, betting can be profitable.",
        concepts: ["ev-bluff", "position"],
      },
    ],
  },
  {
    id: "two-pair-trap",
    title: "Flopping Two Pair",
    position: "Small Blind (SB)",
    holeCards: ["9c", "7c"],
    stackSize: 150,
    blinds: "$1/$2",
    narrative: "You completed from the small blind with 9♣ 7♣. Three players see the flop.",
    decisions: [
      {
        prompt: "The flop comes 9♥ 7♦ 2♠. You've flopped two pair! There are 3 players. Pot is $6. What do you do?",
        board: ["9h", "7d", "2s"],
        potSize: 6,
        options: [
          { action: "raise", label: "Bet $4" },
          { action: "call", label: "Check (plan to raise later)" },
        ],
        correctAction: "raise",
        explanation: "Two pair is strong but vulnerable — any higher pair, straight draw, or overcard could beat you. In a multi-way pot, you want to charge draws and thin the field. Betting small ($4 into $6) makes it incorrect for most draws to call while building the pot with your strong hand.",
        concepts: ["hand-rankings", "pot-odds"],
      },
    ],
  },
  {
    id: "overcard-fold",
    title: "Knowing When to Let Go",
    position: "Middle Position (MP)",
    holeCards: ["Jc", "9d"],
    stackSize: 200,
    blinds: "$1/$2",
    narrative: "You raised to $6 from middle position with J♣ 9♦. The button and big blind both called.",
    decisions: [
      {
        prompt: "The flop comes A♠ K♦ T♣. You have a gutshot straight draw (need a Q for a straight). The BB leads out for $12 into an $18 pot, and the button raises to $35. Action is on you.",
        board: ["As", "Kd", "Tc"],
        potSize: 65,
        betToCall: 35,
        options: [
          { action: "call", label: "Call $35" },
          { action: "fold", label: "Fold" },
        ],
        correctAction: "fold",
        explanation: "This is a disciplined fold. You have a gutshot (4 outs — the four Queens, ~8% on the turn), and you'd need to call $35 into a $65 pot (pot odds ~35%). Your 8% chance of hitting doesn't justify a call. With two opponents showing strength on a dangerous board, folding is correct. When the math says fold, trust the math.",
        concepts: ["count-outs", "pot-odds", "rule-of-2"],
      },
    ],
  },
  {
    id: "short-stack-shove",
    title: "Short Stack All-In",
    position: "Cutoff (CO)",
    holeCards: ["Kd", "Qs"],
    stackSize: 30,
    blinds: "$1/$2",
    narrative: "You're short-stacked with only $30 (15 big blinds) in the cutoff. Everyone folds to you.",
    decisions: [
      {
        prompt: "You have KQ offsuit with 15 big blinds. What's your play?",
        board: [],
        potSize: 3,
        options: [
          { action: "raise", label: "Go all-in ($30)" },
          { action: "call", label: "Raise to $6 (standard)" },
          { action: "fold", label: "Fold" },
        ],
        correctAction: "raise",
        explanation: "With a short stack (15 BBs or less), the correct play with a strong hand like KQ in late position is to shove all-in. A small raise commits too much of your stack — if someone re-raises, you're stuck. Going all-in maximizes fold equity (you win the blinds uncontested) and when called, KQ has decent equity against calling ranges. This is a +EV play.",
        concepts: ["starting-hands", "ev-call", "position"],
      },
    ],
  },
];
