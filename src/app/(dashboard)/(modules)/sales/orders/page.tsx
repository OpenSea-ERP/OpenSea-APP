'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Badge } from '@/components/ui/badge';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  SelectionToolbar,
} from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useOrdersInfinite,
  useDeleteOrder,
  type OrdersFilters,
} from '@/hooks/sales/use-orders';
import { PERMISSIONS } from '@/config/rbac/permission-codes';
import type { OrderDTO } from '@/types/sales';
import {
  ClipboardList,
  Eye,
  Pencil,
  Plus,
  Trash2,
  FileText,
  ShoppingCart,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const ORDER_TYPE_LABELS: Record<string, string> = {
  QUOTE: 'Orçamento',
  ORDER: 'Pedido',
};

const ORDER_CHANNEL_LABELS: Record<string, string> = {
  PDV: 'PDV',
  WEB: 'Web',
  WHATSAPP: 'WhatsApp',
  MARKETPLACE: 'Marketplace',
  BID: 'Licitação',
  MANUAL: 'Manual',
  API: 'API',
};

const CHANNEL_OPTIONS = [
  { value: '', label: 'Todos os canais' },
  { value: 'PDV', label: 'PDV' },
  { value: 'WEB', label: 'Web' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'MARKETPLACE', label: 'Marketplace' },
  { value: 'BID', label: 'Licitação' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'API', label: 'API' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'ORDER', label: 'Pedidos' },
  { value: 'QUOTE', label: 'Orçamentos' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function OrdersPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.SALES.ORDERS.REGISTER);
  const canView = hasPermission(PERMISSIONS.SALES.ORDERS.ACCESS);
  const canEdit = hasPermission(PERMISSIONS.SALES.ORDERS.MODIFY);
  const canDelete = hasPermission(PERMISSIONS.SALES.ORDERS.REMOVE);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<OrdersFilters>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const observerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOrdersInfinite({ ...filters, search: search || undefined });

  const deleteOrder = useDeleteOrder();

  const orders = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleView = useCallback(
    (order: OrderDTO) => {
      router.push(`/sales/orders/${order.id}`);
    },
    [router],
  );

  const handleEdit = useCallback(
    (order: OrderDTO) => {
      router.push(`/sales/orders/${order.id}/edit`);
    },
    [router],
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteTargetId(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTargetId) return;
    try {
      await deleteOrder.mutateAsync(deleteTargetId);
      toast.success('Pedido excluído com sucesso.');
      setDeleteModalOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Erro ao excluir pedido.');
    }
  }, [deleteTargetId, deleteOrder]);

  const handleFilterChange = useCallback(
    (key: keyof OrdersFilters, value: string) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value || undefined,
      }));
    },
    [],
  );

  const getContextMenuActions = useCallback(
    (order: OrderDTO) => {
      const actions = [];

      if (canDelete) {
        actions.push({
          label: 'Excluir',
          icon: Trash2,
          variant: 'destructive' as const,
          separator: 'before' as const,
          onClick: () => handleDeleteRequest(order.id),
        });
      }

      return actions;
    },
    [canDelete, handleDeleteRequest],
  );

  const breadcrumbs = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Pedidos' },
  ];

  const headerButtons = canCreate
    ? [
        {
          label: 'Novo Pedido',
          icon: Plus,
          onClick: () => router.push('/sales/orders/new'),
        },
      ]
    : [];

  return (
    <CoreProvider>
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbs={breadcrumbs} buttons={headerButtons} />
        </PageHeader>

        <PageBody>
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Buscar pedidos por número..."
          />

          {isLoading ? (
            <GridLoading />
          ) : error ? (
            <GridError />
          ) : (
            <EntityGrid
              items={orders}
              getId={(order) => order.id}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              toolbarStart={
                <>
                  <FilterDropdown
                    label="Tipo"
                    options={TYPE_OPTIONS}
                    value={filters.type ?? ''}
                    onChange={(v) => handleFilterChange('type', v)}
                  />
                  <FilterDropdown
                    label="Canal"
                    options={CHANNEL_OPTIONS}
                    value={filters.channel ?? ''}
                    onChange={(v) => handleFilterChange('channel', v)}
                  />
                </>
              }
              renderItem={(order) => (
                <EntityContextMenu
                  onView={canView ? () => handleView(order) : undefined}
                  onEdit={canEdit ? () => handleEdit(order) : undefined}
                  actions={getContextMenuActions(order)}
                >
                  <EntityCard
                    onClick={canView ? () => handleView(order) : undefined}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                          {order.type === 'QUOTE' ? (
                            <FileText className="h-5 w-5 text-blue-500" />
                          ) : (
                            <ShoppingCart className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ORDER_TYPE_LABELS[order.type] ?? order.type} via{' '}
                            {ORDER_CHANNEL_LABELS[order.channel] ??
                              order.channel}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">
                          {formatCurrency(order.grandTotal)}
                        </p>
                        {order.remainingAmount > 0 && (
                          <p className="text-xs text-amber-500">
                            Restante: {formatCurrency(order.remainingAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {ORDER_TYPE_LABELS[order.type] ?? order.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {ORDER_CHANNEL_LABELS[order.channel] ?? order.channel}
                      </Badge>
                      {order.needsApproval && (
                        <Badge variant="destructive" className="text-xs">
                          Aprovação pendente
                        </Badge>
                      )}
                    </div>
                  </EntityCard>
                </EntityContextMenu>
              )}
              onLoadMore={hasNextPage ? () => fetchNextPage() : undefined}
              isLoadingMore={isFetchingNextPage}
              observerRef={observerRef}
              emptyState={{
                icon: ClipboardList,
                title: 'Nenhum pedido encontrado',
                description: 'Crie seu primeiro pedido para começar.',
              }}
            />
          )}

          {selectedIds.length > 0 && (
            <SelectionToolbar
              count={selectedIds.length}
              onClearSelection={() => setSelectedIds([])}
              actions={{
                view: canView,
                edit: canEdit,
                delete: canDelete,
              }}
              onDelete={() => {
                setDeleteTargetId(selectedIds[0]);
                setDeleteModalOpen(true);
              }}
            />
          )}

          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setDeleteTargetId(null);
            }}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description="Digite seu PIN de ação para excluir este pedido."
          />

          {/* Infinite scroll sentinel */}
          <div ref={observerRef} className="h-1" />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
