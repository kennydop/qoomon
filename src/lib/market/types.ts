export interface LMSRParams {
  liquidityParameter: number;
  quantities: number[];
}

export interface BetCalculation {
  shares: number;
  entryPrice: number;
  potentialPayout: number;
  newQuantities: number[];
}

export interface CashoutCalculation {
  payout: number;
  exitPrice: number;
  priceChange: number;
}

export type PricingModel = 'lmsr' | 'parimutuel';

export interface MarketState {
  eventId: string;
  outcomes: Array<{
    id: string;
    label: string;
    shares: number;
  }>;
  liquidityParameter: number;
}

export interface PricingConfig {
  model: PricingModel;
  liquidityParameter: number;
}

export interface OutcomePrices {
  outcomeId: string;
  label: string;
  price: number;
  odds: number;
  shares: number;
}
