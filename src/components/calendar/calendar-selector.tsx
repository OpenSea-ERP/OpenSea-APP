'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Calendar } from '@/types/calendar';
import { CalendarDays, ChevronDown, Users, Settings } from 'lucide-react';

interface CalendarSelectorProps {
  calendars: Calendar[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

interface CalendarGroup {
  label: string;
  color?: string | null;
  icon: typeof CalendarDays;
  calendars: Calendar[];
}

export function CalendarSelector({
  calendars,
  selectedIds,
  onSelectionChange,
}: CalendarSelectorProps) {
  const selectedCount = selectedIds.length;
  const totalCount = calendars.length;

  function handleToggle(calendarId: string) {
    if (selectedIds.includes(calendarId)) {
      onSelectionChange(selectedIds.filter((id) => id !== calendarId));
    } else {
      onSelectionChange([...selectedIds, calendarId]);
    }
  }

  function handleSelectAll() {
    if (selectedCount === totalCount) {
      onSelectionChange([]);
    } else {
      onSelectionChange(calendars.map((c) => c.id));
    }
  }

  // Build groups: Pessoal, then each team by name, then Sistema
  const personal = calendars.filter((c) => c.type === 'PERSONAL');
  const team = calendars.filter((c) => c.type === 'TEAM');
  const system = calendars.filter((c) => c.type === 'SYSTEM');

  // Group team calendars by ownerId (team)
  const teamGroups = new Map<string, { name: string; color: string | null; calendars: Calendar[] }>();
  for (const cal of team) {
    const teamId = cal.ownerId ?? 'unknown';
    if (!teamGroups.has(teamId)) {
      teamGroups.set(teamId, {
        name: cal.ownerName ?? 'Equipe',
        color: cal.ownerColor ?? null,
        calendars: [],
      });
    }
    teamGroups.get(teamId)!.calendars.push(cal);
  }

  const groups: CalendarGroup[] = [];

  if (personal.length > 0) {
    groups.push({ label: 'Pessoal', icon: CalendarDays, calendars: personal });
  }

  for (const [, group] of teamGroups) {
    groups.push({
      label: group.name,
      color: group.color,
      icon: Users,
      calendars: group.calendars,
    });
  }

  if (system.length > 0) {
    groups.push({ label: 'Sistema', icon: Settings, calendars: system });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <CalendarDays className="h-4 w-4" />
          <span>
            Calendários ({selectedCount}/{totalCount})
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-medium">Calendários visíveis</span>
          <button
            onClick={handleSelectAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {selectedCount === totalCount ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        </div>
        <div className="mt-1 space-y-2">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.label}>
                <div className="flex items-center gap-1.5 px-2">
                  {group.color && (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                  )}
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {group.label}
                  </span>
                </div>
                <div className="mt-0.5 space-y-0.5">
                  {group.calendars.map((calendar) => {
                    const isSelected = selectedIds.includes(calendar.id);
                    // Team calendars use ownerColor (team color), others use their own
                    const dotColor =
                      calendar.type === 'TEAM'
                        ? calendar.ownerColor ?? calendar.color ?? '#64748b'
                        : calendar.color ?? '#64748b';
                    return (
                      <label
                        key={calendar.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(calendar.id)}
                        />
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{calendar.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
