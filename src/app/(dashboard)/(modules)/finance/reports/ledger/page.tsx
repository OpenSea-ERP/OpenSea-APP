'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BookOpen,
  Download,
  AlertTriangle,
  Search,
  CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { usePermissions } from '@/hooks/use-permissions';
import { useChartOfAccounts } from '@/hooks/finance/use-chart-of-accounts';
import { useLedger } from '@/hooks/finance/use-reports';
import type { LedgerEntry } from '@/types/finance';
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

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
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
          className="h-9 px-3 text-sm font-normal justify-start gap-2 min-w-36"
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
// SUMMARY CARD
// =============================================================================

function SummaryCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <p
          className={cn('text-xl font-bold font-mono tabular-nums', valueClass)}
        >
          {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function LedgerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="bg-white dark:bg-slate-800/60 border border-border"
          >
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-white dark:bg-slate-800/60 border border-border">
        <CardContent className="p-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 px-4 py-3 border-b border-border/30"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// TABLE ROW
// =============================================================================

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3 text-sm whitespace-nowrap font-mono text-muted-foreground">
        {formatDate(entry.date)}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap font-mono">
        {entry.journalCode}
      </td>
      <td className="px-4 py-3 text-sm max-w-xs truncate text-muted-foreground">
        {entry.description}
      </td>
      <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-mono tabular-nums">
        {entry.debit > 0 ? (
          <span className="text-emerald-600 dark:text-emerald-400">
            {formatCurrency(entry.debit)}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-mono tabular-nums">
        {entry.credit > 0 ? (
          <span className="text-rose-600 dark:text-rose-400">
            {formatCurrency(entry.credit)}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-mono tabular-nums font-medium">
        {formatCurrency(entry.balance)}
      </td>
    </tr>
  );
}

// =============================================================================
// CSV EXPORT
// =============================================================================

function downloadCsv(
  entries: LedgerEntry[],
  accountCode: string,
  _accountName: string
) {
  const header = [
    'Data',
    'Lançamento',
    'Descrição',
    'Débito',
    'Crédito',
    'Saldo',
  ];
  const rows = entries.map(e => [
    formatDate(e.date),
    e.journalCode,
    `"${e.description.replace(/"/g, '""')}"`,
    e.debit > 0 ? String(e.debit) : '',
    e.credit > 0 ? String(e.credit) : '',
    String(e.balance),
  ]);

  const csvContent = [header, ...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `razao_${accountCode}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function LedgerPage() {
  const { hasPermission } = usePermissions();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(() =>
    startOfMonth(new Date())
  );
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  // queried tracks committed query params (set when user clicks "Consultar")
  const [queriedParams, setQueriedParams] = useState<{
    chartOfAccountId: string;
    from: string;
    to: string;
  } | null>(null);

  // Load chart of accounts for the combobox
  const { data: accountsData, isLoading: accountsLoading } = useChartOfAccounts(
    {
      isActive: true,
      perPage: 500,
    }
  );

  const accountOptions: ComboboxOption[] = useMemo(() => {
    const accounts = accountsData?.chartOfAccounts ?? [];
    return accounts.map(acc => ({
      value: acc.id,
      label: `${acc.code} — ${acc.name}`,
    }));
  }, [accountsData]);

  const { data, isLoading, error } = useLedger(
    queriedParams ?? { chartOfAccountId: '', from: '', to: '' }
  );

  const handleConsultar = useCallback(() => {
    setQueriedParams({
      chartOfAccountId: selectedAccountId,
      from: format(startDate, 'yyyy-MM-dd'),
      to: format(endDate, 'yyyy-MM-dd'),
    });
  }, [selectedAccountId, startDate, endDate]);

  const handleExportCsv = useCallback(() => {
    if (!data) return;
    downloadCsv(data.entries, data.account.code, data.account.name);
  }, [data]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Relatórios', href: '/finance/reports' },
            { label: 'Razão' },
          ]}
          hasPermission={hasPermission}
        />
      </PageHeader>

      <PageBody>
        <PageHeroBanner
          title="Razão Contábil"
          description="Histórico cronológico de lançamentos de uma conta contábil específica, com débitos, créditos e saldo acumulado no período."
          icon={BookOpen}
          iconGradient="from-violet-500 to-indigo-600"
          buttons={[]}
          hasPermission={hasPermission}
        />

        {/* Filter Bar */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BookOpen className="h-4 w-4 text-violet-500" />
              Razão Contábil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              {/* Account Selector */}
              <div className="flex-1 min-w-60">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Conta Contábil
                </label>
                <Combobox
                  options={accountOptions}
                  value={selectedAccountId}
                  onValueChange={setSelectedAccountId}
                  placeholder={
                    accountsLoading
                      ? 'Carregando contas...'
                      : 'Selecione uma conta...'
                  }
                  searchPlaceholder="Buscar por código ou nome..."
                  emptyText="Nenhuma conta encontrada."
                  disabled={accountsLoading}
                />
              </div>

              {/* Date Range */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Período
                </label>
                <div className="flex items-center gap-2">
                  <DatePicker
                    label="De"
                    value={startDate}
                    onChange={setStartDate}
                  />
                  <span className="text-muted-foreground text-sm">até</span>
                  <DatePicker
                    label="Até"
                    value={endDate}
                    onChange={setEndDate}
                  />
                </div>
              </div>

              {/* Consultar Button */}
              <Button
                size="sm"
                className="h-9 px-4"
                onClick={handleConsultar}
                disabled={!selectedAccountId}
              >
                <Search className="h-4 w-4 mr-1.5" />
                Consultar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* No account selected / not yet queried */}
        {!queriedParams && (
          <Card className="bg-white dark:bg-slate-800/60 border border-border">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">
                Selecione uma conta para visualizar o razão.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {isLoading && <LedgerSkeleton />}

        {/* Error */}
        {error && !isLoading && (
          <Card className="bg-white dark:bg-slate-800/60 border border-border">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-rose-500 opacity-50" />
              <p className="text-muted-foreground">
                Erro ao carregar o razão. Verifique os filtros e tente
                novamente.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Data */}
        {data && !isLoading && (
          <>
            {/* Account header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Conta
                </p>
                <p className="text-lg font-semibold">
                  {data.account.code} — {data.account.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Período: {formatDate(data.period.from)} a{' '}
                  {formatDate(data.period.to)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 gap-1.5"
                onClick={handleExportCsv}
                disabled={!data.entries.length}
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard label="Saldo Inicial" value={data.openingBalance} />
              <SummaryCard
                label="Total Débitos"
                value={data.totalDebits}
                valueClass="text-emerald-600 dark:text-emerald-400"
              />
              <SummaryCard
                label="Total Créditos"
                value={data.totalCredits}
                valueClass="text-rose-600 dark:text-rose-400"
              />
              <SummaryCard
                label="Saldo Final"
                value={data.closingBalance}
                valueClass={
                  data.closingBalance >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }
              />
            </div>

            {/* Table */}
            <Card className="bg-white dark:bg-slate-800/60 border border-border">
              <CardContent className="p-0 overflow-auto">
                {data.entries.length === 0 ? (
                  <div className="py-16 text-center">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground">
                      Nenhum lançamento encontrado no período.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                          Data
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                          Lançamento
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap">
                          Débito
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap">
                          Crédito
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.entries.map((entry: LedgerEntry, idx: number) => (
                        <LedgerRow
                          key={`${entry.journalEntryId}-${idx}`}
                          entry={entry}
                        />
                      ))}
                    </tbody>
                    {/* Footer totals row */}
                    <tfoot>
                      <tr className="border-t-2 border-border bg-muted/20">
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-sm font-semibold text-muted-foreground"
                        >
                          Totais do período
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(data.totalDebits)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                          {formatCurrency(data.totalCredits)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono tabular-nums font-bold">
                          {formatCurrency(data.closingBalance)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty state when queried but no data returned */}
        {queriedParams && !isLoading && !error && !data && (
          <Card className="bg-white dark:bg-slate-800/60 border border-border">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">
                Nenhum lançamento encontrado no período para a conta
                selecionada.
              </p>
            </CardContent>
          </Card>
        )}
      </PageBody>
    </PageLayout>
  );
}
