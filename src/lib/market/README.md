# LMSR Market Module

## LMSR Overview
The Logarithmic Market Scoring Rule (LMSR) is an automated market maker that
always provides liquidity and produces prices that behave like probabilities.
Unlike order books, LMSR does not require matching buyers and sellers. Instead,
prices are derived from a cost function that responds smoothly to trades.

## Liquidity Parameter (b)
The liquidity parameter `b` controls market depth:
- Higher `b` means more liquidity and slower price movements.
- Lower `b` makes prices move faster with each trade.

As a rule of thumb, `b` approximates the market maker's maximum loss tolerance.
In this project, the default `b = 100` means it typically takes around 100 GHS
to move a 50/50 market to roughly 0.73.

## Seed Quantities
Starting with `q_i = 0` for all outcomes yields equal initial prices of `1/n`
for `n` outcomes. Non-zero seeds bias starting prices and can be used to reflect
known probabilities.

## Usage Examples

### Create a new market
```typescript
import { DEFAULT_LIQUIDITY_PARAMETER, SEED_SHARES } from '@/lib/market';

const liquidityParameter = DEFAULT_LIQUIDITY_PARAMETER;
const initialQuantities = [SEED_SHARES, SEED_SHARES];
```

### Calculate shares for a bet
```typescript
import { calculateShares } from '@/lib/market';

const shares = calculateShares([0, 0], 0, 10, 100);
```

### Get current prices
```typescript
import { calculateAllPrices } from '@/lib/market';

const prices = await calculateAllPrices(eventId, supabase);
```

### Perform cash-out
```typescript
import { cashOutBet } from '@/lib/market/cashout';

const result = await cashOutBet(betId, supabase);
```

### Settle a market
```typescript
const { data, error } = await supabase.rpc('settle_event', {
  p_event_id: eventId,
  p_winning_outcome_id: winningOutcomeId,
});
```

## Mathematical References
- Robin Hanson (2003), "Combinatorial Information Market Design"
  https://mason.gmu.edu/~rhanson/mktscore.pdf
- Hanson (2007), "Logarithmic Market Scoring Rules for Modular Combinatorial
  Information Aggregation"
  https://mason.gmu.edu/~rhanson/logmktscore.pdf

## Integration Guide
Use the market module with Supabase by:
1. Fetching market state (`fetchMarketState`).
2. Calculating shares/prices (`calculateShares`, `calculateAllPrices`).
3. Updating outcome shares (`updateOutcomeShares`).
4. Recording bets and ledger entries with `bets` and `ledger_entries`.
5. Updating balances via `update_user_balance` RPC to keep balances accurate.

Wrap the steps in transactions at the database layer where possible to keep
updates atomic.
