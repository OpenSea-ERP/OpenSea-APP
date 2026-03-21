'use client';

interface InventoryProgressBarProps {
  scanned: number;
  total: number;
}

export function InventoryProgressBar({
  scanned,
  total,
}: InventoryProgressBarProps) {
  const percentage = total > 0 ? Math.min((scanned / total) * 100, 100) : 0;

  return (
    <div className="h-[3px] w-full bg-slate-800">
      <div
        className="h-full transition-all duration-500 ease-out"
        style={{
          width: `${percentage}%`,
          background:
            percentage === 100
              ? '#22c55e'
              : `linear-gradient(90deg, #22c55e ${Math.max(0, 100 - percentage)}%, #4ade80 100%)`,
        }}
      />
    </div>
  );
}
