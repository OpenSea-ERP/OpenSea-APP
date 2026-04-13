/**
 * OpenSea OS - Item Reservation Detail Page
 * Página de detalhes de uma reserva de item
 */

'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useItemReservation,
  useReleaseItemReservation,
} from '@/hooks/sales/use-sales-other';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Hash,
  Package,
  ShoppingCart,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { ItemReservationStatus } from '@/types/sales';
import { ITEM_RESERVATION_STATUS_LABELS } from '@/types/sales';

// ============================================================================
// STATUS STYLES
// ============================================================================

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

// ============================================================================
// DETAIL CONTENT
// ============================================================================

function ItemReservationDetailContent() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(SALES_PERMISSIONS.ORDERS.REMOVE);

  const {
    data: reservationData,
    isLoading,
    isError,
  } = useItemReservation(reservationId);
  const releaseMutation = useReleaseItemReservation();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const reservation = reservationData?.reservation;

  function handleDelete() {
    if (!reservation) return;
    releaseMutation.mutate(
      { id: reservation.id, data: { releaseQuantity: 0 } },
      {
        onSuccess: () => {
          toast.success('Reserva cancelada com sucesso.');
          router.push('/sales/item-reservations');
        },
        onError: () => {
          toast.error('Erro ao cancelar reserva.');
        },
      }
    );
  }

  function formatDateTime(date: string) {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function isExpired(expiresAt: string) {
    return new Date(expiresAt) < new Date();
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Error
  if (isError || !reservation) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">Reserva não encontrada</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          A reserva solicitada não existe ou você nao tem permissão para
          acessa-la.
        </p>
        <Link href="/sales/item-reservations">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Reservas
          </Button>
        </Link>
      </div>
    );
  }

  const statusStyle =
    STATUS_STYLES[reservation.status] || STATUS_STYLES.PENDING;
  const StatusIcon = statusStyle.icon;
  const productName = reservation.item?.product?.name || 'Item sem nome';
  const expired =
    reservation.status === 'PENDING' && isExpired(reservation.expiresAt);

  return (
    <div className="flex flex-col gap-4">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          {
            label: 'Reservas de Itens',
            href: '/sales/item-reservations',
          },
          { label: productName },
        ]}
        buttons={[
          ...(canDelete && reservation.status !== 'CANCELLED'
            ? [
                {
                  id: 'delete',
                  title: 'Cancelar Reserva',
                  icon: Trash2,
                  variant: 'destructive' as const,
                  onClick: () => setShowDeleteModal(true),
                },
              ]
            : []),
        ]}
      />

      {/* Identity Card */}
      <Card className="bg-white/5 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-500/10">
              <Package className="h-6 w-6 text-teal-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{productName}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {reservation.item?.sku && (
                  <span>SKU: {reservation.item.sku}</span>
                )}
                {reservation.salesOrder?.code && (
                  <>
                    <span className="text-muted-foreground/40">|</span>
                    <span>Pedido: {reservation.salesOrder.code}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {expired && (
              <Badge
                variant="secondary"
                className="gap-1 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Expirada
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={cn('gap-1', statusStyle.bg, statusStyle.text)}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {ITEM_RESERVATION_STATUS_LABELS[reservation.status]}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Details Card */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
        <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
          Detalhes da Reserva
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailRow
            icon={Hash}
            label="Quantidade Reservada"
            value={String(reservation.quantity)}
          />

          <DetailRow icon={Package} label="Item" value={productName} />

          <DetailRow
            icon={ShoppingCart}
            label="Pedido de Venda"
            value={
              reservation.salesOrder?.code ||
              reservation.salesOrderId ||
              'Nao vinculado'
            }
          />

          <DetailRow
            icon={StatusIcon}
            label="Status"
            value={ITEM_RESERVATION_STATUS_LABELS[reservation.status]}
          />

          <DetailRow
            icon={Calendar}
            label="Data de Expiração"
            value={formatDateTime(reservation.expiresAt)}
          />

          <DetailRow
            icon={Clock}
            label="Criado em"
            value={formatDateTime(reservation.createdAt)}
          />

          {reservation.updatedAt && (
            <DetailRow
              icon={Clock}
              label="Atualizado em"
              value={formatDateTime(reservation.updatedAt)}
            />
          )}
        </div>
      </Card>

      {/* Delete Modal */}
      <VerifyActionPinModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDelete}
        title="Confirmar Cancelamento"
        description={`Digite seu PIN de ação para cancelar a reserva de "${productName}". Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="text-xs text-muted-foreground block">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE EXPORT
// ============================================================================

export default function ItemReservationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <ItemReservationDetailContent />
    </Suspense>
  );
}
