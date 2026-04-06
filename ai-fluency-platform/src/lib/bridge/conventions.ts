// Common SAYC conventions for identification drills

export interface Convention {
  name: string;
  description: string;
  /** Example auction patterns. "?" marks the conventional bid. */
  exampleAuctions: string[][];
  /** The conventional bid within the auction. */
  conventionalBid: string;
  /** Position in the auction (0-indexed) of the conventional bid. */
  bidIndex: number;
}

export const CONVENTIONS: Convention[] = [
  {
    name: "Stayman",
    description:
      "2♣ response to 1NT asking for a 4-card major. Partner opens 1NT, you bid 2♣ with a 4-card major and 8+ points.",
    exampleAuctions: [
      ["1NT", "Pass", "2C", "Pass"],
    ],
    conventionalBid: "2C",
    bidIndex: 2,
  },
  {
    name: "Jacoby Transfer (Hearts)",
    description:
      "2♦ response to 1NT showing 5+ hearts. Partner bids 2♥ to complete the transfer.",
    exampleAuctions: [
      ["1NT", "Pass", "2D", "Pass", "2H"],
    ],
    conventionalBid: "2D",
    bidIndex: 2,
  },
  {
    name: "Jacoby Transfer (Spades)",
    description:
      "2♥ response to 1NT showing 5+ spades. Partner bids 2♠ to complete the transfer.",
    exampleAuctions: [
      ["1NT", "Pass", "2H", "Pass", "2S"],
    ],
    conventionalBid: "2H",
    bidIndex: 2,
  },
  {
    name: "Blackwood (4NT)",
    description:
      "4NT asks partner how many aces they hold. Responses: 5♣=0/4, 5♦=1, 5♥=2, 5♠=3.",
    exampleAuctions: [
      ["1S", "Pass", "3S", "Pass", "4NT"],
      ["1H", "Pass", "4H", "Pass", "4NT"],
    ],
    conventionalBid: "4NT",
    bidIndex: 4,
  },
  {
    name: "Gerber (4♣)",
    description:
      "4♣ over NT asks for aces. Used instead of Blackwood when the trump suit is clubs or over NT openings.",
    exampleAuctions: [
      ["1NT", "Pass", "4C"],
      ["2NT", "Pass", "4C"],
    ],
    conventionalBid: "4C",
    bidIndex: 2,
  },
  {
    name: "Weak Two Bid",
    description:
      "Opening 2♦/2♥/2♠ shows 6-10 HCP and a good 6-card suit. Preemptive in nature.",
    exampleAuctions: [
      ["2H"],
      ["2S"],
      ["2D"],
    ],
    conventionalBid: "2H",
    bidIndex: 0,
  },
  {
    name: "Strong 2♣ Opening",
    description:
      "2♣ opening is artificial and forcing, showing 22+ HCP or 9+ playing tricks. The strongest opening bid in SAYC.",
    exampleAuctions: [
      ["2C", "Pass", "2D"],
    ],
    conventionalBid: "2C",
    bidIndex: 0,
  },
  {
    name: "2♦ Waiting Response",
    description:
      "2♦ response to partner's 2♣ opening. Artificial and waiting — says nothing about diamonds. Shows 0-7 HCP.",
    exampleAuctions: [
      ["2C", "Pass", "2D"],
    ],
    conventionalBid: "2D",
    bidIndex: 2,
  },
  {
    name: "Takeout Double",
    description:
      "A double of an opponent's suit bid at a low level. Shows opening values and support for all unbid suits.",
    exampleAuctions: [
      ["1H", "Dbl"],
      ["1S", "Dbl"],
      ["1D", "Dbl"],
    ],
    conventionalBid: "Dbl",
    bidIndex: 1,
  },
  {
    name: "Negative Double",
    description:
      "A double by responder after partner opens and RHO overcalls. Shows values and length in unbid suits, especially unbid majors.",
    exampleAuctions: [
      ["1D", "1S", "Dbl"],
      ["1C", "1H", "Dbl"],
    ],
    conventionalBid: "Dbl",
    bidIndex: 2,
  },
  {
    name: "Limit Raise",
    description:
      "A jump raise of partner's suit showing invitational values (10-12 points) and 4+ card support.",
    exampleAuctions: [
      ["1H", "Pass", "3H"],
      ["1S", "Pass", "3S"],
    ],
    conventionalBid: "3H",
    bidIndex: 2,
  },
  {
    name: "New Minor Forcing",
    description:
      "After opener rebids 1NT, responder bids an unbid minor to force opener to further describe their hand.",
    exampleAuctions: [
      ["1D", "Pass", "1H", "Pass", "1NT", "Pass", "2C"],
      ["1C", "Pass", "1S", "Pass", "1NT", "Pass", "2D"],
    ],
    conventionalBid: "2C",
    bidIndex: 6,
  },
  {
    name: "Fourth Suit Forcing",
    description:
      "Bidding the fourth (unbid) suit is artificial and forcing, asking partner to further describe their hand.",
    exampleAuctions: [
      ["1D", "Pass", "1H", "Pass", "2C", "Pass", "2S"],
    ],
    conventionalBid: "2S",
    bidIndex: 6,
  },
  {
    name: "Preemptive Opening (3-level)",
    description:
      "Opening at the 3-level shows a 7-card suit and 6-10 HCP. Aims to consume bidding space from opponents.",
    exampleAuctions: [
      ["3H"],
      ["3S"],
      ["3D"],
      ["3C"],
    ],
    conventionalBid: "3H",
    bidIndex: 0,
  },
];

/**
 * Identify which convention is being used given an auction sequence.
 * Returns the convention name or "Standard" if no convention is detected.
 */
export function identifyConvention(auction: string[]): string {
  // Check 2C opening
  if (auction[0] === "2C" && auction.length >= 1) {
    if (auction.length >= 3 && auction[2] === "2D") {
      // Could be either "Strong 2C" or "2D Waiting" depending on perspective
      return "Strong 2♣ Opening";
    }
    return "Strong 2♣ Opening";
  }

  // Check weak 2 openings
  if (["2D", "2H", "2S"].includes(auction[0])) {
    return "Weak Two Bid";
  }

  // Check 3-level preempts
  if (auction[0]?.match(/^3[CDHS]$/)) {
    return "Preemptive Opening (3-level)";
  }

  // Check Stayman: 1NT - (Pass) - 2C
  if (auction[0] === "1NT" && auction[2] === "2C") {
    return "Stayman";
  }

  // Check Jacoby Transfers: 1NT - (Pass) - 2D (hearts) or 2H (spades)
  if (auction[0] === "1NT" && auction[2] === "2D") {
    return "Jacoby Transfer (Hearts)";
  }
  if (auction[0] === "1NT" && auction[2] === "2H") {
    return "Jacoby Transfer (Spades)";
  }

  // Check Gerber: over NT opening, 4C
  if ((auction[0] === "1NT" || auction[0] === "2NT") && auction[2] === "4C") {
    return "Gerber (4♣)";
  }

  // Check Blackwood: 4NT after suit agreement
  for (let i = 0; i < auction.length; i++) {
    if (auction[i] === "4NT" && i >= 2) {
      return "Blackwood (4NT)";
    }
  }

  // Check Takeout Double: opponent opens a suit, next player doubles
  if (auction.length >= 2 && auction[0]?.match(/^1[CDHS]$/) && auction[1] === "Dbl") {
    return "Takeout Double";
  }

  // Check Negative Double: partner opens, opponent overcalls, you double
  if (
    auction.length >= 3 &&
    auction[0]?.match(/^1[CDHS]$/) &&
    auction[1]?.match(/^[1-4][CDHSN]/) &&
    auction[2] === "Dbl"
  ) {
    return "Negative Double";
  }

  // Check Limit Raise: partner opens 1M, you jump raise to 3M
  if (auction[0] === "1H" && auction[2] === "3H") return "Limit Raise";
  if (auction[0] === "1S" && auction[2] === "3S") return "Limit Raise";

  return "Standard";
}
