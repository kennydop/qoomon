import { getSettlementSummary, settleEvent, validateSettlement } from '@/lib/admin/settlement';

const createClient = ({
  eventStatus = 'closed',
  winningOutcomeId = null,
  outcomeEventMatch = true,
  rpcValue = 5,
  bets = [],
}: {
  eventStatus?: 'open' | 'closed' | 'settled';
  winningOutcomeId?: string | null;
  outcomeEventMatch?: boolean;
  rpcValue?: number;
  bets?: Array<{ outcome_id: string; status: string; stake: string; payout_amount?: string | null }>;
} = {}) => {
  const singleEvent = jest.fn().mockResolvedValue({
    data: { id: 'event-1', status: eventStatus, winning_outcome_id: winningOutcomeId },
    error: null,
  });
  const selectEvent = jest.fn(() => ({ eq: jest.fn(() => ({ single: singleEvent })) }));

  const singleOutcome = jest.fn().mockResolvedValue({
    data: { id: 'outcome-1', event_id: outcomeEventMatch ? 'event-1' : 'other' },
    error: null,
  });
  const selectOutcome = jest.fn((columns?: string) => {
    if (columns?.includes('id,label')) {
      return { eq: jest.fn(async () => ({ data: [{ id: 'outcome-1', label: 'Yes' }], error: null })) };
    }
    return { eq: jest.fn(() => ({ single: singleOutcome })) };
  });

  const selectBets = jest.fn(() => ({ in: jest.fn(async () => ({ data: bets, error: null })) }));
  const selectOutcomes = selectOutcome;

  const from = jest.fn((table: string) => {
    if (table === 'events') return { select: selectEvent };
    if (table === 'outcomes') return { select: selectOutcomes };
    if (table === 'bets') return { select: selectBets };
    return {} as any;
  });

  const rpc = jest.fn().mockResolvedValue({ data: rpcValue, error: null });

  return { from, rpc };
};

describe('admin settlement', () => {
  it('rejects settlement for open events', async () => {
    const client = createClient({ eventStatus: 'open' });
    const result = await validateSettlement(client as any, 'event-1', 'outcome-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('event_open');
    }
  });

  it('rejects mismatched outcome', async () => {
    const client = createClient({ outcomeEventMatch: false });
    const result = await validateSettlement(client as any, 'event-1', 'outcome-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('mismatched_outcome');
    }
  });

  it('settles successfully for closed event', async () => {
    const client = createClient();
    const result = await settleEvent(client as any, 'event-1', 'outcome-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.settled).toBe(5);
    }
  });

  it('summarizes settlement data', async () => {
    const client = createClient({
      bets: [
        { outcome_id: 'outcome-1', status: 'won', stake: '10', payout_amount: '20' },
        { outcome_id: 'outcome-1', status: 'lost', stake: '5', payout_amount: null },
      ],
    });
    const summary = await getSettlementSummary(client as any, 'event-1');
    expect(summary.success).toBe(true);
    if (summary.success) {
      expect(summary.data.outcomes[0].total_staked).toBe(15);
      expect(summary.data.outcomes[0].total_payout).toBe(20);
    }
  });
});
