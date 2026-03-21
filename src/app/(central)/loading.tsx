import { Skeleton } from '@/components/ui/skeleton';

export default function CentralLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton
          className="h-8 w-56"
          style={{ backgroundColor: 'var(--central-card-bg)' }}
        />
        <Skeleton
          className="h-9 w-32"
          style={{ backgroundColor: 'var(--central-card-bg)' }}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-28 rounded-xl"
            style={{ backgroundColor: 'var(--central-card-bg)' }}
          />
        ))}
      </div>
      <Skeleton
        className="h-80 rounded-xl"
        style={{ backgroundColor: 'var(--central-card-bg)' }}
      />
    </div>
  );
}
