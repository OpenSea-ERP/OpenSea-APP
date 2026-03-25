'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TimePicker } from '@/components/ui/time-picker';
import type { CreateWorkScheduleData } from '@/types/hr';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CalendarDays, Check, Clock, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WEEK_DAYS, getDayLabel } from '../utils';

// =============================================================================
// TYPES
// =============================================================================

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWorkScheduleData) => Promise<void>;
  isLoading?: boolean;
}

type DayKey = (typeof WEEK_DAYS)[number];

interface DaySchedule {
  start: string;
  end: string;
  enabled: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_WEEKDAY: DaySchedule = {
  start: '08:00',
  end: '17:00',
  enabled: true,
};
const DEFAULT_WEEKEND: DaySchedule = { start: '', end: '', enabled: false };

const WEEKDAYS: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
];

function getDefaultDays(): Record<DayKey, DaySchedule> {
  return {
    monday: { ...DEFAULT_WEEKDAY },
    tuesday: { ...DEFAULT_WEEKDAY },
    wednesday: { ...DEFAULT_WEEKDAY },
    thursday: { ...DEFAULT_WEEKDAY },
    friday: { ...DEFAULT_WEEKDAY },
    saturday: { ...DEFAULT_WEEKEND },
    sunday: { ...DEFAULT_WEEKEND },
  };
}

// =============================================================================
// HOUR CALCULATION HELPERS
// =============================================================================

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function calcDayMinutes(day: DaySchedule, breakMin: number): number {
  if (!day.enabled || !day.start || !day.end) return 0;
  const startMin = timeToMinutes(day.start);
  const endMin = timeToMinutes(day.end);
  const worked = endMin - startMin;
  return Math.max(0, worked - breakMin);
}

function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

// =============================================================================
// MAIN MODAL
// =============================================================================

export function CreateModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateModalProps) {
  const [name, setName] = useState('');
  const [breakDuration, setBreakDuration] = useState(60);
  const [days, setDays] = useState<Record<DayKey, DaySchedule>>(getDefaultDays);
  const [replicateMonday, setReplicateMonday] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setName('');
      setBreakDuration(60);
      setDays(getDefaultDays());
      setReplicateMonday(true);
      setIsSubmitting(false);
      setTimeout(() => nameRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Replicate Monday toggle handler
  const handleReplicateMondayChange = useCallback((enabled: boolean) => {
    setReplicateMonday(enabled);
    if (enabled) {
      setDays(prev => {
        const updated = { ...prev };
        for (const d of WEEKDAYS) {
          if (d === 'monday') continue;
          if (prev[d].enabled) {
            updated[d] = {
              ...prev[d],
              start: prev.monday.start,
              end: prev.monday.end,
            };
          }
        }
        return updated;
      });
    }
  }, []);

  // Smart day update with propagation
  const handleUpdateDay = useCallback(
    (day: DayKey, field: keyof DaySchedule, value: string | boolean) => {
      if (field === 'enabled') {
        setDays(prev => {
          const updated = { ...prev, [day]: { ...prev[day], enabled: value } };
          if (value && replicateMonday && day !== 'monday' && WEEKDAYS.includes(day)) {
            updated[day] = {
              ...updated[day],
              start: prev.monday.start,
              end: prev.monday.end,
            };
          }
          return updated;
        });
        return;
      }

      if (day === 'monday' && replicateMonday) {
        setDays(prev => {
          const updated = { ...prev };
          updated.monday = { ...prev.monday, [field]: value };
          for (const d of WEEKDAYS) {
            if (d === 'monday') continue;
            if (prev[d].enabled) {
              updated[d] = { ...prev[d], [field]: value };
            }
          }
          return updated;
        });
      } else {
        if (replicateMonday && day !== 'monday' && WEEKDAYS.includes(day)) {
          setReplicateMonday(false);
        }
        setDays(prev => ({
          ...prev,
          [day]: { ...prev[day], [field]: value },
        }));
      }
    },
    [replicateMonday]
  );

  // Calculated values
  const dayMinutes = useMemo(() => {
    const result: Record<string, number> = {};
    for (const day of WEEK_DAYS) {
      result[day] = calcDayMinutes(days[day], breakDuration);
    }
    return result;
  }, [days, breakDuration]);

  const totalWeeklyMinutes = useMemo(
    () => Object.values(dayMinutes).reduce((sum, m) => sum + m, 0),
    [dayMinutes]
  );

  const enabledDaysCount = WEEK_DAYS.filter(d => days[d].enabled).length;

  // Submit
  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const data: CreateWorkScheduleData = {
        name,
        breakDuration,
      };

      for (const day of WEEK_DAYS) {
        const d = days[day];
        if (d.enabled && d.start && d.end) {
          const startKey = `${day}Start` as keyof CreateWorkScheduleData;
          const endKey = `${day}End` as keyof CreateWorkScheduleData;
          (data as unknown as Record<string, unknown>)[startKey] = d.start;
          (data as unknown as Record<string, unknown>)[endKey] = d.end;
        }
      }

      await onSubmit(data);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const canSubmit = name.trim().length >= 2 && enabledDaysCount > 0;
  const pending = isSubmitting || isLoading;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={val => {
        if (!val) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[800px] max-w-[800px] h-[550px] p-0 gap-0 overflow-hidden flex flex-row"
      >
        <VisuallyHidden>
          <DialogTitle>Nova Escala de Trabalho</DialogTitle>
        </VisuallyHidden>

        {/* Left icon column */}
        <div className="w-[200px] shrink-0 bg-slate-50 dark:bg-white/5 flex items-center justify-center border-r border-border/50">
          <CalendarDays className="h-16 w-16 text-sky-400" strokeWidth={1.2} />
        </div>

        {/* Right content column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <h2 className="text-lg font-semibold leading-none">
                Nova Escala de Trabalho
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Defina o nome, horários e intervalos da jornada.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4" onWheel={e => e.stopPropagation()}>
            {/* Name + Break + Replicate row */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="ws-name" className="text-xs">
                  Nome <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="ws-name"
                  ref={nameRef}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Comercial, Administrativo"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ws-break" className="text-xs">
                  Intervalo
                </Label>
                <div className="relative">
                  <Input
                    id="ws-break"
                    type="number"
                    min={0}
                    max={480}
                    value={breakDuration}
                    onChange={e => setBreakDuration(Number(e.target.value))}
                    className="w-24 h-9 text-sm pr-8"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    min
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ws-replicate" className="text-xs">
                  Replicar Segunda
                </Label>
                <div className="h-9 flex items-center">
                  <Switch
                    id="ws-replicate"
                    checked={replicateMonday}
                    onCheckedChange={handleReplicateMondayChange}
                  />
                </div>
              </div>
            </div>

            {/* Day rows */}
            <div className="space-y-1">
              {WEEK_DAYS.map(day => {
                const d = days[day];
                const isMonday = day === 'monday';
                const dailyMin = dayMinutes[day];

                return (
                  <div
                    key={day}
                    className={`flex items-center gap-2.5 h-10 px-2.5 rounded-lg border transition-colors ${
                      d.enabled
                        ? 'bg-background border-border'
                        : 'bg-muted/50 border-transparent'
                    }`}
                  >
                    <Switch
                      checked={d.enabled}
                      onCheckedChange={checked =>
                        handleUpdateDay(day, 'enabled', checked)
                      }
                      className="scale-90"
                    />

                    <span className={`inline-flex items-center justify-center w-16 h-7 rounded-md text-xs font-semibold ${
                      d.enabled
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        : 'bg-slate-100/60 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500'
                    }`}>
                      {getDayLabel(day)}
                    </span>

                    {d.enabled ? (
                      <>
                        <div className="flex items-center gap-1.5 flex-1">
                          <TimePicker
                            value={d.start}
                            onChange={v => handleUpdateDay(day, 'start', v)}
                          />
                          <span className="text-muted-foreground text-xs">até</span>
                          <TimePicker
                            value={d.end}
                            onChange={v => handleUpdateDay(day, 'end', v)}
                          />
                        </div>

                        <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                          {dailyMin > 0 ? formatHoursMinutes(dailyMin) : '-'}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic flex-1">
                        Folga
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-border/50">
            {/* Summary cards */}
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-muted/60 px-4 py-1.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">
                  Dias de Trabalho
                </p>
                <p className="text-base font-semibold tabular-nums leading-none">
                  {enabledDaysCount}
                </p>
              </div>
              <div className="rounded-lg bg-muted/60 px-4 py-1.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">
                  Horas Semanais
                </p>
                <p className="text-base font-semibold tabular-nums leading-none">
                  {totalWeeklyMinutes > 0 ? formatHoursMinutes(totalWeeklyMinutes) : '0h'}
                </p>
              </div>
            </div>

            <div className="flex-1" />

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || pending}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Criar Escala
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
