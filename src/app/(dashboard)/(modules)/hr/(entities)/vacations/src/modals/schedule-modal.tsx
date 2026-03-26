'use client';

/**
 * OpenSea OS - Schedule Vacation Modal (HR)
 *
 * Modal para agendar férias de um período disponível.
 */

import { useState } from 'react';
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
import { translateError } from '@/lib/error-messages';
import { CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import type { ScheduleVacationData } from '@/types/hr';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacationId: string | null;
  onSchedule: (id: string, data: ScheduleVacationData) => void;
  isSubmitting: boolean;
}

export function ScheduleModal({
  isOpen,
  onClose,
  vacationId,
  onSchedule,
  isSubmitting,
}: ScheduleModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState(30);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function resetForm() {
    setStartDate('');
    setEndDate('');
    setDays(30);
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!vacationId || !startDate || !endDate || days <= 0) return;

    try {
      await onSchedule(vacationId, { startDate, endDate, days });
      resetForm();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('date') || msg.includes('overlap') || msg.includes('data')) {
        setFieldErrors(prev => ({ ...prev, startDate: translateError(msg) }));
      } else {
        toast.error(translateError(msg));
      }
    }
  }

  const isValid = startDate && endDate && days > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg">
              <CalendarDays className="h-5 w-5" />
            </div>
            Agendar Férias
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-start-date">Data Início</Label>
              <div className="relative">
                <Input
                  id="schedule-start-date"
                  type="date"
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    if (fieldErrors.startDate) setFieldErrors(prev => ({ ...prev, startDate: '' }));
                  }}
                  required
                  aria-invalid={!!fieldErrors.startDate}
                />
                <FormErrorIcon message={fieldErrors.startDate} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-end-date">Data Fim</Label>
              <Input
                id="schedule-end-date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-days">Dias</Label>
            <Input
              id="schedule-days"
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Agendando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ScheduleModal;
