'use client';

import * as React from 'react';
import {
  Banknote,
  CreditCard,
  QrCode,
  Wallet,
  CircleDollarSign,
  MoreHorizontal,
  X,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Numpad } from '@/components/ui/numpad';
import { Button } from '@/components/ui/button';

// =============================================================================
// TYPES
// =============================================================================

type PaymentMethodType =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PIX'
  | 'STORE_CREDIT'
  | 'OTHER';

interface PaymentEntry {
  id: string;
  method: PaymentMethodType;
  amount: number; // in decimal (e.g., 45.90)
  nsu?: string;
  authorizationCode?: string;
  installments?: number;
  notes?: string;
}

interface PaymentOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  /** Grand total in decimal (e.g., 45.90) */
  total: number;
  orderId: string;
  terminalMode: string;
  posSessionId?: string;
  onSuccess: (result: { changeAmount: number; saleCode: string }) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PAYMENT_METHODS: Array<{
  type: PaymentMethodType;
  label: string;
  icon: React.ElementType;
}> = [
  { type: 'CASH', label: 'Dinheiro', icon: Banknote },
  { type: 'CREDIT_CARD', label: 'Cartão Crédito', icon: CreditCard },
  { type: 'DEBIT_CARD', label: 'Cartão Débito', icon: CreditCard },
  { type: 'PIX', label: 'PIX', icon: QrCode },
  { type: 'STORE_CREDIT', label: 'Crédito Loja', icon: Wallet },
  { type: 'OTHER', label: 'Outro', icon: MoreHorizontal },
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão Crédito',
  DEBIT_CARD: 'Cartão Débito',
  PIX: 'PIX',
  STORE_CREDIT: 'Crédito Loja',
  OTHER: 'Outro',
};

const STORAGE_KEY = 'pos_payment_intent';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// =============================================================================
// PAYMENT OVERLAY COMPONENT
// =============================================================================

function PaymentOverlay({
  isOpen,
  onClose,
  total,
  orderId,
  terminalMode,
  posSessionId,
  onSuccess,
}: PaymentOverlayProps) {
  const [selectedMethod, setSelectedMethod] =
    React.useState<PaymentMethodType | null>(null);
  const [payments, setPayments] = React.useState<PaymentEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state for current entry
  const [cashCents, setCashCents] = React.useState(0);
  const [cardAmount, setCardAmount] = React.useState('');
  const [nsu, setNsu] = React.useState('');
  const [authCode, setAuthCode] = React.useState('');
  const [installments, setInstallments] = React.useState('1');
  const [pixAmount, setPixAmount] = React.useState('');
  const [otherAmount, setOtherAmount] = React.useState('');
  const [otherNotes, setOtherNotes] = React.useState('');

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);
  const totalCents = Math.round(total * 100);
  const remainingCents = Math.round(remaining * 100);
  const canConfirm = totalPaid >= total && payments.length > 0;

  // Reset state when overlay opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMethod(null);
      setPayments([]);
      setError(null);
      resetFormFields();
    }
  }, [isOpen]);

  function resetFormFields() {
    setCashCents(0);
    setCardAmount('');
    setNsu('');
    setAuthCode('');
    setInstallments('1');
    setPixAmount('');
    setOtherAmount('');
    setOtherNotes('');
  }

  function handleSelectMethod(method: PaymentMethodType) {
    setSelectedMethod(method);
    setError(null);
    resetFormFields();

    // Pre-fill amounts with remaining
    if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
      setCardAmount(remaining.toFixed(2));
    } else if (method === 'PIX') {
      setPixAmount(remaining.toFixed(2));
    } else if (method === 'STORE_CREDIT' || method === 'OTHER') {
      setOtherAmount(remaining.toFixed(2));
    }
  }

  function addPayment() {
    let amount = 0;
    const entry: Partial<PaymentEntry> = {
      id: generateId(),
      method: selectedMethod!,
    };

    switch (selectedMethod) {
      case 'CASH':
        amount = cashCents / 100;
        break;
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        amount = parseFloat(cardAmount) || 0;
        entry.nsu = nsu || undefined;
        entry.authorizationCode = authCode || undefined;
        entry.installments = parseInt(installments) || 1;
        break;
      case 'PIX':
        amount = parseFloat(pixAmount) || 0;
        break;
      case 'STORE_CREDIT':
      case 'OTHER':
        amount = parseFloat(otherAmount) || 0;
        entry.notes = otherNotes || undefined;
        break;
    }

    if (amount <= 0) return;

    entry.amount = amount;
    setPayments((prev) => [...prev, entry as PaymentEntry]);
    setSelectedMethod(null);
    resetFormFields();
  }

  function removePayment(id: string) {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleConfirm() {
    if (!canConfirm) return;
    setIsSubmitting(true);
    setError(null);

    // Save intent to localStorage for recovery
    const intent = { orderId, payments, total, terminalMode, posSessionId };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
    } catch {
      // localStorage might be unavailable
    }

    try {
      // Simulate API call — replace with actual endpoint
      // await apiClient.post('/v1/sales/pos/checkout', intent);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const changeAmount = Math.max(0, totalPaid - total);
      const saleCode = `VND-${Date.now().toString(36).toUpperCase()}`;

      // Clear recovery intent
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }

      onSuccess({ changeAmount, saleCode });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao processar pagamento. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Fechar"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          PAGAMENTO — {formatCurrency(total)}
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Added Payments */}
        {payments.length > 0 && (
          <div className="mb-4 space-y-2">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Pagamentos adicionados
            </h2>
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {PAYMENT_METHOD_LABELS[payment.method]}
                  </span>
                  <span className="ml-2 text-sm text-zinc-500">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removePayment(payment.id)}
                  className="flex size-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  aria-label="Remover pagamento"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}

            {remaining > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                Restante: {formatCurrency(remaining)}
              </div>
            )}
          </div>
        )}

        {/* Method Selection */}
        {!selectedMethod && (
          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_METHODS.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleSelectMethod(type)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white p-4',
                  'min-h-[80px] select-none transition-all duration-150',
                  'hover:border-violet-300 hover:shadow-md active:scale-95',
                  'dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-violet-500/50'
                )}
              >
                <Icon className="size-7 text-violet-600 dark:text-violet-400" />
                <span className="text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Contextual Panels */}
        {selectedMethod && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod(null)}
                className="flex size-9 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="size-4" />
              </button>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {PAYMENT_METHOD_LABELS[selectedMethod]}
              </h2>
            </div>

            {/* CASH Panel */}
            {selectedMethod === 'CASH' && (
              <CashPanel
                cents={cashCents}
                onCentsChange={setCashCents}
                remainingCents={remainingCents}
                totalCents={totalCents}
                onAdd={addPayment}
              />
            )}

            {/* CREDIT/DEBIT Panel */}
            {(selectedMethod === 'CREDIT_CARD' ||
              selectedMethod === 'DEBIT_CARD') && (
              <CardPanel
                amount={cardAmount}
                onAmountChange={setCardAmount}
                nsu={nsu}
                onNsuChange={setNsu}
                authCode={authCode}
                onAuthCodeChange={setAuthCode}
                installments={installments}
                onInstallmentsChange={setInstallments}
                showInstallments={selectedMethod === 'CREDIT_CARD'}
                onAdd={addPayment}
              />
            )}

            {/* PIX Panel */}
            {selectedMethod === 'PIX' && (
              <PixPanel
                amount={pixAmount}
                onAmountChange={setPixAmount}
                onAdd={addPayment}
              />
            )}

            {/* OTHER / STORE_CREDIT Panel */}
            {(selectedMethod === 'STORE_CREDIT' ||
              selectedMethod === 'OTHER') && (
              <OtherPanel
                amount={otherAmount}
                onAmountChange={setOtherAmount}
                notes={otherNotes}
                onNotesChange={setOtherNotes}
                onAdd={addPayment}
              />
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                {error}
              </p>
              <button
                type="button"
                onClick={handleConfirm}
                className="mt-2 text-sm font-semibold text-rose-700 underline dark:text-rose-300"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        {totalPaid > total && (
          <div className="mb-3 text-center text-lg font-bold text-emerald-600 dark:text-emerald-400">
            Troco: {formatCurrency(totalPaid - total)}
          </div>
        )}
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm || isSubmitting}
          className={cn(
            'h-14 w-full rounded-xl text-base font-bold',
            'bg-violet-600 text-white hover:bg-violet-700',
            'disabled:opacity-50'
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processando...
            </span>
          ) : (
            'CONFIRMAR PAGAMENTO'
          )}
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-PANELS
// =============================================================================

function CashPanel({
  cents,
  onCentsChange,
  remainingCents,
  totalCents,
  onAdd,
}: {
  cents: number;
  onCentsChange: (v: number) => void;
  remainingCents: number;
  totalCents: number;
  onAdd: () => void;
}) {
  const changeAmount = cents > remainingCents ? (cents - remainingCents) / 100 : 0;

  const shortcuts = [
    { label: 'Valor exato', value: remainingCents },
    { label: 'R$ 50', value: 5000 },
    { label: 'R$ 100', value: 10000 },
  ];

  return (
    <div className="space-y-4">
      <Numpad
        value={cents}
        onChange={onCentsChange}
        shortcuts={shortcuts}
      />

      {changeAmount > 0 && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-center text-lg font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          Troco: {formatCurrency(changeAmount)}
        </div>
      )}

      <Button
        onClick={onAdd}
        disabled={cents === 0}
        className="h-14 w-full rounded-xl bg-violet-600 text-base font-bold text-white hover:bg-violet-700"
      >
        Adicionar pagamento
      </Button>
    </div>
  );
}

function CardPanel({
  amount,
  onAmountChange,
  nsu,
  onNsuChange,
  authCode,
  onAuthCodeChange,
  installments,
  onInstallmentsChange,
  showInstallments,
  onAdd,
}: {
  amount: string;
  onAmountChange: (v: string) => void;
  nsu: string;
  onNsuChange: (v: string) => void;
  authCode: string;
  onAuthCodeChange: (v: string) => void;
  installments: string;
  onInstallmentsChange: (v: string) => void;
  showInstallments: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <FormField label="Valor" required>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className={inputClassName}
          placeholder="0,00"
        />
      </FormField>

      <FormField label="NSU">
        <input
          type="text"
          value={nsu}
          onChange={(e) => onNsuChange(e.target.value)}
          className={inputClassName}
          placeholder="Número Sequencial Único"
        />
      </FormField>

      <FormField label="Código de Autorização">
        <input
          type="text"
          value={authCode}
          onChange={(e) => onAuthCodeChange(e.target.value)}
          className={inputClassName}
          placeholder="Código da operadora"
        />
      </FormField>

      {showInstallments && (
        <FormField label="Parcelas">
          <select
            value={installments}
            onChange={(e) => onInstallmentsChange(e.target.value)}
            className={inputClassName}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}x {n === 1 ? '(à vista)' : ''}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <Button
        onClick={onAdd}
        disabled={!amount || parseFloat(amount) <= 0}
        className="h-14 w-full rounded-xl bg-violet-600 text-base font-bold text-white hover:bg-violet-700"
      >
        Adicionar pagamento
      </Button>
    </div>
  );
}

function PixPanel({
  amount,
  onAmountChange,
  onAdd,
}: {
  amount: string;
  onAmountChange: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-500/30 dark:bg-sky-500/10">
        <CircleDollarSign className="size-5 text-sky-600 dark:text-sky-400" />
        <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
          Registrar pagamento PIX recebido
        </span>
      </div>

      <FormField label="Valor" required>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className={inputClassName}
          placeholder="0,00"
        />
      </FormField>

      <Button
        onClick={onAdd}
        disabled={!amount || parseFloat(amount) <= 0}
        className="h-14 w-full rounded-xl bg-violet-600 text-base font-bold text-white hover:bg-violet-700"
      >
        Adicionar pagamento
      </Button>
    </div>
  );
}

function OtherPanel({
  amount,
  onAmountChange,
  notes,
  onNotesChange,
  onAdd,
}: {
  amount: string;
  onAmountChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <FormField label="Valor" required>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className={inputClassName}
          placeholder="0,00"
        />
      </FormField>

      <FormField label="Observações">
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className={cn(inputClassName, 'h-24 resize-none py-3')}
          placeholder="Detalhes do pagamento..."
        />
      </FormField>

      <Button
        onClick={onAdd}
        disabled={!amount || parseFloat(amount) <= 0}
        className="h-14 w-full rounded-xl bg-violet-600 text-base font-bold text-white hover:bg-violet-700"
      >
        Adicionar pagamento
      </Button>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClassName = cn(
  'h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 text-base',
  'placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20',
  'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-violet-400'
);

export {
  PaymentOverlay,
  type PaymentOverlayProps,
  type PaymentEntry,
  type PaymentMethodType,
};
