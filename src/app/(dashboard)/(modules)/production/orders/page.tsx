/**
 * Production Orders Listing Page
 * Página de listagem de ordens de produção com infinite scroll
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { useDebounce } from '@/hooks/use-debounce';
import { productionOrdersService } from '@/services/production';
import type {
  ProductionOrder,
  ProductionOrderStatus,
  CreateProductionOrderRequest,
} from '@/types/production';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownAZ,
  Calendar,
  CircleDot,
  ClipboardList,
  Clock,
  Hash,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// STATUS HELPERS
// ============================================================================

const STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  DRAFT: 'Rascunho',
  PLANNED: 'Planejada',
  FIRM: 'Firme',
  RELEASED: 'Liberada',
  IN_PROCESS: 'Em Processo',
  TECHNICALLY_COMPLETE: 'Tec. Completa',
  CLOSED: 'Encerrada',
  CANCELLED: 'Cancelada',
};

const STATUS_COLORS: Record<ProductionOrderStatus, string> = {
  DRAFT:
    'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
  PLANNED:
    'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300',
  FIRM:
    'border-indigo-600/25 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/8 text-indigo-700 dark:text-indigo-300',
  RELEASED:
    'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
  IN_PROCESS:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  TECHNICALLY_COMPLETE:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  CLOSED:
    'border-green-600/25 dark:border-green-500/20 bg-green-50 dark:bg-green-500/8 text-green-700 dark:text-green-300',
  CANCELLED:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
};

function StatusBadge({ status }: { status: ProductionOrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Baixa',
  2: 'Normal',
  3: 'Alta',
  4: 'Urgente',
  5: 'Crítica',
};

const PRIORITY_COLORS: Record<number, string> = {
  1: 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
  2: 'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300',
  3: 'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  4: 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  5: 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
};

// ============================================================================
// CONFIG
// ============================================================================

const ordersConfig = {
  display: {
    labels: {
      searchPlaceholder: 'Buscar por número da ordem...',
      singular: 'ordem',
      plural: 'ordens',
    },
    gridColumns: 3,
  },
  permissions: {
    view: PRODUCTION_PERMISSIONS.ORDERS.ACCESS,
    create: PRODUCTION_PERMISSIONS.ORDERS.REGISTER,
    edit: PRODUCTION_PERMISSIONS.ORDERS.MODIFY,
    delete: PRODUCTION_PERMISSIONS.ORDERS.REMOVE,
  },
};

const ALL_STATUSES: ProductionOrderStatus[] = [
  'DRAFT',
  'PLANNED',
  'FIRM',
  'RELEASED',
  'IN_PROCESS',
  'TECHNICALLY_COMPLETE',
  'CLOSED',
  'CANCELLED',
];

// ============================================================================
// PAGE
// ============================================================================

export default function ProductionOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<
    ProductionOrderStatus | 'ALL'
  >('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [itemToCancel, setItemToCancel] = useState<string | null>(null);

  // Create form state
  const [newBomId, setNewBomId] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newPriority, setNewPriority] = useState('2');
  const [newPlannedStart, setNewPlannedStart] = useState('');
  const [newPlannedEnd, setNewPlannedEnd] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Data
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      'production-orders',
      debouncedSearch,
      statusFilter,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await productionOrdersService.list({
        page: pageParam as number,
        limit: 20,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: debouncedSearch || undefined,
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.pages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.productionOrders) ?? [],
    [data],
  );
  const total = data?.pages[0]?.meta.total ?? 0;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateProductionOrderRequest) =>
      productionOrdersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      toast.success('Ordem de produção criada com sucesso!');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => productionOrdersService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      toast.success('Ordem de produção cancelada!');
    },
  });

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handlers
  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/production/orders/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      const order = items.find((o) => o.id === ids[0]);
      if (order && (order.status === 'DRAFT' || order.status === 'PLANNED')) {
        router.push(`/production/orders/${ids[0]}/edit`);
      } else {
        toast.error('Apenas ordens em Rascunho ou Planejada podem ser editadas.');
      }
    }
  };

  const handleContextCancel = (ids: string[]) => {
    if (ids.length === 1) {
      setItemToCancel(ids[0]);
      setCancelOpen(true);
    }
  };

  const handleCancelConfirm = useCallback(async () => {
    if (itemToCancel) {
      await cancelMutation.mutateAsync(itemToCancel);
      setCancelOpen(false);
      setItemToCancel(null);
    }
  }, [itemToCancel, cancelMutation]);

  const handleCreate = useCallback(() => {
    setNewBomId('');
    setNewProductId('');
    setNewQuantity('');
    setNewPriority('2');
    setNewPlannedStart('');
    setNewPlannedEnd('');
    setNewNotes('');
    setCreateStep(1);
    setCreateOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    if (!newBomId || !newProductId || !newQuantity) {
      toast.error('BOM, Produto e Quantidade são obrigatórios.');
      return;
    }

    await createMutation.mutateAsync({
      bomId: newBomId,
      productId: newProductId,
      quantityPlanned: Number(newQuantity),
      priority: Number(newPriority),
      plannedStartDate: newPlannedStart || undefined,
      plannedEndDate: newPlannedEnd || undefined,
      notes: newNotes || undefined,
    });
    setCreateOpen(false);
  }, [
    newBomId,
    newProductId,
    newQuantity,
    newPriority,
    newPlannedStart,
    newPlannedEnd,
    newNotes,
    createMutation,
  ]);

  // Context menu actions
  const contextActions = useMemo(
    () => [
      {
        id: 'cancel',
        label: 'Cancelar Ordem',
        icon: Trash2,
        onClick: handleContextCancel,
        variant: 'destructive' as const,
        separator: 'before' as const,
        hidden: (ids: string[]) => {
          const order = items.find((o) => o.id === ids[0]);
          return (
            !order ||
            order.status === 'CANCELLED' ||
            order.status === 'CLOSED'
          );
        },
      },
    ],
    [items],
  );

  // Sort options
  const sortOptions = useMemo(
    () => [
      {
        field: 'custom' as const,
        direction: 'desc' as const,
        label: 'Mais recentes',
        icon: Calendar,
      },
      {
        field: 'custom' as const,
        direction: 'asc' as const,
        label: 'Mais antigos',
        icon: Calendar,
      },
    ],
    [],
  );

  // Render grid card
  const renderGridCard = (item: ProductionOrder, isSelected: boolean) => {
    const priority = item.priority || 2;
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          hasPermission(PRODUCTION_PERMISSIONS.ORDERS.MODIFY) &&
          (item.status === 'DRAFT' || item.status === 'PLANNED')
            ? handleContextEdit
            : undefined
        }
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.orderNumber}
          subtitle={`Qtd: ${item.quantityPlanned.toLocaleString('pt-BR')}`}
          icon={ClipboardList}
          iconBgColor="bg-linear-to-br from-amber-500 to-orange-600"
          badges={[
            {
              label: STATUS_LABELS[item.status],
              variant: 'outline' as const,
              color: STATUS_COLORS[item.status],
            },
            {
              label: PRIORITY_LABELS[priority] || `P${priority}`,
              variant: 'outline' as const,
              color: PRIORITY_COLORS[priority] || PRIORITY_COLORS[2],
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

  const renderListCard = (item: ProductionOrder, isSelected: boolean) => {
    const priority = item.priority || 2;
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          hasPermission(PRODUCTION_PERMISSIONS.ORDERS.MODIFY) &&
          (item.status === 'DRAFT' || item.status === 'PLANNED')
            ? handleContextEdit
            : undefined
        }
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {item.orderNumber}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                Qtd: {item.quantityPlanned.toLocaleString('pt-BR')}
              </span>
            </span>
          }
          metadata={
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusBadge status={item.status} />
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${PRIORITY_COLORS[priority] || PRIORITY_COLORS[2]}`}
              >
                {PRIORITY_LABELS[priority] || `P${priority}`}
              </span>
              {item.plannedStartDate && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.plannedStartDate).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          }
          icon={ClipboardList}
          iconBgColor="bg-linear-to-br from-amber-500 to-orange-600"
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

  // Computed
  const initialIds = useMemo(() => items.map((i) => i.id), [items]);

  // Header buttons
  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (hasPermission(PRODUCTION_PERMISSIONS.ORDERS.REGISTER)) {
      buttons.push({
        id: 'create-order',
        title: 'Nova Ordem',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [hasPermission, handleCreate]);

  // Create wizard steps
  const wizardSteps: WizardStep[] = [
    {
      title: 'Dados Básicos',
      description: 'Defina o produto, BOM e quantidade',
      icon: <ClipboardList className="h-12 w-12 text-amber-500" />,
      isValid: !!newBomId && !!newProductId && !!newQuantity && Number(newQuantity) > 0,
      content: (
        <div className="space-y-4 p-1">
          <div className="grid gap-2">
            <Label htmlFor="productId">
              ID do Produto <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="productId"
              value={newProductId}
              onChange={(e) => setNewProductId(e.target.value)}
              placeholder="ID do produto"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bomId">
              ID da BOM <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="bomId"
              value={newBomId}
              onChange={(e) => setNewBomId(e.target.value)}
              placeholder="ID da lista de materiais"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantity">
              Quantidade Planejada <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={newPriority} onValueChange={setNewPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Baixa</SelectItem>
                <SelectItem value="2">Normal</SelectItem>
                <SelectItem value="3">Alta</SelectItem>
                <SelectItem value="4">Urgente</SelectItem>
                <SelectItem value="5">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: 'Datas e Observações',
      description: 'Defina as datas planejadas e notas',
      icon: <Calendar className="h-12 w-12 text-amber-500" />,
      isValid: true,
      content: (
        <div className="space-y-4 p-1">
          <div className="grid gap-2">
            <Label htmlFor="plannedStart">Data Início Planejada</Label>
            <Input
              id="plannedStart"
              type="date"
              value={newPlannedStart}
              onChange={(e) => setNewPlannedStart(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plannedEnd">Data Fim Planejada</Label>
            <Input
              id="plannedEnd"
              type="date"
              value={newPlannedEnd}
              onChange={(e) => setNewPlannedEnd(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Observações adicionais"
              rows={4}
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-between w-full">
          <Button variant="ghost" onClick={() => setCreateStep(1)}>
            Voltar
          </Button>
          <Button
            onClick={handleCreateSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Criar Ordem
          </Button>
        </div>
      ),
    },
  ];

  // Status filter dropdown
  const statusFilterDropdown = (
    <Select
      value={statusFilter}
      onValueChange={(v) => setStatusFilter(v as ProductionOrderStatus | 'ALL')}
    >
      <SelectTrigger className="w-[180px] h-9">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Todos os status</SelectItem>
        {ALL_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <CoreProvider selection={{ namespace: 'production-orders', initialIds }}>
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Ordens de Produção', href: '/production/orders' },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Ordens de Produção"
            description="Gerencie as ordens de produção do seu negócio"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            value={searchQuery}
            placeholder={ordersConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar ordens"
              message="Ocorreu um erro ao carregar as ordens de produção."
              action={{
                label: 'Tentar Novamente',
                onClick: () => refetch(),
              }}
            />
          ) : (
            <>
              <EntityGrid
                config={ordersConfig}
                items={items}
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                showItemCount={false}
                toolbarStart={
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'ordem' : 'ordens'}
                      {items.length < total &&
                        ` (${items.length} carregados)`}
                    </p>
                    {statusFilterDropdown}
                  </div>
                }
                onItemDoubleClick={(item) =>
                  router.push(`/production/orders/${item.id}`)
                }
                showSorting={true}
                customSortOptions={sortOptions}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
              />

              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}

          {/* Create Wizard */}
          <StepWizardDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            steps={wizardSteps}
            currentStep={createStep}
            onStepChange={setCreateStep}
            onClose={() => setCreateOpen(false)}
          />

          {/* Cancel Confirmation (PIN) */}
          <VerifyActionPinModal
            isOpen={cancelOpen}
            onClose={() => {
              setCancelOpen(false);
              setItemToCancel(null);
            }}
            onSuccess={handleCancelConfirm}
            title="Cancelar Ordem de Produção"
            description="Digite seu PIN de ação para cancelar esta ordem de produção. Esta ação não pode ser desfeita."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
