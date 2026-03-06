'use client';

import { Badge } from '@/components/ui/badge';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import { EventTypeLabels } from '@/types/common/enums';
import type { EventType } from '@/types/calendar';
import {
  Users,
  CheckSquare,
  Bell,
  Clock,
  PartyPopper,
  Cake,
  Palmtree,
  UserX,
  DollarSign,
  ShoppingCart,
  Tag,
} from 'lucide-react';

export const EVENT_TYPE_ICONS: Record<EventType, React.ReactNode> = {
  MEETING: <Users className="w-3 h-3" />,
  TASK: <CheckSquare className="w-3 h-3" />,
  REMINDER: <Bell className="w-3 h-3" />,
  DEADLINE: <Clock className="w-3 h-3" />,
  HOLIDAY: <PartyPopper className="w-3 h-3" />,
  BIRTHDAY: <Cake className="w-3 h-3" />,
  VACATION: <Palmtree className="w-3 h-3" />,
  ABSENCE: <UserX className="w-3 h-3" />,
  FINANCE_DUE: <DollarSign className="w-3 h-3" />,
  PURCHASE_ORDER: <ShoppingCart className="w-3 h-3" />,
  CUSTOM: <Tag className="w-3 h-3" />,
};

interface EventTypeBadgeProps {
  type: EventType;
  className?: string;
}

export function EventTypeBadge({ type, className }: EventTypeBadgeProps) {
  const color = EVENT_TYPE_COLORS[type] ?? '#64748b';
  const label = EventTypeLabels[type] ?? type;
  const icon = EVENT_TYPE_ICONS[type];

  return (
    <Badge
      className={className}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}40`,
      }}
      variant="outline"
    >
      {icon}
      <span className="ml-1">{label}</span>
    </Badge>
  );
}
