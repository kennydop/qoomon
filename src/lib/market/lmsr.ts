import {
  BINARY_SEARCH_MAX_ITERATIONS,
  BINARY_SEARCH_TOLERANCE,
  MAX_DECIMAL_ODDS,
} from './constants';

/**
 * Convert numeric database values into JavaScript numbers safely.
 * @example
 * parseNumeric('12.50') // 12.5
 */
export function parseNumeric(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    throw new Error('Invalid numeric value.');
  }

  return parsed;
}

/**
 * Convert JavaScript numbers into numeric strings for storage.
 * @example
 * formatNumeric(12.5) // '12.50'
 */
export function formatNumeric(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid numeric value.');
  }

  return value.toFixed(decimals);
}

/**
 * Validate that quantities are non-negative, finite numbers.
 */
export function validateQuantities(quantities: number[]): void {
  if (!Array.isArray(quantities) || quantities.length === 0) {
    throw new Error('Quantities must be a non-empty array.');
  }

  quantities.forEach((quantity) => {
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new Error('Quantities must be non-negative, finite numbers.');
    }
  });
}

function logSumExp(values: number[]): number {
  const maxValue = Math.max(...values);
  const sum = values.reduce((acc, value) => acc + Math.exp(value - maxValue), 0);
  return Math.log(sum) + maxValue;
}

/**
 * Calculate the LMSR cost function C(q) = b * ln(Σ exp(q_i / b)).
 *
 * This follows Robin Hanson's Logarithmic Market Scoring Rule (LMSR),
 * which ensures bounded loss while providing continuous liquidity.
 *
 * Reference: Hanson, R. (2003). "Combinatorial Information Market Design".
 * https://mason.gmu.edu/~rhanson/mktscore.pdf
 */
export function cost(quantities: number[], b: number): number {
  validateQuantities(quantities);

  if (!Number.isFinite(b) || b <= 0) {
    throw new Error('Liquidity parameter b must be a positive number.');
  }

  const scaled = quantities.map((quantity) => quantity / b);
  return b * logSumExp(scaled);
}

/**
 * Calculate the instantaneous marginal price for outcome i:
 * ∂C/∂q_i = exp(q_i / b) / Σ exp(q_j / b)
 *
 * Reference: Hanson, R. (2003). "Combinatorial Information Market Design".
 */
export function price(quantities: number[], outcomeIndex: number, b: number): number {
  validateQuantities(quantities);

  if (!Number.isFinite(b) || b <= 0) {
    throw new Error('Liquidity parameter b must be a positive number.');
  }

  if (!Number.isInteger(outcomeIndex) || outcomeIndex < 0) {
    throw new Error('Outcome index must be a non-negative integer.');
  }

  if (outcomeIndex >= quantities.length) {
    throw new Error('Outcome index is out of bounds.');
  }

  const scaled = quantities.map((quantity) => quantity / b);
  const maxValue = Math.max(...scaled);
  const exps = scaled.map((value) => Math.exp(value - maxValue));
  const sum = exps.reduce((acc, value) => acc + value, 0);
  return exps[outcomeIndex] / sum;
}

/**
 * Calculate the number of shares purchasable for a given stake.
 * Uses binary search to solve cost(q + Δq) - cost(q) ≈ stake.
 *
 * Reference: Hanson, R. (2003). "Combinatorial Information Market Design".
 */
export function calculateShares(
  currentQuantities: number[],
  outcomeIndex: number,
  stake: number,
  b: number
): number {
  validateQuantities(currentQuantities);

  if (!Number.isFinite(stake) || stake < 0) {
    throw new Error('Stake must be a non-negative number.');
  }

  if (stake === 0) {
    return 0;
  }

  if (!Number.isFinite(b) || b <= 0) {
    throw new Error('Liquidity parameter b must be a positive number.');
  }

  if (!Number.isInteger(outcomeIndex) || outcomeIndex < 0) {
    throw new Error('Outcome index must be a non-negative integer.');
  }

  if (outcomeIndex >= currentQuantities.length) {
    throw new Error('Outcome index is out of bounds.');
  }

  const baseCost = cost(currentQuantities, b);
  let low = 0;
  let high = Math.max(1, stake);
  let expansionIterations = 0;

  while (expansionIterations < BINARY_SEARCH_MAX_ITERATIONS) {
    const updated = [...currentQuantities];
    updated[outcomeIndex] += high;
    const delta = cost(updated, b) - baseCost;

    if (delta >= stake) {
      break;
    }

    high *= 2;
    expansionIterations += 1;
  }

  for (let iteration = 0; iteration < BINARY_SEARCH_MAX_ITERATIONS; iteration += 1) {
    const mid = (low + high) / 2;
    const updated = [...currentQuantities];
    updated[outcomeIndex] += mid;

    const newCost = cost(updated, b);
    const delta = newCost - baseCost;

    if (Math.abs(delta - stake) <= BINARY_SEARCH_TOLERANCE) {
      return mid;
    }

    if (delta > stake) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Calculate payout for selling shares back to the market:
 * payout = cost(q) - cost(q - shares).
 */
export function calculatePayout(
  shares: number,
  currentQuantities: number[],
  outcomeIndex: number,
  b: number
): number {
  validateQuantities(currentQuantities);

  if (!Number.isFinite(shares) || shares < 0) {
    throw new Error('Shares must be a non-negative number.');
  }

  if (!Number.isFinite(b) || b <= 0) {
    throw new Error('Liquidity parameter b must be a positive number.');
  }

  if (!Number.isInteger(outcomeIndex) || outcomeIndex < 0) {
    throw new Error('Outcome index must be a non-negative integer.');
  }

  if (outcomeIndex >= currentQuantities.length) {
    throw new Error('Outcome index is out of bounds.');
  }

  if (shares > currentQuantities[outcomeIndex]) {
    throw new Error('Cannot sell more shares than outstanding.');
  }

  const updated = [...currentQuantities];
  updated[outcomeIndex] -= shares;

  return cost(currentQuantities, b) - cost(updated, b);
}

/**
 * Convert LMSR price into decimal odds (1 / price).
 * Caps odds for near-zero probabilities.
 */
export function decimalOdds(quantities: number[], outcomeIndex: number, b: number): number {
  const currentPrice = price(quantities, outcomeIndex, b);

  if (currentPrice <= 0) {
    return MAX_DECIMAL_ODDS;
  }

  return Math.min(1 / currentPrice, MAX_DECIMAL_ODDS);
}
