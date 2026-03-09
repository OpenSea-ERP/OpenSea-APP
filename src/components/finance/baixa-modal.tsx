'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useBankAccounts } from '@/hooks/finance/use-bank-accounts';
import { useRegisterPayment } from '@/hooks/finance/use-finance-entries';
import { cn } from '@/lib/utils';
import type {
  FinanceEntry,
  PaymentMethod,
} from '@/types/finance';
import { PAYMENT_METHOD_LABELS } from '@/types/finance';
import { format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CalendarIcon, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface BaixaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: FinanceEntry;
  categoryInterestRate?: number;
  categoryPenaltyRate?: number;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'PIX', label: PAYMENT_METHOD_LABELS.PIX },
  { value: 'BOLETO', label: PAYMENT_METHOD_LABELS.BOLETO },
  { value: 'TRANSFER', label: PAYMENT_METHOD_LABELS.TRANSFER },
  { value: 'CASH', label: PAYMENT_METHOD_LABELS.CASH },
  { value: 'CHECK', label: PAYMENT_METHOD_LABELS.CHECK },
  { value: 'CARD', label: PAYMENT_METHOD_LABELS.CARD },
];

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BaixaModal({
  open,
  onOpenChange,
  entry,
  categoryInterestRate,
  categoryPenaltyRate,
}: BaixaModalProps) {
  const registerPayment = useRegisterPayment();
  const { data: bankAccountsData } = useBankAccounts();
  const bankAccounts = bankAccountsData?.bankAccounts ?? [];

  // Form state
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [bankAccountId, setBankAccountId] = useState('');
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [interestOverride, setInterestOverride] = useState('');
  const [penaltyOverride, setPenaltyOverride] = useState('');

  // Reset form when entry changes or modal opens
  useEffect(() => {
    if (open && entry) {
      setAmount(entry.remainingBalance.toFixed(2).replace('.', ','));
      setPaymentDate(new Date());
      setBankAccountId(entry.bankAccountId ?? '');
      setMethod('');
      setReference('');
      setNotes('');
      setInterestOverride('');
      setPenaltyOverride('');
    }
  }, [open, entry]);

  // Late fee calculation
  const overdueDays = useMemo(() => {
    if (!entry) return 0;
    const due = new Date(entry.dueDate);
    const days = differenceInCalendarDays(paymentDate, due);
    return Math.max(0, days);
  }, [entry, paymentDate]);

  const isOverdue = overdueDays > 0;

  const calculatedInterest = useMemo(() => {
    if (!isOverdue || !categoryInterestRate) return 0;
    const dailyRate = categoryInterestRate / 30;
    return Math.round(entry.expectedAmount * dailyRate * overdueDays * 100) / 100;
  }, [isOverdue, categoryInterestRate, entry.expectedAmount, overdueDays]);

  const calculatedPenalty = useMemo(() => {
    if (!isOverdue || !categoryPenaltyRate) return 0;
    return Math.round(entry.expectedAmount * categoryPenaltyRate * 100) / 100;
  }, [isOverdue, categoryPenaltyRate, entry.expectedAmount]);

  // Use overrides if user typed values, otherwise use calculated
  const effectiveInterest = useMemo(() => {
    if (interestOverride !== '') return parseCurrencyInput(interestOverride);
    return calculatedInterest;
  }, [interestOverride, calculatedInterest]);

  const effectivePenalty = useMemo(() => {
    if (penaltyOverride !== '') return parseCurrencyInput(penaltyOverride);
    return calculatedPenalty;
  }, [penaltyOverride, calculatedPenalty]);

  // Set auto-calculated values into override fields when calculated values change
  useEffect(() => {
    if (isOverdue && calculatedInterest > 0 && interestOverride === '') {
      setInterestOverride(calculatedInterest.toFixed(2).replace('.', ','));
    }
    if (isOverdue && calculatedPenalty > 0 && penaltyOverride === '') {
      setPenaltyOverride(calculatedPenalty.toFixed(2).replace('.', ','));
    }
    // Only run when overdue status or calculated values change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOverdue, calculatedInterest, calculatedPenalty]);

  const totalWithFees = useMemo(() => {
    const baseAmount = parseCurrencyInput(amount);
    return baseAmount + effectiveInterest + effectivePenalty;
  }, [amount, effectiveInterest, effectivePenalty]);

  const handleSubmit = useCallback(async () => {
    const parsedAmount = parseCurrencyInput(amount);
    if (parsedAmount <= 0) {
      toast.error('Informe um valor de pagamento valido.');
      return;
    }

    try {
      await registerPayment.mutateAsync({
        entryId: entry.id,
        data: {
          amount: parsedAmount,
          paidAt: format(paymentDate, 'yyyy-MM-dd'),
          bankAccountId: bankAccountId || undefined,
          method: (method as PaymentMethod) || undefined,
          reference: reference || undefined,
          notes: notes || undefined,
          interest: effectiveInterest > 0 ? effectiveInterest : undefined,
          penalty: effectivePenalty > 0 ? effectivePenalty : undefined,
        },
      });
      toast.success('Pagamento registrado com sucesso!');
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao registrar pagamento.';
      toast.error(message);
    }
  }, [
    amount,
    entry.id,
    paymentDate,
    bankAccountId,
    method,
    reference,
    notes,
    effectiveInterest,
    effectivePenalty,
    registerPayment,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <div className="text-sm text-muted-foreground mt-1">
            <span className="font-mono">{entry.code}</span> - {entry.description}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Valor Pago */}
          <div className="space-y-1.5">
            <Label htmlFor="baixa-amount">Valor Pago (R$)</Label>
            <Input
              id="baixa-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
            <p className="text-xs text-muted-foreground">
              Saldo restante: {formatCurrency(entry.remainingBalance)}
            </p>
          </div>

          {/* Data de Pagamento */}
          <div className="space-y-1.5">
            <Label>Data de Pagamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !paymentDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate
                    ? format(paymentDate, 'dd/MM/yyyy', { locale: ptBR })
                    : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => {
                    if (date) setPaymentDate(date);
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Conta Bancaria */}
          <div className="space-y-1.5">
            <Label htmlFor="baixa-bank-account">Conta Bancaria</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar conta" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Metodo de Pagamento */}
          <div className="space-y-1.5">
            <Label htmlFor="baixa-method">Metodo de Pagamento</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar metodo" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Referencia */}
          <div className="space-y-1.5">
            <Label htmlFor="baixa-reference">Referencia</Label>
            <Input
              id="baixa-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="ID da transacao, n. do boleto, etc."
            />
          </div>

          {/* Late Fees Section */}
          {isOverdue && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Pagamento em atraso ({overdueDays} {overdueDays === 1 ? 'dia' : 'dias'})
                </span>
              </div>

              {/* Juros */}
              <div className="space-y-1">
                <Label htmlFor="baixa-interest" className="text-sm">
                  Juros ({overdueDays} dias de atraso)
                </Label>
                <Input
                  id="baixa-interest"
                  value={interestOverride}
                  onChange={(e) => setInterestOverride(e.target.value)}
                  placeholder="0,00"
                  className="h-8"
                />
                {categoryInterestRate ? (
                  <p className="text-xs text-muted-foreground">
                    Calculado automaticamente: {formatCurrency(calculatedInterest)}{' '}
                    (taxa mensal: {(categoryInterestRate * 100).toFixed(1)}%)
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Categoria sem taxa de juros definida
                  </p>
                )}
              </div>

              {/* Multa */}
              <div className="space-y-1">
                <Label htmlFor="baixa-penalty" className="text-sm">
                  Multa
                </Label>
                <Input
                  id="baixa-penalty"
                  value={penaltyOverride}
                  onChange={(e) => setPenaltyOverride(e.target.value)}
                  placeholder="0,00"
                  className="h-8"
                />
                {categoryPenaltyRate ? (
                  <p className="text-xs text-muted-foreground">
                    Calculado automaticamente: {formatCurrency(calculatedPenalty)}{' '}
                    (taxa: {(categoryPenaltyRate * 100).toFixed(1)}%)
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Categoria sem taxa de multa definida
                  </p>
                )}
              </div>

              {/* Total com encargos */}
              <div className="pt-2 border-t border-yellow-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total a pagar</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(totalWithFees)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Valor do pagamento</span>
                    <span>{formatCurrency(parseCurrencyInput(amount))}</span>
                  </div>
                  {effectiveInterest > 0 && (
                    <div className="flex justify-between">
                      <span>Juros</span>
                      <span>+{formatCurrency(effectiveInterest)}</span>
                    </div>
                  )}
                  {effectivePenalty > 0 && (
                    <div className="flex justify-between">
                      <span>Multa</span>
                      <span>+{formatCurrency(effectivePenalty)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Observacoes */}
          <div className="space-y-1.5">
            <Label htmlFor="baixa-notes">Observacoes</Label>
            <Textarea
              id="baixa-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observacoes sobre o pagamento..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={registerPayment.isPending}
          >
            {registerPayment.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
