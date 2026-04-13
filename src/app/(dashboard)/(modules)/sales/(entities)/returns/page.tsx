/**
 * OpenSea OS - Returns Listing Page
 * Página de listagem de devolucoes com infinite scroll
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
  useReturnsInfinite,
  useCreateReturn,
  useDeleteReturn,
} from '@/hooks/sales/use-returns';
import type {
  OrderReturnDTO,
  ReturnStatus,
  ReturnReason,
  CreateReturnRequest,
} from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Package,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CreateReturnWizard } from './src/components/create-return-wizard';

// =============================================================================
// LABELS
// =============================================================================

const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  REQUESTED: 'Solicitada',
  APPROVED: 'Aprovada',
  RECEIVING: 'Recebendo',
  RECEIVED: 'Recebida',
  CREDIT_ISSUED: 'Credito Emitido',
  EXCHANGE_COMPLETED: 'Troca Concluida',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
};

const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  DEFECTIVE: 'Defeituoso',
  WRONG_ITEM: 'Item Errado',
  CHANGED_MIND: 'Desistencia',
  DAMAGED: 'Danificado',
  NOT_AS_DESCRIBED: 'Nao Conforme',
  OTHER: 'Outro',
};

// =============================================================================
// STATUS STYLES
// =============================================================================

const STATUS_STYLES: Record<
  ReturnStatus,
  { bg: string; text: string; icon: React.ElementType }
> = {
  REQUESTED: {
    bg: 'bg-amber-50 dark:bg-amber-500/8',
    text: 'text-amber-700 dark:text-amber-300',
    icon: Clock,
  },
  APPROVED: {
    bg: 'bg-sky-50 dark:bg-sky-500/8',
    text: 'text-sky-700 dark:text-sky-300',
    icon: CheckCircle2,
  },
  RECEIVING: {
    bg: 'bg-violet-50 dark:bg-violet-500/8',
    text: 'text-violet-700 dark:text-violet-300',
    icon: Package,
  },
  RECEIVED: {
    bg: 'bg-teal-50 dark:bg-teal-500/8',
    text: 'text-teal-700 dark:text-teal-300',
    icon: CheckCircle2,
  },
  CREDIT_ISSUED: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  EXCHANGE_COMPLETED: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  REJECTED: {
    bg: 'bg-rose-50 dark:bg-rose-500/8',
    text: 'text-rose-700 dark:text-rose-300',
    icon: XCircle,
  },
  CANCELLED: {
    bg: 'bg-slate-50 dark:bg-slate-500/8',
    text: 'text-slate-700 dark:text-slate-300',
    icon: XCircle,
  },
};

// =============================================================================
// MAIN
// =============================================================================

export default function ReturnsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <ReturnsPageContent />
    </Suspense>
  );
}

function ReturnsPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [createWizardOpen, setCreateWizardOpen] = useState(false);

  const canCreate = hasPermission(SALES_PERMISSIONS.RETURNS.REGISTER);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReturnsInfinite({
    search: debouncedSearch || undefined,
    status: statusFilter[0] || undefined,
  });

  const deleteMutation = useDeleteReturn();
  const createMutation = useCreateReturn();

  const returns = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);
  const total = data?.pages[0]?.meta.total ?? 0;

  // Infinite scroll
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

  const statusOptions = useMemo(
    () =>
      Object.entries(RETURN_STATUS_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await deleteMutation.mutateAsync(itemToDelete);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      toast.success('Devolucao excluída com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir devolucao', { description: message });
    }
  }, [itemToDelete, deleteMutation]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const handleCreateSubmit = useCallback(
    async (data: CreateReturnRequest) => {
      await createMutation.mutateAsync(data);
      toast.success('Devolucao criada com sucesso!');
    },
    [createMutation]
  );

  const canDelete = hasPermission(SALES_PERMISSIONS.RETURNS.ADMIN);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Devolucoes', href: '/sales/returns' },
          ]}
          buttons={
            canCreate
              ? [
                  {
                    id: 'create-return',
                    title: 'Nova Devolucao',
                    icon: Plus,
                    onClick: () => setCreateWizardOpen(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />
        <Header
          title="Devolucoes"
          description="Gerencie devolucoes e trocas de pedidos"
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          placeholder="Buscar devolucoes por número..."
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
            title="Erro ao carregar devolucoes"
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
                label="Status"
                icon={Filter}
                options={statusOptions}
                selected={statusFilter}
                onSelectionChange={setStatusFilter}
                activeColor="cyan"
                searchPlaceholder="Buscar status..."
                emptyText="Nenhum status encontrado."
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {total} {total === 1 ? 'devolucao' : 'devolucoes'}
              </p>
            </div>

            {returns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <RotateCcw className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Nenhuma devolucao encontrada
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchQuery || statusFilter.length > 0
                    ? 'Tente ajustar os filtros de busca.'
                    : 'As devolucoes de pedidos aparecerão aqui.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {returns.map((returnItem: OrderReturnDTO) => {
                  const statusStyle = STATUS_STYLES[returnItem.status];
                  const StatusIcon = statusStyle.icon;

                  return (
                    <div
                      key={returnItem.id}
                      className="group relative rounded-xl border bg-card p-4 transition-all hover:shadow-md cursor-pointer"
                      onClick={() =>
                        router.push(`/sales/returns/${returnItem.id}`)
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white bg-linear-to-br from-violet-500 to-purple-600">
                          <RotateCcw className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                            {returnItem.returnNumber}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Pedido: {returnItem.orderId.slice(0, 8)}...
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border border-transparent',
                            statusStyle.bg,
                            statusStyle.text
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {RETURN_STATUS_LABELS[returnItem.status]}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {RETURN_REASON_LABELS[returnItem.reason]}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(returnItem.refundAmount)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(returnItem.createdAt)}
                        </span>
                      </div>

                      {/* Action buttons on hover */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            router.push(`/sales/returns/${returnItem.id}`);
                          }}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDelete(returnItem.id);
                            }}
                            className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div ref={sentinelRef} className="h-1" />
          </>
        )}

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir esta devolucao. Esta ação não pode ser desfeita."
        />

        <CreateReturnWizard
          open={createWizardOpen}
          onOpenChange={setCreateWizardOpen}
          onSubmit={handleCreateSubmit}
          isSubmitting={createMutation.isPending}
        />
      </PageBody>
    </PageLayout>
  );
}
