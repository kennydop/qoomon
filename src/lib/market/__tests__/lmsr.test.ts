import {
  calculatePayout,
  calculateShares,
  cost,
  decimalOdds,
  price,
} from '@/lib/market/lmsr';

describe('LMSR cost function', () => {
  it('should increase monotonically for higher quantities', () => {
    const b = 100;
    const base = cost([0, 0], b);
    const higher = cost([10, 0], b);
    expect(higher).toBeGreaterThan(base);
  });

  it('should be symmetric for equal quantities', () => {
    const b = 100;
    const left = cost([10, 0], b);
    const right = cost([0, 10], b);
    expect(left).toBeCloseTo(right, 8);
  });

  it('should handle all-zero quantities', () => {
    const b = 10;
    const result = cost([0, 0, 0], b);
    expect(result).toBeCloseTo(b * Math.log(3), 8);
  });

  it('should respond to different liquidity parameters', () => {
    const quantities = [5, 2];
    const lowB = cost(quantities, 10);
    const highB = cost(quantities, 1000);
    expect(lowB).toBeLessThan(highB);
  });
});

describe('LMSR price function', () => {
  it('should produce prices that sum to 1', () => {
    const b = 100;
    const quantities = [3, 7, 2];
    const sum =
      price(quantities, 0, b) +
      price(quantities, 1, b) +
      price(quantities, 2, b);
    expect(sum).toBeCloseTo(1, 8);
  });

  it('should keep prices between 0 and 1', () => {
    const b = 100;
    const quantities = [10, 0];
    const priceA = price(quantities, 0, b);
    const priceB = price(quantities, 1, b);
    expect(priceA).toBeGreaterThan(0);
    expect(priceA).toBeLessThan(1);
    expect(priceB).toBeGreaterThan(0);
    expect(priceB).toBeLessThan(1);
  });

  it('should give higher price to higher quantities', () => {
    const b = 100;
    const quantities = [10, 0];
    expect(price(quantities, 0, b)).toBeGreaterThan(price(quantities, 1, b));
  });

  it('should return 1 for single-outcome markets', () => {
    const b = 100;
    expect(price([10], 0, b)).toBeCloseTo(1, 8);
  });
});

describe('LMSR share calculations', () => {
  it('should match stake within tolerance for various stakes', () => {
    const b = 100;
    const quantities = [0, 0];
    const stakes = [0.01, 1, 10, 100, 1000];

    stakes.forEach((stake) => {
      const shares = calculateShares(quantities, 0, stake, b);
      const newQuantities = [shares, 0];
      const delta = cost(newQuantities, b) - cost(quantities, b);
      expect(delta).toBeGreaterThan(0);
      const error = Math.abs(delta - stake) / stake;
      expect(error).toBeLessThan(0.0001);
    });
  });

  it('should return positive shares', () => {
    const shares = calculateShares([0, 0], 1, 10, 100);
    expect(shares).toBeGreaterThan(0);
  });
});

describe('LMSR payout calculations', () => {
  it('should return payout less than or equal to shares * price', () => {
    const b = 100;
    const stake = 10;
    const quantities = [0, 0];
    const shares = calculateShares(quantities, 0, stake, b);
    const updated = [shares, 0];
    const payout = calculatePayout(shares, updated, 0, b);
    const currentPrice = price(updated, 0, b);
    expect(payout).toBeLessThanOrEqual(shares * currentPrice + 1e-6);
  });

  it('should approximately return the original stake when immediately sold', () => {
    const b = 100;
    const stake = 50;
    const quantities = [0, 0];
    const shares = calculateShares(quantities, 0, stake, b);
    const updated = [shares, 0];
    const payout = calculatePayout(shares, updated, 0, b);
    expect(payout).toBeCloseTo(stake, 3);
  });
});

describe('LMSR decimal odds', () => {
  it('should return inverse of price', () => {
    const b = 100;
    const quantities = [0, 0];
    const odds = decimalOdds(quantities, 0, b);
    expect(odds).toBeCloseTo(2, 6);
  });

  it('should cap extreme odds', () => {
    const b = 100;
    const quantities = [1000, 0];
    const odds = decimalOdds(quantities, 1, b);
    expect(odds).toBe(1000);
  });

  it('should reflect extreme probabilities', () => {
    const b = 100;
    const quantities = [0, 400];
    const odds = decimalOdds(quantities, 0, b);
    expect(odds).toBeGreaterThan(1);
  });
});
