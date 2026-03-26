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
import { Scale } from 'lucide-react';
import { toast } from 'sonner';

interface AdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employeeId: string;
    newBalance: number;
    year?: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function AdjustModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AdjustModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [year, setYear] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit({
        employeeId,
        newBalance: Number(newBalance),
        year: year ? Number(year) : undefined,
      });
      setEmployeeId('');
      setNewBalance('');
      setYear('');
      setFieldErrors({});
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('employee') || msg.includes('funcionário')) {
        setFieldErrors(prev => ({ ...prev, employeeId: translateError(msg) }));
      } else if (msg.includes('balance') || msg.includes('saldo')) {
        setFieldErrors(prev => ({ ...prev, newBalance: translateError(msg) }));
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
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-sky-500 to-sky-600 p-2 rounded-lg">
              <Scale className="h-5 w-5" />
            </div>
            Ajustar Saldo
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
            <Label htmlFor="adjust-balance">Novo Saldo (horas)</Label>
            <div className="relative">
              <Input
                id="adjust-balance"
                type="number"
                step="0.5"
                placeholder="Ex: 16"
                value={newBalance}
                onChange={e => {
                  setNewBalance(e.target.value);
                  if (fieldErrors.newBalance) setFieldErrors(prev => ({ ...prev, newBalance: '' }));
                }}
                required
                aria-invalid={!!fieldErrors.newBalance}
              />
              <FormErrorIcon message={fieldErrors.newBalance} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="adjust-year">Ano (opcional)</Label>
            <Input
              id="adjust-year"
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
              disabled={isLoading || !employeeId || newBalance === ''}
            >
              {isLoading ? 'Ajustando...' : 'Ajustar Saldo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
