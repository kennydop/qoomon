'use client';

import * as React from 'react';
import { DollarSign, FileText } from 'lucide-react';
import { ImSpinner2 } from 'react-icons/im';

import { formatBalance } from '@/lib/services/wallet';
import type { WalletMode } from '@/types/wallet';

type BetConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  outcomeId: string;
  outcomeLabel: string;
  stake: number;
  odds: number;
  potentialPayout: number;
  mode: WalletMode;
  onSuccess: () => void;
};

export default function BetConfirmationModal({
  isOpen,
  onClose,
  outcomeId,
  outcomeLabel,
  stake,
  odds,
  potentialPayout,
  mode,
  onSuccess,
}: BetConfirmationModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const ModeIcon = mode === 'paper' ? FileText : DollarSign;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomeId, stake, mode }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to place bet.');
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to place bet.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Confirm bet</p>
          <p className="text-lg font-semibold text-slate-900">{outcomeLabel}</p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ModeIcon className="h-4 w-4" />
            <span className="capitalize">{mode} wallet</span>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Stake</span>
            <span className="font-semibold text-slate-900">{formatBalance(stake)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Odds</span>
            <span className="font-semibold text-slate-900">{odds.toFixed(2)}x</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Potential payout</span>
            <span className="font-semibold text-slate-900">
              {formatBalance(potentialPayout)}
            </span>
          </div>
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-rose-500">{error}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center rounded-2xl bg-[var(--color-primary-500)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[var(--color-primary-500)/25] transition hover:bg-[var(--color-primary-600)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <ImSpinner2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
