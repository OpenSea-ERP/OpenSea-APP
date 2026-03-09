'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { InfoField } from '@/components/shared/info-field';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { deductionsService } from '@/services/hr/deductions.service';
import type { Deduction } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MinusCircle,
  NotebookText,
  RefreshCw,
  CheckCircle,
  Trash,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  deductionKeys,
  formatCurrency,
  formatDate,
  getAppliedLabel,
  getAppliedColor,
  formatInstallments,
  DeleteConfirmModal,
  useDeleteDeduction,
} from '../src';

export default function DeductionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const deductionId = params.id as string;

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: deduction, isLoading } = useQuery<Deduction>({
    queryKey: deductionKeys.detail(deductionId),
    queryFn: async () => {
      const response = await deductionsService.get(deductionId);
      return response.deduction;
    },
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const deleteMutation = useDeleteDeduction({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deductionKeys.all });
      toast.success('Dedução excluída com sucesso!');
      router.push('/hr/deductions');
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = async () => {
    if (!deduction) return;
    await deleteMutation.mutateAsync(deduction.id);
    setShowDeleteModal(false);
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Deduções', href: '/hr/deductions' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // NOT FOUND STATE
  // ============================================================================

  if (!deduction) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Deduções', href: '/hr/deductions' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl mx-auto mb-4 bg-linear-to-br from-red-500 to-red-600">
              <MinusCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              Dedução não encontrada
            </h2>
            <p className="text-muted-foreground mb-4">
              A dedução solicitada não existe ou foi removida.
            </p>
            <button
              onClick={() => router.push('/hr/deductions')}
              className="text-primary hover:underline font-medium"
            >
              Voltar para Deduções
            </button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const installmentsText = formatInstallments(deduction);
  const progressPercent =
    deduction.isRecurring &&
    deduction.installments &&
    deduction.currentInstallment
      ? Math.round(
          (deduction.currentInstallment / deduction.installments) * 100
        )
      : 0;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Deduções', href: '/hr/deductions' },
            { label: deduction.name },
          ]}
          buttons={[
            {
              id: 'delete',
              title: 'Excluir',
              icon: Trash,
              onClick: () => setShowDeleteModal(true),
              variant: 'outline',
              disabled: deleteMutation.isPending,
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-red-500 to-red-600">
              <MinusCircle className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  {deduction.name}
                </h1>
                <Badge variant={getAppliedColor(deduction)}>
                  {getAppliedLabel(deduction)}
                </Badge>
                {deduction.isRecurring && (
                  <Badge variant="outline" className="gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Recorrente
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatCurrency(deduction.amount)}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {deduction.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-red-500" />
                  <span>{formatDate(deduction.createdAt)}</span>
                </div>
              )}
              {deduction.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>{formatDate(deduction.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados da Dedução */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <NotebookText className="h-5 w-5" />
            Dados da Dedução
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField
              label="Nome"
              value={deduction.name}
              showCopyButton
              copyTooltip="Copiar nome"
            />
            <InfoField
              label="Valor"
              value={formatCurrency(deduction.amount)}
              badge={
                <Badge variant="destructive" className="gap-1">
                  {formatCurrency(deduction.amount)}
                </Badge>
              }
            />
            <InfoField
              label="Data"
              value={formatDate(deduction.date)}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <InfoField
              label="Funcionário"
              value={deduction.employeeId}
              showCopyButton
              copyTooltip="Copiar ID do funcionário"
            />
            <InfoField
              label="Motivo"
              value={deduction.reason}
              showCopyButton
              copyTooltip="Copiar motivo"
            />
          </div>
        </Card>

        {/* Recorrência (only if recurring) */}
        {deduction.isRecurring && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <RefreshCw className="h-5 w-5" />
              Recorrência
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <InfoField
                label="Total de Parcelas"
                value={
                  deduction.installments
                    ? String(deduction.installments)
                    : '-'
                }
              />
              <InfoField
                label="Parcela Atual"
                value={
                  deduction.currentInstallment
                    ? String(deduction.currentInstallment)
                    : '-'
                }
              />
              <InfoField
                label="Progresso"
                value={installmentsText ?? '-'}
              />
            </div>
            {deduction.installments && deduction.currentInstallment && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Progresso das parcelas</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-linear-to-r from-red-500 to-red-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Aplicação (only if applied) */}
        {deduction.isApplied && deduction.appliedAt && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <CheckCircle className="h-5 w-5" />
              Aplicação
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <InfoField
                label="Data de Aplicação"
                value={formatDate(deduction.appliedAt)}
              />
            </div>
          </Card>
        )}

        {/* Metadados */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Clock className="h-5 w-5" />
            Metadados
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Criado em"
              value={formatDate(deduction.createdAt)}
            />
            <InfoField
              label="Atualizado em"
              value={formatDate(deduction.updatedAt)}
            />
          </div>
        </Card>
      </PageBody>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageLayout>
  );
}
