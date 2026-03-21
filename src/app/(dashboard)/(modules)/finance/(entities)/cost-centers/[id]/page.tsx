/**
 * Cost Center Detail Page
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PermissionCodes from '@/config/rbac/permission-codes';
import { useCostCenter, useDeleteCostCenter } from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { ArrowLeft, Building2, Edit, Trash } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { toast } from 'sonner';

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
  const canDelete = hasPermission(PermissionCodes.FINANCE.COST_CENTERS.REMOVE);

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
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
            </div>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

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
          <Card className="p-12 text-center">
            <p className="text-destructive text-lg">
              Centro de custo não encontrado.
            </p>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync(id);
    toast.success('Centro de custo excluído com sucesso.');
    router.push('/finance/cost-centers');
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/cost-centers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar para centros de custo
            </Button>
          </Link>
        </div>

        <div className="flex gap-2">
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="gap-2"
            >
              <Trash className="h-4 w-4 text-rose-600" />
              Excluir
            </Button>
          )}

          <Link href={`/finance/cost-centers/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4 text-sky-500" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Cost Center Info Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex gap-4 sm:flex-row items-center sm:gap-6">
          <div className="flex items-center justify-center h-10 w-10 md:h-16 md:w-16 rounded-lg bg-linear-to-br from-purple-500 to-pink-600 shrink-0">
            <Building2 className="md:h-8 md:w-8 text-white" />
          </div>
          <div className="flex justify-between flex-1 gap-4 flex-row items-center">
            <div>
              <h1 className="text-lg sm:text-3xl font-bold tracking-tight">
                {costCenter.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Código: {costCenter.code}
              </p>
            </div>
            <div>
              <Badge variant={costCenter.isActive ? 'success' : 'secondary'}>
                {costCenter.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Card */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Informações Gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Código</p>
            <p className="font-medium">{costCenter.code}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Nome</p>
            <p className="font-medium">{costCenter.name}</p>
          </div>
          {costCenter.companyName && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Empresa</p>
              <p className="font-medium">{costCenter.companyName}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <Badge variant={costCenter.isActive ? 'success' : 'secondary'}>
              {costCenter.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>

        {costCenter.description && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-1">Descrição</p>
            <p className="font-medium">{costCenter.description}</p>
          </div>
        )}
      </Card>

      {/* Budget Card */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Orçamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Orçamento Mensal
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(costCenter.monthlyBudget)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Orçamento Anual
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(costCenter.annualBudget)}
            </p>
          </div>
        </div>
      </Card>

      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Centro de Custo"
        description={`Digite seu PIN de ação para excluir "${costCenter.name}".`}
      />
    </div>
  );
}
