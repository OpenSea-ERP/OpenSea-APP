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
import { useVariants } from '@/hooks/stock/use-variants';
import type { CreateCustomerPriceRequest } from '@/types/sales';
import { BadgeDollarSign, Check, DollarSign, Loader2, User } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────

interface CreateCustomerPriceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCustomerPriceRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Step 1: Cliente e Variante ──────────────────────────────

function StepSelectEntities({
  customerId,
  onCustomerChange,
  variantId,
  onVariantChange,
  customers,
  variants,
}: {
  customerId: string;
  onCustomerChange: (v: string) => void;
  variantId: string;
  onVariantChange: (v: string) => void;
  customers: { id: string; name: string }[];
  variants: { id: string; name: string; sku?: string }[];
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
        <Label>Variante (Produto) *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={variantId}
          onChange={e => onVariantChange(e.target.value)}
        >
          <option value="">Selecione uma variante</option>
          {variants.map(v => (
            <option key={v.id} value={v.id}>
              {v.name}{v.sku ? ` (${v.sku})` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Step 2: Preco e Validade ────────────────────────────────

function StepPriceDetails({
  price,
  onPriceChange,
  validFrom,
  onValidFromChange,
  validUntil,
  onValidUntilChange,
  notes,
  onNotesChange,
}: {
  price: string;
  onPriceChange: (v: string) => void;
  validFrom: string;
  onValidFromChange: (v: string) => void;
  validUntil: string;
  onValidUntilChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Preco (R$) *</Label>
        <Input
          type="number"
          placeholder="0,00"
          value={price}
          onChange={e => onPriceChange(e.target.value)}
          min="0"
          step="0.01"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valido a partir de</Label>
          <Input
            type="date"
            value={validFrom}
            onChange={e => onValidFromChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Valido ate</Label>
          <Input
            type="date"
            value={validUntil}
            onChange={e => onValidUntilChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observacoes</Label>
        <Textarea
          placeholder="Observacoes sobre o preco negociado..."
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateCustomerPriceWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateCustomerPriceWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerId, setCustomerId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [price, setPrice] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');

  const { customers } = useCustomersInfinite();
  const { data: variantsData } = useVariants();

  const customersList = useMemo(
    () => (customers ?? []).map(c => ({ id: c.id, name: c.name })),
    [customers]
  );

  const variantsList = useMemo(
    () =>
      (variantsData?.variants ?? []).map((v: { id: string; name: string; sku?: string }) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
      })),
    [variantsData]
  );

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setCustomerId('');
    setVariantId('');
    setPrice('');
    setValidFrom('');
    setValidUntil('');
    setNotes('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const payload: CreateCustomerPriceRequest = {
      customerId,
      variantId,
      price: parseFloat(price),
      validFrom: validFrom || undefined,
      validUntil: validUntil || undefined,
      notes: notes.trim() || undefined,
    };

    await onSubmit(payload);
    handleClose();
  }, [customerId, variantId, price, validFrom, validUntil, notes, onSubmit, handleClose]);

  const steps: WizardStep[] = [
    {
      title: 'Cliente e Variante',
      description: 'Selecione o cliente e a variante do produto.',
      icon: <User className="h-16 w-16 text-violet-400" strokeWidth={1.2} />,
      content: (
        <StepSelectEntities
          customerId={customerId}
          onCustomerChange={setCustomerId}
          variantId={variantId}
          onVariantChange={setVariantId}
          customers={customersList}
          variants={variantsList}
        />
      ),
      isValid: !!customerId && !!variantId,
    },
    {
      title: 'Preco e Validade',
      description: 'Defina o preco negociado e periodo de validade.',
      icon: <DollarSign className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: (
        <StepPriceDetails
          price={price}
          onPriceChange={setPrice}
          validFrom={validFrom}
          onValidFromChange={setValidFrom}
          validUntil={validUntil}
          onValidUntilChange={setValidUntil}
          notes={notes}
          onNotesChange={setNotes}
        />
      ),
      isValid: !!price && parseFloat(price) > 0,
      footer: (
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !price || parseFloat(price) <= 0}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Preco
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
