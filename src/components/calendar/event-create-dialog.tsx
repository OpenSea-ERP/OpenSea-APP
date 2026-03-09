'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CalendarEventForm } from './calendar-event-form';
import { EVENT_TYPE_ICONS } from './event-type-badge';
import { useCreateCalendarEvent } from '@/hooks/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import type { EventType, EventVisibility, Calendar } from '@/types/calendar';
import {
  CalendarPlus,
  CalendarDays,
  Check,
  Loader2,
  Users,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { translateError } from '@/lib/errors';

interface EventCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  calendars?: Calendar[];
  defaultCalendarId?: string;
}

const CALENDAR_TYPE_ICONS = {
  PERSONAL: CalendarDays,
  TEAM: Users,
  SYSTEM: Settings,
} as const;

export function EventCreateDialog({
  open,
  onOpenChange,
  defaultDate,
  calendars = [],
  defaultCalendarId = '',
}: EventCreateDialogProps) {
  const createEvent = useCreateCalendarEvent();

  const [calendarId, setCalendarId] = useState(defaultCalendarId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [type, setType] = useState<EventType>('CUSTOM');
  const [visibility, setVisibility] = useState<EventVisibility>('PUBLIC');
  const [color, setColor] = useState('');
  const [rrule, setRrule] = useState<string | null>(null);

  const [timezone, setTimezone] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showTimezone, setShowTimezone] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [tzOpen, setTzOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const accentColor = color || EVENT_TYPE_COLORS[type] || '#3b82f6';
  const creatableCalendars = calendars.filter((c) => c.access.canCreate);
  const selectedCalendar = creatableCalendars.find((c) => c.id === calendarId);

  useEffect(() => {
    if (open) {
      const now = new Date();
      const start = defaultDate ? new Date(defaultDate) : now;
      if (defaultDate) {
        start.setHours(now.getHours(), now.getMinutes(), 0, 0);
      }
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      setCalendarId(defaultCalendarId);
      setTitle('');
      setDescription('');
      setLocation('');
      setStartDate(formatDateTimeLocal(start));
      setEndDate(formatDateTimeLocal(end));
      setIsAllDay(false);
      setType('CUSTOM');
      setVisibility('PUBLIC');
      setColor('');
      setRrule(null);
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      setShowDescription(false);
      setShowLocation(false);
      setShowTimezone(false);
      setShowRecurrence(false);
      setTzOpen(false);
      setTypeOpen(false);
      setColorOpen(false);
      setCalOpen(false);
    }
  }, [open, defaultDate, defaultCalendarId]);

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('A data de fim deve ser posterior à data de início');
      return;
    }

    try {
      await createEvent.mutateAsync({
        calendarId: calendarId || undefined,
        title: title.trim(),
        description: description || null,
        location: location || null,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isAllDay,
        type,
        visibility,
        color: color || null,
        rrule,
        timezone: showTimezone ? timezone : null,
      });

      toast.success('Evento criado com sucesso');
      onOpenChange(false);
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  const calendarSlot = creatableCalendars.length > 1 ? (
    <Popover open={calOpen} onOpenChange={setCalOpen}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 h-9 rounded-md border border-border/60 hover:bg-accent/50 transition-colors text-xs"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedCalendar?.color ?? '#64748b' }}
                />
                <span className="hidden sm:inline truncate max-w-[60px]">
                  {selectedCalendar?.name ?? 'Calendário'}
                </span>
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Calendário: {selectedCalendar?.name ?? '—'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-[220px] p-1" align="end" sideOffset={4}>
        {creatableCalendars.map((cal) => {
          const Icon = CALENDAR_TYPE_ICONS[cal.type];
          return (
            <button
              key={cal.id}
              type="button"
              onClick={() => {
                setCalendarId(cal.id);
                setCalOpen(false);
              }}
              className={cn(
                'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm transition-colors',
                calendarId === cal.id
                  ? 'bg-accent font-medium'
                  : 'hover:bg-accent/50',
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: (cal.type === 'TEAM' ? cal.ownerColor : null) ?? cal.color ?? '#64748b' }}
              />
              <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{cal.name}</span>
              {calendarId === cal.id && (
                <Check className="w-3.5 h-3.5 ml-auto text-foreground shrink-0" />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  ) : (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center gap-1.5 h-9 rounded-md border border-border/60 text-xs text-muted-foreground cursor-default">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="hidden sm:inline truncate max-w-[60px]">
              {selectedCalendar?.name ?? 'Pessoal'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">Calendário: {selectedCalendar?.name ?? 'Pessoal'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogTitle className="sr-only">Novo Evento</DialogTitle>

        {/* Header with color bar */}
        <div className="relative px-5 pt-7 pb-4">
          <div
            className="absolute top-0 left-0 w-full h-1.5 rounded-t-lg"
            style={{ backgroundColor: accentColor }}
          />
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: `${accentColor}18` }}
            >
              <CalendarPlus className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold">Novo Evento</h2>
              <p className="text-xs text-muted-foreground">Preencha os dados do evento</p>
            </div>
          </div>
        </div>

        <CalendarEventForm
          idPrefix="create"
          accentColor={accentColor}
          state={{
            title, description, location, startDate, endDate, isAllDay,
            type, visibility, color, rrule, timezone,
            showDescription, showLocation, showTimezone, showRecurrence,
          }}
          actions={{
            setTitle, setDescription, setLocation, setStartDate, setEndDate, setIsAllDay,
            setType, setVisibility, setColor, setRrule, setTimezone,
            setShowDescription, setShowLocation, setShowTimezone, setShowRecurrence,
          }}
          popovers={{ tzOpen, setTzOpen, typeOpen, setTypeOpen, colorOpen, setColorOpen }}
          calendarSlot={calendarSlot}
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="h-9 px-5 text-white"
            style={{ backgroundColor: accentColor }}
            onClick={handleSubmit}
            disabled={!title.trim() || createEvent.isPending}
          >
            {createEvent.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <CalendarPlus className="w-4 h-4 mr-1.5" />
            )}
            Criar Evento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
