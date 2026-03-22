import { Skeleton } from '@/components/ui/skeleton';

export default function AiLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="h-12 border-b border-border px-6 flex items-center">
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="px-6 pt-5">
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
