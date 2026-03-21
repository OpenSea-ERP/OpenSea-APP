/**
 * Cost Center Detail Page
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCostCenter } from '@/hooks/finance';
import { ArrowLeft, Building2, Edit, Trash } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function CostCenterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useCostCenter(id);
  const costCenter = data?.costCenter;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="space-y-4 w-full max-w-2xl">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!costCenter) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Centro de custo não encontrado.</p>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este centro de custo?')) {
      alert('Funcionalidade de exclusão será implementada');
    }
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="gap-2"
          >
            <Trash className="h-4 w-4 text-rose-800" />
            Excluir
          </Button>

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
    </div>
  );
}
