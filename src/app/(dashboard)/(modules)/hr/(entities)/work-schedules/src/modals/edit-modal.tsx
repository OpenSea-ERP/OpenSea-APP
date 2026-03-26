'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { translateError } from '@/lib/error-messages';
import type { WorkSchedule, UpdateWorkScheduleData } from '@/types/hr';
import { Clock, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { WEEK_DAYS, getDayLabel } from '../utils';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  workSchedule: WorkSchedule | null;
  onSubmit: (id: string, data: UpdateWorkScheduleData) => Promise<void>;
  isLoading?: boolean;
}

type DayKey = (typeof WEEK_DAYS)[number];

interface DaySchedule {
  start: string;
  end: string;
  enabled: boolean;
}

export function EditModal({
  isOpen,
  onClose,
  workSchedule,
  onSubmit,
  isLoading,
}: EditModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [breakDuration, setBreakDuration] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [days, setDays] = useState<Record<DayKey, DaySchedule>>(
    {} as Record<DayKey, DaySchedule>
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lastId, setLastId] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && workSchedule && workSchedule.id !== lastId) {
      setLastId(workSchedule.id);
      setName(workSchedule.name);
      setDescription(workSchedule.description ?? '');
      setBreakDuration(workSchedule.breakDuration);
      setIsActive(workSchedule.isActive);

      const newDays: Record<DayKey, DaySchedule> = {} as Record<
        DayKey,
        DaySchedule
      >;
      for (const day of WEEK_DAYS) {
        const startKey = `${day}Start` as keyof WorkSchedule;
        const endKey = `${day}End` as keyof WorkSchedule;
        const start = (workSchedule[startKey] as string | null) ?? '';
        const end = (workSchedule[endKey] as string | null) ?? '';
        newDays[day] = {
          start,
          end,
          enabled: !!start && !!end,
        };
      }
      setDays(newDays);
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isOpen, workSchedule, lastId]);

  useEffect(() => {
    if (!isOpen) setLastId(null);
  }, [isOpen]);

  function updateDay(
    day: DayKey,
    field: keyof DaySchedule,
    value: string | boolean
  ) {
    setDays(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  async function handleSubmit() {
    if (!workSchedule) return;

    const data: UpdateWorkScheduleData = {
      name,
      description: description || undefined,
      breakDuration,
      isActive,
    };

    for (const day of WEEK_DAYS) {
      const d = days[day];
      const startKey = `${day}Start` as keyof UpdateWorkScheduleData;
      const endKey = `${day}End` as keyof UpdateWorkScheduleData;
      if (d.enabled && d.start && d.end) {
        (data as Record<string, unknown>)[startKey] = d.start;
        (data as Record<string, unknown>)[endKey] = d.end;
      } else {
        (data as Record<string, unknown>)[startKey] = null;
        (data as Record<string, unknown>)[endKey] = null;
      }
    }

    try {
      await onSubmit(workSchedule.id, data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('name already') || msg.includes('already exists') || msg.includes('nome')) {
        setFieldErrors(prev => ({ ...prev, name: translateError(msg) }));
      } else {
        toast.error(translateError(msg));
      }
    }
  }

  if (!workSchedule) return null;

  const canSubmit = name.trim().length >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-indigo-500 to-violet-600 p-2 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            Editar Escala de Trabalho
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dados básicos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ws-edit-name">
                Nome <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="ws-edit-name"
                  ref={nameRef}
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="Ex: Comercial, Administrativo"
                  aria-invalid={!!fieldErrors.name}
                />
                <FormErrorIcon message={fieldErrors.name} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-edit-break">Intervalo (minutos)</Label>
              <Input
                id="ws-edit-break"
                type="number"
                min={0}
                max={480}
                value={breakDuration}
                onChange={e => setBreakDuration(Number(e.target.value))}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="ws-edit-desc">Descrição</Label>
              <Textarea
                id="ws-edit-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descreva a escala de trabalho"
                rows={2}
              />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch
                id="ws-edit-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="ws-edit-active">Escala ativa</Label>
            </div>
          </div>

          {/* Jornada semanal */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Jornada Semanal</h4>
            <div className="space-y-2">
              {WEEK_DAYS.map(day => {
                const d = days[day];
                if (!d) return null;
                return (
                  <div
                    key={day}
                    className={`flex items-center gap-3 py-2 px-3 rounded-lg border ${
                      d.enabled
                        ? 'bg-background border-border'
                        : 'bg-muted/50 border-transparent'
                    }`}
                  >
                    <Switch
                      checked={d.enabled}
                      onCheckedChange={checked =>
                        updateDay(day, 'enabled', checked)
                      }
                    />
                    <span className="font-medium w-20 text-sm">
                      {getDayLabel(day)}
                    </span>
                    {d.enabled ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={d.start}
                          onChange={e =>
                            updateDay(day, 'start', e.target.value)
                          }
                          className="w-32 h-8 text-sm"
                        />
                        <span className="text-muted-foreground text-sm">
                          até
                        </span>
                        <Input
                          type="time"
                          value={d.end}
                          onChange={e => updateDay(day, 'end', e.target.value)}
                          className="w-32 h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Folga
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
