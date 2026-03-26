/**
 * OpenSea OS - Create Deduction Wizard
 * Modal de criação rápida de dedução
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { translateError } from '@/lib/error-messages';
import type { CreateDeductionData } from '@/types/hr';
import { Loader2, Receipt } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeductionData) => Promise<void>;
}

export function CreateModal({ isOpen, onClose, onSubmit }: CreateModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [installments, setInstallments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setEmployeeId('');
      setName('');
      setAmount('');
      setReason('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
      setInstallments('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFieldErrors({});
    }
  }, [isOpen]);

  const isReasonValid = reason.trim().length >= 10;
  const parsedAmount = parseFloat(amount);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0;
  const parsedInstallments = parseInt(installments, 10);
  const isInstallmentsValid =
    !isRecurring || (!isNaN(parsedInstallments) && parsedInstallments > 0);

  const canSubmit =
    employeeId.trim() &&
    name.trim() &&
    isAmountValid &&
    isReasonValid &&
    date &&
    isInstallmentsValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const data: CreateDeductionData = {
        employeeId: employeeId.trim(),
        name: name.trim(),
        amount: parsedAmount,
        reason: reason.trim(),
        date,
      };

      if (isRecurring) {
        data.isRecurring = true;
        if (!isNaN(parsedInstallments) && parsedInstallments > 0) {
          data.installments = parsedInstallments;
        }
      }

      await onSubmit(data);
      setEmployeeId('');
      setName('');
      setAmount('');
      setReason('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
      setInstallments('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('name already exists') || msg.includes('already')) {
        setFieldErrors(prev => ({ ...prev, name: translateError(msg) }));
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
        title: 'Nova Dedução',
        description: 'Registre uma nova dedução para um funcionário.',
        icon: (
          <Receipt className="h-16 w-16 text-rose-400 opacity-50" strokeWidth={1.2} />
        ),
        isValid: !!canSubmit,
        content: (
          <div className="space-y-4 py-2">
            {/* Funcionário */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Funcionário <span className="text-rose-500">*</span>
              </Label>
              <EmployeeSelector
                value={employeeId}
                onChange={id => setEmployeeId(id)}
                placeholder="Selecionar funcionário..."
              />
            </div>

            {/* Nome + Valor + Data */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="ded-name" className="text-xs">
                  Nome <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="ded-name"
                    value={name}
                    aria-invalid={!!fieldErrors.name}
                    onChange={e => {
                      setName(e.target.value);
                      if (fieldErrors.name)
                        setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="Ex.: Adiantamento salarial"
                    className="h-9"
                  />
                  <FormErrorIcon message={fieldErrors.name} />
                </div>
              </div>
              <div className="w-32 space-y-1.5">
                <Label htmlFor="ded-amount" className="text-xs">
                  Valor (R$) <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="ded-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    aria-invalid={!!fieldErrors.amount}
                    onChange={e => {
                      setAmount(e.target.value);
                      if (fieldErrors.amount)
                        setFieldErrors(prev => ({ ...prev, amount: '' }));
                    }}
                    placeholder="0,00"
                    className="h-9"
                  />
                  <FormErrorIcon message={fieldErrors.amount} />
                </div>
              </div>
              <div className="w-36 space-y-1.5">
                <Label htmlFor="ded-date" className="text-xs">
                  Data <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="ded-date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5">
              <Label htmlFor="ded-reason" className="text-xs">
                Motivo <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="ded-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Descreva o motivo da dedução (mínimo 10 caracteres)"
                rows={3}
              />
              {reason.trim().length > 0 && !isReasonValid && (
                <p className="text-xs text-destructive">
                  O motivo deve ter no mínimo 10 caracteres.
                </p>
              )}
            </div>

            {/* Recorrente */}
            <div className="flex items-center justify-between">
              <Label
                htmlFor="ded-recurring"
                className="cursor-pointer text-xs"
              >
                Dedução recorrente
              </Label>
              <Switch
                id="ded-recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {/* Parcelas (somente se recorrente) */}
            {isRecurring && (
              <div className="space-y-1.5">
                <Label htmlFor="ded-installments" className="text-xs">
                  Número de parcelas <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="ded-installments"
                  type="number"
                  min="1"
                  value={installments}
                  onChange={e => setInstallments(e.target.value)}
                  placeholder="Ex.: 12"
                  className="h-9"
                />
              </div>
            )}
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
                  Criando...
                </>
              ) : (
                'Criar Dedução'
              )}
            </Button>
          </div>
        ),
      },
    ],
    [employeeId, name, amount, reason, date, isRecurring, installments, isSubmitting, canSubmit, onClose, fieldErrors]
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
