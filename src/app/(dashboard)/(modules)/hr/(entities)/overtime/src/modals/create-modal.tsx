/**
 * OpenSea OS - Create Overtime Wizard (HR)
 * Modal de criação de solicitação de hora extra
 */

'use client';

import { Button } from '@/components/ui/button';
import { EmployeeSelector } from '@/components/shared/employee-selector';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { translateError } from '@/lib/error-messages';
import type { CreateOvertimeData } from '@/types/hr';
import { Clock, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOvertimeData) => Promise<void>;
}

export function CreateModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setEmployeeId('');
      setDate('');
      setHours('');
      setReason('');
      setIsSubmitting(false);
      setFieldErrors({});
    } else {
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const isReasonValid = reason.trim().length >= 10;
  const parsedHours = parseFloat(hours);
  const isHoursValid = !isNaN(parsedHours) && parsedHours > 0;

  const canSubmit = employeeId.trim() && date && isHoursValid && isReasonValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        employeeId: employeeId.trim(),
        date,
        hours: parsedHours,
        reason: reason.trim(),
      });
      setEmployeeId('');
      setDate('');
      setHours('');
      setReason('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('already') || msg.includes('exists')) {
        setFieldErrors(prev => ({ ...prev, date: translateError(msg) }));
      } else {
        toast.error(translateError(msg));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: WizardStep[] = useMemo(
    () => [
      {
        title: 'Solicitar Hora Extra',
        description: 'Registre horas extras realizadas pelo funcionário.',
        icon: (
          <Clock className="h-16 w-16 text-amber-400 opacity-50" strokeWidth={1.2} />
        ),
        isValid: !!canSubmit,
        content: (
          <div className="space-y-4 py-2">
            {/* Funcionário */}
            <div className="space-y-2">
              <Label>
                Funcionário{' '}
                <span className="text-[rgb(var(--color-destructive))]">*</span>
              </Label>
              <div className="relative">
                <EmployeeSelector
                  value={employeeId}
                  onChange={id => {
                    setEmployeeId(id);
                    if (fieldErrors.employeeId)
                      setFieldErrors(prev => ({ ...prev, employeeId: '' }));
                  }}
                  placeholder="Selecionar funcionário..."
                />
                <FormErrorIcon message={fieldErrors.employeeId} />
              </div>
            </div>

            {/* Data e Horas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ot-date">
                  Data{' '}
                  <span className="text-[rgb(var(--color-destructive))]">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="ot-date"
                    type="date"
                    value={date}
                    aria-invalid={!!fieldErrors.date}
                    onChange={e => {
                      setDate(e.target.value);
                      if (fieldErrors.date)
                        setFieldErrors(prev => ({ ...prev, date: '' }));
                    }}
                    className="h-11"
                  />
                  <FormErrorIcon message={fieldErrors.date} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ot-hours">
                  Horas{' '}
                  <span className="text-[rgb(var(--color-destructive))]">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="ot-hours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={hours}
                    aria-invalid={!!fieldErrors.hours}
                    onChange={e => {
                      setHours(e.target.value);
                      if (fieldErrors.hours)
                        setFieldErrors(prev => ({ ...prev, hours: '' }));
                    }}
                    placeholder="Ex.: 2"
                    className="h-11"
                  />
                  <FormErrorIcon message={fieldErrors.hours} />
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="ot-reason">
                Motivo{' '}
                <span className="text-[rgb(var(--color-destructive))]">*</span>
              </Label>
              <div className="relative">
                <Textarea
                  id="ot-reason"
                  value={reason}
                  aria-invalid={!!fieldErrors.reason}
                  onChange={e => {
                    setReason(e.target.value);
                    if (fieldErrors.reason)
                      setFieldErrors(prev => ({ ...prev, reason: '' }));
                  }}
                  placeholder="Descreva o motivo da hora extra (mínimo 10 caracteres)"
                  rows={3}
                />
                <FormErrorIcon message={fieldErrors.reason} />
              </div>
              {reason.trim().length > 0 && !isReasonValid && (
                <p className="text-xs text-destructive">
                  O motivo deve ter no mínimo 10 caracteres.
                </p>
              )}
            </div>
          </div>
        ),
        footer: (
          <div className="flex items-center justify-end gap-2 w-full">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Solicitando...
                </>
              ) : (
                'Solicitar Hora Extra'
              )}
            </Button>
          </div>
        ),
      },
    ],
    [employeeId, date, hours, reason, isSubmitting, canSubmit, isReasonValid, onClose, fieldErrors]
  );

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      steps={steps}
      currentStep={1}
      onStepChange={() => {}}
      onClose={onClose}
    />
  );
}
