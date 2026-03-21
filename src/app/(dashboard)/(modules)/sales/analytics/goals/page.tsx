'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { useGoalsInfinite, useDeleteGoal } from '@/hooks/sales/use-analytics';
import type { AnalyticsGoal } from '@/types/sales';
import { Plus, Target, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'ACHIEVED', label: 'Atingido' },
  { value: 'MISSED', label: 'Perdido' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300',
  ACHIEVED: 'bg-green-50 text-green-700 dark:bg-green-500/8 dark:text-green-300',
  MISSED: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300',
  ARCHIVED: 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  ACHIEVED: 'Atingido',
  MISSED: 'Perdido',
  ARCHIVED: 'Arquivado',
};

const TYPE_LABELS: Record<string, string> = {
  REVENUE: 'Receita',
  QUANTITY: 'Quantidade',
  DEALS_WON: 'Negócios Fechados',
  NEW_CUSTOMERS: 'Novos Clientes',
  TICKET_AVERAGE: 'Ticket Médio',
  CONVERSION_RATE: 'Taxa de Conversão',
  COMMISSION: 'Comissão',
  BID_WIN_RATE: 'Taxa de Licitações',
  CUSTOM: 'Personalizado',
};

const PERIOD_LABELS: Record<string, string> = {
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
  CUSTOM: 'Personalizado',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function GoalsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (statusFilter) f.status = statusFilter;
    return f;
  }, [statusFilter]);

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGoalsInfinite(filters);

  const deleteGoalMutation = useDeleteGoal();

  const goals = useMemo(
    () => data?.pages.flatMap((page) => page.goals) ?? [],
    [data],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteGoalId) return;
    try {
      await deleteGoalMutation.mutateAsync(deleteGoalId);
      toast.success('Meta excluída com sucesso.');
      setDeleteGoalId(null);
    } catch {
      toast.error('Erro ao excluir meta.');
    }
  }, [deleteGoalId, deleteGoalMutation]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Analytics', href: '/sales/analytics' },
            { label: 'Metas' },
          ]}
        >
          <Button
            size="sm"
            className="h-9 px-2.5"
            onClick={() => router.push('/sales/analytics/goals/new')}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Meta
          </Button>
        </PageActionBar>
      </PageHeader>

      <PageBody>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FilterDropdown
              label="Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>

          {isLoading ? (
            <GridLoading />
          ) : error ? (
            <GridError />
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Target className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">Nenhuma meta encontrada</p>
              <p className="text-sm">Crie sua primeira meta para acompanhar o progresso das vendas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal: AnalyticsGoal) => (
                <Card
                  key={goal.id}
                  className="bg-white dark:bg-slate-800/60 border border-border hover:border-primary/20 transition-colors"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{goal.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={STATUS_COLORS[goal.status] ?? ''}
                          >
                            {STATUS_LABELS[goal.status] ?? goal.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {TYPE_LABELS[goal.type] ?? goal.type}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteGoalId(goal.id)}
                        className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">
                          {goal.progressPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={goal.progressPercentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {goal.unit === 'BRL'
                            ? formatCurrency(goal.currentValue)
                            : `${goal.currentValue} ${goal.unit}`}
                        </span>
                        <span>
                          Meta:{' '}
                          {goal.unit === 'BRL'
                            ? formatCurrency(goal.targetValue)
                            : `${goal.targetValue} ${goal.unit}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                      <span>{PERIOD_LABELS[goal.period] ?? goal.period}</span>
                      <span>
                        {new Date(goal.startDate).toLocaleDateString('pt-BR')} -{' '}
                        {new Date(goal.endDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasNextPage && (
            <div
              ref={sentinelRef}
              className="flex justify-center py-4"
            >
              {isFetchingNextPage && <GridLoading />}
              <button
                onClick={() => fetchNextPage()}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Carregar mais
              </button>
            </div>
          )}
        </div>

        <VerifyActionPinModal
          isOpen={!!deleteGoalId}
          onClose={() => setDeleteGoalId(null)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir esta meta."
        />
      </PageBody>
    </PageLayout>
  );
}
