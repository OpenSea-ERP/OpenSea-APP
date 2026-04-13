/**
 * OpenSea OS - Variant Promotion Detail Page
 * Página de detalhes de uma promoção de variante
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useVariantPromotion,
  useDeleteVariantPromotion,
} from '@/hooks/sales/use-sales-other';
import { DISCOUNT_TYPE_LABELS } from '@/types/sales/promotion.types';
import type { VariantPromotion } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  Clock,
  Edit,
  FileText,
  Percent,
  Tag,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function VariantPromotionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const promotionId = params.id as string;

  const [isDeletePinOpen, setIsDeletePinOpen] = useState(false);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data: promotionData,
    isLoading,
    error,
    refetch,
  } = useVariantPromotion(promotionId);
  const deleteMutation = useDeleteVariantPromotion();

  const promotion = promotionData?.promotion;

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  const canEdit = hasPermission(SALES_PERMISSIONS.PROMOTIONS.MODIFY);
  const canDelete = hasPermission(SALES_PERMISSIONS.PROMOTIONS.REMOVE);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(promotionId);
    toast.success('Promoção excluída com sucesso!');
    router.push('/sales/variant-promotions');
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDiscountValue = (p: VariantPromotion) =>
    p.discountType === 'PERCENTAGE'
      ? `${p.discountValue}%`
      : `R$ ${p.discountValue.toFixed(2)}`;

  const getStatusInfo = (p: VariantPromotion) => {
    if (!p.isActive) {
      return {
        label: 'Inativa',
        className:
          'border-gray-300 bg-gray-50 dark:bg-white/[0.04] text-gray-500',
      };
    }
    if (p.isExpired) {
      return {
        label: 'Expirada',
        className:
          'border-rose-600/25 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
      };
    }
    if (p.isUpcoming) {
      return {
        label: 'Futura',
        className:
          'border-sky-600/25 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      };
    }
    return {
      label: 'Ativa',
      className:
        'border-emerald-600/25 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    };
  };

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              {
                label: 'Promoções de Variantes',
                href: '/sales/variant-promotions',
              },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={1} layout="grid" size="lg" gap="gap-4" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !promotion) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              {
                label: 'Promoções de Variantes',
                href: '/sales/variant-promotions',
              },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Erro ao carregar promoção"
            message="Nao foi possível carregar os detalhes desta promoção."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const status = getStatusInfo(promotion);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="variant-promotion-detail">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            {
              label: 'Promoções de Variantes',
              href: '/sales/variant-promotions',
            },
            { label: promotion.name },
          ]}
          buttons={[
            ...(canDelete
              ? [
                  {
                    id: 'delete-promotion',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setIsDeletePinOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
            ...(canEdit
              ? [
                  {
                    id: 'edit-promotion',
                    title: 'Editar',
                    icon: Edit,
                    onClick: () =>
                      router.push(
                        `/sales/variant-promotions/${promotionId}/edit`
                      ),
                    variant: 'default' as const,
                  },
                ]
              : []),
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card
          data-testid="variant-promotion-identity"
          className="bg-white/5 p-5"
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white',
                promotion.isExpired || !promotion.isActive
                  ? 'bg-gray-400'
                  : promotion.discountType === 'PERCENTAGE'
                    ? 'bg-linear-to-br from-violet-500 to-purple-600'
                    : 'bg-linear-to-br from-teal-500 to-emerald-600'
              )}
            >
              {promotion.discountType === 'PERCENTAGE' ? (
                <Percent className="h-7 w-7" />
              ) : (
                <Tag className="h-7 w-7" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {promotion.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Criada em {formatDateTime(promotion.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* Details Card */}
        <Card className="bg-white/5 py-2 overflow-hidden mt-4">
          <div className="p-5 space-y-6">
            {/* Status & Type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Status e Tipo
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border',
                    status.className
                  )}
                >
                  {status.label}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border',
                    promotion.discountType === 'PERCENTAGE'
                      ? 'border-violet-600/25 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300'
                      : 'border-teal-600/25 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300'
                  )}
                >
                  {DISCOUNT_TYPE_LABELS[promotion.discountType]}
                </span>
              </div>
            </div>

            {/* Discount Value */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Valor do Desconto
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDiscountValue(promotion)}
              </p>
            </div>

            {/* Date Range */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Período de Vigencia
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Inicio</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(promotion.startDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Termino</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(promotion.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Variant ID */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                ID da Variante
              </h3>
              <p className="text-sm font-mono text-muted-foreground">
                {promotion.variantId}
              </p>
            </div>

            {/* Notes */}
            {promotion.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Observações
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {promotion.notes}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Criada em {formatDateTime(promotion.createdAt)}
                </span>
                {promotion.updatedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Atualizada em {formatDateTime(promotion.updatedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Delete Confirmation */}
        <VerifyActionPinModal
          isOpen={isDeletePinOpen}
          onClose={() => setIsDeletePinOpen(false)}
          onSuccess={handleDelete}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir esta promoção. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
