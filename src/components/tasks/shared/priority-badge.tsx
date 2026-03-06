'use client';

import { cn } from '@/lib/utils';
import { PRIORITY_CONFIG, type CardPriority } from '@/types/tasks';

interface PriorityBadgeProps {
  priority: CardPriority;
  showLabel?: boolean;
  className?: string;
}

export function PriorityBadge({
  priority,
  showLabel = false,
  className,
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('h-2 w-2 rounded-full shrink-0', config.dotColor)} />
      {showLabel && (
        <span className={cn('text-xs font-medium', config.color)}>
          {config.label}
        </span>
      )}
    </span>
  );
}
