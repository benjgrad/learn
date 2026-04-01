/**
 * Rule of 2: approximate probability with one card to come.
 * Used on the turn (one card left to see).
 */
export function ruleOfTwo(outs: number): number {
  return outs * 2;
}

/**
 * Rule of 4: approximate probability with two cards to come.
 * Used on the flop (two cards left to see).
 */
export function ruleOfFour(outs: number): number {
  return outs * 4;
}

/**
 * Exact probability of hitting at least one out.
 * @param outs Number of outs
 * @param cardsRemaining Cards left in deck (usually 47 on turn, 47 on flop for one card)
 */
export function exactProbability(outs: number, cardsRemaining: number): number {
  return (outs / cardsRemaining) * 100;
}

/**
 * Calculate pot odds as a percentage.
 * Pot odds = callAmount / (potSize + callAmount)
 */
export function potOdds(potSize: number, callAmount: number): number {
  return (callAmount / (potSize + callAmount)) * 100;
}

/**
 * Calculate expected value of a call.
 * EV = (winProb * amountWon) - (loseProb * amountLost)
 * where amountWon = pot + callAmount (what you win), amountLost = callAmount (what you risk)
 */
export function expectedValueCall(
  winProbability: number,
  potSize: number,
  callAmount: number
): number {
  const winAmount = potSize; // You win the pot (your call goes in, so net gain is pot)
  const loseAmount = callAmount;
  return winProbability * winAmount - (1 - winProbability) * loseAmount;
}

/**
 * Calculate expected value of a bluff.
 * EV = (foldProb * potSize) - (callProb * betAmount)
 */
export function expectedValueBluff(
  foldProbability: number,
  potSize: number,
  betAmount: number
): number {
  const callProbability = 1 - foldProbability;
  return foldProbability * potSize - callProbability * betAmount;
}

/**
 * Format a number as a dollar amount.
 */
export function formatDollars(amount: number): string {
  if (amount >= 0) return `+$${amount.toFixed(0)}`;
  return `-$${Math.abs(amount).toFixed(0)}`;
}

/**
 * Round to nearest multiple for cleaner problem numbers.
 */
export function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}
