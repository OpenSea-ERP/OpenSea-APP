/**
 * OpenSea OS - Plano de Contas (Chart of Accounts)
 * Listagem hierarquica com infinite scroll e filtros server-side
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useChartOfAccountsInfinite,
  useChartOfAccounts,
  useCreateChartOfAccount,
  useDeleteChartOfAccount,
  type ChartOfAccountsFilters,
} from '@/hooks/finance/use-chart-of-accounts';
import { cn } from '@/lib/utils';
import type {
  ChartOfAccount,
  ChartOfAccountType,
  CreateChartOfAccountData,
} from '@/types/finance';
import {
  BookOpen,
  ChevronRight,
  Edit,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { CreateChartOfAccountWizard } from './src';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// =============================================================================
// CONSTANTS
// =============================================================================

const TYPE_FILTER_OPTIONS = [
  { id: 'ASSET', label: 'Ativo' },
  { id: 'LIABILITY', label: 'Passivo' },
  { id: 'EQUITY', label: 'Patrimonio Liquido' },
  { id: 'REVENUE', label: 'Receita' },
  { id: 'EXPENSE', label: 'Despesa' },
];

const TYPE_LABELS: Record<ChartOfAccountType, string> = {
  ASSET: 'Ativo',
  LIABILITY: 'Passivo',
  EQUITY: 'Patrimonio Liquido',
  REVENUE: 'Receita',
  EXPENSE: 'Despesa',
};

const TYPE_COLORS: Record<ChartOfAccountType, string> = {
  ASSET:
    'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  LIABILITY:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  EQUITY:
    'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
  REVENUE:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  EXPENSE:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
};

const CLASS_LABELS: Record<string, string> = {
  CURRENT: 'Circulante',
  NON_CURRENT: 'Nao Circulante',
  OPERATIONAL: 'Operacional',
  FINANCIAL: 'Financeiro',
  OTHER: 'Outro',
};

const NATURE_LABELS: Record<string, string> = {
  DEBIT: 'Debito',
  CREDIT: 'Credito',
};

// =============================================================================
// HELPERS
// =============================================================================

/** Compute hierarchy level from code (e.g., "1" = 0, "1.1" = 1, "1.1.1" = 2) */
function getCodeLevel(code: string): number {
  return code.split('.').length - 1;
}

/** Build a tree-ordered list from flat accounts */
function buildTreeOrder(accounts: ChartOfAccount[]): ChartOfAccount[] {
  // Sort by code for natural hierarchy
  return [...accounts].sort((a, b) => {
    const aParts = a.code.split('.').map(Number);
    const bParts = b.code.split('.').map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] ?? 0;
      const bVal = bParts[i] ?? 0;
      if (aVal !== bVal) return aVal - bVal;
    }
    return 0;
  });
}

// =============================================================================
// ROW COMPONENT
// =============================================================================

function AccountRow({
  account,
  level,
  onView,
  onEdit,
  onDelete,
  canView,
  canEdit,
  canDelete,
}: {
  account: ChartOfAccount;
  level: number;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const isParent = level === 0;

  return (
    <tr
      className={cn(
        'border-b border-border/50 transition-colors hover:bg-muted/50',
        isParent && 'bg-muted/20 font-medium'
      )}
    >
      {/* Codigo + Nome */}
      <td className="px-4 py-3">
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${level * 24}px` }}
        >
          {level > 0 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <span className="font-mono text-sm text-muted-foreground shrink-0">
            {account.code}
          </span>
          <span
            className={cn(
              'text-sm truncate',
              isParent ? 'font-semibold text-foreground' : 'text-foreground/90'
            )}
          >
            {account.name}
          </span>
          {account.isSystem && (
            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-600 dark:text-slate-300 shrink-0">
              Sistema
            </span>
          )}
        </div>
      </td>

      {/* Tipo */}
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
            TYPE_COLORS[account.type]
          )}
        >
          {TYPE_LABELS[account.type]}
        </span>
      </td>

      {/* Classe */}
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {CLASS_LABELS[account.accountClass] ?? account.accountClass}
        </span>
      </td>

      {/* Natureza */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-sm text-muted-foreground">
          {NATURE_LABELS[account.nature] ?? account.nature}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <Badge
          variant="outline"
          className={cn(
            'text-[11px]',
            account.isActive
              ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
              : 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300'
          )}
        >
          {account.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      </td>

      {/* Acoes */}
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {canView && (
              <DropdownMenuItem onClick={() => onView(account.id)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
            )}
            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(account.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            {canDelete && !account.isSystem && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(account.id)}
                  className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function ChartOfAccountsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <ChartOfAccountsPageContent />
    </Suspense>
  );
}

function ChartOfAccountsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSION FLAGS
  // ============================================================================

  const canView = hasPermission(FINANCE_PERMISSIONS.CHART_OF_ACCOUNTS.ACCESS);
  const canCreate = hasPermission(
    FINANCE_PERMISSIONS.CHART_OF_ACCOUNTS.REGISTER
  );
  const canEdit = hasPermission(FINANCE_PERMISSIONS.CHART_OF_ACCOUNTS.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.CHART_OF_ACCOUNTS.REMOVE);

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const typeIds = useMemo(() => {
    const raw = searchParams.get('type');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // ============================================================================
  // DATA: Infinite scroll
  // ============================================================================

  const typeFilter = useMemo(() => {
    if (typeIds.length === 1) return typeIds[0];
    return undefined;
  }, [typeIds]);

  const filters: ChartOfAccountsFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      type: typeFilter,
      sortBy: 'code' as const,
      sortOrder: 'asc' as const,
    }),
    [debouncedSearch, typeFilter]
  );

  const {
    accounts,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useChartOfAccountsInfinite(filters);

  // Fetch all accounts for the wizard (parent dropdown)
  const { data: allAccountsData } = useChartOfAccounts({
    perPage: 100,
    sortBy: 'code',
    sortOrder: 'asc',
  });
  const allAccounts = allAccountsData?.chartOfAccounts ?? [];

  // Mutations
  const createMutation = useCreateChartOfAccount();
  const deleteMutation = useDeleteChartOfAccount();

  // ============================================================================
  // INFINITE SCROLL SENTINEL
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
    (params: { type?: string[] }) => {
      const parts: string[] = [];
      const tp = params.type !== undefined ? params.type : typeIds;
      if (tp.length > 0) parts.push(`type=${tp.join(',')}`);
      return parts.length > 0
        ? `/finance/chart-of-accounts?${parts.join('&')}`
        : '/finance/chart-of-accounts';
    },
    [typeIds]
  );

  const setTypeFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ type: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleView = useCallback(
    (id: string) => router.push(`/finance/chart-of-accounts/${id}`),
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => router.push(`/finance/chart-of-accounts/${id}/edit`),
    [router]
  );

  const handleDelete = useCallback((id: string) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;
    await deleteMutation.mutateAsync(itemToDelete);
    setDeleteModalOpen(false);
    setItemToDelete(null);
    toast.success('Conta excluida com sucesso!');
  }, [itemToDelete, deleteMutation]);

  const handleCreate = useCallback(
    async (data: CreateChartOfAccountData) => {
      try {
        await createMutation.mutateAsync(data);
        toast.success('Conta criada com sucesso!');
        setIsCreateOpen(false);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao criar conta';
        toast.error(message);
      }
    },
    [createMutation]
  );

  // ============================================================================
  // COMPUTED: Tree-ordered list
  // ============================================================================

  const orderedAccounts = useMemo(() => buildTreeOrder(accounts), [accounts]);

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-chart-of-account',
        title: 'Nova Conta',
        icon: Plus,
        onClick: () => setIsCreateOpen(true),
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Plano de Contas', href: '/finance/chart-of-accounts' },
          ]}
          buttons={actionButtons}
        />

        <Header
          title="Plano de Contas"
          description="Gerencie a estrutura contabil hierarquica da empresa"
        />
      </PageHeader>

      <PageBody>
        {/* Search Bar */}
        <SearchBar
          placeholder="Buscar contas por nome ou codigo..."
          value={searchQuery}
          onSearch={setSearchQuery}
          onClear={() => setSearchQuery('')}
          showClear={true}
          size="md"
        />

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Tipo"
            icon={BookOpen}
            options={TYPE_FILTER_OPTIONS}
            selected={typeIds}
            onSelectionChange={setTypeFilter}
            activeColor="violet"
            searchPlaceholder="Buscar tipo..."
            emptyText="Nenhum tipo encontrado."
          />
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {total} {total === 1 ? 'conta' : 'contas'}
            {accounts.length < total && ` (${accounts.length} carregadas)`}
          </p>
        </div>

        {/* Table */}
        {isLoading ? (
          <GridLoading count={12} layout="list" size="md" gap="gap-2" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar plano de contas"
            message="Ocorreu um erro ao tentar carregar as contas. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : orderedAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Nenhuma conta encontrada
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {debouncedSearch || typeIds.length > 0
                ? 'Tente ajustar os filtros ou a busca.'
                : 'Comece criando a primeira conta do plano de contas.'}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Codigo / Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                        Classe
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                        Natureza
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedAccounts.map(account => (
                      <AccountRow
                        key={account.id}
                        account={account}
                        level={getCodeLevel(account.code)}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        canView={canView}
                        canEdit={canEdit}
                        canDelete={canDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
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

        {/* Create Wizard */}
        <CreateChartOfAccountWizard
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
          accounts={allAccounts}
        />

        {/* Delete PIN Confirmation Modal */}
        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusao"
          description="Digite seu PIN de Acao para confirmar a exclusao desta conta contabil. Esta acao nao pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
