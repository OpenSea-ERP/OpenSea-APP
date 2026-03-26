'use client';

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
import { EmployeeSelector } from '@/components/shared/employee-selector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { translateError } from '@/lib/error-messages';
import { TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface DebitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employeeId: string;
    hours: number;
    year?: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function DebitModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: DebitModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [hours, setHours] = useState('');
  const [year, setYear] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit({
        employeeId,
        hours: Number(hours),
        year: year ? Number(year) : undefined,
      });
      setEmployeeId('');
      setHours('');
      setYear('');
      setFieldErrors({});
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('hours') || msg.includes('horas') || msg.includes('insufficient') || msg.includes('insuficiente')) {
        setFieldErrors(prev => ({ ...prev, hours: translateError(msg) }));
      } else {
        toast.error(translateError(msg));
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-rose-500 to-rose-600 p-2 rounded-lg">
              <TrendingDown className="h-5 w-5" />
            </div>
            Debitar Horas
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Funcionário *</Label>
            <EmployeeSelector
              value={employeeId}
              onChange={id => setEmployeeId(id)}
              placeholder="Selecionar funcionário..."
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="debit-hours">Horas</Label>
            <div className="relative">
              <Input
                id="debit-hours"
                type="number"
                min="0.5"
                step="0.5"
                placeholder="Ex: 4"
                value={hours}
                onChange={e => {
                  setHours(e.target.value);
                  if (fieldErrors.hours) setFieldErrors(prev => ({ ...prev, hours: '' }));
                }}
                required
                aria-invalid={!!fieldErrors.hours}
              />
              <FormErrorIcon message={fieldErrors.hours} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="debit-year">Ano (opcional)</Label>
            <Input
              id="debit-year"
              type="number"
              min="2020"
              max="2100"
              placeholder={String(new Date().getFullYear())}
              value={year}
              onChange={e => setYear(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !employeeId || !hours}
              variant="destructive"
            >
              {isLoading ? 'Debitando...' : 'Debitar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
