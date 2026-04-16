'use client';

import { Card } from '@/components/ui/card';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { useFinanceEntries } from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { FINANCE_ENTRY_STATUS_LABELS } from '@/types/finance';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

type TabType = 'payable' | 'receivable';

export default function OverduePage() {
  const { hasPermission } = usePermissions();
  const [currentTab, setCurrentTab] = useState<TabType>('payable');

  const { data, isLoading, error } = useFinanceEntries({
    type: currentTab === 'payable' ? 'PAYABLE' : 'RECEIVABLE',
    isOverdue: true,
  });
  const entries = data?.entries;

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

  // Aging colors: avoid yellow/orange (CLAUDE.md) — use rose ramps + amber
  // only for the lightest 7-day bucket where the warning isn't yet critical.
  const getAgingBadge = (days: number) => {
    if (days <= 7) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
    } else if (days <= 30) {
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300';
    } else if (days <= 60) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200';
    } else {
      return 'bg-rose-200 text-rose-900 dark:bg-rose-500/30 dark:text-rose-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200';
      case 'PARTIALLY_PAID':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300';
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

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          className={`px-6 py-3 font-medium transition-colors ${
            currentTab === 'payable'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setCurrentTab('payable')}
        >
          A Pagar Vencidos
        </button>
        <button
          className={`px-6 py-3 font-medium transition-colors ${
            currentTab === 'receivable'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setCurrentTab('receivable')}
        >
          A Receber Vencidos
        </button>
      </div>

      {/* Content */}
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
          <div className="p-8 text-center text-muted-foreground">
            Erro ao carregar contas vencidas
          </div>
        ) : !entries || entries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum registro encontrado
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgingBadge(daysOverdue)}`}
                        >
                          {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}
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
    </div>
  );
}
