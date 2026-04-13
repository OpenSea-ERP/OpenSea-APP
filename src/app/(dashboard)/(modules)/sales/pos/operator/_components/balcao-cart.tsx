'use client';

import * as React from 'react';
import { Minus, Plus, ShoppingCart, Trash2, User } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useCartData, useCartActions } from '@/providers/cart-provider';
import { Button } from '@/components/ui/button';

// =============================================================================
// TYPES
// =============================================================================

interface BalcaoCartProps {
  onCharge: () => void;
  onIdentifyCustomer?: () => void;
  className?: string;
}

// =============================================================================
// BALCAO CART COMPONENT
// =============================================================================

function BalcaoCart({
  onCharge,
  onIdentifyCustomer,
  className,
}: BalcaoCartProps) {
  const { activeOrder, items, itemCount, isLoading } = useCartData();
  const { updateItemQuantity, removeItem } = useCartActions();

  const subtotal = activeOrder?.subtotal ?? 0;
  const discount = activeOrder?.discountTotal ?? 0;
  const total = activeOrder?.grandTotal ?? 0;

  const isEmpty = items.length === 0;

  return (
    <div
      className={cn(
        'flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-violet-600 dark:text-violet-400" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Carrinho
          </h2>
          {itemCount > 0 && (
            <span className="flex size-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
              {itemCount}
            </span>
          )}
        </div>
        {activeOrder?.saleCode && (
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {activeOrder.saleCode}
          </span>
        )}
      </div>

      {/* Customer Section */}
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        {activeOrder?.customerName ? (
          <div className="flex items-center gap-2">
            <User className="size-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {activeOrder.customerName}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onIdentifyCustomer}
            className={cn(
              'flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300',
              'text-sm font-medium text-zinc-500 transition-colors',
              'hover:border-violet-400 hover:text-violet-600',
              'dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-violet-500 dark:hover:text-violet-400'
            )}
          >
            <User className="size-4" />
            Identificar cliente
          </button>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <ShoppingCart className="mb-3 size-10 opacity-40" />
            <p className="text-sm font-medium">Carrinho vazio</p>
            <p className="text-xs">Toque em um produto para adicionar</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map(item => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={qty => updateItemQuantity(item.id, qty)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1 px-4 py-3">
          <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
              <span>Desconto</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Total
            </span>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Charge Button */}
        <div className="px-4 pb-4">
          <Button
            onClick={onCharge}
            disabled={isEmpty}
            className={cn(
              'h-16 w-full rounded-xl text-lg font-bold',
              isEmpty
                ? 'cursor-not-allowed bg-zinc-300 text-zinc-500 opacity-50 dark:bg-zinc-700 dark:text-zinc-400'
                : 'bg-violet-600 text-white shadow-sm hover:bg-violet-700'
            )}
          >
            {isEmpty
              ? 'Adicione produtos'
              : total === 0
                ? 'FINALIZAR'
                : `COBRAR ${formatCurrency(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CART ITEM ROW
// =============================================================================

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  };
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="line-clamp-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {item.name}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatCurrency(item.unitPrice)} un.
        </p>
      </div>

      {/* Quantity Stepper */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            if (item.quantity <= 1) {
              onRemove();
            } else {
              onUpdateQuantity(item.quantity - 1);
            }
          }}
          className={cn(
            'flex size-10 items-center justify-center rounded-lg border border-zinc-200',
            'text-zinc-600 transition-colors select-none active:scale-95',
            'hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
          )}
          aria-label="Diminuir quantidade"
        >
          <Minus className="size-4" />
        </button>

        <span className="flex size-10 items-center justify-center text-sm font-bold text-zinc-900 tabular-nums dark:text-zinc-100">
          {item.quantity}
        </span>

        <button
          type="button"
          onClick={() => onUpdateQuantity(item.quantity + 1)}
          className={cn(
            'flex size-10 items-center justify-center rounded-lg border border-zinc-200',
            'text-zinc-600 transition-colors select-none active:scale-95',
            'hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
          )}
          aria-label="Aumentar quantidade"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {/* Subtotal + Remove */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-bold text-zinc-900 tabular-nums dark:text-zinc-100">
          {formatCurrency(item.subtotal)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="flex size-8 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          aria-label="Remover item"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

export { BalcaoCart, type BalcaoCartProps };
