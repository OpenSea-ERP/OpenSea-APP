/**
 * OpenSea OS - Cashier Session Detail Page
 * Página de detalhes da sessão de caixa com resumo e transações
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCashierSession } from '@/hooks/sales/use-cashier';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { CashierSession, CashierTransaction } from '@/types/sales';
import {
  CASHIER_SESSION_STATUS_LABELS,
  CASHIER_TRANSACTION_TYPE_LABELS,
} from '@/types/sales';
import {
  Banknote,
  Calculator,
  Calendar,
  DollarSign,
  Edit,
  Hash,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function CashierSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const sessionId = params.id as string;

  const { data: sessionData, isLoading, error } = useCashierSession(sessionId);

  const session = sessionData?.session as CashierSession | undefined;

  const actionButtons: HeaderButton[] = [
    ...(session?.status === 'OPEN' &&
    hasPermission(SALES_PERMISSIONS.CASHIER.ADMIN)
      ? [
          {
            id: 'edit',
            title: 'Editar Notas',
            icon: Edit,
            onClick: () => router.push(`/sales/cashier/${sessionId}/edit`),
            variant: 'default' as const,
          },
        ]
      : []),
  ];

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Caixa', href: '/sales/cashier' },
    { label: session ? `Sessão #${session.id.substring(0, 8)}` : '...' },
  ];

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !session) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Sessão não encontrada"
            message="A sessão de caixa que você está procurando não existe ou foi removida."
            action={{
              label: 'Voltar para Caixa',
              onClick: () => router.push('/sales/cashier'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const statusLabel =
    CASHIER_SESSION_STATUS_LABELS[session.status] || session.status;
  const transactions = session.transactions || [];
  const diff = session.difference ?? 0;

  const openedDate = new Date(session.openedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const closedDate = session.closedAt
    ? new Date(session.closedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const getStatusColor = () => {
    switch (session.status) {
      case 'OPEN':
        return 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300';
      case 'CLOSED':
        return 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400';
      case 'RECONCILED':
        return 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300';
      default:
        return '';
    }
  };

  return (
    <PageLayout data-testid="cashier-detail">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>
      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-teal-500 to-cyan-600">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Sessão de Caixa</p>
              <h1 className="text-xl font-bold truncate">
                Sessão #{session.id.substring(0, 8)}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getStatusColor()}`}
              >
                {statusLabel}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
          </TabsList>

          {/* TAB: Resumo */}
          <TabsContent value="summary" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Resumo da Sessão
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Valores de abertura, fechamento e diferença
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoRow
                      icon={Banknote}
                      label="Saldo Abertura"
                      value={formatCurrency(session.openingBalance)}
                    />
                    {session.closingBalance !== undefined &&
                      session.closingBalance !== null && (
                        <InfoRow
                          icon={Banknote}
                          label="Saldo Fechamento"
                          value={formatCurrency(session.closingBalance)}
                        />
                      )}
                    {session.expectedBalance !== undefined &&
                      session.expectedBalance !== null && (
                        <InfoRow
                          icon={Calculator}
                          label="Saldo Esperado"
                          value={formatCurrency(session.expectedBalance)}
                        />
                      )}
                    {diff !== 0 && (
                      <InfoRow
                        icon={diff > 0 ? TrendingUp : TrendingDown}
                        label="Diferença"
                        value={formatCurrency(diff)}
                      />
                    )}
                    <InfoRow
                      icon={Calendar}
                      label="Aberto em"
                      value={openedDate}
                    />
                    {closedDate && (
                      <InfoRow
                        icon={Calendar}
                        label="Fechado em"
                        value={closedDate}
                      />
                    )}
                    <InfoRow
                      icon={Hash}
                      label="Transações"
                      value={`${transactions.length} transação(ões)`}
                    />
                  </div>

                  {session.notes && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Observações
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {session.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Transações */}
          <TabsContent value="transactions" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4">
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-semibold text-muted-foreground">
                      Nenhuma transação
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nenhuma transação registrada nesta sessão.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-foreground" />
                        <div>
                          <h3 className="text-base font-semibold">
                            Transações
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Lista de movimentações da sessão
                          </p>
                        </div>
                      </div>
                      <div className="border-b border-border" />
                    </div>

                    {transactions.map((tx: CashierTransaction) => {
                      const typeLabel =
                        CASHIER_TRANSACTION_TYPE_LABELS[tx.type] || tx.type;
                      const isPositive =
                        tx.type === 'SALE' || tx.type === 'CASH_IN';

                      return (
                        <div
                          key={tx.id}
                          className="w-full rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                                  isPositive
                                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {isPositive ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">
                                  {typeLabel}
                                </p>
                                {tx.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {tx.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-sm font-bold ${
                                  isPositive
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : 'text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {isPositive ? '+' : '-'}
                                {formatCurrency(Math.abs(tx.amount))}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(tx.createdAt).toLocaleTimeString(
                                  'pt-BR',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
