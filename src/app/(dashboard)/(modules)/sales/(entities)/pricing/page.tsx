/**
 * OpenSea OS - Price Tables Page
 * Página de gerenciamento de tabelas de preço com infinite scroll
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useDeletePriceTable,
  usePriceTablesInfinite,
} from '@/hooks/sales/use-price-tables';
import type { PriceTable } from '@/types/sales';
import { PRICE_TABLE_TYPE_LABELS } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { CreatePriceTableWizard } from './src/components/create-price-table-wizard';
import { DollarSign, Plus, Table2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function PricingPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <PricingPageContent />
    </Suspense>
  );
}

function PricingPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Wizard modal
  const [wizardOpen, setWizardOpen] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // Data
  const {
    priceTables,
    total,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePriceTablesInfinite({
    search: debouncedSearch || undefined,
    type: typeFilter[0] || undefined,
    sortBy,
    sortOrder,
  });

  const deleteMutation = useDeletePriceTable();

  // Infinite scroll sentinel — store volatile values in refs so the
  // IntersectionObserver is created only once (when the sentinel mounts)
  // instead of being torn down & re-created on every fetch-state change,
  // which caused an infinite rapid-fire loop that froze the browser.
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const fetchNextPageRef = useRef(fetchNextPage);
  hasNextPageRef.current = hasNextPage;
  isFetchingNextPageRef.current = isFetchingNextPage;
  fetchNextPageRef.current = fetchNextPage;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    // Disconnect prévious observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          hasNextPageRef.current &&
          !isFetchingNextPageRef.current
        ) {
          fetchNextPageRef.current();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  // Filter options
  const typeOptions = useMemo(
    () =>
      Object.entries(PRICE_TABLE_TYPE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  // Handlers
  const handleDelete = (ids: string[]) => {
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
        ? 'Tabela de preço excluída com sucesso!'
        : `${itemsToDelete.length} tabelas excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  return (
    <PageLayout data-testid="pricing-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Tabelas de Preco', href: '/sales/pricing' },
          ]}
          buttons={
            hasPermission(SALES_PERMISSIONS.PRICE_TABLES.REGISTER)
              ? [
                  {
                    id: 'create',
                    title: 'Nova Tabela',
                    icon: Plus,
                    onClick: () => setWizardOpen(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />
        <Header
          title="Tabelas de Preço"
          description="Gerencie tabelas de preco, preços por cliente e politicas de precificação"
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          placeholder="Buscar tabelas de preco..."
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
            title="Erro ao carregar tabelas de preco"
            message="Ocorreu um erro. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <FilterDropdown
                label="Tipo"
                icon={Table2}
                options={typeOptions}
                selected={typeFilter}
                onSelectionChange={setTypeFilter}
                activeColor="blue"
                searchPlaceholder="Buscar tipo..."
                emptyText="Nenhum tipo encontrado."
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {total} {total === 1 ? 'tabela' : 'tabelas'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {priceTables.map((table: PriceTable) => (
                <div
                  key={table.id}
                  onClick={() => router.push(`/sales/pricing/${table.id}`)}
                  className={cn(
                    'group relative rounded-xl border bg-card p-4 cursor-pointer transition-all',
                    'hover:shadow-md hover:border-primary/20',
                    'dark:hover:border-primary/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                        {table.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {table.description ||
                          PRICE_TABLE_TYPE_LABELS[table.type]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                        'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300'
                      )}
                    >
                      {PRICE_TABLE_TYPE_LABELS[table.type]}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                        table.isActive
                          ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                          : 'border-gray-300 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {table.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                    {table.isDefault && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300">
                        Padrão
                      </span>
                    )}
                  </div>

                  {hasPermission(SALES_PERMISSIONS.PRICE_TABLES.REMOVE) && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete([table.id]);
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div ref={sentinelRef} className="h-1" />
          </>
        )}

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir esta tabela de preço. Esta ação não pode ser desfeita."
        />

        {hasPermission(SALES_PERMISSIONS.PRICE_TABLES.REGISTER) && (
          <CreatePriceTableWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
          />
        )}
      </PageBody>
    </PageLayout>
  );
}
