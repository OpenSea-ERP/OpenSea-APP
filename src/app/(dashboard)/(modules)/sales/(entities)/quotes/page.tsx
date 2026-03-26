/**
 * OpenSea OS - Quotes Page
 * Página de gerenciamento de orçamentos com infinite scroll e filtros server-side
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
import { quotesConfig } from '@/config/entities/quotes.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useQuotesInfinite,
  useCreateQuote,
  useDeleteQuote,
} from '@/hooks/sales/use-quotes';
import { CreateQuoteWizard } from './src/components/create-quote-wizard';
import type { Quote, QuoteStatus } from '@/types/sales';
import { QUOTE_STATUS_LABELS } from '@/types/sales';
import {
  Calendar,
  Copy,
  DollarSign,
  FileText,
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

const STATUS_COLORS: Record<QuoteStatus, string> = {
  DRAFT:
    'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
  SENT: 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  ACCEPTED:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  REJECTED:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  EXPIRED:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
};

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function QuotesPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <QuotesPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function QuotesPageContent() {
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
  } = useQuotesInfinite({
    search: debouncedSearch || undefined,
    status: (statusFilter[0] as QuoteStatus) || undefined,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateQuote();
  const deleteMutation = useDeleteQuote();

  const quotes = useMemo(() => {
    return (data?.pages.flatMap(p => p.quotes) ?? []) as unknown as Quote[];
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
        ? `/sales/quotes?${parts.join('&')}`
        : '/sales/quotes';
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
      Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => ({
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
      router.push(`/sales/quotes/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/quotes/${ids[0]}/edit`);
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
        ? 'Orçamento excluído com sucesso!'
        : `${itemsToDelete.length} orçamentos excluídos!`
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

  const renderGridCard = (item: Quote, isSelected: boolean) => {
    const statusLabel = QUOTE_STATUS_LABELS[item.status];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          quotesConfig.permissions.update &&
          hasPermission(quotesConfig.permissions.update) &&
          item.status === 'DRAFT'
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(quotesConfig.permissions.delete)
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
          icon={FileText}
          iconBgColor="bg-linear-to-br from-sky-500 to-cyan-600"
          badges={[
            {
              label: statusLabel,
              variant: 'default',
            },
            {
              label: formatCurrency(item.total),
              variant: 'secondary',
            },
          ]}
          footer={
            item.validUntil
              ? {
                  type: 'single' as const,
                  button: {
                    icon: Calendar,
                    label: `Válido até ${new Date(item.validUntil).toLocaleDateString('pt-BR')}`,
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

  const renderListCard = (item: Quote, isSelected: boolean) => {
    const statusLabel = QUOTE_STATUS_LABELS[item.status];

    const listBadges = [
      {
        label: statusLabel,
        variant: 'outline' as const,
        color: STATUS_COLORS[item.status],
      },
      {
        label: formatCurrency(item.total),
        variant: 'outline' as const,
        icon: DollarSign as typeof FileText,
        color:
          'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
      },
      ...(item.customerName
        ? [
            {
              label: item.customerName,
              variant: 'outline' as const,
              icon: User as typeof FileText,
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
          quotesConfig.permissions.update &&
          hasPermission(quotesConfig.permissions.update) &&
          item.status === 'DRAFT'
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(quotesConfig.permissions.delete)
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
          icon={FileText}
          iconBgColor="bg-linear-to-br from-sky-500 to-cyan-600"
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

  const initialIds = useMemo(() => quotes.map(i => i.id), [quotes]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-quote',
        title: 'Novo Orçamento',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: quotesConfig.permissions.create,
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
        namespace: 'quotes',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Orçamentos', href: '/sales/quotes' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Orçamentos"
            description="Gerencie os orçamentos enviados aos clientes"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={quotesConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar orçamentos"
              message="Ocorreu um erro ao tentar carregar os orçamentos. Por favor, tente novamente."
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
                config={quotesConfig}
                items={quotes}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={FileText}
                      options={statusOptions}
                      selected={statusFilter}
                      onSelectionChange={setStatusFilter}
                      activeColor="blue"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'orçamento' : 'orçamentos'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/quotes/${item.id}`)
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
          <CreateQuoteWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await createMutation.mutateAsync(
                data as unknown as Record<string, unknown>
              );
              toast.success('Orçamento criado com sucesso!');
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
                ? 'Digite seu PIN de ação para excluir este orçamento. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} orçamentos. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
