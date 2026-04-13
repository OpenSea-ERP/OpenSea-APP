'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GridLoading } from '@/components/handlers/grid-loading';
import { GridError } from '@/components/handlers/grid-error';
import { formatCurrency } from '@/lib/utils';
import { Clock, ShoppingBag, Receipt } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface QueuedOrder {
  id: string;
  orderNumber?: string;
  customerName: string | null;
  grandTotal: number;
  itemCount: number;
  createdAt: string;
}

interface CashierQueueResponse {
  orders: QueuedOrder[];
}

interface CashierQueueProps {
  onChargeOrder: (order: QueuedOrder) => void;
}

// =============================================================================
// CASHIER QUEUE COMPONENT
// =============================================================================

export function CashierQueue({ onChargeOrder }: CashierQueueProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pos-cashier-queue'],
    queryFn: async () => {
      const response =
        await apiClient.get<CashierQueueResponse>('/v1/pos/orders/queue');
      return response.orders;
    },
    refetchInterval: 5000,
  });

  if (isLoading) return <GridLoading />;
  if (error) return <GridError />;

  const orders = data ?? [];

  if (orders.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 border-dashed">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="font-semibold text-lg mb-1">
          Nenhum pedido aguardando
        </h3>
        <p className="text-sm text-muted-foreground">
          Os pedidos aparecerão aqui assim que os vendedores enviarem.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Fila de Pagamento</h2>
        <Badge variant="secondary">{orders.length} pedido(s)</Badge>
      </div>

      {orders.map(order => (
        <Card
          key={order.id}
          className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800/60 border border-border"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
            <Receipt className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">
                {order.customerName ?? 'Cliente não identificado'}
              </h3>
              {order.orderNumber && (
                <Badge variant="outline">#{order.orderNumber}</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>{order.itemCount} item(ns)</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="font-mono font-bold text-lg">
              {formatCurrency(order.grandTotal)}
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => onChargeOrder(order)}
          >
            Receber
          </Button>
        </Card>
      ))}
    </div>
  );
}
