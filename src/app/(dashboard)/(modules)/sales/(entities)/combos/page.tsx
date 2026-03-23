/**
 * OpenSea OS - Combos Page
 * Pagina de gerenciamento de combos de produtos com infinite scroll
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
import { useCombosInfinite, useDeleteCombo } from '@/hooks/sales/use-combos';
import type { Combo } from '@/types/sales';
import { COMBO_TYPE_LABELS } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { CreateComboWizard } from './src/components/create-combo-wizard';
import { Layers, Package, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function CombosPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <CombosPageContent />
    </Suspense>
  );
}

function CombosPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  const {
    combos,
    total,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCombosInfinite({
    search: debouncedSearch || undefined,
    type: typeFilter[0] as Combo['type'] | undefined,
  });

  const deleteMutation = useDeleteCombo();

  // Infinite scroll — refs prevent observer teardown/re-creation loop
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const fetchNextPageRef = useRef(fetchNextPage);
  hasNextPageRef.current = hasNextPage;
  isFetchingNextPageRef.current = isFetchingNextPage;
  fetchNextPageRef.current = fetchNextPage;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
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

  const typeOptions = useMemo(
    () =>
      Object.entries(COMBO_TYPE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

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
        ? 'Combo excluido com sucesso!'
        : `${itemsToDelete.length} combos excluidos!`
    );
  }, [itemsToDelete, deleteMutation]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Combos', href: '/sales/combos' },
          ]}
          buttons={
            hasPermission(SALES_PERMISSIONS.COMBOS.ADMIN)
              ? [
                  {
                    id: 'create-combo',
                    title: 'Novo Combo',
                    icon: Plus,
                    onClick: () => setCreateOpen(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />
        <Header
          title="Combos"
          description="Gerencie combos e pacotes de produtos"
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          placeholder="Buscar combos..."
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
            title="Erro ao carregar combos"
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
                icon={Layers}
                options={typeOptions}
                selected={typeFilter}
                onSelectionChange={setTypeFilter}
                activeColor="violet"
                searchPlaceholder="Buscar tipo..."
                emptyText="Nenhum tipo encontrado."
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {total} {total === 1 ? 'combo' : 'combos'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {combos.map((combo: Combo) => (
                <div
                  key={combo.id}
                  onClick={() => router.push(`/sales/combos/${combo.id}`)}
                  className={cn(
                    'group relative rounded-xl border bg-card p-4 cursor-pointer transition-all',
                    'hover:shadow-md hover:border-primary/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-orange-500 to-amber-600 text-white">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                        {combo.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {combo.description || COMBO_TYPE_LABELS[combo.type]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border border-orange-600/25 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/8 text-orange-700 dark:text-orange-300">
                      {COMBO_TYPE_LABELS[combo.type]}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                        combo.isActive
                          ? 'border-emerald-600/25 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                          : 'border-gray-300 bg-gray-50 dark:bg-white/[0.04] text-gray-500'
                      )}
                    >
                      {combo.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    {combo.fixedPrice && (
                      <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        R$ {combo.fixedPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {hasPermission(SALES_PERMISSIONS.COMBOS.ADMIN) && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete([combo.id]);
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

        <CreateComboWizard open={createOpen} onOpenChange={setCreateOpen} />

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusao"
          description="Digite seu PIN de acao para excluir este combo. Esta acao nao pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
