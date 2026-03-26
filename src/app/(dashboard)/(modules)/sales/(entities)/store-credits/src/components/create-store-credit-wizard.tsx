'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { useCustomersInfinite } from '@/hooks/sales/use-customers';
import type { CreateStoreCreditRequest } from '@/types/sales';
import { Calendar, Check, Loader2, User, Wallet } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────

interface CreateStoreCreditWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateStoreCreditRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Step 1: Cliente e Valor ─────────────────────────────────

function StepClientAndAmount({
  customerId,
  onCustomerChange,
  amount,
  onAmountChange,
  customers,
}: {
  customerId: string;
  onCustomerChange: (v: string) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  customers: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Cliente *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={customerId}
          onChange={e => onCustomerChange(e.target.value)}
        >
          <option value="">Selecione um cliente</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Valor (R$) *</Label>
        <Input
          type="number"
          placeholder="0,00"
          value={amount}
          onChange={e => onAmountChange(e.target.value)}
          min="0"
          step="0.01"
        />
      </div>
    </div>
  );
}

// ─── Step 2: Validade ────────────────────────────────────────

function StepExpiration({
  expiresAt,
  onExpiresAtChange,
}: {
  expiresAt: string;
  onExpiresAtChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Data de expiracao</Label>
        <Input
          type="date"
          value={expiresAt}
          onChange={e => onExpiresAtChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Deixe em branco para credito sem data de expiracao.
        </p>
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateStoreCreditWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateStoreCreditWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const { customers } = useCustomersInfinite();

  const customersList = useMemo(
    () => (customers ?? []).map(c => ({ id: c.id, name: c.name })),
    [customers]
  );

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setCustomerId('');
    setAmount('');
    setExpiresAt('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const payload: CreateStoreCreditRequest = {
      customerId,
      amount: parseFloat(amount),
      expiresAt: expiresAt || undefined,
    };

    await onSubmit(payload);
    handleClose();
  }, [customerId, amount, expiresAt, onSubmit, handleClose]);

  const steps: WizardStep[] = [
    {
      title: 'Cliente e Valor',
      description: 'Selecione o cliente e informe o valor do credito.',
      icon: <Wallet className="h-16 w-16 text-violet-400" strokeWidth={1.2} />,
      content: (
        <StepClientAndAmount
          customerId={customerId}
          onCustomerChange={setCustomerId}
          amount={amount}
          onAmountChange={setAmount}
          customers={customersList}
        />
      ),
      isValid: !!customerId && !!amount && parseFloat(amount) > 0,
    },
    {
      title: 'Validade',
      description: 'Defina a data de expiracao do credito (opcional).',
      icon: <Calendar className="h-16 w-16 text-sky-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: (
        <StepExpiration
          expiresAt={expiresAt}
          onExpiresAtChange={setExpiresAt}
        />
      ),
      isValid: true,
      footer: (
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Credito
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
