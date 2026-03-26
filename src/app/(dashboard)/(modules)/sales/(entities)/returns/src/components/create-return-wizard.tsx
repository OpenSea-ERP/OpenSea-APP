'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { useOrdersInfinite } from '@/hooks/sales/use-orders';
import type {
  CreateReturnRequest,
  ReturnReason,
  ReturnType,
  RefundMethod,
} from '@/types/sales';
import { Check, Loader2, Package, RotateCcw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

// ─── Labels ───────────────────────────────────────────────────

const RETURN_TYPE_LABELS: Record<ReturnType, string> = {
  FULL_RETURN: 'Devolucao Total',
  PARTIAL_RETURN: 'Devolucao Parcial',
  EXCHANGE: 'Troca',
};

const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  DEFECTIVE: 'Defeituoso',
  WRONG_ITEM: 'Item Errado',
  CHANGED_MIND: 'Desistencia',
  DAMAGED: 'Danificado',
  NOT_AS_DESCRIBED: 'Nao Conforme',
  OTHER: 'Outro',
};

const REFUND_METHOD_LABELS: Record<RefundMethod, string> = {
  SAME_METHOD: 'Mesmo Metodo',
  STORE_CREDIT: 'Credito de Loja',
  BANK_TRANSFER: 'Transferencia Bancaria',
  PIX: 'PIX',
};

// ─── Types ────────────────────────────────────────────────────

interface CreateReturnWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateReturnRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Step 1: Pedido e Motivo ─────────────────────────────────

function StepOrderAndReason({
  orderId,
  onOrderChange,
  type,
  onTypeChange,
  reason,
  onReasonChange,
  orders,
}: {
  orderId: string;
  onOrderChange: (v: string) => void;
  type: ReturnType | '';
  onTypeChange: (v: ReturnType) => void;
  reason: ReturnReason | '';
  onReasonChange: (v: ReturnReason) => void;
  orders: { id: string; orderNumber: string }[];
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pedido *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={orderId}
          onChange={e => onOrderChange(e.target.value)}
        >
          <option value="">Selecione um pedido</option>
          {orders.map(o => (
            <option key={o.id} value={o.id}>
              {o.orderNumber}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Tipo de devolucao *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={type}
          onChange={e => onTypeChange(e.target.value as ReturnType)}
        >
          <option value="">Selecione o tipo</option>
          {Object.entries(RETURN_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Motivo *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={reason}
          onChange={e => onReasonChange(e.target.value as ReturnReason)}
        >
          <option value="">Selecione o motivo</option>
          {Object.entries(RETURN_REASON_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Step 2: Reembolso e Detalhes ────────────────────────────

function StepRefundDetails({
  refundMethod,
  onRefundMethodChange,
  refundAmount,
  onRefundAmountChange,
  reasonDetails,
  onReasonDetailsChange,
  notes,
  onNotesChange,
}: {
  refundMethod: RefundMethod | '';
  onRefundMethodChange: (v: RefundMethod) => void;
  refundAmount: string;
  onRefundAmountChange: (v: string) => void;
  reasonDetails: string;
  onReasonDetailsChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Metodo de reembolso</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={refundMethod}
          onChange={e => onRefundMethodChange(e.target.value as RefundMethod)}
        >
          <option value="">Selecione o metodo</option>
          {Object.entries(REFUND_METHOD_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Valor do reembolso (R$)</Label>
        <Input
          type="number"
          placeholder="0,00"
          value={refundAmount}
          onChange={e => onRefundAmountChange(e.target.value)}
          min="0"
          step="0.01"
        />
      </div>

      <div className="space-y-2">
        <Label>Detalhes do motivo</Label>
        <Textarea
          placeholder="Descreva o motivo em detalhes..."
          value={reasonDetails}
          onChange={e => onReasonDetailsChange(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Observacoes</Label>
        <Textarea
          placeholder="Observacoes adicionais..."
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateReturnWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateReturnWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderId, setOrderId] = useState('');
  const [type, setType] = useState<ReturnType | ''>('');
  const [reason, setReason] = useState<ReturnReason | ''>('');
  const [refundMethod, setRefundMethod] = useState<RefundMethod | ''>('');
  const [refundAmount, setRefundAmount] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [notes, setNotes] = useState('');

  const { data: ordersData } = useOrdersInfinite();

  const ordersList = useMemo(() => {
    const pages = ordersData?.pages ?? [];
    const allOrders = pages.flatMap((p: { data?: { id: string; orderNumber: string }[] }) => p.data ?? []);
    return allOrders.map((o: { id: string; orderNumber: string }) => ({
      id: o.id,
      orderNumber: o.orderNumber,
    }));
  }, [ordersData]);

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setOrderId('');
    setType('');
    setReason('');
    setRefundMethod('');
    setRefundAmount('');
    setReasonDetails('');
    setNotes('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const payload: CreateReturnRequest = {
      orderId,
      type: type as ReturnType,
      reason: reason as ReturnReason,
      refundMethod: (refundMethod as RefundMethod) || undefined,
      refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
      reasonDetails: reasonDetails.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    await onSubmit(payload);
    handleClose();
  }, [orderId, type, reason, refundMethod, refundAmount, reasonDetails, notes, onSubmit, handleClose]);

  const steps: WizardStep[] = [
    {
      title: 'Pedido e Motivo',
      description: 'Selecione o pedido, tipo e motivo da devolucao.',
      icon: <RotateCcw className="h-16 w-16 text-violet-400" strokeWidth={1.2} />,
      content: (
        <StepOrderAndReason
          orderId={orderId}
          onOrderChange={setOrderId}
          type={type}
          onTypeChange={setType}
          reason={reason}
          onReasonChange={setReason}
          orders={ordersList}
        />
      ),
      isValid: !!orderId && !!type && !!reason,
    },
    {
      title: 'Reembolso e Detalhes',
      description: 'Defina o metodo de reembolso e observacoes.',
      icon: <Package className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: (
        <StepRefundDetails
          refundMethod={refundMethod}
          onRefundMethodChange={setRefundMethod}
          refundAmount={refundAmount}
          onRefundAmountChange={setRefundAmount}
          reasonDetails={reasonDetails}
          onReasonDetailsChange={setReasonDetails}
          notes={notes}
          onNotesChange={setNotes}
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
          Criar Devolucao
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
