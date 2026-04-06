// Bridge scoring (duplicate / Chicago style)

/**
 * Base trick value by strain (denomination).
 * Clubs/Diamonds = 20 per trick, Hearts/Spades = 30, NT first trick = 40 then 30.
 */
export function trickValue(strain: string, trickNumber: number): number {
  const s = strain.toUpperCase();
  if (s === "C" || s === "D") return 20;
  if (s === "H" || s === "S") return 30;
  if (s === "NT") return trickNumber === 1 ? 40 : 30;
  return 0;
}

/** Calculate the base trick score for a contract (before bonuses). */
function baseTrickScore(level: number, strain: string): number {
  let score = 0;
  for (let i = 1; i <= level; i++) {
    score += trickValue(strain, i);
  }
  return score;
}

/**
 * Full contract score when contract is made.
 * level: 1-7, strain: "C"|"D"|"H"|"S"|"NT"
 * overtricks: number of tricks above the contract
 */
export function contractScore(
  level: number,
  strain: string,
  doubled: boolean,
  redoubled: boolean,
  vulnerable: boolean,
  overtricks: number
): number {
  let base = baseTrickScore(level, strain);
  const multiplier = redoubled ? 4 : doubled ? 2 : 1;
  const contractValue = base * multiplier;

  // Overtrick value
  let overtrickValue: number;
  if (redoubled) {
    overtrickValue = overtricks * (vulnerable ? 400 : 200);
  } else if (doubled) {
    overtrickValue = overtricks * (vulnerable ? 200 : 100);
  } else {
    overtrickValue = overtricks * trickValue(strain, 2);
  }

  // Insult bonus for making doubled/redoubled
  const insultBonus = redoubled ? 100 : doubled ? 50 : 0;

  // Game bonus
  let gameBonus: number;
  if (contractValue >= 100) {
    // Game
    gameBonus = vulnerable ? 500 : 300;
  } else {
    // Part score
    gameBonus = 50;
  }

  // Slam bonuses
  let slamBonus = 0;
  if (level === 6) {
    slamBonus = vulnerable ? 750 : 500;
  } else if (level === 7) {
    slamBonus = vulnerable ? 1500 : 1000;
  }

  return contractValue + overtrickValue + insultBonus + gameBonus + slamBonus;
}

/**
 * Penalty score for going down (undertricks).
 * Returns a positive number representing the penalty points.
 */
export function penaltyScore(
  undertricks: number,
  vulnerable: boolean,
  doubled: boolean,
  redoubled: boolean
): number {
  if (undertricks <= 0) return 0;

  if (!doubled && !redoubled) {
    return undertricks * (vulnerable ? 100 : 50);
  }

  let penalty = 0;
  const mult = redoubled ? 2 : 1;

  for (let i = 1; i <= undertricks; i++) {
    if (i === 1) {
      penalty += (vulnerable ? 200 : 100) * mult;
    } else if (i <= 3) {
      penalty += (vulnerable ? 300 : 200) * mult;
    } else {
      penalty += (vulnerable ? 300 : 300) * mult;
    }
  }

  return penalty;
}

/** Is this a game contract? (contract value >= 100 undoubled) */
export function isGameContract(level: number, strain: string): boolean {
  const s = strain.toUpperCase();
  if (s === "NT") return level >= 3;
  if (s === "H" || s === "S") return level >= 4;
  if (s === "C" || s === "D") return level >= 5;
  return false;
}

/** Is this a slam? 6 = small slam, 7 = grand slam. */
export function isSlamContract(level: number): boolean {
  return level >= 6;
}

/** Is this a grand slam? */
export function isGrandSlam(level: number): boolean {
  return level === 7;
}

/** Calculate total IMP (International Match Points) from a point difference. */
export function impScale(diff: number): number {
  const absDiff = Math.abs(diff);
  const table = [
    [20, 1], [50, 2], [90, 3], [130, 4], [170, 5],
    [220, 6], [270, 7], [320, 8], [370, 9], [430, 10],
    [500, 11], [600, 12], [750, 13], [900, 14], [1100, 15],
    [1300, 16], [1500, 17], [1750, 18], [2000, 19], [2250, 20],
    [2500, 21], [3000, 22], [3500, 23], [4000, 24],
  ];
  for (const [threshold, imps] of table) {
    if (absDiff < threshold) return diff >= 0 ? imps - 1 : -(imps - 1);
  }
  return diff >= 0 ? 24 : -24;
}
