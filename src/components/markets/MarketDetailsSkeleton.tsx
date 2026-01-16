import Skeleton from '@/components/Skeleton';

export default function MarketDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <Skeleton className="h-52 w-full rounded-3xl" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2 rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded-full" />
            <Skeleton className="h-4 w-2/3 rounded-full" />
            <div className="flex gap-3">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-52 w-full rounded-3xl" />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
