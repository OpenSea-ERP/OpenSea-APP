/**
 * OpenSea OS - Create Payment Condition Wizard
 * StepWizardDialog com 2 etapas: dados basicos + regras financeiras
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePaymentCondition } from '@/hooks/sales/use-payment-conditions';
import type {
  PaymentConditionType,
  CreatePaymentConditionRequest,
} from '@/types/sales';
import {
  PAYMENT_CONDITION_TYPE_LABELS,
} from '@/types/sales/payment-condition.types';
import { Check, CreditCard, Loader2, Settings2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface CreatePaymentConditionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePaymentConditionWizard({
  open,
  onOpenChange,
}: CreatePaymentConditionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 - Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PaymentConditionType>('CASH');
  const [installments, setInstallments] = useState('1');
  const [firstDueDays, setFirstDueDays] = useState('0');
  const [intervalDays, setIntervalDays] = useState('30');

  // Step 2 - Financial rules
  const [downPaymentPercent, setDownPaymentPercent] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [penaltyRate, setPenaltyRate] = useState('');
  const [discountCash, setDiscountCash] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxOrderValue, setMaxOrderValue] = useState('');

  const createMutation = useCreatePaymentCondition();

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setDescription('');
    setType('CASH');
    setInstallments('1');
    setFirstDueDays('0');
    setIntervalDays('30');
    setDownPaymentPercent('');
    setInterestRate('');
    setPenaltyRate('');
    setDiscountCash('');
    setMinOrderValue('');
    setMaxOrderValue('');
    onOpenChange(false);
  }, [onOpenChange]);

  async function handleSubmit() {
    const payload: CreatePaymentConditionRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      installments: Number(installments) || 1,
      firstDueDays: Number(firstDueDays) || 0,
      intervalDays: Number(intervalDays) || 30,
      downPaymentPercent: downPaymentPercent
        ? Number(downPaymentPercent)
        : undefined,
      interestRate: interestRate ? Number(interestRate) : undefined,
      penaltyRate: penaltyRate ? Number(penaltyRate) : undefined,
      discountCash: discountCash ? Number(discountCash) : undefined,
      minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
      maxOrderValue: maxOrderValue ? Number(maxOrderValue) : undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
      toast.success('Condicao de pagamento criada com sucesso!');
      handleClose();
    } catch {
      toast.error('Erro ao criar condicao de pagamento. Tente novamente.');
    }
  }

  const step1Valid =
    name.trim().length > 0 && Number(installments) > 0;

  const steps: WizardStep[] = [
    {
      title: 'Dados Basicos',
      description: 'Defina o nome, tipo e parcelas da condicao.',
      icon: (
        <CreditCard className="h-16 w-16 text-teal-400" strokeWidth={1.2} />
      ),
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              placeholder="Ex: 30/60/90 dias"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea
              placeholder="Descreva a condicao de pagamento..."
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={type}
                onChange={e =>
                  setType(e.target.value as PaymentConditionType)
                }
              >
                {Object.entries(PAYMENT_CONDITION_TYPE_LABELS).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Parcelas *</Label>
              <Input
                type="number"
                min={1}
                value={installments}
                onChange={e => setInstallments(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primeiro Vencimento (dias)</Label>
              <Input
                type="number"
                min={0}
                value={firstDueDays}
                onChange={e => setFirstDueDays(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Intervalo entre Parcelas (dias)</Label>
              <Input
                type="number"
                min={1}
                value={intervalDays}
                onChange={e => setIntervalDays(e.target.value)}
                placeholder="30"
              />
            </div>
          </div>
        </div>
      ),
      isValid: step1Valid,
    },
    {
      title: 'Regras Financeiras',
      description: 'Configure juros, multas e limites.',
      icon: (
        <Settings2 className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entrada (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                placeholder="0"
                value={downPaymentPercent}
                onChange={e => setDownPaymentPercent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Desconto a Vista (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                placeholder="0"
                value={discountCash}
                onChange={e => setDiscountCash(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Taxa de Juros (%)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Multa por Atraso (%)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                value={penaltyRate}
                onChange={e => setPenaltyRate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Minimo do Pedido (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Sem limite"
                value={minOrderValue}
                onChange={e => setMinOrderValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Maximo do Pedido (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Sem limite"
                value={maxOrderValue}
                onChange={e => setMaxOrderValue(e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
      isValid: true,
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Condicao
        </Button>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
