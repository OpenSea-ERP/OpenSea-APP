/**
 * OpenSea OS - Lead Scoring Rules Page
 * Página de gerenciamento de regras de lead scoring
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
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCreateLeadScoringRule,
  useLeadScoringRulesInfinite,
  useDeleteLeadScoringRule,
} from '@/hooks/sales/use-lead-scoring';
import { CreateScoringRuleWizard } from './src/components/create-scoring-rule-wizard';
import type { LeadScoringRule } from '@/types/sales';
import {
  LEAD_SCORE_FIELD_LABELS,
  LEAD_SCORE_CONDITION_LABELS,
} from '@/types/sales';
import {
  Activity,
  Minus,
  Pause,
  Play,
  Plus,
  Star,
  Target,
  Trash2,
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
// Entity config (inline since lead scoring is simpler)
// ============================================================================

const leadScoringPermissions = {
  view: SALES_PERMISSIONS.LEAD_SCORING.ACCESS,
  create: SALES_PERMISSIONS.LEAD_SCORING.REGISTER,
  update: SALES_PERMISSIONS.LEAD_SCORING.MODIFY,
  delete: SALES_PERMISSIONS.LEAD_SCORING.REMOVE,
};

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function LeadScoringPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <LeadScoringPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function LeadScoringPageContent() {
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
  } = useLeadScoringRulesInfinite();

  const createMutation = useCreateLeadScoringRule();
  const deleteMutation = useDeleteLeadScoringRule();

  // Client-side filtering
  const rules = useMemo(() => {
    let list = rulesData ?? [];

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(query));
    }

    if (statusFilter.length > 0) {
      list = list.filter(r => {
        if (statusFilter.includes('active') && r.isActive) return true;
        if (statusFilter.includes('inactive') && !r.isActive) return true;
        return false;
      });
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
  }, [rulesData, debouncedSearch, statusFilter, sortBy, sortOrder]);

  const total = rules.length;

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(() => {}, { rootMargin: '300px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ============================================================================
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: { status?: string[] }) => {
      const parts: string[] = [];
      const s = params.status !== undefined ? params.status : statusFilter;
      if (s.length > 0) parts.push(`status=${s.join(',')}`);
      return parts.length > 0
        ? `/sales/lead-scoring?${parts.join('&')}`
        : '/sales/lead-scoring';
    },
    [statusFilter]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  const statusOptions = useMemo(
    () => [
      { id: 'active', label: 'Ativa' },
      { id: 'inactive', label: 'Inativa' },
    ],
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

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

  const renderGridCard = (item: LeadScoringRule, isSelected: boolean) => {
    const pointsLabel =
      item.points > 0 ? `+${item.points}` : `${item.points}`;
    const pointsColor =
      item.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';

    return (
      <EntityContextMenu
        itemId={item.id}
        actions={[
          ...(hasPermission(leadScoringPermissions.delete)
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
          subtitle={`${LEAD_SCORE_FIELD_LABELS[item.field]} ${LEAD_SCORE_CONDITION_LABELS[item.condition]} ${item.value}`}
          icon={Target}
          iconBgColor={
            item.points > 0
              ? 'bg-linear-to-br from-amber-500 to-orange-600'
              : 'bg-linear-to-br from-rose-500 to-pink-600'
          }
          badges={[
            {
              label: item.isActive ? 'Ativa' : 'Inativa',
              variant: item.isActive ? 'default' : 'secondary',
            },
            {
              label: `${pointsLabel} pts`,
              variant: 'outline',
            },
          ]}
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

  const renderListCard = (item: LeadScoringRule, isSelected: boolean) => {
    const pointsLabel =
      item.points > 0 ? `+${item.points}` : `${item.points}`;

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof Star;
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
        label: LEAD_SCORE_FIELD_LABELS[item.field],
        variant: 'outline',
        color:
          'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      },
      {
        label: `${pointsLabel} pts`,
        variant: 'outline',
        icon: item.points > 0 ? Plus : Minus,
        color:
          item.points > 0
            ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
            : 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
      },
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        actions={[
          ...(hasPermission(leadScoringPermissions.delete)
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
          icon={Target}
          iconBgColor={
            item.points > 0
              ? 'bg-linear-to-br from-amber-500 to-orange-600'
              : 'bg-linear-to-br from-rose-500 to-pink-600'
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
        id: 'create-rule',
        title: 'Nova Regra',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: leadScoringPermissions.create,
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
        namespace: 'lead-scoring-rules',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Lead Scoring', href: '/sales/lead-scoring' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Lead Scoring"
            description="Configure regras de pontuação automática para qualificação de leads"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            placeholder="Buscar regras por nome..."
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
              message="Ocorreu um erro ao tentar carregar as regras de scoring. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => refetch(),
              }}
            />
          ) : (
            <>
              <EntityGrid
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
                      activeColor="amber"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
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

          <CreateScoringRuleWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await createMutation.mutateAsync(data);
              toast.success('Regra de scoring criada com sucesso!');
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
