'use client';

import { Button } from '@/components/ui/button';
import type { PosCartItem } from './product-search';
import { Minus, Plus, X, ShoppingBag } from 'lucide-react';

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

interface QuickCartProps {
  items: PosCartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  className,
}: QuickCartProps) {
  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <div className={`flex flex-col ${className ?? ''}`}>
      {/* Items */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              Adicione produtos para iniciar
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900">
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left py-2 px-2 font-medium">Produto</th>
                <th className="text-center py-2 px-1 font-medium w-28">Qtd.</th>
                <th className="text-right py-2 px-2 font-medium w-24">Preço</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(item => (
                <tr
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-2 px-2">
                    <p className="font-medium truncate max-w-[180px]">
                      {item.name}
                    </p>
                  </td>
                  <td className="py-2 px-1">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-medium tabular-nums">
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
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right font-semibold tabular-nums">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </td>
                  <td className="py-2 pr-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-rose-500 hover:text-rose-600"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Total */}
      <div className="border-t border-border pt-3 mt-auto">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-primary tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
