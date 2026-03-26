'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, CreditCard, QrCode, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActiveMethod = 'CASH' | 'CARD' | 'PIX' | null;

interface PaymentPanelProps {
  total: number;
  onFinalize: (method: 'CASH' | 'CARD' | 'PIX') => void;
  disabled?: boolean;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaymentPanel({
  total,
  onFinalize,
  disabled = false,
}: PaymentPanelProps) {
  const [activeMethod, setActiveMethod] = useState<ActiveMethod>(null);
  const [receivedAmount, setReceivedAmount] = useState('');

  const parsedReceived = parseFloat(receivedAmount.replace(',', '.')) || 0;
  const change = parsedReceived - total;

  const handleFinalize = () => {
    if (!activeMethod) return;
    onFinalize(activeMethod);
    setActiveMethod(null);
    setReceivedAmount('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Total Display */}
      <div className="text-center py-6 mb-4">
        <p className="text-sm text-muted-foreground mb-1">Total</p>
        <p className="text-4xl font-bold text-primary tabular-nums">
          {formatCurrency(total)}
        </p>
      </div>

      {/* Payment Method Buttons */}
      <div className="space-y-3 flex-1">
        {/* Dinheiro */}
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'w-full rounded-xl border-2 p-4 text-left transition-all cursor-pointer',
            activeMethod === 'CASH'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/8'
              : 'border-border hover:border-emerald-300 dark:hover:border-emerald-500/30',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() =>
            setActiveMethod(activeMethod === 'CASH' ? null : 'CASH')
          }
        >
          <div className="flex items-center gap-3">
            <Banknote
              className={cn(
                'h-6 w-6',
                activeMethod === 'CASH'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'font-semibold',
                activeMethod === 'CASH'
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : ''
              )}
            >
              Dinheiro
            </span>
          </div>
        </button>

        {/* Cash amount / change calculator */}
        {activeMethod === 'CASH' && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Valor Recebido (R$)</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={receivedAmount}
                onChange={e => setReceivedAmount(e.target.value)}
                className="h-10 text-lg font-semibold"
                autoFocus
              />
            </div>
            {parsedReceived > 0 && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm text-muted-foreground">Troco</span>
                <span
                  className={cn(
                    'text-xl font-bold tabular-nums',
                    change >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {formatCurrency(Math.max(0, change))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Cartao */}
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'w-full rounded-xl border-2 p-4 text-left transition-all cursor-pointer',
            activeMethod === 'CARD'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/8'
              : 'border-border hover:border-blue-300 dark:hover:border-blue-500/30',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() =>
            setActiveMethod(activeMethod === 'CARD' ? null : 'CARD')
          }
        >
          <div className="flex items-center gap-3">
            <CreditCard
              className={cn(
                'h-6 w-6',
                activeMethod === 'CARD'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'font-semibold',
                activeMethod === 'CARD'
                  ? 'text-blue-700 dark:text-blue-300'
                  : ''
              )}
            >
              Cartão
            </span>
          </div>
        </button>

        {activeMethod === 'CARD' && (
          <div className="rounded-lg border border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Insira ou aproxime o cartão na máquina
            </p>
          </div>
        )}

        {/* PIX */}
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'w-full rounded-xl border-2 p-4 text-left transition-all cursor-pointer',
            activeMethod === 'PIX'
              ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/8'
              : 'border-border hover:border-sky-300 dark:hover:border-sky-500/30',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => setActiveMethod(activeMethod === 'PIX' ? null : 'PIX')}
        >
          <div className="flex items-center gap-3">
            <QrCode
              className={cn(
                'h-6 w-6',
                activeMethod === 'PIX'
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'font-semibold',
                activeMethod === 'PIX' ? 'text-sky-700 dark:text-sky-300' : ''
              )}
            >
              PIX
            </span>
          </div>
        </button>

        {activeMethod === 'PIX' && (
          <div className="rounded-lg border border-sky-200 dark:border-sky-500/20 bg-sky-50/50 dark:bg-sky-500/5 p-4 flex items-center justify-center">
            <div className="text-center space-y-2">
              <QrCode className="mx-auto h-16 w-16 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                QR Code será gerado ao finalizar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Finalize Button */}
      <div className="mt-4 pt-4 border-t border-border">
        <Button
          className="w-full h-14 text-lg font-bold"
          disabled={disabled || !activeMethod}
          onClick={handleFinalize}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Finalizar
        </Button>
      </div>
    </div>
  );
}
