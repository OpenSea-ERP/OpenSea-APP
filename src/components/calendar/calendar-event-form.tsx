'use client';

import { useMemo, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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
import { EventTypeLabels } from '@/types/common/enums';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import type { EventType, EventVisibility } from '@/types/calendar';
import {
  Clock,
  Repeat,
  MapPin,
  AlignLeft,
  Globe,
  ChevronsUpDown,
  Check,
  Eye,
  EyeOff,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLOR_PRESETS, getTimezoneOffset } from '@/lib/calendar-utils';

const EVENT_TYPES = Object.entries(EventTypeLabels) as [EventType, string][];

export interface CalendarEventFormState {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  type: EventType;
  visibility: EventVisibility;
  color: string;
  rrule: string | null;
  timezone: string;
  showDescription: boolean;
  showLocation: boolean;
  showTimezone: boolean;
  showRecurrence: boolean;
}

export interface CalendarEventFormActions {
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setLocation: (v: string) => void;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  setIsAllDay: (v: boolean) => void;
  setType: (v: EventType) => void;
  setVisibility: (v: EventVisibility) => void;
  setColor: (v: string) => void;
  setRrule: (v: string | null) => void;
  setTimezone: (v: string) => void;
  setShowDescription: (v: boolean) => void;
  setShowLocation: (v: boolean) => void;
  setShowTimezone: (v: boolean) => void;
  setShowRecurrence: (v: boolean) => void;
}

interface PopoverStates {
  tzOpen: boolean;
  setTzOpen: (v: boolean) => void;
  typeOpen: boolean;
  setTypeOpen: (v: boolean) => void;
  colorOpen: boolean;
  setColorOpen: (v: boolean) => void;
}

interface CalendarEventFormProps {
  state: CalendarEventFormState;
  actions: CalendarEventFormActions;
  popovers: PopoverStates;
  accentColor: string;
  idPrefix: string;
  calendarSlot?: ReactNode;
}

export function CalendarEventForm({
  state,
  actions,
  popovers,
  accentColor,
  idPrefix,
  calendarSlot,
}: CalendarEventFormProps) {
  const timezoneOptions = useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      return ['America/Sao_Paulo', 'America/New_York', 'Europe/London', 'UTC'];
    }
  }, []);

  const optionalFieldCount = [
    state.showDescription,
    state.showLocation,
    state.showTimezone,
  ].filter(Boolean).length;

  return (
    <div className="px-5 pb-5 space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-title`} className="text-xs font-medium text-muted-foreground">Título *</label>
        <Input
          id={`${idPrefix}-title`}
          value={state.title}
          onChange={(e) => actions.setTitle(e.target.value)}
          placeholder="Nome do evento"
          maxLength={256}
          className="h-10"
          style={state.title ? { borderColor: `${accentColor}50` } : undefined}
        />
      </div>

      {/* Optional fields toggle row */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => actions.setShowDescription(!state.showDescription)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
            state.showDescription
              ? 'text-white'
              : 'bg-muted/50 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10',
          )}
          style={state.showDescription ? { backgroundColor: accentColor } : undefined}
        >
          <AlignLeft className="w-3 h-3" />
          Descrição
        </button>
        <button
          type="button"
          onClick={() => actions.setShowLocation(!state.showLocation)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
            state.showLocation
              ? 'text-white'
              : 'bg-muted/50 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10',
          )}
          style={state.showLocation ? { backgroundColor: accentColor } : undefined}
        >
          <MapPin className="w-3 h-3" />
          Local
        </button>
        <button
          type="button"
          onClick={() => actions.setShowTimezone(!state.showTimezone)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
            state.showTimezone
              ? 'text-white'
              : 'bg-muted/50 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10',
          )}
          style={state.showTimezone ? { backgroundColor: accentColor } : undefined}
        >
          <Globe className="w-3 h-3" />
          Fuso horário
        </button>
        <button
          type="button"
          onClick={() => {
            actions.setShowRecurrence(!state.showRecurrence);
            if (state.showRecurrence) actions.setRrule(null);
          }}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
            state.showRecurrence
              ? 'text-white'
              : 'bg-muted/50 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10',
          )}
          style={state.showRecurrence ? { backgroundColor: accentColor } : undefined}
        >
          <Repeat className="w-3 h-3" />
          Repetir
        </button>
      </div>

      {/* Optional fields - expanded */}
      {optionalFieldCount > 0 && (
        <div className="space-y-3">
          {state.showDescription && (
            <Textarea
              value={state.description}
              onChange={(e) => actions.setDescription(e.target.value)}
              placeholder="Descrição do evento"
              rows={2}
              className="resize-none text-sm"
            />
          )}
          {state.showLocation && (
            <Input
              value={state.location}
              onChange={(e) => actions.setLocation(e.target.value)}
              placeholder="Local do evento"
              maxLength={512}
              className="h-9 text-sm"
            />
          )}
          {state.showTimezone && (
            <Popover open={popovers.tzOpen} onOpenChange={popovers.setTzOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popovers.tzOpen}
                  className="w-full justify-between font-normal h-9 text-sm"
                >
                  <span className="truncate">
                    {state.timezone ? `${state.timezone} (${getTimezoneOffset(state.timezone)})` : 'Selecionar fuso horário'}
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
                              actions.setTimezone(tz);
                              popovers.setTzOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', state.timezone === tz ? 'opacity-100' : 'opacity-0')} />
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
            <Switch checked={state.isAllDay} onCheckedChange={actions.setIsAllDay} />
          </div>
        </div>

        {state.isAllDay ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor={`${idPrefix}-allday-start`} className="text-[0.7rem] text-muted-foreground">Início</label>
              <Input
                id={`${idPrefix}-allday-start`}
                type="date"
                value={state.startDate.slice(0, 10)}
                onChange={(e) => actions.setStartDate(e.target.value)}
                className="calendar-date-input h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${idPrefix}-allday-end`} className="text-[0.7rem] text-muted-foreground">Fim</label>
              <Input
                id={`${idPrefix}-allday-end`}
                type="date"
                value={state.endDate.slice(0, 10)}
                onChange={(e) => actions.setEndDate(e.target.value)}
                className="calendar-date-input h-9 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor={`${idPrefix}-start-date`} className="text-[0.7rem] text-muted-foreground">Data início</label>
                <Input
                  id={`${idPrefix}-start-date`}
                  type="date"
                  value={state.startDate.slice(0, 10)}
                  onChange={(e) => {
                    const time = state.startDate.slice(11) || '00:00';
                    actions.setStartDate(`${e.target.value}T${time}`);
                  }}
                  className="calendar-date-input h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={`${idPrefix}-start-time`} className="text-[0.7rem] text-muted-foreground">Horário início</label>
                <Input
                  id={`${idPrefix}-start-time`}
                  type="time"
                  value={state.startDate.slice(11, 16)}
                  onChange={(e) => {
                    const date = state.startDate.slice(0, 10);
                    actions.setStartDate(`${date}T${e.target.value}`);
                  }}
                  className="calendar-date-input h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor={`${idPrefix}-end-date`} className="text-[0.7rem] text-muted-foreground">Data fim</label>
                <Input
                  id={`${idPrefix}-end-date`}
                  type="date"
                  value={state.endDate.slice(0, 10)}
                  onChange={(e) => {
                    const time = state.endDate.slice(11) || '00:00';
                    actions.setEndDate(`${e.target.value}T${time}`);
                  }}
                  className="calendar-date-input h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={`${idPrefix}-end-time`} className="text-[0.7rem] text-muted-foreground">Horário fim</label>
                <Input
                  id={`${idPrefix}-end-time`}
                  type="time"
                  value={state.endDate.slice(11, 16)}
                  onChange={(e) => {
                    const date = state.endDate.slice(0, 10);
                    actions.setEndDate(`${date}T${e.target.value}`);
                  }}
                  className="calendar-date-input h-9 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recurrence - shown when toggled */}
      {state.showRecurrence && (
        <div
          className="rounded-lg border p-3.5 space-y-3"
          style={{ borderColor: `${accentColor}25` }}
        >
          <RecurrencePicker
            value={state.rrule}
            onChange={actions.setRrule}
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

      {/* Settings row: Type / Visibility / Color / Calendar */}
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-4 gap-2 pt-1">
          {/* Type */}
          <Popover open={popovers.typeOpen} onOpenChange={popovers.setTypeOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 h-9 rounded-md border border-border/60 hover:bg-accent/50 transition-colors text-xs"
                    style={{ color: EVENT_TYPE_COLORS[state.type] ?? accentColor }}
                  >
                    {EVENT_TYPE_ICONS[state.type]}
                    <span className="hidden sm:inline truncate max-w-[60px]">
                      {EventTypeLabels[state.type]}
                    </span>
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Tipo: {EventTypeLabels[state.type]}</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-[200px] p-1" align="start" sideOffset={4}>
              {EVENT_TYPES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    actions.setType(value);
                    popovers.setTypeOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm transition-colors',
                    state.type === value
                      ? 'bg-accent font-medium'
                      : 'hover:bg-accent/50',
                  )}
                >
                  <span style={{ color: EVENT_TYPE_COLORS[value] ?? '#64748b' }}>
                    {EVENT_TYPE_ICONS[value]}
                  </span>
                  {label}
                  {state.type === value && (
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
                onClick={() => actions.setVisibility(state.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                className={cn(
                  'flex items-center justify-center gap-1.5 h-9 rounded-md border border-border/60 hover:bg-accent/50 transition-colors text-xs',
                  state.visibility === 'PRIVATE' && 'text-amber-500',
                )}
              >
                {state.visibility === 'PUBLIC' ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {state.visibility === 'PUBLIC' ? 'Público' : 'Privado'}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{state.visibility === 'PUBLIC' ? 'Público' : 'Privado'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Color */}
          <Popover open={popovers.colorOpen} onOpenChange={popovers.setColorOpen}>
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
                    actions.setColor('');
                    popovers.setColorOpen(false);
                  }}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110 border-2 border-dashed border-border/80 flex items-center justify-center relative overflow-hidden"
                  style={{
                    boxShadow: !state.color
                      ? `0 0 0 2px var(--color-background), 0 0 0 4px ${EVENT_TYPE_COLORS[state.type] ?? '#64748b'}`
                      : 'none',
                  }}
                  title="Padrão"
                  aria-label="Usar cor padrão do tipo"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: EVENT_TYPE_COLORS[state.type] ?? '#64748b', opacity: 0.5 }}
                  />
                </button>
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      actions.setColor(state.color === preset.value ? '' : preset.value);
                      popovers.setColorOpen(false);
                    }}
                    className="w-7 h-7 rounded-full transition-all hover:scale-110"
                    style={{
                      backgroundColor: preset.value,
                      boxShadow: state.color === preset.value
                        ? `0 0 0 2px var(--color-background), 0 0 0 4px ${preset.value}`
                        : 'none',
                    }}
                    title={preset.label}
                    aria-label={`Selecionar cor ${preset.label}`}
                  />
                ))}
              </div>
              <p className="text-[0.65rem] text-center text-muted-foreground mt-2">
                {state.color ? 'Clique novamente para remover' : 'Automática por tipo'}
              </p>
            </PopoverContent>
          </Popover>

          {/* Calendar slot — provided by parent */}
          {calendarSlot ?? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center gap-1.5 h-9 rounded-md border border-border/60 text-xs text-muted-foreground cursor-default">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Calendário</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Calendário</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
