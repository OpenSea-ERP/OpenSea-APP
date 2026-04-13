'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { useCreateCombo } from '@/hooks/sales/use-combos';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import type { ComboDiscountType, CreateComboRequest } from '@/types/sales';
import { CalendarDays, Check, Loader2, Package } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface CreateComboWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateComboWizard({
  open,
  onOpenChange,
}: CreateComboWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 — Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] =
    useState<ComboDiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');

  // Step 2 — Dates & activation
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateCombo();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setFieldErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  async function handleSubmit() {
    const payload: CreateComboRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      discountType,
      discountValue: discountValue ? Number(discountValue) : undefined,
      validFrom: startDate ? new Date(startDate).toISOString() : undefined,
      validUntil: endDate ? new Date(endDate).toISOString() : undefined,
      isActive,
    };

    try {
      await createMutation.mutateAsync(payload);
      toast.success('Combo criado com sucesso!');
      handleClose();
    } catch (err) {
      const apiError = ApiError.from(err);
      const fieldMap: Record<string, string> = {
        'name already': 'name',
        'Combo name already': 'name',
      };
      let mapped = false;
      if (apiError.fieldErrors?.length) {
        const errors: Record<string, string> = {};
        for (const fe of apiError.fieldErrors) {
          errors[fe.field] = translateError(fe.message);
          mapped = true;
        }
        if (mapped) {
          setFieldErrors(errors);
          setCurrentStep(1);
        }
      }
      if (!mapped) {
        for (const [pattern, field] of Object.entries(fieldMap)) {
          if (apiError.message.includes(pattern)) {
            setFieldErrors({ [field]: translateError(apiError.message) });
            setCurrentStep(1);
            mapped = true;
            break;
          }
        }
      }
      if (!mapped) {
        toast.error(translateError(apiError.message));
      }
    }
  }

  const step1Valid = name.trim().length > 0;

  const steps: WizardStep[] = [
    {
      title: 'Informações Básicas',
      description: 'Defina o nome, descrição e desconto do combo.',
      icon: <Package className="h-16 w-16 text-orange-400" strokeWidth={1.2} />,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <div className="relative">
              <Input
                placeholder="Ex: Combo Verão"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setFieldErrors(prev => {
                    const { name: _, ...rest } = prev;
                    return rest;
                  });
                }}
                aria-invalid={!!fieldErrors.name}
              />
              <FormErrorIcon message={fieldErrors.name} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descreva o combo..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Desconto</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={discountType}
                onChange={e =>
                  setDiscountType(e.target.value as ComboDiscountType)
                }
              >
                <option value="PERCENTAGE">Percentual (%)</option>
                <option value="FIXED_VALUE">Valor Fixo (R$)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Valor do Desconto</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder={
                  discountType === 'PERCENTAGE' ? 'Ex: 15' : 'Ex: 30.00'
                }
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
      isValid: step1Valid,
    },
    {
      title: 'Datas e Ativação',
      description: 'Configure o período de vigência e status do combo.',
      icon: (
        <CalendarDays
          className="h-16 w-16 text-emerald-400"
          strokeWidth={1.2}
        />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                isActive ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <Label
              className="cursor-pointer"
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? 'Combo ativo' : 'Combo inativo'}
            </Label>
          </div>
        </div>
      ),
      isValid: true,
      footer: (
        <Button
          type="button"
          data-testid="combo-create-submit"
          onClick={handleSubmit}
          disabled={!step1Valid || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Combo
        </Button>
      ),
    },
  ];

  return (
    <StepWizardDialog
      data-testid="combo-create-wizard"
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
