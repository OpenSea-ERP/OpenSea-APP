'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { EventTypeLabels } from '@/types/common/enums';
import type { EventType } from '@/types/calendar';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_ICONS } from './event-type-badge';
import { EventSearchCombobox } from './event-search-combobox';

interface EventFiltersProps {
  selectedType: EventType | undefined;
  onTypeChange: (type: EventType | undefined) => void;
  includeSystemEvents: boolean;
  onSystemEventsChange: (include: boolean) => void;
  onEventSelect?: (event: CalendarEvent) => void;
}

const EVENT_TYPES = Object.entries(EventTypeLabels) as [EventType, string][];

export function EventFilters({
  selectedType,
  onTypeChange,
  includeSystemEvents,
  onSystemEventsChange,
  onEventSelect,
}: EventFiltersProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      {onEventSelect && (
        <EventSearchCombobox onEventSelect={onEventSelect} />
      )}

      <Select
        value={selectedType ?? 'ALL'}
        onValueChange={(val) => onTypeChange(val === 'ALL' ? undefined : (val as EventType))}
      >
        <SelectTrigger className="w-[170px] h-9 text-sm bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <SelectValue placeholder="Tipo de evento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos os tipos</SelectItem>
          {EVENT_TYPES.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              <span className="flex items-center gap-1.5">
                {EVENT_TYPE_ICONS[value]}
                {label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 ml-auto">
        <Switch
          id="system-events"
          checked={includeSystemEvents}
          onCheckedChange={onSystemEventsChange}
        />
        <Label htmlFor="system-events" className="text-sm whitespace-nowrap text-muted-foreground cursor-pointer">
          Eventos do sistema
        </Label>
      </div>
    </div>
  );
}
