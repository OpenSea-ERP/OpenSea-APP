'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CalendarEventForm } from './calendar-event-form';
import { useUpdateCalendarEvent, useMyCalendars } from '@/hooks/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import type { CalendarEvent, EventType, EventVisibility } from '@/types/calendar';
import {
  Pencil,
  Save,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';

interface EventEditDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventEditDialog({
  event,
  open,
  onOpenChange,
}: EventEditDialogProps) {
  const updateEvent = useUpdateCalendarEvent();
  const { data: calendarsData } = useMyCalendars();
  const eventCalendar = calendarsData?.calendars?.find(
    (c) => c.id === event?.calendarId,
  );

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

  const accentColor = color || event?.color || EVENT_TYPE_COLORS[type] || '#3b82f6';

  useEffect(() => {
    if (event && open) {
      setTitle(event.title);
      setDescription(event.description ?? '');
      setLocation(event.location ?? '');
      setStartDate(formatDateTimeLocal(new Date(event.startDate)));
      setEndDate(formatDateTimeLocal(new Date(event.endDate)));
      setIsAllDay(event.isAllDay);
      setType(event.type);
      setVisibility(event.visibility);
      setColor(event.color ?? '');
      setRrule(event.rrule);
      setTimezone(event.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
      setShowDescription(!!event.description);
      setShowLocation(!!event.location);
      setShowTimezone(!!event.timezone);
      setShowRecurrence(!!event.rrule);
      setTzOpen(false);
      setTypeOpen(false);
      setColorOpen(false);
    }
  }, [event, open]);

  async function handleSubmit() {
    if (!event || !title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('A data de fim deve ser posterior à data de início');
      return;
    }

    try {
      await updateEvent.mutateAsync({
        id: event.id,
        data: {
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
        },
      });

      toast.success('Evento atualizado com sucesso');
      onOpenChange(false);
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  const calendarSlot = (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center gap-1.5 h-9 rounded-md border border-border/60 text-xs text-muted-foreground cursor-default">
            {eventCalendar ? (
              <>
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: eventCalendar.color ?? '#64748b' }}
                />
                <span className="hidden sm:inline truncate max-w-[60px]">
                  {eventCalendar.name}
                </span>
              </>
            ) : (
              <>
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Calendário</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">Calendário: {eventCalendar?.name ?? '—'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogTitle className="sr-only">Editar Evento</DialogTitle>

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
              <Pencil className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold">Editar Evento</h2>
              {eventCalendar && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: eventCalendar.color ?? accentColor }}
                  />
                  {eventCalendar.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <CalendarEventForm
          idPrefix="edit"
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
            disabled={!title.trim() || updateEvent.isPending}
          >
            {updateEvent.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            Salvar Alterações
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
