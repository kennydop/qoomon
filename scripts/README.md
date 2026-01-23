# Admin CLI

Admin CLI for creating, updating, closing, and settling events using the Supabase service role. Commands are built on the reusable admin library modules under `src/lib/admin`.

## Setup

- Ensure environment variables are available when running the CLI:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Install dependencies: `pnpm install`
- Run commands with `pnpm tsx scripts/admin-events.ts <command>` or use package scripts (`pnpm admin:list`, etc.).

## Commands

- `create-event`  
  Example:  
  `tsx scripts/admin-events.ts create-event --title "Event Title" --category politics --pricing lmsr --liquidity 100 --close-time "2026-12-31T23:59:00Z" --outcomes "Yes:0.5,No:0.5"`

- `add-outcome`  
  `tsx scripts/admin-events.ts add-outcome --event-id <uuid> --label "New Option" --probability 0.25`

- `set-odds`  
  `tsx scripts/admin-events.ts set-odds --event-id <uuid> --odds "Option A:0.6,Option B:0.4"`

- `close-event`  
  `tsx scripts/admin-events.ts close-event --event-id <uuid>`

- `settle-event`  
  `tsx scripts/admin-events.ts settle-event --event-id <uuid> --winning-outcome <uuid|label>`

- `list-events`  
  `tsx scripts/admin-events.ts list-events --status open --category politics`

- `event-details`  
  `tsx scripts/admin-events.ts event-details --event-id <uuid>`

- `update-event`  
  `tsx scripts/admin-events.ts update-event --event-id <uuid> --title "New title" --close-time "2026-07-01T12:00:00Z"`

## Workflows

- **Create a new event**: Use `create-event` with outcomes. Verify with `list-events`.
- **Bulk seed**: Keep using `seed:events` with templates in `scripts/templates/events.json`.
- **Adjust odds before market opens**: Run `set-odds` with normalized probabilities (sum to 1.0).
- **Close and settle**: `close-event` then `settle-event` to pay out winners.

## Troubleshooting

- Validation failures include field details; ensure close times are in the future and titles are 3-200 chars.
- RLS errors: confirm you are using the service role key and environment variables are loaded.
- Probability updates are blocked once bets exist for an outcome.

## Security

- The CLI uses the Supabase service role key; keep it outside client bundles and share only with trusted operators.
- Avoid running commands on untrusted machines or storing the service role key in shell history.
