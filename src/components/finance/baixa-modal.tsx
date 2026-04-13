'use client';

import { translateError } from '@/lib/error-messages';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useBankAccounts } from '@/hooks/finance/use-bank-accounts';
import { useRegisterPayment } from '@/hooks/finance/use-finance-entries';
import { cn } from '@/lib/utils';
import type { FinanceEntry, PaymentMethod } from '@/types/finance';
import { PAYMENT_METHOD_LABELS } from '@/types/finance';
import { format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import {
  AlertTriangle,
  CalendarIcon,
  CheckCircle,
  CreditCard,
  DollarSign,
  Loader2,
} from 'lucide-react';
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
  onSuccess?: () => void;
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
  onSuccess,
}: BaixaModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const registerPayment = useRegisterPayment();
  const { data: bankAccountsData } = useBankAccounts();
  const bankAccounts = bankAccountsData?.bankAccounts ?? [];

  // Form state
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
      setFieldErrors({});
      setCurrentStep(1);
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
    return (
      Math.round(entry.expectedAmount * dailyRate * overdueDays * 100) / 100
    );
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

  const selectedBankAccount = useMemo(
    () => bankAccounts.find(a => a.id === bankAccountId),
    [bankAccounts, bankAccountId]
  );

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const parsedAmount = parseCurrencyInput(amount);
    if (parsedAmount <= 0) {
      setFieldErrors({ amount: 'Informe um valor de pagamento válido.' });
      setCurrentStep(1);
      return;
    }
    setFieldErrors({});

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
      handleClose();
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('amount') ||
        msg.includes('Amount') ||
        msg.includes('valor')
      ) {
        setFieldErrors({ amount: translateError(msg) });
        setCurrentStep(1);
      } else {
        toast.error(translateError(msg));
      }
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
    handleClose,
    onSuccess,
  ]);

  // Step 1 validation: amount must be valid
  const step1Valid = useMemo(() => {
    const parsedAmount = parseCurrencyInput(amount);
    return parsedAmount > 0;
  }, [amount]);

  const steps: WizardStep[] = useMemo(
    () => [
      {
        title: 'Valor e Data',
        description: `Pagamento do lançamento ${entry.code}`,
        icon: (
          <DollarSign className="h-16 w-16 text-violet-400" strokeWidth={1.2} />
        ),
        content: (
          <div className="space-y-4 py-1">
            {/* Valor Pago */}
            <div className="space-y-1.5">
              <Label htmlFor="baixa-amount">Valor Pago (R$)</Label>
              <div className="relative">
                <Input
                  id="baixa-amount"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value);
                    if (fieldErrors.amount)
                      setFieldErrors(prev => ({ ...prev, amount: '' }));
                  }}
                  placeholder="0,00"
                  aria-invalid={!!fieldErrors.amount}
                />
                <FormErrorIcon message={fieldErrors.amount} />
              </div>
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
                    onSelect={date => {
                      if (date) setPaymentDate(date);
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Late Fees Section */}
            {isOverdue && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Pagamento em atraso ({overdueDays}{' '}
                    {overdueDays === 1 ? 'dia' : 'dias'})
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
                    onChange={e => setInterestOverride(e.target.value)}
                    placeholder="0,00"
                    className="h-8"
                  />
                  {categoryInterestRate ? (
                    <p className="text-xs text-muted-foreground">
                      Calculado automaticamente:{' '}
                      {formatCurrency(calculatedInterest)} (taxa mensal:{' '}
                      {(categoryInterestRate * 100).toFixed(1)}%)
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
                    onChange={e => setPenaltyOverride(e.target.value)}
                    placeholder="0,00"
                    className="h-8"
                  />
                  {categoryPenaltyRate ? (
                    <p className="text-xs text-muted-foreground">
                      Calculado automaticamente:{' '}
                      {formatCurrency(calculatedPenalty)} (taxa:{' '}
                      {(categoryPenaltyRate * 100).toFixed(1)}%)
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Categoria sem taxa de multa definida
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ),
        isValid: step1Valid,
      },
      {
        title: 'Método',
        description: 'Selecione a conta e o método de pagamento',
        icon: (
          <CreditCard className="h-16 w-16 text-sky-400" strokeWidth={1.2} />
        ),
        content: (
          <div className="space-y-4 py-2">
            {/* Conta Bancária */}
            <div className="space-y-1.5">
              <Label htmlFor="baixa-bank-account">Conta Bancária</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Método de Pagamento */}
            <div className="space-y-1.5">
              <Label htmlFor="baixa-method">Método de Pagamento</Label>
              <Select
                value={method}
                onValueChange={v => setMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar método" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Referência */}
            <div className="space-y-1.5">
              <Label htmlFor="baixa-reference">Referência</Label>
              <Input
                id="baixa-reference"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="ID da transação, n. do boleto, etc."
              />
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="baixa-notes">Observações</Label>
              <Textarea
                id="baixa-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observações sobre o pagamento..."
                rows={2}
              />
            </div>
          </div>
        ),
        isValid: true,
      },
      {
        title: 'Confirmação',
        description: 'Revise os dados antes de confirmar o pagamento',
        icon: (
          <CheckCircle
            className="h-16 w-16 text-emerald-400"
            strokeWidth={1.2}
          />
        ),
        content: (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lançamento</span>
                <span className="font-mono font-medium">{entry.code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descrição</span>
                <span className="font-medium text-right max-w-[60%] truncate">
                  {entry.description}
                </span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Valor do pagamento
                </span>
                <span className="font-medium">
                  {formatCurrency(parseCurrencyInput(amount))}
                </span>
              </div>
              {effectiveInterest > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Juros</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    +{formatCurrency(effectiveInterest)}
                  </span>
                </div>
              )}
              {effectivePenalty > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Multa</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    +{formatCurrency(effectivePenalty)}
                  </span>
                </div>
              )}
              <div className="border-t border-border/50 pt-3 flex justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                  {formatCurrency(totalWithFees)}
                </span>
              </div>
              <div className="border-t border-border/50 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Data de pagamento
                  </span>
                  <span className="font-medium">
                    {format(paymentDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                {selectedBankAccount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Conta bancária
                    </span>
                    <span className="font-medium">
                      {selectedBankAccount.name}
                    </span>
                  </div>
                )}
                {method && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Método</span>
                    <span className="font-medium">
                      {PAYMENT_METHOD_LABELS[method as PaymentMethod]}
                    </span>
                  </div>
                )}
                {reference && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Referência</span>
                    <span className="font-medium">{reference}</span>
                  </div>
                )}
              </div>
            </div>
            {isOverdue && (
              <Badge
                variant="outline"
                className="border-amber-500/30 text-amber-600 dark:text-amber-400"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Pagamento em atraso ({overdueDays}{' '}
                {overdueDays === 1 ? 'dia' : 'dias'})
              </Badge>
            )}
          </div>
        ),
        footer: (
          <div className="flex items-center gap-2 w-full justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(2)}
            >
              ← Voltar
            </Button>
            <Button onClick={handleSubmit} disabled={registerPayment.isPending}>
              {registerPayment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              Registrar Pagamento
            </Button>
          </div>
        ),
      },
    ],
    [
      amount,
      fieldErrors,
      paymentDate,
      isOverdue,
      overdueDays,
      interestOverride,
      penaltyOverride,
      calculatedInterest,
      calculatedPenalty,
      categoryInterestRate,
      categoryPenaltyRate,
      effectiveInterest,
      effectivePenalty,
      totalWithFees,
      step1Valid,
      bankAccountId,
      bankAccounts,
      method,
      reference,
      notes,
      entry,
      selectedBankAccount,
      handleSubmit,
      registerPayment.isPending,
    ]
  );

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={val => {
        if (!val) handleClose();
      }}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
      heightClass="h-[540px]"
    />
  );
}
