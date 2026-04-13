/**
 * Cost Center Detail Page
 * Follows pattern: PageLayout > PageActionBar > Identity Card > Content Cards
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { InfoField } from '@/components/shared/info-field';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useCostCenter, useDeleteCostCenter } from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import {
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  GitBranch,
  Target,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// =============================================================================
// PAGE
// =============================================================================

export default function CostCenterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useCostCenter(id);
  const costCenter = data?.costCenter;
  const deleteMutation = useDeleteCostCenter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(FINANCE_PERMISSIONS.COST_CENTERS.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.COST_CENTERS.REMOVE);

  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'Financeiro', href: '/finance' },
    { label: 'Centros de Custo', href: '/finance/cost-centers' },
    ...(costCenter ? [{ label: costCenter.name }] : []),
  ];

  // ============================================================================
  // LOADING
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Centros de Custo', href: '/finance/cost-centers' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-6">
            <div className="flex gap-6 items-center">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // NOT FOUND
  // ============================================================================

  if (!costCenter) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Centros de Custo', href: '/finance/cost-centers' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Centro de custo não encontrado
            </h2>
            <p className="text-muted-foreground mb-6">
              O centro de custo que você está procurando não existe ou foi
              removido.
            </p>
            <Button onClick={() => router.push('/finance/cost-centers')}>
              Voltar para Centros de Custo
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Centro de custo excluído com sucesso.');
      router.push('/finance/cost-centers');
    } catch {
      toast.error('Erro ao excluir centro de custo.');
    }
  };

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
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    ...(canEdit
      ? [
          {
            id: 'edit',
            title: 'Editar',
            icon: Edit,
            onClick: () => router.push(`/finance/cost-centers/${id}/edit`),
            variant: 'default' as const,
          },
        ]
      : []),
  ];

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
        <Card className="bg-white/5 p-5" data-testid="cost-center-identity">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-emerald-600 shadow-lg">
              <Target className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className="text-2xl font-bold tracking-tight"
                  data-testid="cost-center-name"
                >
                  {costCenter.name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    costCenter.isActive
                      ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300'
                  )}
                >
                  {costCenter.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 font-mono">
                Código: {costCenter.code}
              </p>
            </div>
            <div className="hidden sm:flex flex-col gap-2 shrink-0 text-sm">
              {costCenter.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>
                    {new Date(costCenter.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {costCenter.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(costCenter.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* General Info */}
        <Card
          className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
          data-testid="cost-center-info"
        >
          <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
            <Target className="h-5 w-5" />
            Informações Gerais
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField
              label="Nome"
              value={costCenter.name}
              showCopyButton
              copyTooltip="Copiar Nome"
            />
            <InfoField
              label="Código"
              value={costCenter.code}
              showCopyButton
              copyTooltip="Copiar Código"
            />
            <InfoField
              label="Status"
              value={costCenter.isActive ? 'Ativo' : 'Inativo'}
            />
            {costCenter.companyName && (
              <InfoField
                label="Empresa Vinculada"
                value={costCenter.companyName}
                icon={<Building2 className="h-4 w-4 text-violet-500" />}
              />
            )}
            {costCenter.parentName && (
              <InfoField
                label="Centro de Custo Pai"
                value={costCenter.parentName}
                icon={<GitBranch className="h-4 w-4 text-sky-500" />}
              />
            )}
            {costCenter.description && (
              <InfoField
                label="Descrição"
                value={costCenter.description}
                className="md:col-span-3"
              />
            )}
          </div>
        </Card>

        {/* Budget */}
        <Card
          className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
          data-testid="cost-center-budget"
        >
          <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5" />
            Orçamento
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Orçamento Mensal
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(costCenter.monthlyBudget)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Orçamento Anual
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(costCenter.annualBudget)}
              </p>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Confirmation */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Centro de Custo"
        description={`Digite seu PIN de Ação para confirmar a exclusão do centro de custo "${costCenter.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
