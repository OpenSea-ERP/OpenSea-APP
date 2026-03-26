/**
 * OpenSea OS - Create Vacation Period Wizard (HR)
 * Modal para criar novo período de férias com wizard de 2 etapas.
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
import { CalendarHeart, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCreateVacation } from '../api';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [acquisitionStart, setAcquisitionStart] = useState('');
  const [acquisitionEnd, setAcquisitionEnd] = useState('');
  const [concessionStart, setConcessionStart] = useState('');
  const [concessionEnd, setConcessionEnd] = useState('');
  const [totalDays, setTotalDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  const createVacation = useCreateVacation({
    onSuccess: () => {
      resetForm();
      onClose();
    },
  });

  function resetForm() {
    setEmployeeId('');
    setAcquisitionStart('');
    setAcquisitionEnd('');
    setConcessionStart('');
    setConcessionEnd('');
    setTotalDays(30);
    setNotes('');
    setIsSubmitting(false);
    setFieldErrors({});
    setCurrentStep(1);
  }

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const isStep1Valid =
    !!employeeId && !!acquisitionStart && !!acquisitionEnd;

  const isStep2Valid =
    !!concessionStart && !!concessionEnd && totalDays > 0;

  const handleSubmit = async () => {
    if (!isStep1Valid || !isStep2Valid) return;
    setIsSubmitting(true);
    try {
      await new Promise<void>((resolve, reject) => {
        createVacation.mutate(
          {
            employeeId,
            acquisitionStart,
            acquisitionEnd,
            concessionStart,
            concessionEnd,
            totalDays,
            notes: notes || undefined,
          },
          {
            onSuccess: () => resolve(),
            onError: (error: Error) => reject(error),
          }
        );
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('already') || msg.includes('exists') || msg.includes('overlap')) {
        setFieldErrors(prev => ({
          ...prev,
          acquisitionStart: translateError(msg),
        }));
        setCurrentStep(1);
      } else if (msg.includes('employee') || msg.includes('funcionário')) {
        setFieldErrors(prev => ({
          ...prev,
          employeeId: translateError(msg),
        }));
        setCurrentStep(1);
      } else {
        toast.error(translateError(msg));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const steps: WizardStep[] = useMemo(
    () => [
      {
        title: 'Funcionário e Período Aquisitivo',
        description: 'Selecione o funcionário e defina o período aquisitivo.',
        icon: (
          <CalendarHeart className="h-16 w-16 text-emerald-400 opacity-50" strokeWidth={1.2} />
        ),
        isValid: isStep1Valid,
        content: (
          <div className="space-y-4 py-2">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vacation-acq-start">
                  Início Aquisitivo{' '}
                  <span className="text-[rgb(var(--color-destructive))]">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="vacation-acq-start"
                    type="date"
                    value={acquisitionStart}
                    aria-invalid={!!fieldErrors.acquisitionStart}
                    onChange={e => {
                      setAcquisitionStart(e.target.value);
                      if (fieldErrors.acquisitionStart)
                        setFieldErrors(prev => ({ ...prev, acquisitionStart: '' }));
                    }}
                    className="h-11"
                  />
                  <FormErrorIcon message={fieldErrors.acquisitionStart} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vacation-acq-end">
                  Fim Aquisitivo{' '}
                  <span className="text-[rgb(var(--color-destructive))]">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="vacation-acq-end"
                    type="date"
                    value={acquisitionEnd}
                    aria-invalid={!!fieldErrors.acquisitionEnd}
                    onChange={e => {
                      setAcquisitionEnd(e.target.value);
                      if (fieldErrors.acquisitionEnd)
                        setFieldErrors(prev => ({ ...prev, acquisitionEnd: '' }));
                    }}
                    className="h-11"
                  />
                  <FormErrorIcon message={fieldErrors.acquisitionEnd} />
                </div>
              </div>
            </div>
          </div>
        ),
        footer: (
          <div className="flex items-center justify-end gap-2 w-full">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!isStep1Valid}
            >
              Próximo
            </Button>
          </div>
        ),
      },
      {
        title: 'Período Concessivo e Detalhes',
        description: 'Configure o período concessivo, total de dias e observações.',
        icon: (
          <CalendarHeart className="h-16 w-16 text-emerald-400 opacity-50" strokeWidth={1.2} />
        ),
        isValid: isStep2Valid,
        content: (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vacation-con-start">
                  Início Concessivo{' '}
                  <span className="text-[rgb(var(--color-destructive))]">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="vacation-con-start"
                    type="date"
                    value={concessionStart}
                    aria-invalid={!!fieldErrors.concessionStart}
                    onChange={e => {
                      setConcessionStart(e.target.value);
                      if (fieldErrors.concessionStart)
                        setFieldErrors(prev => ({ ...prev, concessionStart: '' }));
                    }}
                    className="h-11"
                  />
                  <FormErrorIcon message={fieldErrors.concessionStart} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vacation-con-end">
                  Fim Concessivo{' '}
                  <span className="text-[rgb(var(--color-destructive))]">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="vacation-con-end"
                    type="date"
                    value={concessionEnd}
                    aria-invalid={!!fieldErrors.concessionEnd}
                    onChange={e => {
                      setConcessionEnd(e.target.value);
                      if (fieldErrors.concessionEnd)
                        setFieldErrors(prev => ({ ...prev, concessionEnd: '' }));
                    }}
                    className="h-11"
                  />
                  <FormErrorIcon message={fieldErrors.concessionEnd} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vacation-total-days">
                Total de Dias{' '}
                <span className="text-[rgb(var(--color-destructive))]">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="vacation-total-days"
                  type="number"
                  min={1}
                  max={30}
                  value={totalDays}
                  aria-invalid={!!fieldErrors.totalDays}
                  onChange={e => {
                    setTotalDays(Number(e.target.value));
                    if (fieldErrors.totalDays)
                      setFieldErrors(prev => ({ ...prev, totalDays: '' }));
                  }}
                  className="h-11"
                />
                <FormErrorIcon message={fieldErrors.totalDays} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vacation-notes">
                Observações (opcional)
              </Label>
              <Textarea
                id="vacation-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observações sobre o período de férias..."
                rows={3}
              />
            </div>
          </div>
        ),
        footer: (
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
            >
              Voltar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isStep1Valid || !isStep2Valid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                'Criar Período'
              )}
            </Button>
          </div>
        ),
      },
    ],
    [
      employeeId,
      acquisitionStart,
      acquisitionEnd,
      concessionStart,
      concessionEnd,
      totalDays,
      notes,
      isSubmitting,
      isStep1Valid,
      isStep2Valid,
      fieldErrors,
    ]
  );

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={open => !open && handleClose()}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}

export default CreateModal;
