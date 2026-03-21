'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFinanceEntries } from '@/hooks/finance';
import { FINANCE_ENTRY_STATUS_LABELS } from '@/types/finance';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type TabType = 'payable' | 'receivable';

export default function OverduePage() {
  const router = useRouter();
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

  const getAgingBadge = (days: number) => {
    if (days <= 7) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    } else if (days <= 30) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    } else if (days <= 60) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
    } else {
      return 'bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Contas Vencidas</h1>
            <p className="text-muted-foreground">
              Visualize contas vencidas e em atraso
            </p>
          </div>
        </div>
      </div>

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
