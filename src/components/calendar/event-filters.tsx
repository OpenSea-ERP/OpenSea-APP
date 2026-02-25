'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { EventTypeLabels } from '@/types/common/enums';
import type { EventType } from '@/types/calendar';
import { Filter, Search } from 'lucide-react';

interface EventFiltersProps {
  selectedType: EventType | undefined;
  onTypeChange: (type: EventType | undefined) => void;
  includeSystemEvents: boolean;
  onSystemEventsChange: (include: boolean) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
}

const EVENT_TYPES = Object.entries(EventTypeLabels) as [EventType, string][];

export function EventFilters({
  selectedType,
  onTypeChange,
  includeSystemEvents,
  onSystemEventsChange,
  search,
  onSearchChange,
}: EventFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap bg-muted/30 dark:bg-white/5 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Filter className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Filtros</span>
      </div>

      <div className="w-px h-4 bg-border" />

      {onSearchChange && (
        <>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar eventos..."
              className="h-8 w-[180px] pl-7 text-xs"
            />
          </div>
          <div className="w-px h-4 bg-border" />
        </>
      )}

      <Select
        value={selectedType ?? 'ALL'}
        onValueChange={(val) => onTypeChange(val === 'ALL' ? undefined : (val as EventType))}
      >
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue placeholder="Tipo de evento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos os tipos</SelectItem>
          {EVENT_TYPES.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-2">
        <Switch
          id="system-events"
          checked={includeSystemEvents}
          onCheckedChange={onSystemEventsChange}
          className="scale-90"
        />
        <Label htmlFor="system-events" className="text-xs whitespace-nowrap text-muted-foreground cursor-pointer">
          Eventos do sistema
        </Label>
      </div>
    </div>
  );
}
