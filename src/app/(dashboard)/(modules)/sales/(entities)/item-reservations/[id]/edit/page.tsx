/**
 * OpenSea OS - Edit Item Reservation Page
 * Pagina de edicao de reserva de item (campos limitados)
 * Apenas status (cancelar) e data de expiracao sao editaveis
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useItemReservation,
  useReleaseItemReservation,
} from '@/hooks/sales/use-sales-other';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type { ItemReservation, ItemReservationStatus } from '@/types/sales';
import { ITEM_RESERVATION_STATUS_LABELS } from '@/types/sales';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Hash,
  Loader2,
  Package,
  ShoppingCart,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// SECTION HEADER
// =============================================================================

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

// =============================================================================
// STATUS STYLES
// =============================================================================

const STATUS_STYLES: Record<
  ItemReservationStatus,
  { bg: string; text: string; icon: React.ElementType }
> = {
  PENDING: {
    bg: 'bg-amber-50 dark:bg-amber-500/8',
    text: 'text-amber-700 dark:text-amber-300',
    icon: Clock,
  },
  CONFIRMED: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  CANCELLED: {
    bg: 'bg-rose-50 dark:bg-rose-500/8',
    text: 'text-rose-700 dark:text-rose-300',
    icon: XCircle,
  },
};

// =============================================================================
// HELPERS
// =============================================================================

function toDateTimeInputValue(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 16);
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditItemReservationPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const reservationId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: reservationData,
    isLoading,
    error,
  } = useItemReservation(reservationId);

  const reservation = reservationData?.reservation as
    | ItemReservation
    | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const releaseMutation = useReleaseItemReservation();

  // ============================================================================
  // STATE
  // ============================================================================

  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCancelConfirm = async () => {
    if (!reservation) return;
    try {
      await releaseMutation.mutateAsync({
        id: reservationId,
        data: { releaseQuantity: reservation.quantity },
      });
      toast.success('Reserva cancelada com sucesso!');
      router.push('/sales/item-reservations');
    } catch (err) {
      logger.error(
        'Erro ao cancelar reserva',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao cancelar reserva', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const canCancel =
    hasPermission(SALES_PERMISSIONS.ORDERS.REMOVE) &&
    reservation?.status === 'PENDING';

  const actionButtons: HeaderButton[] = [
    ...(canCancel
      ? [
          {
            id: 'cancel',
            title: 'Cancelar Reserva',
            icon: Trash2,
            onClick: () => setCancelModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Reservas', href: '/sales/item-reservations' },
    {
      label: reservation
        ? `Reserva #${reservation.id.slice(0, 8)}`
        : '...',
      href: `/sales/item-reservations/${reservationId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !reservation) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Reserva nao encontrada"
            message="A reserva solicitada nao foi encontrada."
            action={{
              label: 'Voltar para Reservas',
              onClick: () => router.push('/sales/item-reservations'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const statusStyle = STATUS_STYLES[reservation.status];
  const StatusIcon = statusStyle.icon;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-sky-500 to-blue-600">
              <Package className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Detalhes da reserva
              </p>
              <h1 className="text-xl font-bold truncate">
                Reserva #{reservation.id.slice(0, 8)}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                  statusStyle.bg,
                  statusStyle.text
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {ITEM_RESERVATION_STATUS_LABELS[reservation.status]}
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados da Reserva (read-only) */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Hash}
                title="Dados da Reserva"
                subtitle="Informacoes da reserva (somente leitura)"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Quantidade</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        {reservation.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Item</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground truncate">
                        {reservation.item?.product?.name ??
                          reservation.item?.sku ??
                          reservation.itemId}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Pedido</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground truncate">
                        {reservation.salesOrder?.code ??
                          reservation.salesOrderId ??
                          'Sem pedido vinculado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile status */}
                <div className="grid grid-cols-1 sm:hidden gap-4">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium w-fit',
                        statusStyle.bg,
                        statusStyle.text
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {ITEM_RESERVATION_STATUS_LABELS[reservation.status]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Datas */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Calendar}
                title="Datas"
                subtitle="Datas de criacao e expiracao da reserva"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Criada em</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(reservation.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Expira em</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(reservation.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Info notice for cancelled/confirmed */}
        {reservation.status !== 'PENDING' && (
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-6 py-4 space-y-8">
              <div className="space-y-5">
                <SectionHeader
                  icon={AlertTriangle}
                  title="Aviso"
                  subtitle="Esta reserva nao pode ser modificada"
                />
                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <p className="text-sm text-muted-foreground">
                    {reservation.status === 'CANCELLED'
                      ? 'Esta reserva ja foi cancelada e nao pode ser alterada.'
                      : 'Esta reserva ja foi confirmada e nao pode ser alterada.'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </PageBody>

      {/* Cancel PIN Modal */}
      <VerifyActionPinModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={handleCancelConfirm}
        title="Cancelar Reserva"
        description={`Digite seu PIN de acao para cancelar esta reserva de ${reservation.quantity} unidade(s). Esta acao nao pode ser desfeita.`}
      />
    </PageLayout>
  );
}
