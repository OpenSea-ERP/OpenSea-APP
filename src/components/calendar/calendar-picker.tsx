'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Calendar } from '@/types/calendar';
import { CalendarDays, Users, Settings } from 'lucide-react';

interface CalendarPickerProps {
  calendars: Calendar[];
  value: string;
  onChange: (calendarId: string) => void;
}

export function CalendarPicker({ calendars, value, onChange }: CalendarPickerProps) {
  // Only show calendars where user can create events
  const creatableCalendars = calendars.filter((c) => c.access.canCreate);

  // If only one calendar available, don't render picker
  if (creatableCalendars.length <= 1) {
    return null;
  }

  // Group by type, with TEAM sub-grouped by team
  const personal = creatableCalendars.filter((c) => c.type === 'PERSONAL');
  const team = creatableCalendars.filter((c) => c.type === 'TEAM');
  const system = creatableCalendars.filter((c) => c.type === 'SYSTEM');

  // Group team calendars by ownerId
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

  function getDotColor(calendar: Calendar) {
    if (calendar.type === 'TEAM') {
      return calendar.ownerColor ?? calendar.color ?? '#64748b';
    }
    return calendar.color ?? '#64748b';
  }

  return (
    <div className="space-y-2">
      <Label>Calendário</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o calendário" />
        </SelectTrigger>
        <SelectContent>
          {personal.length > 0 && (
            <SelectGroup>
              <SelectLabel>Pessoal</SelectLabel>
              {personal.map((cal) => (
                <SelectItem key={cal.id} value={cal.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getDotColor(cal) }}
                    />
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{cal.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {[...teamGroups.entries()].map(([teamId, group]) => (
            <SelectGroup key={teamId}>
              <SelectLabel className="flex items-center gap-1.5">
                {group.color && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                )}
                {group.name}
              </SelectLabel>
              {group.calendars.map((cal) => (
                <SelectItem key={cal.id} value={cal.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getDotColor(cal) }}
                    />
                    <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{cal.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
          {system.length > 0 && (
            <SelectGroup>
              <SelectLabel>Sistema</SelectLabel>
              {system.map((cal) => (
                <SelectItem key={cal.id} value={cal.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getDotColor(cal) }}
                    />
                    <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{cal.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
