import { Skeleton } from '@/components/ui/skeleton';

export default function EmailLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <div className="w-64 space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-7 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      {/* Message list */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
