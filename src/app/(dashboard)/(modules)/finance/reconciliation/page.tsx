/**
 * Conciliação Bancária — Listagem
 * Importação de arquivos OFX e listagem de conciliações com infinite scroll.
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { OfxImportModal } from '@/components/finance/reconciliation/ofx-import-modal';
import { ReconciliationSuggestionsPanel } from '@/components/finance/reconciliation/reconciliation-suggestions-panel';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useBankAccounts } from '@/hooks/finance/use-bank-accounts';
import {
  useReconciliationsInfinite,
  type ReconciliationFilters,
} from '@/hooks/finance/use-reconciliation';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import type { Reconciliation, ReconciliationStatus } from '@/types/finance';
import { RECONCILIATION_STATUS_LABELS } from '@/types/finance';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Calendar,
  FileText,
  Filter,
  Landmark,
  Loader2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
  { id: 'PENDING', label: 'Pendente' },
  { id: 'IN_PROGRESS', label: 'Em Andamento' },
  { id: 'COMPLETED', label: 'Concluída' },
  { id: 'CANCELLED', label: 'Cancelada' },
];

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
      'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-600 dark:text-slate-400',
  };
  return colors[status] ?? colors.PENDING;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ReconciliationPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="grid" size="md" gap="gap-4" />}
    >
      <ReconciliationPageContent />
    </Suspense>
  );
}

function ReconciliationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  const canImport = hasPermission(FINANCE_PERMISSIONS.ENTRIES.IMPORT);

  // ============================================================================
  // FILTER STATE
  // ============================================================================

  const statusIds = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const bankAccountIds = useMemo(() => {
    const raw = searchParams.get('bankAccount');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  // ============================================================================
  // STATE
  // ============================================================================

  const [importModalOpen, setImportModalOpen] = useState(false);

  // ============================================================================
  // DATA
  // ============================================================================

  const filters: ReconciliationFilters = useMemo(
    () => ({
      status:
        statusIds.length === 1
          ? (statusIds[0] as ReconciliationStatus)
          : undefined,
      bankAccountId:
        bankAccountIds.length === 1 ? bankAccountIds[0] : undefined,
    }),
    [statusIds, bankAccountIds]
  );

  const {
    reconciliations,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useReconciliationsInfinite(filters);

  // Bank accounts for filter dropdown
  const { data: bankAccountsData } = useBankAccounts({ perPage: 100 });
  const bankAccountOptions = useMemo(
    () =>
      (bankAccountsData?.bankAccounts ?? []).map(ba => ({
        id: ba.id,
        label: ba.name,
      })),
    [bankAccountsData]
  );

  // ============================================================================
  // INFINITE SCROLL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      observerEntries => {
        if (
          observerEntries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: { status?: string[]; bankAccount?: string[] }) => {
      const parts: string[] = [];
      const sts = params.status !== undefined ? params.status : statusIds;
      const ba =
        params.bankAccount !== undefined ? params.bankAccount : bankAccountIds;
      if (sts.length > 0) parts.push(`status=${sts.join(',')}`);
      if (ba.length > 0) parts.push(`bankAccount=${ba.join(',')}`);
      return parts.length > 0
        ? `/finance/reconciliation?${parts.join('&')}`
        : '/finance/reconciliation';
    },
    [statusIds, bankAccountIds]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  const setBankAccountFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ bankAccount: ids })),
    [router, buildFilterUrl]
  );

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
          ]}
          buttons={[
            ...(canImport
              ? [
                  {
                    id: 'import-ofx',
                    title: 'Importar OFX',
                    icon: Upload,
                    variant: 'default' as const,
                    onClick: () => setImportModalOpen(true),
                  },
                ]
              : []),
          ]}
        />

        <Header
          title="Conciliação Bancária"
          description="Importe arquivos OFX e concilie transações com lançamentos financeiros"
        />
      </PageHeader>

      <PageBody>
        {/* Auto-Reconciliation Suggestions */}
        <ReconciliationSuggestionsPanel />

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Status"
            icon={Filter}
            options={STATUS_OPTIONS}
            selected={statusIds}
            onSelectionChange={setStatusFilter}
            activeColor="violet"
            searchPlaceholder="Buscar status..."
            emptyText="Nenhum status encontrado."
          />
          <FilterDropdown
            label="Conta Bancária"
            icon={Building2}
            options={bankAccountOptions}
            selected={bankAccountIds}
            onSelectionChange={setBankAccountFilter}
            activeColor="cyan"
            searchPlaceholder="Buscar conta..."
            emptyText="Nenhuma conta encontrada."
          />
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {total} {total === 1 ? 'conciliação' : 'conciliações'}
            {reconciliations.length < total &&
              ` (${reconciliations.length} carregadas)`}
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <GridLoading count={6} layout="grid" size="md" gap="gap-4" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar conciliações"
            message="Ocorreu um erro ao tentar carregar as conciliações. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : reconciliations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">
                Nenhuma conciliação encontrada
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Importe um arquivo OFX do banco ou conecte uma conta via Open
                Finance para sincronizar as transações automaticamente.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {canImport && (
                <Button
                  variant="default"
                  onClick={() => setImportModalOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar OFX
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/finance/bank-connections">
                  <Landmark className="h-4 w-4 mr-2" />
                  Conectar via Open Finance
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {reconciliations.map(rec => (
                <ReconciliationCard
                  key={rec.id}
                  reconciliation={rec}
                  onClick={() =>
                    router.push(`/finance/reconciliation/${rec.id}`)
                  }
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}

        {/* Import Modal */}
        <OfxImportModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onImported={() => refetch()}
        />
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// RECONCILIATION CARD
// ============================================================================

function ReconciliationCard({
  reconciliation,
  onClick,
}: {
  reconciliation: Reconciliation;
  onClick: () => void;
}) {
  const matchedPercent =
    reconciliation.totalItems > 0
      ? Math.round(
          ((reconciliation.matchedItems + reconciliation.createdItems) /
            reconciliation.totalItems) *
            100
        )
      : 0;

  return (
    <Card
      className="p-4 cursor-pointer hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors"
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {reconciliation.bankAccountName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {reconciliation.fileName}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 text-[11px]',
              getStatusColor(reconciliation.status)
            )}
          >
            {RECONCILIATION_STATUS_LABELS[reconciliation.status]}
          </Badge>
        </div>

        {/* Period */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(reconciliation.periodStart)} a{' '}
          {formatDate(reconciliation.periodEnd)}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/50 p-1.5">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-semibold">{reconciliation.totalItems}</p>
          </div>
          <div className="rounded-md bg-emerald-50 dark:bg-emerald-500/8 p-1.5">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Conciliados
            </p>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {reconciliation.matchedItems + reconciliation.createdItems}
            </p>
          </div>
          <div className="rounded-md bg-amber-50 dark:bg-amber-500/8 p-1.5">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Pendentes
            </p>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {reconciliation.unmatchedItems}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{matchedPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
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

        {/* Totals */}
        <div className="flex items-center justify-between text-xs pt-1 border-t">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <ArrowUpCircle className="h-3 w-3" />
            {formatCurrency(reconciliation.totalCredits)}
          </span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <ArrowDownCircle className="h-3 w-3" />
            {formatCurrency(reconciliation.totalDebits)}
          </span>
        </div>
      </div>
    </Card>
  );
}
