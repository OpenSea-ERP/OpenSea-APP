'use client';

import { cn } from '@/lib/utils';

interface LabelBadgeProps {
  name: string;
  color: string;
  className?: string;
}

export function LabelBadge({ name, color, className }: LabelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight',
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}
