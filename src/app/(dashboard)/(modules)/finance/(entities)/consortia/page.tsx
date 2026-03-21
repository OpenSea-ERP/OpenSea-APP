/**
 * OpenSea OS - Consórcios
 * Listagem de consórcios com infinite scroll, filtros server-side e EntityGrid
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { consortiumConfig } from '@/config/entities/consortium.config';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useConsortiaInfinite,
  useDeleteConsortium,
  type ConsortiaFilters,
} from '@/hooks/finance/use-consortia';
import { cn } from '@/lib/utils';
import type { Consortium, ConsortiumStatus } from '@/types/finance';
import { CONSORTIUM_STATUS_LABELS } from '@/types/finance';
import {
  CheckCircle,
  DollarSign,
  Loader2,
  Plus,
  Star,
  Trash2,
  Users,
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
import { CreateConsortiumWizard } from './src/components/create-consortium-wizard';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
  { id: 'ACTIVE', label: 'Ativo' },
  { id: 'CONTEMPLATED', label: 'Contemplado' },
  { id: 'WITHDRAWN', label: 'Desistente' },
  { id: 'COMPLETED', label: 'Concluído' },
  { id: 'CANCELLED', label: 'Cancelado' },
];

const CONTEMPLATED_OPTIONS = [
  { id: 'YES', label: 'Contemplados' },
  { id: 'NO', label: 'Não contemplados' },
];

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getStatusColor(status: ConsortiumStatus): string {
  const colors: Record<ConsortiumStatus, string> = {
    ACTIVE:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    CONTEMPLATED:
      'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
    WITHDRAWN:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    COMPLETED:
      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
    CANCELLED:
      'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
  };
  return colors[status] ?? colors.ACTIVE;
}

// ============================================================================
// TYPES
// ============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ConsortiaPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <ConsortiaPageContent />
    </Suspense>
  );
}

function ConsortiaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSION FLAGS
  // ============================================================================

  const canView = hasPermission(FINANCE_PERMISSIONS.CONSORTIA.ACCESS);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.CONSORTIA.REGISTER);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.CONSORTIA.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.CONSORTIA.REMOVE);

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const statusIds = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const contemplatedIds = useMemo(() => {
    const raw = searchParams.get('contemplated');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<
    'createdAt' | 'monthlyPayment' | 'administrator' | 'status'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // ============================================================================
  // DATA: Infinite scroll + filter dropdown sources
  // ============================================================================

  const filters: ConsortiaFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusIds.length === 1 ? statusIds[0] : undefined,
      isContemplated: contemplatedIds.length === 1 ? contemplatedIds[0] : undefined,
      sortBy,
      sortOrder,
    }),
    [debouncedSearch, statusIds, contemplatedIds, sortBy, sortOrder]
  );

  const {
    consortia,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useConsortiaInfinite(filters);

  // Mutations
  const deleteMutation = useDeleteConsortium();

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
    (params: { status?: string[]; contemplated?: string[] }) => {
      const parts: string[] = [];
      const sts = params.status !== undefined ? params.status : statusIds;
      const cont = params.contemplated !== undefined ? params.contemplated : contemplatedIds;
      if (sts.length > 0) parts.push(`status=${sts.join(',')}`);
      if (cont.length > 0) parts.push(`contemplated=${cont.join(',')}`);
      return parts.length > 0
        ? `/finance/consortia?${parts.join('&')}`
        : '/finance/consortia';
    },
    [statusIds, contemplatedIds]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  const setContemplatedFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ contemplated: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/consortia/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/consortia/${ids[0]}/edit`);
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
        ? 'Consórcio excluído com sucesso!'
        : `${itemsToDelete.length} consórcios excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Consortium, isSelected: boolean) => {
    const progressPercentage =
      item.totalInstallments > 0
        ? Math.round((item.paidInstallments / item.totalInstallments) * 100)
        : 0;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={[
          ...(canEdit && !item.isContemplated && item.status === 'ACTIVE'
            ? [
                {
                  id: 'mark-contemplated',
                  label: 'Marcar Contemplado',
                  icon: Star,
                  onClick: (ids: string[]) => {
                    if (ids.length === 1) {
                      router.push(`/finance/consortia/${ids[0]}`);
                    }
                  },
                  separator: 'before' as const,
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  id: 'delete',
                  label: 'Excluir',
                  icon: Trash2,
                  onClick: handleContextDelete,
                  variant: 'destructive' as const,
                  separator: 'before' as const,
                },
              ]
            : []),
        ]}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.administrator}
          subtitle={
            item.groupNumber || item.quotaNumber
              ? `Grupo ${item.groupNumber || '—'} - Cota ${item.quotaNumber || '—'}`
              : item.name
          }
          icon={Users}
          iconBgColor="bg-linear-to-br from-pink-500 to-pink-600"
          badges={[
            {
              label: CONSORTIUM_STATUS_LABELS[item.status],
              variant: 'outline' as const,
              color: getStatusColor(item.status),
            },
            ...(item.isContemplated
              ? [
                  {
                    label: 'Contemplado',
                    variant: 'outline' as const,
                    icon: CheckCircle,
                    color:
                      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
                  },
                ]
              : []),
          ]}
          footer={{
            type: 'split',
            left: {
              icon: DollarSign,
              label: formatCurrency(item.monthlyPayment),
              onClick: () => {},
              color: 'secondary',
            },
            right: {
              label: `${progressPercentage}%`,
              onClick: () => {},
              color: 'secondary',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={false}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Consortium, isSelected: boolean) => {
    const progressPercentage =
      item.totalInstallments > 0
        ? Math.round((item.paidInstallments / item.totalInstallments) * 100)
        : 0;

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof CheckCircle;
      color: string;
    }[] = [
      {
        label: CONSORTIUM_STATUS_LABELS[item.status],
        variant: 'outline',
        color: getStatusColor(item.status),
      },
      ...(item.isContemplated
        ? [
            {
              label: 'Contemplado',
              variant: 'outline' as const,
              icon: CheckCircle,
              color:
                'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
            },
          ]
        : []),
      ...(item.groupNumber || item.quotaNumber
        ? [
            {
              label: `G${item.groupNumber || '—'} / C${item.quotaNumber || '—'}`,
              variant: 'outline' as const,
              color:
                'border-pink-600/25 dark:border-pink-500/20 bg-pink-50 dark:bg-pink-500/8 text-pink-700 dark:text-pink-300',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={[
          ...(canEdit && !item.isContemplated && item.status === 'ACTIVE'
            ? [
                {
                  id: 'mark-contemplated',
                  label: 'Marcar Contemplado',
                  icon: Star,
                  onClick: (ids: string[]) => {
                    if (ids.length === 1) {
                      router.push(`/finance/consortia/${ids[0]}`);
                    }
                  },
                  separator: 'before' as const,
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  id: 'delete',
                  label: 'Excluir',
                  icon: Trash2,
                  onClick: handleContextDelete,
                  variant: 'destructive' as const,
                  separator: 'before' as const,
                },
              ]
            : []),
        ]}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {item.administrator}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {item.name}
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
          icon={Users}
          iconBgColor="bg-linear-to-br from-pink-500 to-pink-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={false}
        >
          {/* Right zone: monthly payment + progress */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
              {formatCurrency(item.monthlyPayment)}
            </span>
            <span className="text-xs text-muted-foreground">
              {item.paidInstallments}/{item.totalInstallments} parcelas ({progressPercentage}%)
            </span>
          </div>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => consortia.map(c => c.id), [consortia]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreateClick = useCallback(() => {
    setWizardOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-consortium',
        title: 'Novo Consórcio',
        icon: Plus,
        onClick: handleCreateClick,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.CONSORTIA.REGISTER,
      },
    ],
    [handleCreateClick]
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
        namespace: 'consortia',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Consórcios', href: '/finance/consortia' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Consórcios"
            description="Gerencie suas cotas de consórcio, acompanhe parcelas e contemplações"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={consortiumConfig.display.labels.searchPlaceholder}
            value={searchQuery}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="list" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar consórcios"
              message="Ocorreu um erro ao tentar carregar os consórcios. Por favor, tente novamente."
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
                config={consortiumConfig}
                items={consortia}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={Users}
                      options={STATUS_OPTIONS}
                      selected={statusIds}
                      onSelectionChange={setStatusFilter}
                      activeColor="pink"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <FilterDropdown
                      label="Contemplado"
                      icon={CheckCircle}
                      options={CONTEMPLATED_OPTIONS}
                      selected={contemplatedIds}
                      onSelectionChange={setContemplatedFilter}
                      activeColor="emerald"
                      searchPlaceholder="Buscar..."
                      emptyText="Nenhuma opção encontrada."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total}{' '}
                      {total === 1 ? 'consórcio' : 'consórcios'}
                      {consortia.length < total &&
                        ` (${consortia.length} carregados)`}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/finance/consortia/${item.id}`)
                }
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(
                      field as
                        | 'createdAt'
                        | 'monthlyPayment'
                        | 'administrator'
                        | 'status'
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
          <CreateConsortiumWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            onCreated={() => {
              refetch();
            }}
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
                ? 'Digite seu PIN de Ação para confirmar a exclusão deste consórcio. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de Ação para excluir ${itemsToDelete.length} consórcios. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
