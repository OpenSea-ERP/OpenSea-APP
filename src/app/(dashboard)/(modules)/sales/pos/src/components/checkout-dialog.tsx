'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Banknote, CreditCard, QrCode, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaymentMethod = 'CASH' | 'CARD' | 'PIX';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (paymentMethod: PaymentMethod, paymentCondition: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}[] = [
  {
    value: 'CASH',
    label: 'Dinheiro',
    icon: Banknote,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor:
      'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8',
  },
  {
    value: 'CARD',
    label: 'Cartão',
    icon: CreditCard,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor:
      'border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8',
  },
  {
    value: 'PIX',
    label: 'PIX',
    icon: QrCode,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor:
      'border-sky-200 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8',
  },
];

const PAYMENT_CONDITIONS = [
  { value: 'A_VISTA', label: 'À Vista' },
  { value: '30_DIAS', label: '30 dias' },
  { value: '30_60', label: '30/60 dias' },
  { value: '30_60_90', label: '30/60/90 dias' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CheckoutDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
}: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentCondition, setPaymentCondition] = useState('A_VISTA');

  const handleConfirm = () => {
    onConfirm(paymentMethod, paymentCondition);
    setPaymentMethod('CASH');
    setPaymentCondition('A_VISTA');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Total */}
          <div className="text-center py-4 rounded-xl bg-muted/30 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Total da Venda</p>
            <p className="text-3xl font-bold text-primary tabular-nums">
              {formatCurrency(total)}
            </p>
          </div>

          {/* Payment Condition */}
          <div className="space-y-2">
            <Label>Condição de Pagamento</Label>
            <Select
              value={paymentCondition}
              onValueChange={setPaymentCondition}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_CONDITIONS.map(cond => (
                  <SelectItem key={cond.value} value={cond.value}>
                    {cond.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all cursor-pointer',
                      isSelected
                        ? `${method.bgColor} border-current ${method.color}`
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                    onClick={() => setPaymentMethod(method.value)}
                  >
                    <Icon
                      className={cn(
                        'h-6 w-6',
                        isSelected ? method.color : 'text-muted-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isSelected ? method.color : 'text-muted-foreground'
                      )}
                    >
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
