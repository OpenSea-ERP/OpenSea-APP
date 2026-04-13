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
import { useCreateCoupon } from '@/hooks/sales/use-coupons';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import type { CouponType, CreateCouponRequest } from '@/types/sales';
import { COUPON_TYPE_LABELS } from '@/types/sales';
import { Check, Loader2, ShieldCheck, Ticket } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface CreateCouponWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCouponWizard({
  open,
  onOpenChange,
}: CreateCouponWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 — Basic info
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<CouponType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');

  // Step 2 — Rules
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxUsageCount, setMaxUsageCount] = useState('');
  const [maxUsagePerCustomer, setMaxUsagePerCustomer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateCoupon();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setCode('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setMinOrderValue('');
    setMaxUsageCount('');
    setMaxUsagePerCustomer('');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setFieldErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  async function handleSubmit() {
    const payload: CreateCouponRequest = {
      code: code.trim().toUpperCase(),
      type: discountType,
      value: Number(discountValue),
      minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
      maxUsageTotal: maxUsageCount ? Number(maxUsageCount) : undefined,
      maxUsagePerCustomer: maxUsagePerCustomer
        ? Number(maxUsagePerCustomer)
        : undefined,
      validFrom: new Date(startDate).toISOString(),
      validUntil: new Date(endDate).toISOString(),
      isActive,
    };

    try {
      await createMutation.mutateAsync(payload);
      toast.success('Cupom criado com sucesso!');
      handleClose();
    } catch (err) {
      const apiError = ApiError.from(err);
      const fieldMap: Record<string, string> = {
        'code already': 'code',
        'Coupon code already': 'code',
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

  const step1Valid = code.trim().length > 0 && discountValue.trim().length > 0;
  const step2Valid = startDate.length > 0 && endDate.length > 0;

  const steps: WizardStep[] = [
    {
      title: 'Informações Básicas',
      description: 'Defina o código, tipo e valor do cupom.',
      icon: <Ticket className="h-16 w-16 text-teal-400" strokeWidth={1.2} />,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Código do Cupom *</Label>
            <div className="relative">
              <Input
                data-testid="coupon-create-code"
                placeholder="Ex: DESCONTO10"
                value={code}
                onChange={e => {
                  setCode(e.target.value.toUpperCase());
                  setFieldErrors(prev => {
                    const { code: _, ...rest } = prev;
                    return rest;
                  });
                }}
                className="font-mono"
                aria-invalid={!!fieldErrors.code}
              />
              <FormErrorIcon message={fieldErrors.code} />
            </div>
            <p className="text-xs text-muted-foreground">
              O código será convertido automáticamente para maiúsculas.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descreva o cupom..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Desconto *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={discountType}
                onChange={e => setDiscountType(e.target.value as CouponType)}
              >
                {Object.entries(COUPON_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Valor do Desconto *</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder={
                  discountType === 'PERCENTAGE'
                    ? 'Ex: 10'
                    : discountType === 'FREE_SHIPPING'
                      ? '0'
                      : 'Ex: 25.00'
                }
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                disabled={discountType === 'FREE_SHIPPING'}
              />
            </div>
          </div>
        </div>
      ),
      isValid: step1Valid,
    },
    {
      title: 'Regras e Vigência',
      description: 'Configure limites de uso e período de validade.',
      icon: (
        <ShieldCheck className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Término *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Valor Mínimo do Pedido</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="Ex: 50.00"
              value={minOrderValue}
              onChange={e => setMinOrderValue(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Limite Total de Usos</Label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 100"
                value={maxUsageCount}
                onChange={e => setMaxUsageCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Limite por Cliente</Label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 1"
                value={maxUsagePerCustomer}
                onChange={e => setMaxUsagePerCustomer(e.target.value)}
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
              {isActive ? 'Cupom ativo' : 'Cupom inativo'}
            </Label>
          </div>
        </div>
      ),
      isValid: step2Valid,
      footer: (
        <Button
          type="button"
          data-testid="coupon-create-submit"
          onClick={handleSubmit}
          disabled={!step2Valid || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Cupom
        </Button>
      ),
    },
  ];

  return (
    <StepWizardDialog
      data-testid="coupon-create-wizard"
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
