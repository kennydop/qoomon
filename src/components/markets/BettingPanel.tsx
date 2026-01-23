'use client';

import * as React from 'react';

import BetConfirmationModal from '@/components/markets/BetConfirmationModal';
import { MIN_STAKE } from '@/lib/market/constants';
import { calculateShares } from '@/lib/market/lmsr';
import { fetchMarketState, getEventPricingConfig } from '@/lib/market/state';
import { formatBalance, getStoredWalletMode } from '@/lib/services/wallet';
import supabase from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { WalletMode } from '@/types/wallet';

type BettingPanelProps = {
  outcomeId: string;
  outcomeLabel: string;
  currentOdds: number;
  eventId: string;
  onBetPlaced: () => void;
};

const parseStake = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function BettingPanel({
  outcomeId,
  outcomeLabel,
  currentOdds,
  eventId,
  onBetPlaced,
}: BettingPanelProps) {
  const { user, userProfile, refreshBalance } = useAuth();
  const [walletMode, setWalletMode] = React.useState<WalletMode>('paper');
  const [stakeInput, setStakeInput] = React.useState('');
  const [debouncedStake, setDebouncedStake] = React.useState(0);
  const [quote, setQuote] = React.useState<{ shares: number; potentialPayout: number } | null>(
    null
  );
  const [quoteLoading, setQuoteLoading] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    setWalletMode(getStoredWalletMode());
  }, []);

  const stakeValue = parseStake(stakeInput);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedStake(stakeValue);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [stakeValue]);

  React.useEffect(() => {
    let isActive = true;

    const fetchQuote = async () => {
      if (!eventId || !outcomeId || debouncedStake < MIN_STAKE) {
        setQuote(null);
        return;
      }

      setQuoteLoading(true);
      try {
        const pricingConfig = await getEventPricingConfig(eventId, supabase);
        const marketState = await fetchMarketState(eventId, supabase);
        const quantities = marketState.outcomes.map((entry) => entry.shares);
        const outcomeIndex = marketState.outcomes.findIndex(
          (entry) => entry.id === outcomeId
        );

        if (outcomeIndex === -1) {
          throw new Error('Outcome not found in market state.');
        }

        const shares = calculateShares(
          quantities,
          outcomeIndex,
          debouncedStake,
          pricingConfig.liquidityParameter
        );
        const potentialPayout = shares;

        if (isActive) {
          setQuote({ shares, potentialPayout });
        }
      } catch (error) {
        if (isActive) {
          setQuote(null);
        }
      } finally {
        if (isActive) {
          setQuoteLoading(false);
        }
      }
    };

    void fetchQuote();

    return () => {
      isActive = false;
    };
  }, [debouncedStake, eventId, outcomeId]);

  const balance =
    walletMode === 'paper'
      ? Number(userProfile?.paper_balance ?? 0)
      : Number(userProfile?.live_balance ?? 0);

  const insufficientBalance = stakeValue > balance;
  const isStakeValid = stakeValue >= MIN_STAKE && !insufficientBalance;
  const potentialPayout = quote?.potentialPayout ?? 0;

  const handleSuccess = React.useCallback(async () => {
    await refreshBalance();
    onBetPlaced();
    setIsModalOpen(false);
    setStakeInput('');
  }, [onBetPlaced, refreshBalance]);

  return (
    <div
      className="rounded-3xl border border-white/20 bg-white shadow-2xl p-5 md:p-6 sticky top-4"
      data-event-id={eventId}
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Betting slip</p>
        <p className="text-lg font-semibold text-slate-900">{outcomeLabel}</p>
        <p className="text-sm text-slate-500">Current odds: {currentOdds.toFixed(2)}x</p>
      </div>

      <div className="mt-6 space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Wallet mode</span>
          <span className="font-semibold capitalize text-slate-900">{walletMode}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Available balance</span>
          <span className="font-semibold text-slate-900">{formatBalance(balance)}</span>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Stake amount
        </label>
        <input
          type="number"
          min={MIN_STAKE}
          step="0.01"
          value={stakeInput}
          onChange={(event) => setStakeInput(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[var(--color-primary-500)] focus:outline-none"
          placeholder={`Min ${MIN_STAKE}`}
        />
        {insufficientBalance && (
          <p className="text-xs font-semibold text-rose-500">Insufficient balance.</p>
        )}
      </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>Potential payout</span>
          <span className="font-semibold text-slate-900">
            {quoteLoading ? 'Calculating...' : formatBalance(potentialPayout)}
          </span>
        </div>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={!user || !isStakeValid}
        className={cn(
          'mt-6 flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-white shadow-xl transition-all duration-300',
          'bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-500)] hover:from-[var(--color-primary-700)] hover:to-[var(--color-primary-600)] active:scale-95',
          (!user || !isStakeValid) && 'cursor-not-allowed opacity-50 hover:from-[var(--color-primary-600)] hover:to-[var(--color-primary-500)]'
        )}
      >
        {!user ? 'Sign in to bet' : 'Place Bet'}
      </button>

      <BetConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        outcomeId={outcomeId}
        outcomeLabel={outcomeLabel}
        stake={stakeValue}
        odds={currentOdds}
        potentialPayout={potentialPayout}
        mode={walletMode}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
