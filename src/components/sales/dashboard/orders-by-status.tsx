'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SalesDashboardData } from '@/hooks/sales/use-sales-dashboard';
import { ClipboardList } from 'lucide-react';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

interface StatusConfig {
  label: string;
  badge: string;
  bar: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: {
    label: 'Rascunho',
    badge:
      'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300',
    bar: 'bg-slate-400 dark:bg-slate-500',
  },
  QUOTE: {
    label: 'Orçamento',
    badge:
      'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-400 dark:bg-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmado',
    badge:
      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    bar: 'bg-emerald-400 dark:bg-emerald-500',
  },
  PROCESSING: {
    label: 'Processando',
    badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
    bar: 'bg-blue-400 dark:bg-blue-500',
  },
  SHIPPED: {
    label: 'Enviado',
    badge:
      'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300',
    bar: 'bg-violet-400 dark:bg-violet-500',
  },
  DELIVERED: {
    label: 'Entregue',
    badge: 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300',
    bar: 'bg-teal-400 dark:bg-teal-500',
  },
  CANCELLED: {
    label: 'Cancelado',
    badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300',
    bar: 'bg-rose-400 dark:bg-rose-500',
  },
};

const FALLBACK_CONFIG: StatusConfig = {
  label: 'Outro',
  badge: 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300',
  bar: 'bg-slate-400 dark:bg-slate-500',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OrdersByStatusProps {
  data: SalesDashboardData | undefined;
  isLoading: boolean;
}

export function OrdersByStatus({ data, isLoading }: OrdersByStatusProps) {
  if (isLoading) {
    return (
      <Card
        data-testid="sales-orders-status"
        className="bg-white dark:bg-slate-800/60 border border-border"
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const entries = Object.entries(data.ordersByStage).sort(
    ([, a], [, b]) => b - a
  );
  const totalOrders = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10">
            <ClipboardList className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Pedidos por Status
          </h3>
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
            {totalOrders} total
          </span>
        </div>

        <div className="space-y-2.5">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum pedido encontrado
            </p>
          )}

          {entries.map(([status, count]) => {
            const config = STATUS_CONFIG[status] ?? {
              ...FALLBACK_CONFIG,
              label: status,
            };
            const percent = totalOrders > 0 ? (count / totalOrders) * 100 : 0;

            return (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${config.badge}`}
                  >
                    {config.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {count}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
