'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';

type MarketSearchProps = {
  onChange: (value: string) => void;
  className?: string;
};

export default function MarketSearch({ onChange, className }: MarketSearchProps) {
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      onChange(value.trim());
    }, 300);

    return () => window.clearTimeout(handle);
  }, [value, onChange]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[var(--color-primary-500)]',
        className
      )}
    >
      <Search className="h-4 w-4 text-slate-400" />
      <input
        type="search"
        aria-label="Search markets"
        placeholder="Search markets..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="flex-1 border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue('')}
          className="rounded-full p-1 text-slate-400 transition hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
