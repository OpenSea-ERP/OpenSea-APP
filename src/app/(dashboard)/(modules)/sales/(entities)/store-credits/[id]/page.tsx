/**
 * OpenSea OS - Store Credit Detail Page
 * Página de detalhes do credito de loja com informações do cliente, saldo e histórico
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
import { Card } from '@/components/ui/card';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  useStoreCredit,
  useDeleteStoreCredit,
} from '@/hooks/sales/use-store-credits';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { STORE_CREDIT_SOURCE_LABELS } from '@/types/sales';
import type { StoreCreditDTO } from '@/types/sales';
import { cn } from '@/lib/utils';
import {
  Calendar,
  CreditCard,
  DollarSign,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// INFO ROW COMPONENT
// ============================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
  valueClassName?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-medium truncate', valueClassName)}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function StoreCreditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const creditId = params.id as string;

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: creditData, isLoading, error } = useStoreCredit(creditId);
  const deleteMutation = useDeleteStoreCredit();

  const credit = creditData?.storeCredit as StoreCreditDTO | undefined;

  const canDelete = hasPermission(SALES_PERMISSIONS.STORE_CREDITS.REMOVE);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDeleteConfirm = useCallback(async () => {
    await deleteMutation.mutateAsync(creditId);
    setDeleteModalOpen(false);
    toast.success('Credito de loja excluído com sucesso!');
    router.push('/sales/store-credits');
  }, [creditId, deleteMutation, router]);

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(canDelete
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
  ];

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Creditos de Loja', href: '/sales/store-credits' },
    { label: credit?.customerName || 'Detalhes' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

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

  if (error || !credit) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Credito de loja não encontrado"
            message="O credito de loja que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Creditos de Loja',
              onClick: () => router.push('/sales/store-credits'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const usedAmount = credit.amount - credit.balance;
  const usagePercent =
    credit.amount > 0 ? Math.round((credit.balance / credit.amount) * 100) : 0;

  const isExpired = credit.expiresAt && new Date(credit.expiresAt) < new Date();
  const statusLabel = !credit.isActive
    ? 'Inativo'
    : isExpired
      ? 'Expirado'
      : credit.balance <= 0
        ? 'Esgotado'
        : 'Ativo';
  const statusColor =
    !credit.isActive || credit.balance <= 0
      ? 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
      : isExpired
        ? 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300'
        : 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300';

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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-violet-500 to-purple-600">
              <Wallet className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Credito de Loja</p>
              <h1 className="text-xl font-bold truncate">
                {credit.customerName || 'Cliente'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Criado em {formatDate(credit.createdAt)}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                  statusColor
                )}
              >
                {statusLabel}
              </div>
            </div>
          </div>
        </Card>

        {/* Balance Card */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="text-base font-semibold">Saldo</h3>
                  <p className="text-sm text-muted-foreground">
                    Detalhes do valor e utilização do credito
                  </p>
                </div>
              </div>
              <div className="border-b border-border" />
            </div>

            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    Valor Original
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(credit.amount)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    Saldo Disponivel
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(credit.balance)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    Valor Utilizado
                  </p>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {formatCurrency(usedAmount)}
                  </p>
                </div>
              </div>

              {/* Usage bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{usagePercent}% disponivel</span>
                  <span>
                    {formatCurrency(credit.balance)} /{' '}
                    {formatCurrency(credit.amount)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/[0.06]">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all',
                      usagePercent > 50
                        ? 'bg-emerald-500'
                        : usagePercent > 20
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                    )}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Details Card */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="text-base font-semibold">
                    Informações do Credito
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Detalhes de origem, validade e cliente
                  </p>
                </div>
              </div>
              <div className="border-b border-border" />
            </div>

            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={User}
                  label="Cliente"
                  value={credit.customerName || credit.customerId}
                />
                <InfoRow
                  icon={Wallet}
                  label="Origem"
                  value={STORE_CREDIT_SOURCE_LABELS[credit.source]}
                />
                <InfoRow
                  icon={Calendar}
                  label="Data de Criação"
                  value={formatDate(credit.createdAt)}
                />
                <InfoRow
                  icon={Calendar}
                  label="Data de Expiração"
                  value={
                    credit.expiresAt
                      ? formatDate(credit.expiresAt)
                      : 'Sem expiração'
                  }
                  valueClassName={
                    isExpired ? 'text-rose-600 dark:text-rose-400' : undefined
                  }
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Delete Modal */}
        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir este credito de loja. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
