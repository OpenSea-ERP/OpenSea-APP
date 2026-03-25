/**
 * OpenSea OS - Centros de Custo (Cost Centers)
 * Listagem com infinite scroll e filtros server-side
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
import { LinkCompanyModal } from '@/components/modals/link-company-modal';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import type { EntityConfig } from '@/core/types';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCostCentersInfinite,
  useCreateCostCenter,
  useDeleteCostCenter,
  useUpdateCostCenter,
  type CostCentersFilters,
} from '@/hooks/finance/use-cost-centers';
import { useCostCenters } from '@/hooks/finance';
import { cn } from '@/lib/utils';
import type { CostCenter } from '@/types/finance';
import {
  Building2,
  Calendar,
  CircleDot,
  DollarSign,
  GitBranch,
  Landmark,
  Link2Off,
  Loader2,
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
import { CreateCostCenterWizard } from './src';

// =============================================================================
// ENTITY CONFIG (minimal, for EntityGrid)
// =============================================================================

const costCentersConfig: EntityConfig<CostCenter> = {
  name: 'cost-center',
  namePlural: 'cost-centers',
  api: {
    baseUrl: '/api/v1/finance/cost-centers',
  },
  routes: {
    list: '/finance/cost-centers',
    detail: '/finance/cost-centers/:id',
  },
  display: {
    titleField: 'name',
    subtitleField: 'code',
    labels: {
      singular: 'centro de custo',
      plural: 'centros de custo',
      createButton: 'Novo Centro de Custo',
      searchPlaceholder: 'Buscar centros de custo por nome ou código...',
      emptyState: 'Nenhum centro de custo encontrado',
    },
  },
  permissions: {
    view: FINANCE_PERMISSIONS.COST_CENTERS.ACCESS,
    create: FINANCE_PERMISSIONS.COST_CENTERS.REGISTER,
    edit: FINANCE_PERMISSIONS.COST_CENTERS.MODIFY,
    delete: FINANCE_PERMISSIONS.COST_CENTERS.REMOVE,
  },
};

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_OPTIONS = [
  { id: 'active', label: 'Ativo' },
  { id: 'inactive', label: 'Inativo' },
];

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

function getStatusColor(isActive: boolean): string {
  return isActive
    ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
    : 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300';
}

/**
 * Compute next auto-generated code from existing cost centers
 * Format: CC + 5-digit zero-padded number
 */
function computeNextCode(costCenters: CostCenter[]): string {
  let maxNum = 0;
  for (const cc of costCenters) {
    const match = cc.code.match(/^CC(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `CC${(maxNum + 1).toString().padStart(5, '0')}`;
}

// =============================================================================
// TYPES
// =============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function CostCentersPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <CostCentersPageContent />
    </Suspense>
  );
}

function CostCentersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSION FLAGS
  // ============================================================================

  const canView = hasPermission(FINANCE_PERMISSIONS.COST_CENTERS.ACCESS);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.COST_CENTERS.REGISTER);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.COST_CENTERS.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.COST_CENTERS.REMOVE);

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const statusIds = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<
    'name' | 'code' | 'createdAt' | 'monthlyBudget' | 'annualBudget'
  >('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // Link company modal state
  const [linkTarget, setLinkTarget] = useState<CostCenter | null>(null);
  const [linkMode, setLinkMode] = useState<'link' | 'unlink'>('link');
  const [isLinkOpen, setIsLinkOpen] = useState(false);

  // ============================================================================
  // DATA: Infinite scroll + filter dropdown sources
  // ============================================================================

  const isActiveFilter = useMemo(() => {
    if (statusIds.length === 1) {
      return statusIds[0] === 'active' ? true : false;
    }
    return undefined;
  }, [statusIds]);

  const filters: CostCentersFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      isActive: isActiveFilter,
      sortBy,
      sortOrder,
    }),
    [debouncedSearch, isActiveFilter, sortBy, sortOrder]
  );

  const {
    costCenters,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useCostCentersInfinite(filters);

  // Fetch all cost centers for the wizard (nextCode calculation + parent dropdown)
  const { data: allCostCentersData } = useCostCenters();
  const allCostCenters = allCostCentersData?.costCenters ?? [];
  const nextCode = useMemo(
    () => computeNextCode(allCostCenters),
    [allCostCenters]
  );

  // Mutations
  const createMutation = useCreateCostCenter();
  const updateMutation = useUpdateCostCenter();
  const deleteMutation = useDeleteCostCenter();

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
    (params: { status?: string[] }) => {
      const parts: string[] = [];
      const sts = params.status !== undefined ? params.status : statusIds;
      if (sts.length > 0) parts.push(`status=${sts.join(',')}`);
      return parts.length > 0
        ? `/finance/cost-centers?${parts.join('&')}`
        : '/finance/cost-centers';
    },
    [statusIds]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/cost-centers/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/cost-centers/${ids[0]}/edit`);
    }
  };

  const handleContextDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    toast.success(
      itemsToDelete.length === 1
        ? 'Centro de custo excluído com sucesso!'
        : `${itemsToDelete.length} centros de custo excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  const handleCreate = useCallback(
    async (data: Parameters<typeof createMutation.mutateAsync>[0]) => {
      try {
        await createMutation.mutateAsync(data);
        toast.success('Centro de custo criado com sucesso!');
        setIsCreateOpen(false);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao criar centro de custo';
        toast.error(message);
      }
    },
    [createMutation]
  );

  const handleLinkCompany = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const cc = costCenters.find(c => c.id === ids[0]);
      if (cc) {
        setLinkTarget(cc);
        setLinkMode('link');
        setIsLinkOpen(true);
      }
    },
    [costCenters]
  );

  const handleUnlinkCompany = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const cc = costCenters.find(c => c.id === ids[0]);
      if (cc) {
        setLinkTarget(cc);
        setLinkMode('unlink');
        setIsLinkOpen(true);
      }
    },
    [costCenters]
  );

  const handleLinkConfirm = useCallback(
    async (companyId: string | null) => {
      if (!linkTarget) return;
      try {
        await updateMutation.mutateAsync({
          id: linkTarget.id,
          data: { companyId: companyId ?? undefined },
        });
        toast.success(
          companyId
            ? 'Empresa vinculada com sucesso!'
            : 'Empresa desvinculada com sucesso!'
        );
        setIsLinkOpen(false);
        setLinkTarget(null);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao atualizar centro de custo';
        toast.error(message);
      }
    },
    [linkTarget, updateMutation]
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: CostCenter, isSelected: boolean) => {
    const monthly = formatCurrency(item.monthlyBudget);
    const annual = formatCurrency(item.annualBudget);

    const contextActions: ContextMenuAction[] = [];

    if (canEdit) {
      contextActions.push({
        id: 'link-company',
        label: 'Vincular Empresa',
        icon: Building2,
        onClick: handleLinkCompany,
        separator: 'before',
        hidden: ids => {
          const cc = costCenters.find(c => c.id === ids[0]);
          return !!cc?.companyId;
        },
      });

      contextActions.push({
        id: 'unlink-company',
        label: 'Desvincular Empresa',
        icon: Link2Off,
        onClick: handleUnlinkCompany,
        separator: 'before',
        hidden: ids => {
          const cc = costCenters.find(c => c.id === ids[0]);
          return !cc?.companyId;
        },
      });
    }

    if (canDelete) {
      contextActions.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: handleContextDelete,
        variant: 'destructive',
        separator: 'before',
      });
    }

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={item.code}
          icon={Landmark}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"
          badges={[
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: 'outline' as const,
              color: getStatusColor(item.isActive),
            },
            ...(item.companyName
              ? [
                  {
                    label: item.companyName,
                    variant: 'outline' as const,
                    icon: Building2,
                    color:
                      'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
                  },
                ]
              : []),
            ...(item.parentName
              ? [
                  {
                    label: item.parentName,
                    variant: 'outline' as const,
                    icon: GitBranch,
                    color:
                      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
                  },
                ]
              : []),
          ]}
          metadata={
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {(monthly || annual) && (
                <div className="flex items-center gap-3">
                  {monthly && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Mensal: {monthly}
                    </span>
                  )}
                  {annual && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Anual: {annual}
                    </span>
                  )}
                </div>
              )}
              {item.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Criado em{' '}
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: CostCenter, isSelected: boolean) => {
    const monthly = formatCurrency(item.monthlyBudget);
    const annual = formatCurrency(item.annualBudget);

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof Building2;
      color: string;
    }[] = [
      {
        label: item.isActive ? 'Ativo' : 'Inativo',
        variant: 'outline',
        color: getStatusColor(item.isActive),
      },
      ...(item.companyName
        ? [
            {
              label: item.companyName,
              variant: 'outline' as const,
              icon: Building2,
              color:
                'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
            },
          ]
        : []),
      ...(item.parentName
        ? [
            {
              label: item.parentName,
              variant: 'outline' as const,
              icon: GitBranch,
              color:
                'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
            },
          ]
        : []),
    ];

    const contextActions: ContextMenuAction[] = [];

    if (canEdit) {
      contextActions.push({
        id: 'link-company',
        label: 'Vincular Empresa',
        icon: Building2,
        onClick: handleLinkCompany,
        separator: 'before',
        hidden: ids => {
          const cc = costCenters.find(c => c.id === ids[0]);
          return !!cc?.companyId;
        },
      });

      contextActions.push({
        id: 'unlink-company',
        label: 'Desvincular Empresa',
        icon: Link2Off,
        onClick: handleUnlinkCompany,
        separator: 'before',
        hidden: ids => {
          const cc = costCenters.find(c => c.id === ids[0]);
          return !cc?.companyId;
        },
      });
    }

    if (canDelete) {
      contextActions.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: handleContextDelete,
        variant: 'destructive',
        separator: 'before',
      });
    }

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {item.name}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 font-mono">
                {item.code}
              </span>
            </span>
          }
          metadata={
            <div className="flex items-center gap-1.5 mt-0.5">
              {listBadges.map((badge, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0',
                    badge.color
                  )}
                >
                  {badge.icon && <badge.icon className="w-3 h-3" />}
                  {badge.label}
                </span>
              ))}
            </div>
          }
          icon={Landmark}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={false}
        >
          {/* Right zone: budgets */}
          <div className="flex flex-col items-end gap-0.5">
            {monthly && (
              <span className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
                {monthly}
              </span>
            )}
            {annual && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {annual}/ano
              </span>
            )}
          </div>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => costCenters.map(e => e.id), [costCenters]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-cost-center',
        title: 'Novo Centro de Custo',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.COST_CENTERS.REGISTER,
      },
    ],
    [handleOpenCreate]
  );

  const visibleActionButtons = useMemo<HeaderButton[]>(
    () =>
      actionButtons
        .filter(button =>
          button.permission ? hasPermission(button.permission) : true
        )
        .map(({ permission, ...button }) => button),
    [actionButtons, hasPermission]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'cost-centers',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Centros de Custo', href: '/finance/cost-centers' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Centros de Custo"
            description="Gerencie os centros de custo da empresa"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={costCentersConfig.display.labels.searchPlaceholder}
            value={searchQuery}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar centros de custo"
              message="Ocorreu um erro ao tentar carregar os centros de custo. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <>
              <EntityGrid
                config={costCentersConfig}
                items={costCenters}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={CircleDot}
                      options={STATUS_OPTIONS}
                      selected={statusIds}
                      onSelectionChange={setStatusFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total}{' '}
                      {total === 1 ? 'centro de custo' : 'centros de custo'}
                      {costCenters.length < total &&
                        ` (${costCenters.length} carregados)`}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  canView && router.push(`/finance/cost-centers/${item.id}`)
                }
                showSorting={true}
                defaultSortField="name"
                defaultSortDirection="asc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(
                      field as
                        | 'name'
                        | 'code'
                        | 'createdAt'
                        | 'monthlyBudget'
                        | 'annualBudget'
                    );
                    setSortOrder(direction);
                  }
                }}
              />

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
          <CreateCostCenterWizard
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
            nextCode={nextCode}
            costCenters={allCostCenters}
          />

          {/* Link Company Modal */}
          <LinkCompanyModal
            isOpen={isLinkOpen}
            onClose={() => {
              setIsLinkOpen(false);
              setLinkTarget(null);
            }}
            onConfirm={handleLinkConfirm}
            currentCompanyId={linkTarget?.companyId}
            currentCompanyName={linkTarget?.companyName}
            mode={linkMode}
            isLoading={updateMutation.isPending}
          />

          {/* Delete PIN Confirmation Modal */}
          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setItemsToDelete([]);
            }}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de Ação para confirmar a exclusão deste centro de custo. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de Ação para excluir ${itemsToDelete.length} centros de custo. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
