'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmployeeSelector } from '@/components/shared/employee-selector';
import type { ClockInOutRequest } from '@/services/hr/time-control.service';
import { Loader2, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ClockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClockInOutRequest) => Promise<void>;
  isLoading?: boolean;
  employeeId?: string;
}

export function ClockOutModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  employeeId,
}: ClockOutModalProps) {
  const [employee, setEmployee] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmployee(employeeId ?? '');
      setNotes('');
    }
  }, [isOpen, employeeId]);

  async function handleSubmit() {
    if (!employee) return;
    await onSubmit({
      employeeId: employee,
      notes: notes || undefined,
    });
  }

  const canSubmit = employee.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-red-500 to-red-600 p-2 rounded-lg">
              <LogOut className="h-5 w-5" />
            </div>
            Registrar Saída
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              Funcionário <span className="text-red-500">*</span>
            </Label>
            <EmployeeSelector
              value={employee}
              onChange={id => setEmployee(id)}
              placeholder="Selecionar funcionário..."
              disabled={!!employeeId}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tc-out-notes">Observações</Label>
            <Textarea
              id="tc-out-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observações (opcional)"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            variant="destructive"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Saída
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
