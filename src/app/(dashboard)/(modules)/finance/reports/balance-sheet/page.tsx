'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { usePermissions } from '@/hooks/use-permissions';
import { useBalanceSheet } from '@/hooks/finance';
import type { BalanceSheetAccount, BalanceSheetSection } from '@/types/finance';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Scale,
  Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// =============================================================================
// ACCOUNT TREE ROW
// =============================================================================

function AccountRow({
  account,
  depth = 0,
}: {
  account: BalanceSheetAccount;
  depth?: number;
}) {
  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between py-2 px-4',
          depth === 0 && 'font-medium',
          depth > 0 && 'text-sm text-muted-foreground'
        )}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <span className="flex items-center gap-2">
          {depth > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          )}
          {account.name}
        </span>
        <span className="font-mono tabular-nums text-foreground">
          {formatCurrency(account.value)}
        </span>
      </div>
      {account.children?.map(child => (
        <AccountRow key={child.name} account={child} depth={depth + 1} />
      ))}
    </>
  );
}

// =============================================================================
// SECTION CARD
// =============================================================================

function SectionCard({
  title,
  icon: Icon,
  iconColor,
  section,
  totalLabel,
  totalValue,
  totalColor,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  section?: BalanceSheetSection;
  totalLabel: string;
  totalValue: number;
  totalColor: string;
}) {
  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Icon className={cn('h-4 w-4', iconColor)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {section && (
          <>
            {/* Sub-section title */}
            <div className="px-4 py-2 bg-muted/30 border-y border-border/50">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </span>
            </div>
            {/* Accounts */}
            <div className="divide-y divide-border/30">
              {section.accounts.map(acc => (
                <AccountRow key={acc.name} account={acc} />
              ))}
            </div>
            {/* Subtotal */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-t border-border/50">
              <span className="text-sm font-semibold text-muted-foreground">
                Subtotal {section.title}
              </span>
              <span className="font-mono font-semibold tabular-nums">
                {formatCurrency(section.subtotal)}
              </span>
            </div>
          </>
        )}
        {/* Total */}
        <div className="flex items-center justify-between px-4 py-3 border-t-2 border-border">
          <span className="text-sm font-bold">{totalLabel}</span>
          <span
            className={cn(
              'font-mono font-bold tabular-nums text-lg',
              totalColor
            )}
          >
            {formatCurrency(totalValue)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// EQUITY CARD
// =============================================================================

function EquityCard({
  accounts,
  total,
}: {
  accounts: BalanceSheetAccount[];
  total: number;
}) {
  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Scale className="h-4 w-4 text-violet-500" />
          Patrimonio Liquido
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {accounts.map(acc => (
            <AccountRow key={acc.name} account={acc} />
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t-2 border-border">
          <span className="text-sm font-bold">Total Patrimonio Liquido</span>
          <span
            className={cn(
              'font-mono font-bold tabular-nums text-lg',
              total >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {formatCurrency(total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function BalanceSheetSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card
          key={i}
          className="bg-white dark:bg-slate-800/60 border border-border"
        >
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-8 w-full" />
            ))}
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// DATE PICKER
// =============================================================================

function DatePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 px-3 text-sm font-normal justify-start gap-2"
        >
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{label}:</span>
          <span className="font-medium">
            {format(value, 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={d => d && onChange(d)}
          locale={ptBR}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function BalanceSheetPage() {
  const { hasPermission } = usePermissions();

  const [startDate, setStartDate] = useState<Date>(() =>
    startOfMonth(new Date())
  );
  const [endDate, setEndDate] = useState<Date>(() => endOfMonth(new Date()));

  const params = useMemo(
    () => ({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }),
    [startDate, endDate]
  );

  const { data, isLoading, error } = useBalanceSheet(params);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Financeiro', href: '/finance' },
          { label: 'Relatorios', href: '/finance/reports' },
          { label: 'Balanco Patrimonial' },
        ]}
        hasPermission={hasPermission}
      />

      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <DatePicker label="Inicio" value={startDate} onChange={setStartDate} />
        <DatePicker label="Fim" value={endDate} onChange={setEndDate} />
      </div>

      {/* Loading */}
      {isLoading && <BalanceSheetSkeleton />}

      {/* Error */}
      {error && !isLoading && (
        <Card className="bg-white dark:bg-slate-800/60 border border-border">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-rose-500 opacity-50" />
            <p className="text-muted-foreground">
              Erro ao carregar o balanco patrimonial. Tente novamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data */}
      {data && !isLoading && (
        <>
          {/* 3-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Assets */}
            <div className="space-y-6">
              <SectionCard
                title="Ativo"
                icon={Building2}
                iconColor="text-emerald-500"
                section={data.assets.current}
                totalLabel="Total do Ativo"
                totalValue={data.assets.total}
                totalColor="text-emerald-600 dark:text-emerald-400"
              />
              {data.assets.nonCurrent && (
                <Card className="bg-white dark:bg-slate-800/60 border border-border">
                  <CardContent className="p-0">
                    <div className="px-4 py-2 bg-muted/30 border-b border-border/50">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {data.assets.nonCurrent.title}
                      </span>
                    </div>
                    <div className="divide-y divide-border/30">
                      {data.assets.nonCurrent.accounts.map(acc => (
                        <AccountRow key={acc.name} account={acc} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-t border-border/50">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Subtotal {data.assets.nonCurrent.title}
                      </span>
                      <span className="font-mono font-semibold tabular-nums">
                        {formatCurrency(data.assets.nonCurrent.subtotal)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Column 2: Liabilities */}
            <div className="space-y-6">
              <SectionCard
                title="Passivo"
                icon={Landmark}
                iconColor="text-rose-500"
                section={data.liabilities.current}
                totalLabel="Total do Passivo"
                totalValue={data.liabilities.total}
                totalColor="text-rose-600 dark:text-rose-400"
              />
              {data.liabilities.nonCurrent && (
                <Card className="bg-white dark:bg-slate-800/60 border border-border">
                  <CardContent className="p-0">
                    <div className="px-4 py-2 bg-muted/30 border-b border-border/50">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {data.liabilities.nonCurrent.title}
                      </span>
                    </div>
                    <div className="divide-y divide-border/30">
                      {data.liabilities.nonCurrent.accounts.map(acc => (
                        <AccountRow key={acc.name} account={acc} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-t border-border/50">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Subtotal {data.liabilities.nonCurrent.title}
                      </span>
                      <span className="font-mono font-semibold tabular-nums">
                        {formatCurrency(data.liabilities.nonCurrent.subtotal)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Column 3: Equity */}
            <div>
              <EquityCard
                accounts={data.equity.accounts}
                total={data.equity.total}
              />
            </div>
          </div>

          {/* Footer: Balance Check */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Ativo Total
                    </p>
                    <p className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(data.assets.total)}
                    </p>
                  </div>
                  <span className="text-2xl font-light text-muted-foreground">
                    vs
                  </span>
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Passivo + Patrimonio Liquido
                    </p>
                    <p className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                      {formatCurrency(
                        data.liabilities.total + data.equity.total
                      )}
                    </p>
                  </div>
                </div>

                {data.isBalanced ? (
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30 px-4 py-1.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Equilibrado
                  </Badge>
                ) : (
                  <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300 border-rose-200 dark:border-rose-800/30 px-4 py-1.5 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1.5" />
                    Desequilibrado (diferenca: {formatCurrency(data.difference)}
                    )
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty state */}
      {!data && !isLoading && !error && (
        <Card className="bg-white dark:bg-slate-800/60 border border-border">
          <CardContent className="py-12 text-center">
            <Scale className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              Selecione um periodo para gerar o balanco patrimonial.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
