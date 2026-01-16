import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  className?: string;
};

export default function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm',
        className
      )}
    >
      <div className="rounded-2xl bg-[var(--color-primary-50)] p-3 text-[var(--color-primary-600)]">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">Something went wrong</p>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-2xl bg-[var(--color-primary-500)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-[var(--color-primary-500)/25] transition hover:bg-[var(--color-primary-600)]"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
