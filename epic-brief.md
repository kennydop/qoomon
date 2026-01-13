## Summary

Build a web-based prediction market betting platform for Ghanaian users to bet on diverse events beyond sports—elections, weather, cultural contests, economic indicators, and more. The platform uses LMSR (Logarithmic Market Scoring Rule) market-making to provide dynamic, market-driven odds and guaranteed liquidity. Users can practice risk-free in "paper mode" with virtual funds before depositing real money via mobile money (MTN Momo, AirtelTigo, Telecel) to trade in "live mode." The platform abstracts complex prediction market mechanics behind a familiar sportsbook-style interface, making it accessible to existing sports bettors and the general public interested in current events.

## Context & Problem

### Who's Affected

**Primary Users:**

- **Existing sports bettors** in Ghana who use platforms like Sportybet and Betway but want to bet on non-sports events
- **General public** interested in Ghanaian current events (elections, weather, cultural outcomes) who want to participate in prediction markets

**Secondary Users:**

- Platform administrators who create and manage event markets

### Current Pain Points

1. **Geographic Exclusion**: Ghanaians cannot access international prediction market platforms (Kalshi, Polymarket) due to geographic restrictions and payment barriers
2. **Limited Event Diversity**: Existing Ghanaian betting platforms focus exclusively on sports, leaving no outlet for betting on elections, weather, cultural events, or economic outcomes
3. **No Information Aggregation Mechanism**: There's no platform that aggregates crowd wisdom on important local events through market-based pricing
4. **High Barrier to Entry**: Traditional prediction markets are complex and intimidating for users unfamiliar with market mechanics, creating friction for new users
5. **Payment Friction**: International platforms don't support local mobile money payment methods (MTN Momo, AirtelTigo, Telecel) that Ghanaians prefer

### Where in the Product

This is a **greenfield product**—building from scratch with an existing Next.js boilerplate. The platform will be web-only (mobile-first responsive design) with no native mobile apps in MVP scope.

## Goals

### Primary Goal

Enable Ghanaian users to participate in prediction markets on diverse local and global events through a familiar, accessible betting interface.

### Success Criteria

**MVP Success Metric**: Active traders who place at least one bet (paper or live mode)

**Key Outcomes:**

- Users can sign up with phone + password and verify via SMS OTP
- Users can practice betting in paper mode with virtual funds (1000 GHS initial grant)
- Users can deposit real money (mocked for MVP) and bet in live mode
- Markets display dynamic odds that update based on trading activity (LMSR)
- Users can cash out early by selling shares back to the market
- Admins can create diverse event markets via CLI script
- Markets settle automatically at close time (with admin fallback for manual resolution)

### Non-Goals (Explicitly Out of Scope for MVP)

- Social features (profiles, following, comments, sharing)
- Advanced trading features (limit orders, stop-loss, portfolio analytics)
- Real mobile money integration (using mocks/stubs for MVP)
- Native iOS/Android mobile apps
- Referral programs and rewards
- Multiple currency support (GHS only)
- Comprehensive admin dashboard and analytics
- Regulatory compliance research (deferred until post-MVP validation)

## Constraints

### Technical Constraints

- **Stack**: Next.js (TypeScript) + Supabase (Postgres, Auth, Storage) + Vercel hosting
- **SMS Provider**: Arkesel for OTP verification and admin notifications
- **Payment**: Mock/stub mobile money integration for MVP (no real payment processing)
- **Testing**: Manual testing only (no automated test suite for MVP)

### Business Constraints

- **Regulatory**: Gambling/betting regulations in Ghana not yet researched; will investigate after MVP validation
- **Payment Processing**: Real mobile money integration deferred to post-MVP
- **Admin Interface**: No web-based admin UI; admins use Node.js CLI script to create markets

### Design Constraints

- **Mobile-first**: Primary focus on mobile experience (desktop secondary)
- **Visual Style**: Dark green background with purple primary color, inspired by Ghanaian sportsbook aesthetics (Sportybet reference)
- **Simplicity**: Abstract complex prediction market mechanics behind familiar betting UX

## Key Assumptions

1. **User Familiarity**: Target users are already familiar with betting interfaces from sports betting platforms
2. **Mobile Money Adoption**: Users prefer mobile money (MTN Momo, AirtelTigo, Telecel) over card payments
3. **Paper Mode Value**: Offering risk-free practice mode will reduce friction and increase conversion to live betting
4. **LMSR Complexity**: Users don't need to understand LMSR mechanics; they just see dynamic odds like any sportsbook
5. **Admin Capacity**: Admins are technical enough to use CLI scripts for market creation
6. **Market Demand**: There's sufficient demand for betting on non-sports events in Ghana
7. **Regulatory Viability**: The platform can operate legally in Ghana (to be validated post-MVP)

## Why LMSR?

The platform uses LMSR (Logarithmic Market Scoring Rule) instead of simpler fixed-odds or parimutuel betting for three critical reasons:

1. **Dynamic Pricing**: Odds automatically adjust based on market sentiment and trading activity, creating a self-correcting price discovery mechanism
2. **Guaranteed Liquidity**: Users can always buy or sell shares at some price, even in thin markets—no waiting for counterparties
3. **Authentic Prediction Markets**: LMSR provides true prediction market mechanics that aggregate information efficiently, not just gambling odds

This positions the platform as a genuine prediction market (like Kalshi/Polymarket) rather than a traditional betting platform, while maintaining a familiar user experience.

## Why Paper Mode?

Paper mode serves three strategic purposes:

1. **Risk-Free Learning**: New users can learn how prediction markets work without financial risk
2. **Market Testing**: Users can test strategies and understand market dynamics before committing real money
3. **User Acquisition**: Lower barrier to entry—users can try the platform immediately without depositing, increasing signup conversion

Users receive 1000 GHS virtual funds on first access and can request refills if balance drops below 5 GHS.
