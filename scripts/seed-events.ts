import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';

import { SUPABASE_URL } from '@/constant/supabase';
import { SUPABASE_SERVICE_ROLE_KEY } from '@/constant/supabase-server';
import type { Database } from '@/lib/supabase/types';

type SeedOutcome = {
  label: string;
  initial_probability?: number;
};

type SeedEvent = {
  category: string;
  title: string;
  description?: string;
  pricing_model?: 'lmsr' | 'parimutuel';
  liquidity_parameter?: number;
  close_time: string;
  outcomes: SeedOutcome[];
};

const loadTemplates = (): SeedEvent[] => {
  const templatePath = path.join(process.cwd(), 'scripts', 'templates', 'events.json');
  const file = fs.readFileSync(templatePath, 'utf-8');
  return JSON.parse(file) as SeedEvent[];
};

const createSupabaseClient = () => {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const parseArgs = () => ({
  clear: process.argv.includes('--clear'),
});

const normalizeOutcomes = (outcomes: SeedOutcome[]): SeedOutcome[] => {
  const total = outcomes.reduce(
    (sum, outcome) => sum + (outcome.initial_probability ?? 0),
    0
  );

  if (!total) {
    const equalProb = 1 / outcomes.length;
    return outcomes.map((outcome) => ({
      ...outcome,
      initial_probability: Number(equalProb.toFixed(4)),
    }));
  }

  return outcomes.map((outcome) => ({
    ...outcome,
    initial_probability: Number(
      (((outcome.initial_probability ?? 0) / total) || 0).toFixed(4)
    ),
  }));
};

const createEvent = async (supabase: ReturnType<typeof createSupabaseClient>, data: SeedEvent) => {
  const { data: inserted, error } = await supabase
    .from('events')
    .insert({
      title: data.title,
      description: data.description,
      category: data.category,
      pricing_model: data.pricing_model ?? 'lmsr',
      liquidity_parameter: data.liquidity_parameter ?? 100,
      close_time: data.close_time,
      status: 'open',
    })
    .select('id')
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to create event ${data.title}: ${error?.message}`);
  }

  return inserted.id as string;
};

const addOutcome = async (
  supabase: ReturnType<typeof createSupabaseClient>,
  eventId: string,
  outcome: SeedOutcome
) => {
  const { error } = await supabase.from('outcomes').insert({
    event_id: eventId,
    label: outcome.label,
    initial_probability: outcome.initial_probability ?? 0.5,
  });

  if (error) {
    throw new Error(`Failed to add outcome ${outcome.label}: ${error.message}`);
  }
};

const seedSampleEvents = async (supabase: ReturnType<typeof createSupabaseClient>) => {
  const templates = loadTemplates();

  for (const template of templates) {
    const normalizedOutcomes = normalizeOutcomes(template.outcomes);
    const eventId = await createEvent(supabase, template);

    for (const outcome of normalizedOutcomes) {
      await addOutcome(supabase, eventId, outcome);
    }

    // eslint-disable-next-line no-console
    console.log(`Seeded event: ${template.title}`);
  }
};

const clearExistingEvents = async (supabase: ReturnType<typeof createSupabaseClient>) => {
  await supabase.from('bets').delete().neq('id', '');
  await supabase.from('ledger_entries').delete().neq('id', '');
  await supabase.from('events').delete().neq('id', '');
  // eslint-disable-next-line no-console
  console.log('Cleared existing events, bets, and ledger entries');
};

const main = async () => {
  const supabase = createSupabaseClient();
  const { clear } = parseArgs();

  if (clear) {
    await clearExistingEvents(supabase);
  }

  await seedSampleEvents(supabase);
};

main()
  // eslint-disable-next-line no-console
  .then(() => console.log('Seed completed'))
  // eslint-disable-next-line no-console
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
