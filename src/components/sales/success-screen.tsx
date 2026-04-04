'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingCart } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// =============================================================================
// TYPES
// =============================================================================

interface SuccessScreenProps {
  isOpen: boolean;
  saleCode: string;
  total: number;
  changeAmount: number;
  payments: Array<{ method: string; amount: number }>;
  onNewSale: () => void;
  onClose: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão Crédito',
  DEBIT_CARD: 'Cartão Débito',
  PIX: 'PIX',
  STORE_CREDIT: 'Crédito Loja',
  OTHER: 'Outro',
};

// =============================================================================
// SUCCESS SCREEN COMPONENT
// =============================================================================

function SuccessScreen({
  isOpen,
  saleCode,
  total,
  changeAmount,
  payments,
  onNewSale,
  onClose,
}: SuccessScreenProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-zinc-950"
        >
          {/* Animated Checkmark */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: 0.1,
            }}
            className="mb-6 flex size-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 15,
                delay: 0.3,
              }}
            >
              <Check className="size-12 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100"
          >
            Venda Concluída
          </motion.h1>

          {/* Change Amount */}
          {changeAmount > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                TROCO: {formatCurrency(changeAmount)}
              </span>
            </motion.div>
          )}

          {/* Sale Details */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full max-w-sm space-y-3 px-6"
          >
            {/* Sale Code */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="text-center">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Código da Venda
                </span>
                <p className="text-lg font-bold tracking-wider text-zinc-900 dark:text-zinc-100">
                  {saleCode}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Total
              </span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(total)}
              </span>
            </div>

            {/* Payments Breakdown */}
            {payments.length > 0 && (
              <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Pagamentos
                </span>
                {payments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 w-full max-w-sm px-6"
          >
            <Button
              onClick={onNewSale}
              className={cn(
                'h-14 w-full rounded-xl text-base font-bold',
                'bg-violet-600 text-white hover:bg-violet-700'
              )}
            >
              <ShoppingCart className="mr-2 size-5" />
              Nova Venda
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { SuccessScreen, type SuccessScreenProps };
