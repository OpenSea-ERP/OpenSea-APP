'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PosCartItem } from './product-search';
import { Minus, Plus, X, ShoppingCart } from 'lucide-react';

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
// Types
// ---------------------------------------------------------------------------

interface CartProps {
  items: PosCartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  discount: number;
  onDiscountChange: (value: number) => void;
  onCheckout: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  discount,
  onDiscountChange,
  onCheckout,
  className,
}: CartProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const total = Math.max(0, subtotal - discount);

  return (
    <div className={`flex flex-col ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Carrinho</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </Badge>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Carrinho vazio</p>
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-border p-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.unitPrice)} un.
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onUpdateQuantity(item.id, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-7 text-center text-sm font-medium tabular-nums">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onUpdateQuantity(item.id, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-rose-500 hover:text-rose-600"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-sm font-semibold tabular-nums w-20 text-right shrink-0">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-border pt-3 mt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">
            Desconto (R$)
          </span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={discount || ''}
            onChange={e => onDiscountChange(parseFloat(e.target.value) || 0)}
            className="h-8 text-sm w-24 ml-auto"
            placeholder="0,00"
          />
        </div>

        <div className="flex justify-between text-lg font-bold pt-1">
          <span>Total</span>
          <span className="text-primary tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>

        <Button
          className="w-full h-11 text-base font-bold mt-2"
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          Finalizar Venda
        </Button>
      </div>
    </div>
  );
}
