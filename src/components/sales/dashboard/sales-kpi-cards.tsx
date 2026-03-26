'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SalesDashboardData } from '@/hooks/sales/use-sales-dashboard';
import {
  DollarSign,
  Percent,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function KPICardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SalesKPICardsProps {
  data: SalesDashboardData | undefined;
  isLoading: boolean;
}

interface KPICardDef {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  accentBg: string;
  accentIcon: string;
  accentValue: string;
}

export function SalesKPICards({ data, isLoading }: SalesKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards: KPICardDef[] = [
    {
      label: 'Faturamento do Mês',
      value: formatCurrency(data.monthlyRevenue),
      subtitle: `${data.monthlyOrderCount} pedidos confirmados`,
      icon: DollarSign,
      accentBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      accentIcon: 'text-emerald-600 dark:text-emerald-400',
      accentValue: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Pedidos do Mês',
      value: data.monthlyOrderCount.toLocaleString('pt-BR'),
      subtitle: `${data.pendingOrders} pendentes`,
      icon: ShoppingCart,
      accentBg: 'bg-blue-50 dark:bg-blue-500/10',
      accentIcon: 'text-blue-600 dark:text-blue-400',
      accentValue: 'text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(data.averageTicket),
      icon: TrendingUp,
      accentBg: 'bg-violet-50 dark:bg-violet-500/10',
      accentIcon: 'text-violet-600 dark:text-violet-400',
      accentValue: 'text-violet-700 dark:text-violet-300',
    },
    {
      label: 'Taxa de Conversão',
      value: formatPercent(data.conversionRate),
      subtitle: 'Negócios ganhos / fechados',
      icon: Percent,
      accentBg: 'bg-sky-50 dark:bg-sky-500/10',
      accentIcon: 'text-sky-600 dark:text-sky-400',
      accentValue: 'text-sky-700 dark:text-sky-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <Card
          key={card.label}
          className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-border"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {card.label}
              </p>
              <p
                className={`text-xl font-bold tracking-tight tabular-nums ${card.accentValue}`}
              >
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {card.subtitle}
                </p>
              )}
            </div>
            <div className={`p-2.5 rounded-xl ${card.accentBg} shrink-0`}>
              <card.icon className={`h-5 w-5 ${card.accentIcon}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
