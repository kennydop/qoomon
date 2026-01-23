import { createEvent, updateEvent } from '@/lib/admin/events';
import type { Database } from '@/lib/supabase/types';

const createMockClient = () => {
  const single = jest.fn().mockResolvedValue({ data: { id: 'event-123', title: 'Valid title', status: 'open' }, error: null });
  const select = jest.fn(() => ({ single }));
  const eq = jest.fn(() => ({ select }));
  const insert = jest.fn(() => ({ select }));
  const update = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ insert, update }));

  return { from };
};

describe('admin events', () => {
  it('fails validation for too-short title', async () => {
    const client = createMockClient() as unknown as any;
    const result = await createEvent(client, {
      title: 'Hi',
      category: 'politics',
      pricing_model: 'lmsr',
      liquidity_parameter: 100,
      close_time: new Date(Date.now() + 1000).toISOString(),
      status: 'open',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('validation_error');
    }
  });

  it('creates event successfully with valid payload', async () => {
    const client = createMockClient() as unknown as Database;
    const result = await createEvent(client as any, {
      title: 'Valid Event Title',
      category: 'sports',
      pricing_model: 'lmsr',
      liquidity_parameter: 120,
      close_time: new Date(Date.now() + 10_000).toISOString(),
      status: 'open',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('event-123');
    }
  });

  it('rejects update when close time is in the past', async () => {
    const client = createMockClient() as unknown as Database;
    const result = await updateEvent(client as any, 'event-123', {
      close_time: new Date(Date.now() - 10_000).toISOString(),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('validation_error');
    }
  });
});
