'use client';

import { Badge } from '@/components/ui/badge';
import type { CalendarType } from '@/types/calendar';
import { CalendarDays, Users, Settings } from 'lucide-react';

const CALENDAR_TYPE_LABELS: Record<CalendarType, string> = {
  PERSONAL: 'Pessoal',
  TEAM: 'Time',
  SYSTEM: 'Sistema',
};

const CALENDAR_TYPE_ICONS: Record<CalendarType, React.ReactNode> = {
  PERSONAL: <CalendarDays className="w-3 h-3" />,
  TEAM: <Users className="w-3 h-3" />,
  SYSTEM: <Settings className="w-3 h-3" />,
};

interface CalendarBadgeProps {
  name: string;
  type: CalendarType;
  color?: string | null;
  className?: string;
}

export function CalendarBadge({ name, type, color, className }: CalendarBadgeProps) {
  const bgColor = color ?? '#64748b';
  const icon = CALENDAR_TYPE_ICONS[type];
  const typeLabel = CALENDAR_TYPE_LABELS[type];

  return (
    <Badge
      className={className}
      style={{
        backgroundColor: `${bgColor}20`,
        color: bgColor,
        borderColor: `${bgColor}40`,
      }}
      variant="outline"
    >
      {icon}
      <span className="ml-1">{name}</span>
      <span className="ml-1 opacity-60">({typeLabel})</span>
    </Badge>
  );
}
