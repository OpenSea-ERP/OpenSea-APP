/**
 * OpenSea OS - Proposals Page
 * Página de gerenciamento de propostas comerciais com infinite scroll e filtros server-side
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { proposalsConfig } from '@/config/entities/proposals.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useProposalsInfinite,
  useCreateProposal,
  useDeleteProposal,
} from '@/hooks/sales/use-proposals';
import { CreateProposalWizard } from './src/components/create-proposal-wizard';
import type { Proposal, ProposalStatus } from '@/types/sales';
import { PROPOSAL_STATUS_LABELS } from '@/types/sales';
import {
  Calendar,
  DollarSign,
  FileCheck,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useDebounce } from '@/hooks/use-debounce';

// ============================================================================
// TYPES
// ============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

// ============================================================================
// STATUS BADGE COLORS
// ============================================================================

const STATUS_COLORS: Record<ProposalStatus, string> = {
  DRAFT:
    'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
  SENT: 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  UNDER_REVIEW:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  APPROVED:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  REJECTED:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  EXPIRED:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
};

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function ProposalsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <ProposalsPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function ProposalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const statusFilter = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt'>(
    'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProposalsInfinite({
    search: debouncedSearch || undefined,
    status: (statusFilter[0] as ProposalStatus) || undefined,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateProposal();
  const deleteMutation = useDeleteProposal();

  const proposals = useMemo(() => {
    return (data?.pages.flatMap(p => p.proposals) ??
      []) as unknown as Proposal[];
  }, [data]);

  const total = data?.pages[0]?.meta.total ?? 0;

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
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
      const s = params.status !== undefined ? params.status : statusFilter;
      if (s.length > 0) parts.push(`status=${s.join(',')}`);
      return parts.length > 0
        ? `/sales/proposals?${parts.join('&')}`
        : '/sales/proposals';
    },
    [statusFilter]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const statusOptions = useMemo(
    () =>
      Object.entries(PROPOSAL_STATUS_LABELS).map(([value, label]) => ({
        id: value,
        label,
      })),
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/proposals/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/proposals/${ids[0]}/edit`);
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
        ? 'Proposta excluída com sucesso!'
        : `${itemsToDelete.length} propostas excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const renderGridCard = (item: Proposal, isSelected: boolean) => {
    const statusLabel = PROPOSAL_STATUS_LABELS[item.status];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          proposalsConfig.permissions!.update &&
          hasPermission(proposalsConfig.permissions!.update) &&
          item.status === 'DRAFT'
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(proposalsConfig.permissions!.delete &&
          hasPermission(proposalsConfig.permissions!.delete)
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
          title={item.title}
          subtitle={item.customerName || 'Cliente não informado'}
          icon={FileCheck}
          iconBgColor="bg-linear-to-br from-violet-500 to-purple-600"
          badges={[
            {
              label: statusLabel,
              variant: 'default',
            },
            {
              label: formatCurrency(item.totalValue),
              variant: 'secondary',
            },
          ]}
          footer={
            item.validUntil
              ? {
                  type: 'single' as const,
                  button: {
                    icon: Calendar,
                    label: `Válida até ${new Date(item.validUntil).toLocaleDateString('pt-BR')}`,
                    onClick: () => {},
                    color: 'secondary' as const,
                  },
                }
              : undefined
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Proposal, isSelected: boolean) => {
    const statusLabel = PROPOSAL_STATUS_LABELS[item.status];

    const listBadges = [
      {
        label: statusLabel,
        variant: 'outline' as const,
        color: STATUS_COLORS[item.status],
      },
      {
        label: formatCurrency(item.totalValue),
        variant: 'outline' as const,
        icon: DollarSign as typeof FileCheck,
        color:
          'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
      },
      ...(item.customerName
        ? [
            {
              label: item.customerName,
              variant: 'outline' as const,
              icon: User as typeof FileCheck,
              color:
                'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          proposalsConfig.permissions!.update &&
          hasPermission(proposalsConfig.permissions!.update) &&
          item.status === 'DRAFT'
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(proposalsConfig.permissions!.delete &&
          hasPermission(proposalsConfig.permissions!.delete)
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
                {item.title}
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
          icon={FileCheck}
          iconBgColor="bg-linear-to-br from-violet-500 to-purple-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => proposals.map(i => i.id), [proposals]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-proposal',
        title: 'Nova Proposta',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: proposalsConfig.permissions!.create,
      },
    ],
    [handleCreate]
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
        namespace: 'proposals',
        initialIds,
      }}
    >
      <PageLayout data-testid="proposals-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Propostas', href: '/sales/proposals' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Propostas"
            description="Gerencie as propostas comerciais"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={proposalsConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar propostas"
              message="Ocorreu um erro ao tentar carregar as propostas. Por favor, tente novamente."
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
                config={proposalsConfig}
                items={proposals}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={FileCheck}
                      options={statusOptions}
                      selected={statusFilter}
                      onSelectionChange={setStatusFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'proposta' : 'propostas'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/proposals/${item.id}`)
                }
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(field as 'title' | 'createdAt' | 'updatedAt');
                    setSortOrder(direction);
                  }
                }}
              />

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />
            </>
          )}

          {/* Create Wizard */}
          <CreateProposalWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await createMutation.mutateAsync(
                data as unknown as Record<string, unknown>
              );
              toast.success('Proposta criada com sucesso!');
            }}
            isSubmitting={createMutation.isPending}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de ação para excluir esta proposta. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} propostas. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
