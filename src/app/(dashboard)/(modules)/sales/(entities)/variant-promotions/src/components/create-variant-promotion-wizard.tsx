'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import type { CreateVariantPromotionRequest } from '@/types/sales';
import type { DiscountType } from '@/types/sales/promotion.types';
import { CalendarDays, Check, Loader2, Percent } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface CreateVariantPromotionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateVariantPromotionRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ============================================================================
// STEP 1: Informações da Promoção
// ============================================================================

function StepPromotionInfo({
  name,
  onNameChange,
  variantId,
  onVariantIdChange,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  variantId: string;
  onVariantIdChange: (v: string) => void;
  discountType: DiscountType;
  onDiscountTypeChange: (v: DiscountType) => void;
  discountValue: string;
  onDiscountValueChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome da Promoção *</Label>
        <Input
          placeholder="Ex: Promoção de Verão"
          value={name}
          onChange={e => onNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>ID da Variante *</Label>
        <Input
          placeholder="Informe o ID da variante do produto"
          value={variantId}
          onChange={e => onVariantIdChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Identifique a variante do produto que receberá o desconto.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Desconto *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={discountType}
          onChange={e => onDiscountTypeChange(e.target.value as DiscountType)}
        >
          <option value="PERCENTAGE">Percentual</option>
          <option value="FIXED">Valor Fixo</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>
          Valor do Desconto * {discountType === 'PERCENTAGE' ? '(%)' : '(R$)'}
        </Label>
        <Input
          type="number"
          min="0"
          step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
          max={discountType === 'PERCENTAGE' ? '100' : undefined}
          placeholder={discountType === 'PERCENTAGE' ? 'Ex: 15' : 'Ex: 25.00'}
          value={discountValue}
          onChange={e => onDiscountValueChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ============================================================================
// STEP 2: Período e Detalhes
// ============================================================================

function StepPeriodAndDetails({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  notes,
  onNotesChange,
  name,
  discountType,
  discountValue,
  variantId,
}: {
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  name: string;
  discountType: DiscountType;
  discountValue: string;
  variantId: string;
}) {
  const discountLabel =
    discountType === 'PERCENTAGE'
      ? `${discountValue}% de desconto`
      : `R$ ${Number(discountValue || 0).toFixed(2)} de desconto`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Data de Início *</Label>
          <Input
            type="date"
            value={startDate}
            onChange={e => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Data de Término *</Label>
          <Input
            type="date"
            value={endDate}
            onChange={e => onEndDateChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          placeholder="Notas adicionais sobre a promoção..."
          rows={3}
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
        />
      </div>

      {/* Review summary */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Resumo</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Nome</p>
            <p className="font-medium">{name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Desconto</p>
            <p className="font-medium">{discountLabel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Variante</p>
            <p className="font-medium truncate">
              {variantId ? variantId.slice(0, 12) + '...' : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Período</p>
            <p className="font-medium">
              {startDate && endDate
                ? `${new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} - ${new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
                : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

export function CreateVariantPromotionWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateVariantPromotionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [variantId, setVariantId] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setVariantId('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const payload: CreateVariantPromotionRequest = {
      name: name.trim(),
      variantId: variantId.trim(),
      discountType,
      discountValue: Number(discountValue),
      startDate: new Date(startDate + 'T00:00:00').toISOString(),
      endDate: new Date(endDate + 'T23:59:59').toISOString(),
      isActive: true,
      notes: notes.trim() || undefined,
    };

    await onSubmit(payload);
    handleClose();
  }, [
    name,
    variantId,
    discountType,
    discountValue,
    startDate,
    endDate,
    notes,
    onSubmit,
    handleClose,
  ]);

  const step1Valid = useMemo(
    () =>
      name.trim().length > 0 &&
      variantId.trim().length > 0 &&
      Number(discountValue) > 0,
    [name, variantId, discountValue]
  );

  const step2Valid = useMemo(
    () => startDate.length > 0 && endDate.length > 0 && endDate >= startDate,
    [startDate, endDate]
  );

  const steps: WizardStep[] = [
    {
      title: 'Informações da Promoção',
      description: 'Defina o nome, variante e tipo de desconto.',
      icon: <Percent className="h-16 w-16 text-violet-400" strokeWidth={1.2} />,
      content: (
        <StepPromotionInfo
          name={name}
          onNameChange={setName}
          variantId={variantId}
          onVariantIdChange={setVariantId}
          discountType={discountType}
          onDiscountTypeChange={setDiscountType}
          discountValue={discountValue}
          onDiscountValueChange={setDiscountValue}
        />
      ),
      isValid: step1Valid,
    },
    {
      title: 'Período e Detalhes',
      description: 'Defina o período de vigência e revise os dados.',
      icon: (
        <CalendarDays
          className="h-16 w-16 text-emerald-400"
          strokeWidth={1.2}
        />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <StepPeriodAndDetails
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          notes={notes}
          onNotesChange={setNotes}
          name={name}
          discountType={discountType}
          discountValue={discountValue}
          variantId={variantId}
        />
      ),
      isValid: step2Valid,
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !step2Valid}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Promoção
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
