import { Skeleton } from '@/components/ui/skeleton';

export default function StockMovementsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
