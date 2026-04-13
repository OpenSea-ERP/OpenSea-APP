'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { useVariants } from '@/hooks/stock/use-variants';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import type { CreateItemReservationRequest } from '@/types/sales';
import { Calendar, Check, Hash, Loader2, Package } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────

interface CreateItemReservationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateItemReservationRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Step 1: Item e Quantidade ───────────────────────────────

function StepItemAndQuantity({
  itemId,
  onItemChange,
  quantity,
  onQuantityChange,
  variants,
}: {
  itemId: string;
  onItemChange: (v: string) => void;
  quantity: string;
  onQuantityChange: (v: string) => void;
  variants: { id: string; name: string; sku?: string }[];
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Item (Variante) *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={itemId}
          onChange={e => onItemChange(e.target.value)}
        >
          <option value="">Selecione um item</option>
          {variants.map(v => (
            <option key={v.id} value={v.id}>
              {v.name}
              {v.sku ? ` (${v.sku})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Quantidade *</Label>
        <Input
          type="number"
          placeholder="1"
          value={quantity}
          onChange={e => onQuantityChange(e.target.value)}
          min="1"
          step="1"
        />
      </div>
    </div>
  );
}

// ─── Step 2: Expiração e Pedido ──────────────────────────────

function StepExpirationAndOrder({
  expiresAt,
  onExpiresAtChange,
  salesOrderId,
  onSalesOrderIdChange,
}: {
  expiresAt: string;
  onExpiresAtChange: (v: string) => void;
  salesOrderId: string;
  onSalesOrderIdChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Data de expiração *</Label>
        <Input
          type="datetime-local"
          value={expiresAt}
          onChange={e => onExpiresAtChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Data e hora em que a reserva expira automáticamente.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Referencia do pedido</Label>
        <Input
          placeholder="ID do pedido (opcional)"
          value={salesOrderId}
          onChange={e => onSalesOrderIdChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Vincule a reserva a um pedido de venda existente (opcional).
        </p>
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateItemReservationWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateItemReservationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [salesOrderId, setSalesOrderId] = useState('');

  const { data: variantsData } = useVariants();

  const variantsList = useMemo(
    () =>
      (variantsData?.variants ?? []).map(
        (v: { id: string; name: string; sku?: string }) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
        })
      ),
    [variantsData]
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setItemId('');
    setQuantity('');
    setExpiresAt('');
    setSalesOrderId('');
    setFieldErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const payload: CreateItemReservationRequest = {
      itemId,
      quantity: parseInt(quantity, 10),
      expiresAt: new Date(expiresAt),
      salesOrderId: salesOrderId.trim() || undefined,
    };

    try {
      await onSubmit(payload);
      handleClose();
    } catch (err) {
      const apiError = ApiError.from(err);
      if (apiError.message.includes('Insufficient stock')) {
        toast.error(translateError(apiError.message));
      } else {
        toast.error(translateError(apiError.message));
      }
    }
  }, [itemId, quantity, expiresAt, salesOrderId, onSubmit, handleClose]);

  const steps: WizardStep[] = [
    {
      title: 'Item e Quantidade',
      description: 'Selecione o item e a quantidade a reservar.',
      icon: <Package className="h-16 w-16 text-teal-400" strokeWidth={1.2} />,
      content: (
        <StepItemAndQuantity
          itemId={itemId}
          onItemChange={setItemId}
          quantity={quantity}
          onQuantityChange={setQuantity}
          variants={variantsList}
        />
      ),
      isValid: !!itemId && !!quantity && parseInt(quantity, 10) > 0,
    },
    {
      title: 'Expiração e Pedido',
      description: 'Defina a expiração e vincule a um pedido (opcional).',
      icon: <Calendar className="h-16 w-16 text-sky-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: (
        <StepExpirationAndOrder
          expiresAt={expiresAt}
          onExpiresAtChange={setExpiresAt}
          salesOrderId={salesOrderId}
          onSalesOrderIdChange={setSalesOrderId}
        />
      ),
      isValid: !!expiresAt,
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !expiresAt}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Reserva
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
