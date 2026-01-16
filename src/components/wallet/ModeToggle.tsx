'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import type { WalletMode } from '@/types/wallet';

import { DollarSign, FileText } from 'lucide-react';

const toggleOptions: {
  id: WalletMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'paper', label: 'Paper', icon: FileText },
  { id: 'live', label: 'Live', icon: DollarSign },
];

type ModeToggleProps = {
  currentMode: WalletMode;
  onChange: (mode: WalletMode) => void;
};

export default function ModeToggle({ currentMode, onChange }: ModeToggleProps) {
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem('walletMode') as WalletMode | null;
    if (stored && stored !== currentMode) {
      onChange(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = (mode: WalletMode) => {
    if (mode === currentMode) {
      return;
    }
    onChange(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('walletMode', mode);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[380px] rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
      <div className="grid grid-cols-2 gap-1">
        {toggleOptions.map(({ id, label, icon: Icon }) => {
          const isActive = currentMode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200',
                isActive
                  ? 'bg-[var(--color-primary-600)] text-white shadow-lg shadow-[var(--color-primary-600)/40]'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
