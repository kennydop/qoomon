import {
  calculateParimutuelOdds,
  calculateParimutuelPayout,
} from '@/lib/market/parimutuel';

describe('Parimutuel odds calculation', () => {
  it('should return balanced odds for equal pools', () => {
    const odds = calculateParimutuelOdds([
      { id: 'a', totalStaked: 100 },
      { id: 'b', totalStaked: 100 },
    ]);

    expect(odds.get('a')).toBeCloseTo(2, 6);
    expect(odds.get('b')).toBeCloseTo(2, 6);
  });

  it('should assign default odds for zero-stake outcomes', () => {
    const odds = calculateParimutuelOdds([
      { id: 'a', totalStaked: 0 },
      { id: 'b', totalStaked: 50 },
    ]);

    expect(odds.get('a')).toBe(2.0);
    expect(odds.get('b')).toBeCloseTo(2, 6);
  });

  it('should handle single bettor edge case', () => {
    const odds = calculateParimutuelOdds([
      { id: 'a', totalStaked: 100 },
      { id: 'b', totalStaked: 0 },
    ]);

    expect(odds.get('a')).toBeCloseTo(1, 6);
    expect(odds.get('b')).toBe(2.0);
  });
});

describe('Parimutuel payout calculation', () => {
  it('should multiply stake by odds', () => {
    expect(calculateParimutuelPayout(10, 2.5)).toBeCloseTo(25, 6);
  });
});
