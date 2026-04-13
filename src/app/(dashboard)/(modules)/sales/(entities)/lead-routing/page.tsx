/**
 * OpenSea OS - Lead Routing Rules Page
 * Página de gerenciamento de regras de roteamento de leads
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
import { leadRoutingConfig } from '@/config/entities/lead-routing.config';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import {
  useCreateLeadRoutingRule,
  useDeleteLeadRoutingRule,
  useLeadRoutingRulesInfinite,
} from '@/hooks/sales/use-lead-routing';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import type { LeadRoutingRule, LeadRoutingStrategy } from '@/types/sales';
import { LEAD_ROUTING_STRATEGY_LABELS } from '@/types/sales';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  GitBranch,
  Globe,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Scale,
  Shuffle,
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
import { CreateRoutingRuleWizard } from './src/components/create-routing-rule-wizard';

// ============================================================================
// TYPES
// ============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

const leadRoutingPermissions = {
  view: SALES_PERMISSIONS.LEAD_ROUTING.ACCESS,
  create: SALES_PERMISSIONS.LEAD_ROUTING.REGISTER,
  update: SALES_PERMISSIONS.LEAD_ROUTING.MODIFY,
  delete: SALES_PERMISSIONS.LEAD_ROUTING.REMOVE,
};

const STRATEGY_ICONS: Record<LeadRoutingStrategy, LucideIcon> = {
  ROUND_ROBIN: RefreshCcw,
  TERRITORY: Globe,
  SEGMENT: GitBranch,
  LOAD_BALANCE: Scale,
};

const STRATEGY_COLORS: Record<LeadRoutingStrategy, string> = {
  ROUND_ROBIN:
    'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
  TERRITORY:
    'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300',
  SEGMENT:
    'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
  LOAD_BALANCE:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
};

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function LeadRoutingPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <LeadRoutingPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function LeadRoutingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE
  // ============================================================================

  const statusFilter = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const strategyFilter = useMemo(() => {
    const raw = searchParams.get('strategy');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>(
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
    rules: rulesData,
    total: rulesTotal,
    isLoading,
    error,
    refetch,
  } = useLeadRoutingRulesInfinite();

  const createMutation = useCreateLeadRoutingRule();
  const deleteMutation = useDeleteLeadRoutingRule();

  // Client-side filtering
  const rules = useMemo(() => {
    let list = rulesData ?? [];

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      list = list.filter(
        r =>
          r.name.toLowerCase().includes(query) ||
          (r.description && r.description.toLowerCase().includes(query))
      );
    }

    if (statusFilter.length > 0) {
      list = list.filter(r => {
        if (statusFilter.includes('active') && r.isActive) return true;
        if (statusFilter.includes('inactive') && !r.isActive) return true;
        return false;
      });
    }

    if (strategyFilter.length > 0) {
      list = list.filter(r => strategyFilter.includes(r.strategy));
    }

    list = [...list].sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [
    rulesData,
    debouncedSearch,
    statusFilter,
    strategyFilter,
    sortBy,
    sortOrder,
  ]);

  const total = rules.length;

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(() => {}, {
      rootMargin: '300px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ============================================================================
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: { status?: string[]; strategy?: string[] }) => {
      const parts: string[] = [];
      const s = params.status !== undefined ? params.status : statusFilter;
      if (s.length > 0) parts.push(`status=${s.join(',')}`);
      const st =
        params.strategy !== undefined ? params.strategy : strategyFilter;
      if (st.length > 0) parts.push(`strategy=${st.join(',')}`);
      return parts.length > 0
        ? `/sales/lead-routing?${parts.join('&')}`
        : '/sales/lead-routing';
    },
    [statusFilter, strategyFilter]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  const setStrategyFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ strategy: ids })),
    [router, buildFilterUrl]
  );

  const statusOptions = useMemo(
    () => [
      { id: 'active', label: 'Ativa' },
      { id: 'inactive', label: 'Inativa' },
    ],
    []
  );

  const strategyOptions = useMemo(
    () => [
      { id: 'ROUND_ROBIN', label: 'Round Robin' },
      { id: 'TERRITORY', label: 'Território' },
      { id: 'SEGMENT', label: 'Segmento' },
      { id: 'LOAD_BALANCE', label: 'Balanceamento' },
    ],
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/lead-routing/${ids[0]}`);
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
        ? 'Regra excluída com sucesso!'
        : `${itemsToDelete.length} regras excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: LeadRoutingRule, isSelected: boolean) => {
    const StrategyIcon = STRATEGY_ICONS[item.strategy];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        actions={[
          ...(hasPermission(leadRoutingPermissions.delete)
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
          title={item.name}
          subtitle={
            item.description || LEAD_ROUTING_STRATEGY_LABELS[item.strategy]
          }
          icon={Shuffle}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"
          badges={[
            {
              label: item.isActive ? 'Ativa' : 'Inativa',
              variant: item.isActive ? 'default' : 'secondary',
            },
            {
              label: LEAD_ROUTING_STRATEGY_LABELS[item.strategy],
              variant: 'outline',
            },
          ]}
          footer={{
            type: 'single' as const,
            button: {
              icon: Users,
              label: `${item.assignments?.length ?? 0} vendedor${(item.assignments?.length ?? 0) !== 1 ? 'es' : ''} | ${item.totalRouted} roteados`,
              onClick: () => {},
              color: 'secondary' as const,
            },
          }}
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

  const renderListCard = (item: LeadRoutingRule, isSelected: boolean) => {
    const StrategyIcon = STRATEGY_ICONS[item.strategy];

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: LucideIcon;
      color: string;
    }[] = [
      {
        label: item.isActive ? 'Ativa' : 'Inativa',
        variant: 'outline',
        icon: item.isActive ? Play : Pause,
        color: item.isActive
          ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
          : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
      },
      {
        label: LEAD_ROUTING_STRATEGY_LABELS[item.strategy],
        variant: 'outline',
        icon: StrategyIcon,
        color: STRATEGY_COLORS[item.strategy],
      },
      {
        label: `${item.assignments?.length ?? 0} vendedores`,
        variant: 'outline',
        icon: Users,
        color:
          'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      },
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        actions={[
          ...(hasPermission(leadRoutingPermissions.delete)
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
          icon={Shuffle}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"
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

  const initialIds = useMemo(() => rules.map(i => i.id), [rules]);

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-routing-rule',
        title: 'Nova Regra',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: leadRoutingPermissions.create,
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
        namespace: 'lead-routing-rules',
        initialIds,
      }}
    >
      <PageLayout data-testid="lead-routing-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Lead Routing', href: '/sales/lead-routing' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Lead Routing"
            description="Configure regras de distribuição automática de leads entre vendedores"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            placeholder="Buscar regras de roteamento..."
            value={searchQuery}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar regras"
              message="Ocorreu um erro ao tentar carregar as regras de roteamento. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  void refetch();
                },
              }}
            />
          ) : (
            <>
              <EntityGrid
                config={leadRoutingConfig}
                items={rules}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={Activity}
                      options={statusOptions}
                      selected={statusFilter}
                      onSelectionChange={setStatusFilter}
                      activeColor="cyan"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <FilterDropdown
                      label="Estratégia"
                      icon={Shuffle}
                      options={strategyOptions}
                      selected={strategyFilter}
                      onSelectionChange={setStrategyFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar estratégia..."
                      emptyText="Nenhuma estratégia encontrada."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'regra' : 'regras'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/lead-routing/${item.id}`)
                }
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(field as 'name' | 'createdAt' | 'updatedAt');
                    setSortOrder(direction);
                  }
                }}
              />

              <div ref={sentinelRef} className="h-1" />
            </>
          )}

          <CreateRoutingRuleWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await createMutation.mutateAsync(data);
              toast.success('Regra de roteamento criada com sucesso!');
            }}
            isSubmitting={createMutation.isPending}
          />

          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de ação para excluir esta regra. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} regras. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
