import {
  normalizeOutcomeProbabilities,
  updateOutcomeProbability,
  validateOutcomes,
} from '@/lib/admin/outcomes';

const createClientWithBetCount = (count: number) => {
  const single = jest.fn().mockResolvedValue({ data: { id: 'outcome-1', initial_probability: 0.5 }, error: null });
  const selectAfterUpdate = jest.fn(() => ({ single }));
  const eqAfterUpdate = jest.fn(() => ({ select: selectAfterUpdate }));
  const update = jest.fn(() => ({ eq: eqAfterUpdate }));

  const eqOnBets = jest.fn().mockResolvedValue({ count, error: null });
  const selectBets = jest.fn(() => ({ eq: eqOnBets }));

  const from = jest.fn((table: string) => {
    if (table === 'bets') {
      return { select: selectBets };
    }
    if (table === 'outcomes') {
      return { update };
    }
    return {} as any;
  });

  return { from };
};

describe('admin outcomes', () => {
  it('rejects duplicate outcome labels', () => {
    const result = validateOutcomes([
      { label: 'Yes', initial_probability: 0.5 },
      { label: 'yes', initial_probability: 0.5 },
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('validation_error');
    }
  });

  it('normalizes probabilities to sum to one', () => {
    const normalized = normalizeOutcomeProbabilities([
      { label: 'A', initial_probability: 2 },
      { label: 'B', initial_probability: 1 },
    ]);
    const total = normalized.reduce((sum, o) => sum + o.initial_probability, 0);
    expect(total).toBeCloseTo(1, 4);
  });

  it('prevents probability updates when bets exist', async () => {
    const client = createClientWithBetCount(3);
    const result = await updateOutcomeProbability(client as any, 'outcome-1', 0.3);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('bets_exist');
    }
  });

  it('updates probability when no bets exist', async () => {
    const client = createClientWithBetCount(0);
    const result = await updateOutcomeProbability(client as any, 'outcome-1', 0.4);
    expect(result.success).toBe(true);
  });
});
