'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SalesDashboardData } from '@/hooks/sales/use-sales-dashboard';
import type { OrderDTO } from '@/types/sales';
import { Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function getOrderStatus(order: OrderDTO): { label: string; className: string } {
  if (order.cancelledAt) {
    return {
      label: 'Cancelado',
      className:
        'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300',
    };
  }
  if (order.confirmedAt) {
    return {
      label: 'Confirmado',
      className:
        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    };
  }
  if (order.type === 'QUOTE') {
    return {
      label: 'Orçamento',
      className:
        'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
    };
  }
  return {
    label: 'Rascunho',
    className:
      'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RecentOrdersTableProps {
  data: SalesDashboardData | undefined;
  isLoading: boolean;
}

export function RecentOrdersTable({ data, isLoading }: RecentOrdersTableProps) {
  if (isLoading) {
    return (
      <Card
        data-testid="sales-recent-orders"
        className="bg-white dark:bg-slate-800/60 border border-border"
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const orders = data.recentOrders;

  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Atividade Recente
          </h3>
          <Link
            href="/sales/orders"
            className="text-xs text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1 transition-colors"
          >
            Ver todos
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum pedido registrado ainda
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-xs font-medium text-muted-foreground">
                    Pedido
                  </th>
                  <th className="text-left py-2 pr-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Canal
                  </th>
                  <th className="text-right py-2 pr-3 text-xs font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="text-center py-2 pr-3 text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const status = getOrderStatus(order);
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-border/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/sales/orders/${order.id}`}
                          className="font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground hidden sm:table-cell">
                        {order.channel}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-medium tabular-nums text-foreground">
                        {formatCurrency(order.grandTotal)}
                      </td>
                      <td className="py-2.5 pr-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground tabular-nums hidden md:table-cell">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
