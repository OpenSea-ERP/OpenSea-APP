/**
 * Conciliação Bancária — Detalhe
 * Página principal de revisão de conciliação com transações pendentes e conciliadas.
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { ManualMatchModal } from '@/components/finance/reconciliation/manual-match-modal';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useReconciliation,
  useMatchItem,
  useIgnoreItem,
  useCreateEntryFromItem,
  useCompleteReconciliation,
  useCancelReconciliation,
} from '@/hooks/finance/use-reconciliation';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import type {
  ReconciliationItem,
  ReconciliationItemStatus,
  ReconciliationStatus,
} from '@/types/finance';
import {
  RECONCILIATION_STATUS_LABELS,
  RECONCILIATION_ITEM_STATUS_LABELS,
} from '@/types/finance';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Link2,
  Loader2,
  Plus,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getStatusColor(status: ReconciliationStatus): string {
  const colors: Record<ReconciliationStatus, string> = {
    PENDING:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    IN_PROGRESS:
      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
    COMPLETED:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    CANCELLED:
      'border-slate-300 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400',
  };
  return colors[status] ?? colors.PENDING;
}

function getItemStatusColor(status: ReconciliationItemStatus): string {
  const colors: Record<ReconciliationItemStatus, string> = {
    UNMATCHED:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    MATCHED:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    IGNORED:
      'border-slate-300 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400',
    CREATED:
      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  };
  return colors[status] ?? colors.UNMATCHED;
}

function getConfidenceBadge(confidence: number | null | undefined) {
  if (confidence == null) return null;
  if (confidence >= 90)
    return {
      label: 'Alta',
      color:
        'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    };
  if (confidence >= 70)
    return {
      label: 'Média',
      color:
        'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    };
  return {
    label: 'Baixa',
    color:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ReconciliationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  const canModify = hasPermission(FINANCE_PERMISSIONS.ENTRIES.MODIFY);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data: reconciliationData,
    isLoading,
    error,
    refetch,
  } = useReconciliation(id);

  const reconciliation = reconciliationData?.reconciliation;

  // ============================================================================
  // STATE
  // ============================================================================

  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(
    null
  );
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const matchMutation = useMatchItem();
  const ignoreMutation = useIgnoreItem();
  const createEntryMutation = useCreateEntryFromItem();
  const completeMutation = useCompleteReconciliation();
  const cancelMutation = useCancelReconciliation();

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const items = reconciliation?.items ?? [];

  const pendingItems = useMemo(
    () => items.filter(i => i.status === 'UNMATCHED'),
    [items]
  );

  const reconciledItems = useMemo(
    () => items.filter(i => i.status !== 'UNMATCHED'),
    [items]
  );

  const matchedPercent =
    reconciliation && reconciliation.totalItems > 0
      ? Math.round(
          ((reconciliation.matchedItems + reconciliation.createdItems) /
            reconciliation.totalItems) *
            100
        )
      : 0;

  const isEditable =
    reconciliation?.status === 'PENDING' ||
    reconciliation?.status === 'IN_PROGRESS';

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleMatch = useCallback(
    async (entryId: string) => {
      if (!selectedItem) return;
      try {
        await matchMutation.mutateAsync({
          reconciliationId: id,
          itemId: selectedItem.id,
          entryId,
        });
        toast.success('Transação vinculada com sucesso!');
        setMatchModalOpen(false);
        setSelectedItem(null);
        refetch();
      } catch {
        toast.error('Erro ao vincular transação.');
      }
    },
    [selectedItem, id, matchMutation, refetch]
  );

  const handleIgnore = useCallback(
    async (item: ReconciliationItem) => {
      try {
        await ignoreMutation.mutateAsync({
          reconciliationId: id,
          itemId: item.id,
        });
        toast.success('Transação ignorada.');
        refetch();
      } catch {
        toast.error('Erro ao ignorar transação.');
      }
    },
    [id, ignoreMutation, refetch]
  );

  const handleCreateEntry = useCallback(
    async (item: ReconciliationItem) => {
      try {
        await createEntryMutation.mutateAsync({
          reconciliationId: id,
          itemId: item.id,
        });
        toast.success('Lançamento criado com sucesso!');
        refetch();
      } catch {
        toast.error('Erro ao criar lançamento.');
      }
    },
    [id, createEntryMutation, refetch]
  );

  const handleComplete = useCallback(async () => {
    try {
      await completeMutation.mutateAsync(id);
      toast.success('Conciliação concluída com sucesso!');
      setCompleteModalOpen(false);
      refetch();
    } catch {
      toast.error('Erro ao concluir conciliação.');
    }
  }, [id, completeMutation, refetch]);

  const handleCancel = useCallback(async () => {
    try {
      await cancelMutation.mutateAsync(id);
      toast.success('Conciliação cancelada.');
      setCancelModalOpen(false);
      router.push('/finance/reconciliation');
    } catch {
      toast.error('Erro ao cancelar conciliação.');
    }
  }, [id, cancelMutation, router]);

  const openMatchModal = useCallback((item: ReconciliationItem) => {
    setSelectedItem(item);
    setMatchModalOpen(true);
  }, []);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              {
                label: 'Conciliação Bancária',
                href: '/finance/reconciliation',
              },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !reconciliation) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              {
                label: 'Conciliação Bancária',
                href: '/finance/reconciliation',
              },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Erro ao carregar conciliação"
            message="Não foi possível carregar os dados da conciliação."
            action={{ label: 'Voltar', onClick: () => router.back() }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Conciliação Bancária', href: '/finance/reconciliation' },
            { label: reconciliation.bankAccountName },
          ]}
          buttons={[
            ...(canModify && isEditable
              ? [
                  {
                    id: 'cancel-reconciliation',
                    title: 'Cancelar',
                    icon: XCircle,
                    variant: 'outline' as const,
                    onClick: () => setCancelModalOpen(true),
                  },
                  {
                    id: 'complete-reconciliation',
                    title: 'Concluir Conciliação',
                    icon: CheckCircle2,
                    variant: 'default' as const,
                    onClick: () => setCompleteModalOpen(true),
                  },
                ]
              : []),
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Summary Header */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left: Account info */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      {reconciliation.bankAccountName}
                    </h2>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[11px]',
                        getStatusColor(reconciliation.status)
                      )}
                    >
                      {RECONCILIATION_STATUS_LABELS[reconciliation.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {reconciliation.fileName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(reconciliation.periodStart)} a{' '}
                      {formatDate(reconciliation.periodEnd)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Stats */}
              <div className="flex items-center gap-3">
                <StatBox
                  label="Total"
                  value={reconciliation.totalItems}
                  color="default"
                />
                <StatBox
                  label="Conciliados"
                  value={
                    reconciliation.matchedItems + reconciliation.createdItems
                  }
                  color="emerald"
                />
                <StatBox
                  label="Pendentes"
                  value={reconciliation.unmatchedItems}
                  color="amber"
                />
                <StatBox
                  label="Ignorados"
                  value={reconciliation.ignoredItems}
                  color="slate"
                />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Progresso da conciliação
                </span>
                <span className="font-medium">{matchedPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    matchedPercent === 100
                      ? 'bg-emerald-500'
                      : matchedPercent > 50
                        ? 'bg-sky-500'
                        : 'bg-amber-500'
                  )}
                  style={{ width: `${matchedPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Pendentes ({pendingItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="reconciled"
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Conciliados ({reconciledItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-2">
            {pendingItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                <h3 className="text-base font-medium mb-1">
                  Todas as transações foram conciliadas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Não há transações pendentes de conciliação.
                </p>
              </div>
            ) : (
              pendingItems.map(item => (
                <TransactionRow
                  key={item.id}
                  item={item}
                  isEditable={isEditable && canModify}
                  onMatch={() => openMatchModal(item)}
                  onIgnore={() => handleIgnore(item)}
                  onCreateEntry={() => handleCreateEntry(item)}
                  isIgnoring={ignoreMutation.isPending}
                  isCreating={createEntryMutation.isPending}
                />
              ))
            )}
          </TabsContent>

          {/* Reconciled Tab */}
          <TabsContent value="reconciled" className="space-y-2">
            {reconciledItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <h3 className="text-base font-medium mb-1">
                  Nenhuma transação conciliada ainda
                </h3>
                <p className="text-sm text-muted-foreground">
                  Vincule transações pendentes para vê-las aqui.
                </p>
              </div>
            ) : (
              reconciledItems.map(item => (
                <TransactionRow
                  key={item.id}
                  item={item}
                  isEditable={false}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <ManualMatchModal
          open={matchModalOpen}
          onOpenChange={setMatchModalOpen}
          reconciliationId={id}
          item={selectedItem}
          onMatch={handleMatch}
          isMatching={matchMutation.isPending}
        />

        <VerifyActionPinModal
          isOpen={completeModalOpen}
          onClose={() => setCompleteModalOpen(false)}
          onSuccess={handleComplete}
          title="Concluir Conciliação"
          description="Digite seu PIN de Ação para confirmar a conclusão desta conciliação. Transações pendentes permanecerão como não conciliadas."
        />

        <VerifyActionPinModal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          onSuccess={handleCancel}
          title="Cancelar Conciliação"
          description="Digite seu PIN de Ação para cancelar esta conciliação. Todos os vínculos serão desfeitos."
        />
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// STAT BOX
// ============================================================================

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'default' | 'emerald' | 'amber' | 'slate';
}) {
  const colorClasses = {
    default: 'bg-muted/50',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/8',
    amber: 'bg-amber-50 dark:bg-amber-500/8',
    slate: 'bg-slate-50 dark:bg-slate-500/8',
  };

  const textClasses = {
    default: 'text-foreground',
    emerald: 'text-emerald-700 dark:text-emerald-300',
    amber: 'text-amber-700 dark:text-amber-300',
    slate: 'text-slate-600 dark:text-slate-400',
  };

  return (
    <div
      className={cn(
        'rounded-lg px-3 py-2 text-center min-w-[72px]',
        colorClasses[color]
      )}
    >
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className={cn('text-lg font-bold', textClasses[color])}>{value}</p>
    </div>
  );
}

// ============================================================================
// TRANSACTION ROW
// ============================================================================

function TransactionRow({
  item,
  isEditable,
  onMatch,
  onIgnore,
  onCreateEntry,
  isIgnoring,
  isCreating,
}: {
  item: ReconciliationItem;
  isEditable: boolean;
  onMatch?: () => void;
  onIgnore?: () => void;
  onCreateEntry?: () => void;
  isIgnoring?: boolean;
  isCreating?: boolean;
}) {
  const isCredit = item.transactionType === 'CREDIT';
  const confidenceBadge = getConfidenceBadge(item.matchConfidence);

  return (
    <Card className="p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
            isCredit
              ? 'bg-emerald-100 dark:bg-emerald-500/10'
              : 'bg-rose-100 dark:bg-rose-500/10'
          )}
        >
          {isCredit ? (
            <ArrowUpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowDownCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {item.description}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 text-[10px]',
                getItemStatusColor(item.status)
              )}
            >
              {RECONCILIATION_ITEM_STATUS_LABELS[item.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(item.date)}
            </span>
            {item.matchedEntryCode && (
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <Link2 className="h-3 w-3" />
                {item.matchedEntryCode}
                {item.matchedEntryDescription &&
                  ` — ${item.matchedEntryDescription}`}
              </span>
            )}
            {confidenceBadge && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border',
                  confidenceBadge.color
                )}
              >
                {Math.round(item.matchConfidence!)}% {confidenceBadge.label}
              </span>
            )}
            {item.memo && (
              <span className="truncate">{item.memo}</span>
            )}
          </div>
        </div>

        {/* Amount */}
        <span
          className={cn(
            'text-sm font-bold font-mono whitespace-nowrap',
            isCredit
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          )}
        >
          {isCredit ? '+' : '-'}
          {formatCurrency(Math.abs(item.amount))}
        </span>

        {/* Actions */}
        {isEditable && item.status === 'UNMATCHED' && (
          <div className="flex items-center gap-1 shrink-0">
            {onMatch && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={onMatch}
              >
                <Link2 className="h-3.5 w-3.5 mr-1" />
                Vincular
              </Button>
            )}
            {onCreateEntry && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={onCreateEntry}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Criar
                  </>
                )}
              </Button>
            )}
            {onIgnore && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-rose-600"
                onClick={onIgnore}
                disabled={isIgnoring}
              >
                {isIgnoring ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5 mr-1" />
                    Ignorar
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
