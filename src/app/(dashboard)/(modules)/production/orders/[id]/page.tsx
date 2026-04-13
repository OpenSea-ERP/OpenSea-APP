/**
 * Production Order Detail Page
 * Página de detalhe de uma ordem de produção
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { productionOrdersService, materialReservationsService, materialIssuesService, materialReturnsService } from '@/services/production';
import type {
  ProductionOrder,
  ProductionOrderStatus,
} from '@/types/production';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BoxIcon,
  Calendar,
  CheckCircle,
  Clock,
  ClipboardList,
  Hash,
  Loader2,
  Package,
  Pencil,
  Play,
  Rocket,
  Shield,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
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

const STATUS_FLOW: ProductionOrderStatus[] = [
  'DRAFT',
  'PLANNED',
  'FIRM',
  'RELEASED',
  'IN_PROCESS',
  'TECHNICALLY_COMPLETE',
  'CLOSED',
];

const NEXT_STATUS_MAP: Partial<
  Record<ProductionOrderStatus, { target: ProductionOrderStatus; label: string; icon: React.ElementType }>
> = {
  DRAFT: { target: 'PLANNED', label: 'Planejar', icon: Calendar },
  PLANNED: { target: 'FIRM', label: 'Firmar', icon: Shield },
  FIRM: { target: 'RELEASED', label: 'Liberar', icon: Rocket },
  RELEASED: { target: 'IN_PROCESS', label: 'Iniciar Produção', icon: Play },
  IN_PROCESS: {
    target: 'TECHNICALLY_COMPLETE',
    label: 'Completar Tec.',
    icon: CheckCircle,
  },
  TECHNICALLY_COMPLETE: {
    target: 'CLOSED',
    label: 'Encerrar',
    icon: CheckCircle,
  },
};

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between dark:bg-slate-800 p-4 rounded-lg">
      <div className="flex-1 text-xs sm:text-sm">
        <div className="font-bold uppercase text-muted-foreground mb-2">
          {label}
        </div>
        <p className="text-sm sm:text-base text-foreground">
          {value ?? <span className="text-slate-400 dark:text-slate-500/80">&mdash;</span>}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// STATUS TIMELINE
// ============================================================================

function StatusTimeline({
  currentStatus,
}: {
  currentStatus: ProductionOrderStatus;
}) {
  const isCancelled = currentStatus === 'CANCELLED';
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STATUS_FLOW.map((status, idx) => {
        const isActive = idx <= currentIndex && !isCancelled;
        const isCurrent = status === currentStatus;
        return (
          <div key={status} className="flex items-center gap-1 shrink-0">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                isCurrent
                  ? STATUS_COLORS[status]
                  : isActive
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-400'
                    : 'border-gray-200 bg-gray-50 text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-500'
              }`}
            >
              {isActive && !isCurrent && (
                <CheckCircle className="h-3 w-3" />
              )}
              {STATUS_LABELS[status]}
            </div>
            {idx < STATUS_FLOW.length - 1 && (
              <ArrowRight className="h-3 w-3 text-gray-300 dark:text-gray-600 shrink-0" />
            )}
          </div>
        );
      })}
      {isCancelled && (
        <div className="flex items-center gap-1 shrink-0">
          <ArrowRight className="h-3 w-3 text-gray-300 dark:text-gray-600" />
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${STATUS_COLORS.CANCELLED}`}
          >
            <XCircle className="h-3 w-3" />
            Cancelada
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ProductionOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const orderId = params.id as string;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['production-orders', orderId],
    queryFn: async () => {
      const res = await productionOrdersService.getById(orderId);
      return res.productionOrder;
    },
    enabled: !!orderId,
  });

  const order = orderData as ProductionOrder | undefined;

  const { data: reservationsData } = useQuery({
    queryKey: ['material-reservations', orderId],
    queryFn: () => materialReservationsService.list(orderId),
    enabled: !!orderId && !!order,
  });

  const { data: issuesData } = useQuery({
    queryKey: ['material-issues', orderId],
    queryFn: () => materialIssuesService.list(orderId),
    enabled: !!orderId && !!order,
  });

  const { data: returnsData } = useQuery({
    queryKey: ['material-returns', orderId],
    queryFn: () => materialReturnsService.list(orderId),
    enabled: !!orderId && !!order,
  });

  const reservations = reservationsData?.materialReservations ?? [];
  const issues = issuesData?.materialIssues ?? [];
  const returns = returnsData?.materialReturns ?? [];

  const changeStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: ProductionOrderStatus;
    }) => productionOrdersService.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => productionOrdersService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      toast.success('Ordem cancelada!');
    },
    onError: () => {
      toast.error('Erro ao cancelar ordem.');
    },
  });

  const handleStatusTransition = async (targetStatus: ProductionOrderStatus) => {
    if (!order) return;
    setIsChangingStatus(true);
    try {
      await changeStatusMutation.mutateAsync({
        id: order.id,
        status: targetStatus,
      });
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!order) return;
    await cancelMutation.mutateAsync(order.id);
    setCancelOpen(false);
  };

  // Format dates
  const formatDate = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null;

  // Loading
  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Ordens', href: '/production/orders' },
              { label: '...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // Error
  if (error || !order) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Ordens', href: '/production/orders' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Ordem não encontrada"
            message="A ordem de produção que você procura não existe ou foi removida."
            action={{
              label: 'Voltar para Ordens',
              onClick: () => router.push('/production/orders'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const canEdit =
    hasPermission(PRODUCTION_PERMISSIONS.ORDERS.MODIFY) &&
    (order.status === 'DRAFT' || order.status === 'PLANNED');
  const canTransition =
    hasPermission(PRODUCTION_PERMISSIONS.ORDERS.ADMIN) &&
    order.status !== 'CANCELLED' &&
    order.status !== 'CLOSED';
  const nextStatus = NEXT_STATUS_MAP[order.status];

  const actionButtons: HeaderButton[] = [];
  if (canEdit) {
    actionButtons.push({
      id: 'edit',
      title: 'Editar',
      icon: Pencil,
      onClick: () => router.push(`/production/orders/${orderId}/edit`),
      variant: 'default',
    });
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Produção', href: '/production' },
            { label: 'Ordens', href: '/production/orders' },
            { label: order.orderNumber },
          ]}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5" data-testid="order-identity-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 shadow-lg">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-xl font-bold">
                  {order.orderNumber}
                </h1>
                <span
                  className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                {formatDate(order.createdAt) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-sky-400" />
                    Criada em {formatDate(order.createdAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Status transition button */}
            {canTransition && nextStatus && (
              <Button
                size="sm"
                className="h-9 px-2.5 gap-1.5"
                onClick={() => handleStatusTransition(nextStatus.target)}
                disabled={isChangingStatus}
              >
                {isChangingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <nextStatus.icon className="h-4 w-4" />
                )}
                {nextStatus.label}
              </Button>
            )}
            {canTransition &&
              order.status !== 'CANCELLED' &&
              order.status !== 'CLOSED' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
          </div>
        </Card>

        {/* Status Timeline */}
        <Card className="bg-white/5 p-5">
          <StatusTimeline currentStatus={order.status} />
        </Card>

        {/* Tabs */}
        <Card className="overflow-hidden bg-white/5 py-2">
          <Tabs defaultValue="details" className="px-6 py-4">
            <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="materials">Materiais</TabsTrigger>
              <TabsTrigger value="operations">Operações</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details">
              <div className="space-y-8">
                <div className="space-y-5">
                  <SectionHeader
                    icon={ClipboardList}
                    title="Informações da Ordem"
                    subtitle="Dados gerais da ordem de produção"
                  />
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                    <div className="grid gap-6 md:grid-cols-3">
                      <InfoField
                        label="Número da Ordem"
                        value={order.orderNumber}
                      />
                      <InfoField
                        label="ID do Produto"
                        value={order.productId}
                      />
                      <InfoField label="ID da BOM" value={order.bomId} />
                    </div>
                    <div className="mt-6 grid gap-6 md:grid-cols-3">
                      <InfoField
                        label="Quantidade Planejada"
                        value={order.quantityPlanned.toLocaleString('pt-BR')}
                      />
                      <InfoField
                        label="Quantidade Iniciada"
                        value={order.quantityStarted.toLocaleString('pt-BR')}
                      />
                      <InfoField
                        label="Quantidade Completa"
                        value={order.quantityCompleted.toLocaleString('pt-BR')}
                      />
                    </div>
                    <div className="mt-6 grid gap-6 md:grid-cols-3">
                      <InfoField
                        label="Quantidade Refugo"
                        value={order.quantityScrapped.toLocaleString('pt-BR')}
                      />
                      <InfoField
                        label="Prioridade"
                        value={
                          order.priority
                            ? `${order.priority} - ${
                                {
                                  1: 'Baixa',
                                  2: 'Normal',
                                  3: 'Alta',
                                  4: 'Urgente',
                                  5: 'Crítica',
                                }[order.priority] || ''
                              }`
                            : null
                        }
                      />
                      <InfoField
                        label="Pedido de Venda"
                        value={order.salesOrderId}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <SectionHeader
                    icon={Calendar}
                    title="Datas"
                    subtitle="Datas planejadas e realizadas"
                  />
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                    <div className="grid gap-6 md:grid-cols-2">
                      <InfoField
                        label="Início Planejado"
                        value={formatDate(order.plannedStartDate)}
                      />
                      <InfoField
                        label="Fim Planejado"
                        value={formatDate(order.plannedEndDate)}
                      />
                    </div>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      <InfoField
                        label="Início Real"
                        value={formatDate(order.actualStartDate)}
                      />
                      <InfoField
                        label="Fim Real"
                        value={formatDate(order.actualEndDate)}
                      />
                    </div>
                    {order.releasedAt && (
                      <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <InfoField
                          label="Liberada em"
                          value={formatDate(order.releasedAt)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {order.notes && (
                  <div className="space-y-5">
                    <SectionHeader
                      icon={Hash}
                      title="Observações"
                      subtitle="Notas adicionais"
                    />
                    <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {order.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials">
              <div className="space-y-6">
                {/* BOM link */}
                <div>
                  <SectionHeader
                    icon={Package}
                    title="Lista de Materiais (BOM)"
                    subtitle="Materiais definidos na BOM vinculada"
                  />
                  <div className="w-full rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        BOM: <strong>{order.bomId}</strong>
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-2.5"
                        onClick={() => router.push(`/production/engineering/boms/${order.bomId}`)}
                      >
                        Ver BOM
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Reservations */}
                <div>
                  <SectionHeader
                    icon={BoxIcon}
                    title="Reservas de Material"
                    subtitle={`${reservations.length} reserva(s) registrada(s)`}
                  />
                  {reservations.length === 0 ? (
                    <div className="w-full rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60">
                      <p className="text-sm text-muted-foreground">Nenhuma reserva de material registrada.</p>
                    </div>
                  ) : (
                    <div className="w-full rounded-xl border border-border bg-white dark:bg-slate-800/60 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/80">
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Material</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Armazém</th>
                            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Reservado</th>
                            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Emitido</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservations.map((r) => (
                            <tr key={r.id} className="border-b border-border last:border-0">
                              <td className="px-4 py-2 font-mono text-xs">{r.materialId}</td>
                              <td className="px-4 py-2 font-mono text-xs">{r.warehouseId}</td>
                              <td className="px-4 py-2 text-right">{r.quantityReserved}</td>
                              <td className="px-4 py-2 text-right">{r.quantityIssued}</td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                                  r.status === 'RESERVED' ? 'border-blue-600/25 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/8 dark:text-blue-300' :
                                  r.status === 'PARTIALLY_ISSUED' ? 'border-amber-600/25 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-300' :
                                  r.status === 'FULLY_ISSUED' ? 'border-emerald-600/25 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300' :
                                  'border-rose-600/25 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/8 dark:text-rose-300'
                                }`}>
                                  {r.status === 'RESERVED' ? 'Reservado' : r.status === 'PARTIALLY_ISSUED' ? 'Parcial' : r.status === 'FULLY_ISSUED' ? 'Emitido' : 'Cancelado'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Issues */}
                <div>
                  <SectionHeader
                    icon={ArrowUpRight}
                    title="Requisições de Material"
                    subtitle={`${issues.length} requisição(ões) registrada(s)`}
                  />
                  {issues.length === 0 ? (
                    <div className="w-full rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60">
                      <p className="text-sm text-muted-foreground">Nenhuma requisição de material registrada.</p>
                    </div>
                  ) : (
                    <div className="w-full rounded-xl border border-border bg-white dark:bg-slate-800/60 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/80">
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Material</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Armazém</th>
                            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Quantidade</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Lote</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {issues.map((issue) => (
                            <tr key={issue.id} className="border-b border-border last:border-0">
                              <td className="px-4 py-2 font-mono text-xs">{issue.materialId}</td>
                              <td className="px-4 py-2 font-mono text-xs">{issue.warehouseId}</td>
                              <td className="px-4 py-2 text-right">{issue.quantity}</td>
                              <td className="px-4 py-2">{issue.batchNumber ?? '—'}</td>
                              <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(issue.issuedAt).toLocaleDateString('pt-BR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Returns */}
                <div>
                  <SectionHeader
                    icon={ArrowDownLeft}
                    title="Devoluções de Material"
                    subtitle={`${returns.length} devolução(ões) registrada(s)`}
                  />
                  {returns.length === 0 ? (
                    <div className="w-full rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60">
                      <p className="text-sm text-muted-foreground">Nenhuma devolução de material registrada.</p>
                    </div>
                  ) : (
                    <div className="w-full rounded-xl border border-border bg-white dark:bg-slate-800/60 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/80">
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Material</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Armazém</th>
                            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Quantidade</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Motivo</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {returns.map((ret) => (
                            <tr key={ret.id} className="border-b border-border last:border-0">
                              <td className="px-4 py-2 font-mono text-xs">{ret.materialId}</td>
                              <td className="px-4 py-2 font-mono text-xs">{ret.warehouseId}</td>
                              <td className="px-4 py-2 text-right">{ret.quantity}</td>
                              <td className="px-4 py-2">{ret.reason ?? '—'}</td>
                              <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(ret.returnedAt).toLocaleDateString('pt-BR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Operations Tab */}
            <TabsContent value="operations">
              <div className="space-y-5">
                <SectionHeader
                  icon={Clock}
                  title="Operações"
                  subtitle="Roteiro de operações vinculado à BOM"
                />
                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <p className="text-sm text-muted-foreground">
                    As operações são definidas no roteiro da BOM vinculada.
                    Consulte a BOM <strong>{order.bomId}</strong> para ver o
                    roteiro completo.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 h-9 px-2.5"
                    onClick={() =>
                      router.push(
                        `/production/engineering/boms/${order.bomId}`,
                      )
                    }
                  >
                    Ver Roteiro
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Cancel Confirmation (PIN) */}
        <VerifyActionPinModal
          isOpen={cancelOpen}
          onClose={() => setCancelOpen(false)}
          onSuccess={handleCancelConfirm}
          title="Cancelar Ordem de Produção"
          description={`Digite seu PIN de ação para cancelar a ordem "${order.orderNumber}". Esta ação não pode ser desfeita.`}
        />
      </PageBody>
    </PageLayout>
  );
}
