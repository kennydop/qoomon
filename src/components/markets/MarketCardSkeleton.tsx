import Skeleton from '@/components/Skeleton';

export default function MarketCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <Skeleton className="h-40 w-full" />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4 rounded-full" />
          <Skeleton className="h-4 w-1/2 rounded-full" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-9 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
