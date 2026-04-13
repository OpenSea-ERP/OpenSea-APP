/**
 * OpenSea OS - Customer Price Detail Page
 * Página de detalhes de preço por cliente (somente leitura)
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCustomerPricesInfinite,
  useDeleteCustomerPrice,
} from '@/hooks/sales/use-customer-prices';
import { useCustomersInfinite } from '@/hooks/sales/use-customers';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  ArrowLeft,
  BadgeDollarSign,
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CustomerPriceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { hasPermission } = usePermissions();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const deleteMutation = useDeleteCustomerPrice();

  // Load all customer prices and find the one with this id
  const { customerPrices, isLoading, error, refetch } =
    useCustomerPricesInfinite();

  const customerPrice = useMemo(
    () => customerPrices.find(cp => cp.id === id),
    [customerPrices, id]
  );

  // Load customers for name resolution
  const { customers: allCustomers } = useCustomersInfinite();
  const customerName = useMemo(() => {
    if (!customerPrice) return '';
    const customer = (allCustomers ?? []).find(
      c => c.id === customerPrice.customerId
    );
    return customer?.name ?? customerPrice.customerId;
  }, [customerPrice, allCustomers]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nao definido';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatus = () => {
    if (!customerPrice) return 'active';
    const now = new Date();
    if (customerPrice.validUntil && new Date(customerPrice.validUntil) < now)
      return 'expired';
    if (customerPrice.validFrom && new Date(customerPrice.validFrom) > now)
      return 'upcoming';
    return 'active';
  };

  const statusBadgeStyles = {
    active:
      'border-emerald-600/25 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    expired:
      'border-gray-300 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400',
    upcoming:
      'border-sky-600/25 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  };

  const statusLabels = {
    active: 'Ativo',
    expired: 'Expirado',
    upcoming: 'Futuro',
  };

  // ============================================================================
  // DELETE HANDLER
  // ============================================================================

  const handleDeleteConfirm = useCallback(async () => {
    await deleteMutation.mutateAsync(id);
    setDeleteModalOpen(false);
    toast.success('Preço excluído com sucesso!');
    router.push('/sales/customer-prices');
  }, [id, deleteMutation, router]);

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
                label: 'Preços por Cliente',
                href: '/sales/customer-prices',
              },
              { label: 'Detalhes' },
            ]}
            buttons={[]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="grid" size="lg" gap="gap-4" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !customerPrice) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              {
                label: 'Preços por Cliente',
                href: '/sales/customer-prices',
              },
              { label: 'Detalhes' },
            ]}
            buttons={[]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Preço não encontrado"
            message="O preço por cliente solicitado não foi encontrado."
            action={{
              label: 'Voltar',
              onClick: () => router.push('/sales/customer-prices'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const status = getStatus();

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            {
              label: 'Preços por Cliente',
              href: '/sales/customer-prices',
            },
            { label: customerName },
          ]}
          buttons={[
            ...(hasPermission(SALES_PERMISSIONS.CUSTOMER_PRICES.REMOVE)
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteModalOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/sales/customer-prices')}
          className="mb-4 -ml-2 h-9 px-2.5"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Voltar
        </Button>

        {/* Identity Card */}
        <Card className="bg-white/5 p-5 mb-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white',
                status === 'expired'
                  ? 'bg-gray-400'
                  : status === 'upcoming'
                    ? 'bg-linear-to-br from-sky-500 to-blue-600'
                    : 'bg-linear-to-br from-emerald-500 to-teal-600'
              )}
            >
              <BadgeDollarSign className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {customerName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Criado em {formatDateTime(customerPrice.createdAt)}
              </p>
            </div>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border',
                statusBadgeStyles[status]
              )}
            >
              {statusLabels[status]}
            </span>
          </div>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price Info */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Informações de Preco
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Preço Negociado</p>
                <p className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                  {formatPrice(customerPrice.price)}
                </p>
              </div>
            </div>
          </Card>

          {/* Customer & Variant */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-violet-600" />
              Cliente e Variante
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {customerName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ID da Variante</p>
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {customerPrice.variantId}
                </p>
              </div>
            </div>
          </Card>

          {/* Validity Period */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-sky-600" />
              Período de Validade
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Valido a Partir de
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(customerPrice.validFrom)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valido Ate</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(customerPrice.validUntil)}
                </p>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-teal-600" />
              Observações
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {customerPrice.notes || 'Nenhuma observação registrada.'}
            </p>
          </Card>
        </div>

        {/* Audit Info */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-5 mt-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Auditoria
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Criado em</p>
              <p className="text-gray-900 dark:text-white">
                {formatDateTime(customerPrice.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Atualizado em</p>
              <p className="text-gray-900 dark:text-white">
                {formatDateTime(customerPrice.updatedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Criado por</p>
              <p className="text-gray-700 dark:text-gray-300 font-mono text-xs">
                {customerPrice.createdByUserId}
              </p>
            </div>
          </div>
        </Card>

        {/* Delete Modal */}
        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir este preco. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
