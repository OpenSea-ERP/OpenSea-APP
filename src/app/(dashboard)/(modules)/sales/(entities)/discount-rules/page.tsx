/**
 * OpenSea OS - Discount Rules Page
 * Página de gerenciamento de regras de desconto com infinite scroll e filtros server-side
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
import { discountRulesConfig } from '@/config/entities/discount-rules.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useDiscountRulesInfinite,
  useCreateDiscountRule,
  useDeleteDiscountRule,
} from '@/hooks/sales/use-discount-rules';
import { CreateDiscountRuleWizard } from './src/components/create-discount-rule-wizard';
import type { DiscountRule, DiscountType } from '@/types/sales';
import { DISCOUNT_TYPE_LABELS } from '@/types/sales';
import {
  Calendar,
  CheckCircle,
  DollarSign,
  Percent,
  Plus,
  Trash2,
  XCircle,
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
// PAGE WRAPPER
// ============================================================================

export default function DiscountRulesPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <DiscountRulesPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function DiscountRulesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const typeFilter = useMemo(() => {
    const raw = searchParams.get('type');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const activeFilter = useMemo(() => {
    const raw = searchParams.get('active');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
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

  const isActiveParam =
    activeFilter.length === 1 ? activeFilter[0] === 'true' : undefined;

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscountRulesInfinite({
    search: debouncedSearch || undefined,
    type: (typeFilter[0] as DiscountType) || undefined,
    isActive: isActiveParam,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateDiscountRule();
  const deleteMutation = useDeleteDiscountRule();

  const discountRules = useMemo(() => {
    return (data?.pages.flatMap(p => p.discountRules) ??
      []) as unknown as DiscountRule[];
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
    (params: { type?: string[]; active?: string[] }) => {
      const parts: string[] = [];
      const t = params.type !== undefined ? params.type : typeFilter;
      const a = params.active !== undefined ? params.active : activeFilter;
      if (t.length > 0) parts.push(`type=${t.join(',')}`);
      if (a.length > 0) parts.push(`active=${a.join(',')}`);
      return parts.length > 0
        ? `/sales/discount-rules?${parts.join('&')}`
        : '/sales/discount-rules';
    },
    [typeFilter, activeFilter]
  );

  const setTypeFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ type: ids })),
    [router, buildFilterUrl]
  );

  const setActiveFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ active: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const typeOptions = useMemo(
    () =>
      Object.entries(DISCOUNT_TYPE_LABELS).map(([value, label]) => ({
        id: value,
        label,
      })),
    []
  );

  const activeOptions = useMemo(
    () => [
      { id: 'true', label: 'Ativa' },
      { id: 'false', label: 'Inativa' },
    ],
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/discount-rules/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/discount-rules/${ids[0]}/edit`);
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
        ? 'Regra de desconto excluída com sucesso!'
        : `${itemsToDelete.length} regras de desconto excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const formatValue = (rule: DiscountRule) => {
    if (rule.type === 'PERCENTAGE') {
      return `${rule.value}%`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(rule.value);
  };

  const renderGridCard = (item: DiscountRule, isSelected: boolean) => {
    const typeLabel = DISCOUNT_TYPE_LABELS[item.type];
    const isActive = item.isActive;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          discountRulesConfig.permissions!.update &&
          hasPermission(discountRulesConfig.permissions!.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(discountRulesConfig.permissions!.delete)
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
          subtitle={item.description || typeLabel}
          icon={item.type === 'PERCENTAGE' ? Percent : DollarSign}
          iconBgColor="bg-linear-to-br from-emerald-500 to-teal-600"
          badges={[
            {
              label: formatValue(item),
              variant: 'default',
            },
            {
              label: isActive ? 'Ativa' : 'Inativa',
              variant: isActive ? 'default' : 'secondary',
            },
          ]}
          footer={
            item.startDate && item.endDate
              ? {
                  type: 'single' as const,
                  button: {
                    icon: Calendar,
                    label: `${new Date(item.startDate).toLocaleDateString('pt-BR')} - ${new Date(item.endDate).toLocaleDateString('pt-BR')}`,
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

  const renderListCard = (item: DiscountRule, isSelected: boolean) => {
    const typeLabel = DISCOUNT_TYPE_LABELS[item.type];
    const isActive = item.isActive;

    const listBadges = [
      {
        label: typeLabel,
        variant: 'outline' as const,
        icon: (item.type === 'PERCENTAGE'
          ? Percent
          : DollarSign) as typeof Percent,
        color:
          item.type === 'PERCENTAGE'
            ? 'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300'
            : 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      },
      {
        label: formatValue(item),
        variant: 'outline' as const,
        color:
          'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
      },
      {
        label: isActive ? 'Ativa' : 'Inativa',
        variant: 'outline' as const,
        icon: (isActive ? CheckCircle : XCircle) as typeof Percent,
        color: isActive
          ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
          : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
      },
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          discountRulesConfig.permissions!.update &&
          hasPermission(discountRulesConfig.permissions!.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(discountRulesConfig.permissions!.delete)
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
          icon={item.type === 'PERCENTAGE' ? Percent : DollarSign}
          iconBgColor="bg-linear-to-br from-emerald-500 to-teal-600"
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

  const initialIds = useMemo(
    () => discountRules.map(i => i.id),
    [discountRules]
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-discount-rule',
        title: 'Nova Regra',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: discountRulesConfig.permissions!.create,
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
        namespace: 'discount-rules',
        initialIds,
      }}
    >
      <PageLayout data-testid="discount-rules-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Regras de Desconto', href: '/sales/discount-rules' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Regras de Desconto"
            description="Gerencie as regras de desconto aplicáveis"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            data-testid="discount-rules-search"
            placeholder={discountRulesConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar regras de desconto"
              message="Ocorreu um erro ao tentar carregar as regras. Por favor, tente novamente."
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
                config={discountRulesConfig}
                items={discountRules}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Tipo"
                      icon={Percent}
                      options={typeOptions}
                      selected={typeFilter}
                      onSelectionChange={setTypeFilter}
                      activeColor="emerald"
                      searchPlaceholder="Buscar tipo..."
                      emptyText="Nenhum tipo encontrado."
                    />
                    <FilterDropdown
                      label="Status"
                      icon={CheckCircle}
                      options={activeOptions}
                      selected={activeFilter}
                      onSelectionChange={setActiveFilter}
                      activeColor="emerald"
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
                onItemDoubleClick={item =>
                  router.push(`/sales/discount-rules/${item.id}`)
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

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />
            </>
          )}

          {/* Create Wizard */}
          <CreateDiscountRuleWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await createMutation.mutateAsync(
                data as unknown as Record<string, unknown>
              );
              toast.success('Regra de desconto criada com sucesso!');
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
                ? 'Digite seu PIN de ação para excluir esta regra de desconto. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} regras de desconto. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
