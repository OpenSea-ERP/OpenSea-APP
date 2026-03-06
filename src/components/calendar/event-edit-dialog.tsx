'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { RecurrencePicker } from './recurrence-picker';
import { EVENT_TYPE_ICONS } from './event-type-badge';
import { useUpdateCalendarEvent, useMyCalendars } from '@/hooks/calendar';
import { EventTypeLabels } from '@/types/common/enums';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import type { CalendarEvent, EventType, EventVisibility } from '@/types/calendar';
import {
  Pencil,
  Save,
  Clock,
  Repeat,
  MapPin,
  AlignLeft,
  Globe,
  ChevronsUpDown,
  Check,
  Eye,
  EyeOff,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { translateError } from '@/lib/errors';

interface EventEditDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_TYPES = Object.entries(EventTypeLabels) as [EventType, string][];

const COLOR_PRESETS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#f97316', label: 'Laranja' },
];

function getTimezoneOffset(tz: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === 'timeZoneName');
    if (!offsetPart) return '';
    const raw = offsetPart.value.replace('GMT', '');
    if (!raw || raw === '') return 'UTC';
    if (!raw.includes(':')) return `${raw}:00`;
    return raw;
  } catch {
    return '';
  }
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

  const timezoneOptions = useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      return ['America/Sao_Paulo', 'America/New_York', 'Europe/London', 'UTC'];
    }
  }, []);

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

  const optionalFieldCount = [showDescription, showLocation, showTimezone].filter(Boolean).length;

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

        <div className="px-5 pb-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Título *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do evento"
              maxLength={256}
              className="h-10"
              style={title ? { borderColor: `${accentColor}50` } : undefined}
            />
          </div>

          {/* Optional fields toggle row */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setShowDescription(!showDescription)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                showDescription
                  ? 'text-white'
                  : 'bg-muted/50 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10',
              )}
              style={showDescription ? { backgroundColor: accentColor } : undefined}
            >
              <AlignLeft className="w-3 h-3" />
              Descrição
            </button>
            <button
              type="button"
              onClick={() => setShowLocation(!showLocation)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                showLocation
                  ? 'text-white'
                  : 'bg-muted/50 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10',
              )}
              style={showLocation ? { backgroundColor: accentColor } : undefined}
            >
              <MapPin className="w-3 h-3" />
              Local
            </button>
            <button
              type="button"
              onClick={() => setShowTimezone(!showTimezone)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                showTimezone
                  ? 'text-white'
                  : 'bg-muted/50 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10',
              )}
              style={showTimezone ? { backgroundColor: accentColor } : undefined}
            >
              <Globe className="w-3 h-3" />
              Fuso horário
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRecurrence(!showRecurrence);
                if (showRecurrence) setRrule(null);
              }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                showRecurrence
                  ? 'text-white'
                  : 'bg-muted/50 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10',
              )}
              style={showRecurrence ? { backgroundColor: accentColor } : undefined}
            >
              <Repeat className="w-3 h-3" />
              Repetir
            </button>
          </div>

          {/* Optional fields - expanded */}
          {optionalFieldCount > 0 && (
            <div className="space-y-3">
              {showDescription && (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do evento"
                  rows={2}
                  className="resize-none text-sm"
                />
              )}
              {showLocation && (
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Local do evento"
                  maxLength={512}
                  className="h-9 text-sm"
                />
              )}
              {showTimezone && (
                <Popover open={tzOpen} onOpenChange={setTzOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={tzOpen}
                      className="w-full justify-between font-normal h-9 text-sm"
                    >
                      <span className="truncate">
                        {timezone ? `${timezone} (${getTimezoneOffset(timezone)})` : 'Selecionar fuso horário'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar fuso horário..." />
                      <CommandList>
                        <CommandEmpty>Nenhum fuso horário encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {timezoneOptions.map((tz) => {
                            const offset = getTimezoneOffset(tz);
                            return (
                              <CommandItem
                                key={tz}
                                value={tz}
                                onSelect={() => {
                                  setTimezone(tz);
                                  setTzOpen(false);
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', timezone === tz ? 'opacity-100' : 'opacity-0')} />
                                <span className="flex-1 truncate">{tz}</span>
                                <span className="text-xs text-muted-foreground ml-2 shrink-0">{offset}</span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}

          {/* Date & Time */}
          <div
            className="rounded-lg border p-3.5 space-y-3"
            style={{ borderColor: `${accentColor}25` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
                Data e hora
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Dia inteiro</span>
                <Switch checked={isAllDay} onCheckedChange={setIsAllDay} />
              </div>
            </div>

            {isAllDay ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[0.7rem] text-muted-foreground">Início</label>
                  <Input
                    type="date"
                    value={startDate.slice(0, 10)}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="calendar-date-input h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.7rem] text-muted-foreground">Fim</label>
                  <Input
                    type="date"
                    value={endDate.slice(0, 10)}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="calendar-date-input h-9 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[0.7rem] text-muted-foreground">Data início</label>
                    <Input
                      type="date"
                      value={startDate.slice(0, 10)}
                      onChange={(e) => {
                        const time = startDate.slice(11) || '00:00';
                        setStartDate(`${e.target.value}T${time}`);
                      }}
                      className="calendar-date-input h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] text-muted-foreground">Horário início</label>
                    <Input
                      type="time"
                      value={startDate.slice(11, 16)}
                      onChange={(e) => {
                        const date = startDate.slice(0, 10);
                        setStartDate(`${date}T${e.target.value}`);
                      }}
                      className="calendar-date-input h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[0.7rem] text-muted-foreground">Data fim</label>
                    <Input
                      type="date"
                      value={endDate.slice(0, 10)}
                      onChange={(e) => {
                        const time = endDate.slice(11) || '00:00';
                        setEndDate(`${e.target.value}T${time}`);
                      }}
                      className="calendar-date-input h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] text-muted-foreground">Horário fim</label>
                    <Input
                      type="time"
                      value={endDate.slice(11, 16)}
                      onChange={(e) => {
                        const date = endDate.slice(0, 10);
                        setEndDate(`${date}T${e.target.value}`);
                      }}
                      className="calendar-date-input h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recurrence - shown when toggled */}
          {showRecurrence && (
            <div
              className="rounded-lg border p-3.5 space-y-3"
              style={{ borderColor: `${accentColor}25` }}
            >
              <RecurrencePicker
                value={rrule}
                onChange={setRrule}
                accentColor={accentColor}
                titleSlot={
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Repeat className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    Recorrência
                  </div>
                }
              />
            </div>
          )}

          {/* Settings row: Type / Visibility / Color / Calendar — 4 columns before footer */}
          <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {/* Type */}
              <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-1.5 h-9 rounded-md border border-border/60 hover:bg-accent/50 transition-colors text-xs"
                        style={{ color: EVENT_TYPE_COLORS[type] ?? accentColor }}
                      >
                        {EVENT_TYPE_ICONS[type]}
                        <span className="hidden sm:inline truncate max-w-[60px]">
                          {EventTypeLabels[type]}
                        </span>
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Tipo: {EventTypeLabels[type]}</p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent className="w-[200px] p-1" align="start" sideOffset={4}>
                  {EVENT_TYPES.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setType(value);
                        setTypeOpen(false);
                      }}
                      className={cn(
                        'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm transition-colors',
                        type === value
                          ? 'bg-accent font-medium'
                          : 'hover:bg-accent/50',
                      )}
                    >
                      <span style={{ color: EVENT_TYPE_COLORS[value] ?? '#64748b' }}>
                        {EVENT_TYPE_ICONS[value]}
                      </span>
                      {label}
                      {type === value && (
                        <Check className="w-3.5 h-3.5 ml-auto text-foreground" />
                      )}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              {/* Visibility */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setVisibility(visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 h-9 rounded-md border border-border/60 hover:bg-accent/50 transition-colors text-xs',
                      visibility === 'PRIVATE' && 'text-amber-500',
                    )}
                  >
                    {visibility === 'PUBLIC' ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {visibility === 'PUBLIC' ? 'Público' : 'Privado'}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{visibility === 'PUBLIC' ? 'Público' : 'Privado'}</p>
                </TooltipContent>
              </Tooltip>

              {/* Color */}
              <Popover open={colorOpen} onOpenChange={setColorOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-1.5 h-9 rounded-md border border-border/60 hover:bg-accent/50 transition-colors text-xs"
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: accentColor,
                            boxShadow: `0 0 0 2px var(--color-background), 0 0 0 3px ${accentColor}40`,
                          }}
                        />
                        <span className="hidden sm:inline">Cor</span>
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Cor</p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent className="w-auto p-3" align="center" sideOffset={4}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setColor('');
                        setColorOpen(false);
                      }}
                      className="w-7 h-7 rounded-full transition-all hover:scale-110 border-2 border-dashed border-border/80 flex items-center justify-center relative overflow-hidden"
                      style={{
                        boxShadow: !color
                          ? `0 0 0 2px var(--color-background), 0 0 0 4px ${EVENT_TYPE_COLORS[type] ?? '#64748b'}`
                          : 'none',
                      }}
                      title="Padrão"
                      aria-label="Usar cor padrão do tipo"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[type] ?? '#64748b', opacity: 0.5 }}
                      />
                    </button>
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setColor(color === preset.value ? '' : preset.value);
                          setColorOpen(false);
                        }}
                        className="w-7 h-7 rounded-full transition-all hover:scale-110"
                        style={{
                          backgroundColor: preset.value,
                          boxShadow: color === preset.value
                            ? `0 0 0 2px var(--color-background), 0 0 0 4px ${preset.value}`
                            : 'none',
                        }}
                        title={preset.label}
                        aria-label={`Selecionar cor ${preset.label}`}
                      />
                    ))}
                  </div>
                  <p className="text-[0.65rem] text-center text-muted-foreground mt-2">
                    {color ? 'Clique novamente para remover' : 'Automática por tipo'}
                  </p>
                </PopoverContent>
              </Popover>

              {/* Calendar (read-only for edit) */}
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
            </div>
          </TooltipProvider>
        </div>

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
