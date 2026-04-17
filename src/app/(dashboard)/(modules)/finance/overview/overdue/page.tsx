'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { useFinanceEntriesInfinite } from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { FINANCE_ENTRY_STATUS_LABELS } from '@/types/finance';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type TabType = 'payable' | 'receivable';

export default function OverduePage() {
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<TabType>('payable');

  const {
    entries,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useFinanceEntriesInfinite({
    type: currentTab === 'payable' ? 'PAYABLE' : 'RECEIVABLE',
    isOverdue: true,
    sortBy: 'dueDate',
    sortOrder: 'asc',
  });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 0;
  };

  // Aging colors: paleta finance proíbe amber/yellow. Rose para vencido e
  // teal para o bucket mais leve (7 dias — aviso brando, ainda não crítico).
  const getAgingBadge = (days: number) => {
    if (days <= 7) {
      return 'bg-teal-50 text-teal-700 dark:bg-teal-500/8 dark:text-teal-300';
    } else if (days <= 30) {
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300';
    } else if (days <= 60) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200';
    } else {
      return 'bg-rose-200 text-rose-900 dark:bg-rose-500/25 dark:text-rose-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200';
      case 'PARTIALLY_PAID':
        return 'bg-teal-50 text-teal-700 dark:bg-teal-500/8 dark:text-teal-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Financeiro', href: '/finance' },
          { label: 'Visão Geral', href: '/finance/overview' },
          { label: 'Contas Vencidas' },
        ]}
        hasPermission={hasPermission}
      />

      <PageHeroBanner
        title="Contas Vencidas"
        description="Acompanhe contas a pagar e a receber em atraso, com aging por faixa de dias e total inadimplente do período."
        icon={AlertTriangle}
        iconGradient="from-rose-500 to-rose-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      {/* Tabs (a11y-friendly shadcn primitive replaces the old <button> stack) */}
      <Tabs value={currentTab} onValueChange={v => setCurrentTab(v as TabType)}>
        <TabsList>
          <TabsTrigger value="payable">A Pagar Vencidos</TabsTrigger>
          <TabsTrigger value="receivable">A Receber Vencidos</TabsTrigger>
        </TabsList>
      </Tabs>

      {!isLoading && !error && entries.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'lançamento vencido' : 'lançamentos vencidos'}
          {entries.length < total && ` (${entries.length} carregados)`}
        </p>
      )}

      <Card>
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 mx-auto text-rose-600 dark:text-rose-400" />
            <p className="text-sm text-rose-800 dark:text-rose-300">
              {error instanceof Error
                ? error.message
                : 'Erro ao carregar contas vencidas.'}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-emerald-500/60" />
            <div>
              <p className="font-semibold">Sem contas vencidas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tudo em dia para{' '}
                {currentTab === 'payable'
                  ? 'contas a pagar'
                  : 'contas a receber'}{' '}
                no momento.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold">Código</th>
                  <th className="text-left p-4 font-semibold">Descrição</th>
                  <th className="text-left p-4 font-semibold">Categoria</th>
                  <th className="text-left p-4 font-semibold">
                    {currentTab === 'payable' ? 'Fornecedor' : 'Cliente'}
                  </th>
                  <th className="text-right p-4 font-semibold">Valor</th>
                  <th className="text-left p-4 font-semibold">Vencimento</th>
                  <th className="text-center p-4 font-semibold">
                    Dias em Atraso
                  </th>
                  <th className="text-left p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map(entry => {
                  const daysOverdue = calculateDaysOverdue(entry.dueDate);
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() =>
                        router.push(`/finance/${currentTab}/${entry.id}`)
                      }
                    >
                      <td className="p-4 font-mono text-sm">{entry.code}</td>
                      <td className="p-4">
                        <div className="font-medium">{entry.description}</div>
                      </td>
                      <td className="p-4 text-sm">
                        {entry.categoryName || '—'}
                      </td>
                      <td className="p-4 text-sm">
                        {currentTab === 'payable'
                          ? entry.supplierName || '—'
                          : entry.customerName || '—'}
                      </td>
                      <td className="p-4 text-right font-mono text-sm">
                        {formatCurrency(entry.expectedAmount)}
                      </td>
                      <td className="p-4 text-sm">
                        {formatDate(entry.dueDate)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAgingBadge(daysOverdue)}`}
                        >
                          {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}
                        >
                          {FINANCE_ENTRY_STATUS_LABELS[entry.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
