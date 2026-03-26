'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupplierSummary } from '@/hooks/finance/use-supplier-summary';
import type {
  SupplierSummaryParams,
  FinanceEntryStatus,
} from '@/types/finance';
import { FINANCE_ENTRY_STATUS_LABELS } from '@/types/finance';
import {
  Building2,
  CalendarDays,
  DollarSign,
  FileText,
  TrendingUp,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface SupplierSummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName?: string;
  supplierId?: string;
  customerName?: string;
  customerId?: string;
  entityType: 'supplier' | 'customer';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' {
  switch (status) {
    case 'PAID':
    case 'RECEIVED':
      return 'success';
    case 'PENDING':
      return 'secondary';
    case 'OVERDUE':
      return 'destructive';
    case 'PARTIALLY_PAID':
      return 'warning';
    case 'CANCELLED':
      return 'outline';
    default:
      return 'secondary';
  }
}

export function SupplierSummaryDrawer({
  open,
  onOpenChange,
  supplierName,
  supplierId,
  customerName,
  customerId,
  entityType,
}: SupplierSummaryDrawerProps) {
  const queryParams: SupplierSummaryParams = useMemo(
    () => ({
      supplierName,
      supplierId,
      customerName,
      customerId,
    }),
    [supplierName, supplierId, customerName, customerId]
  );

  const { data, isLoading } = useSupplierSummary(queryParams);
  const summary = data?.summary;

  const displayName = supplierName || customerName || 'Desconhecido';
  const EntityIcon = entityType === 'supplier' ? Building2 : User;
  const entityLabel = entityType === 'supplier' ? 'Fornecedor' : 'Cliente';

  // Compute max value for bar chart scaling
  const maxTrendValue = useMemo(() => {
    if (!summary?.monthlyTrend?.length) return 1;
    return Math.max(...summary.monthlyTrend.map(m => m.total), 1);
  }, [summary?.monthlyTrend]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center h-10 w-10 rounded-lg shrink-0',
                entityType === 'supplier'
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                  : 'bg-gradient-to-br from-sky-500 to-blue-600'
              )}
            >
              <EntityIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-lg truncate">
                {displayName}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">{entityLabel}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 pt-5">
          {isLoading ? (
            <LoadingSkeleton />
          ) : !summary || summary.entryCount === 0 ? (
            <EmptyState entityLabel={entityLabel} displayName={displayName} />
          ) : (
            <>
              {/* KPI Cards - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3">
                <KpiCard
                  label="Total Pago"
                  value={formatCurrency(summary.totalPaid)}
                  icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                  className="border-emerald-200 dark:border-emerald-800/50"
                />
                <KpiCard
                  label="Pendente"
                  value={formatCurrency(summary.totalPending)}
                  icon={<CalendarDays className="h-4 w-4 text-sky-500" />}
                  className="border-sky-200 dark:border-sky-800/50"
                />
                <KpiCard
                  label="Vencido"
                  value={formatCurrency(summary.totalOverdue)}
                  icon={<TrendingUp className="h-4 w-4 text-rose-500" />}
                  className="border-rose-200 dark:border-rose-800/50"
                  valueClassName={
                    summary.totalOverdue > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : ''
                  }
                />
                <KpiCard
                  label="Qtd. Lanc."
                  value={String(summary.entryCount)}
                  icon={<FileText className="h-4 w-4 text-violet-500" />}
                  className="border-violet-200 dark:border-violet-800/50"
                />
              </div>

              {/* Extra Info */}
              <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                <span>
                  Valor Medio:{' '}
                  <strong className="text-foreground">
                    {formatCurrency(summary.avgAmount)}
                  </strong>
                </span>
                <span>
                  {formatDate(summary.firstEntryDate)} -{' '}
                  {formatDate(summary.lastEntryDate)}
                </span>
              </div>

              {/* Monthly Trend */}
              {summary.monthlyTrend.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Tendencia Mensal
                  </h3>
                  <div className="space-y-2">
                    {summary.monthlyTrend.map(month => {
                      const barWidth =
                        maxTrendValue > 0
                          ? (month.total / maxTrendValue) * 100
                          : 0;
                      const monthLabel = formatMonthLabel(month.month);
                      return (
                        <div
                          key={month.month}
                          className="flex items-center gap-3"
                        >
                          <span className="text-xs text-muted-foreground w-12 shrink-0 text-right">
                            {monthLabel}
                          </span>
                          <div className="flex-1 h-6 bg-muted/50 rounded-md overflow-hidden relative">
                            <div
                              className={cn(
                                'h-full rounded-md transition-all duration-300',
                                entityType === 'supplier'
                                  ? 'bg-violet-500/80'
                                  : 'bg-sky-500/80'
                              )}
                              style={{ width: `${Math.max(barWidth, 1)}%` }}
                            />
                            {month.total > 0 && (
                              <span className="absolute inset-0 flex items-center px-2 text-xs font-medium">
                                {formatCurrency(month.total)}
                                <span className="text-muted-foreground ml-1">
                                  ({month.count})
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Recent Entries */}
              {summary.recentEntries.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Lancamentos Recentes
                  </h3>
                  <div className="space-y-2">
                    {summary.recentEntries.map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="text-sm font-medium truncate">
                            {entry.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Venc. {formatShortDate(entry.dueDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-mono">
                            {formatCurrency(entry.expectedAmount)}
                          </span>
                          <Badge
                            variant={getStatusBadgeVariant(entry.status)}
                            className="text-[10px] px-1.5"
                          >
                            {FINANCE_ENTRY_STATUS_LABELS[
                              entry.status as FinanceEntryStatus
                            ] || entry.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function KpiCard({
  label,
  value,
  icon,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <Card className={cn('p-3 border', className)}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn('text-base font-semibold', valueClassName)}>{value}</p>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-3">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-24" />
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <Skeleton className="h-4 w-36 mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}

function EmptyState({
  entityLabel,
  displayName,
}: {
  entityLabel: string;
  displayName: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">
        Nenhum lancamento financeiro encontrado para {entityLabel.toLowerCase()}{' '}
        <strong>{displayName}</strong>.
      </p>
    </div>
  );
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const months = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${months[monthIndex]}/${year.slice(2)}`;
}
