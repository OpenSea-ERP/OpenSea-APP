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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import type { Bonus } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  FileText,
  NotebookText,
  PlusCircle,
  Trash,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  bonusesApi,
  bonusKeys,
  formatCurrency,
  formatDate,
  getPaidLabel,
  getPaidColor,
  useDeleteBonus,
  DeleteConfirmModal,
} from '../src';

export default function BonusDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bonusId = params.id as string;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: bonus, isLoading } = useQuery<Bonus>({
    queryKey: bonusKeys.detail(bonusId),
    queryFn: () => bonusesApi.get(bonusId),
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const deleteMutation = useDeleteBonus({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bonusKeys.lists() });
      router.push('/hr/bonuses');
    },
  });

  const { getName } = useEmployeeMap(bonus ? [bonus.employeeId] : []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = async () => {
    if (!bonus) return;
    await deleteMutation.mutateAsync(bonus.id);
    setIsDeleteModalOpen(false);
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
              { label: 'Bonificações', href: '/hr/bonuses' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!bonus) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Bonificações', href: '/hr/bonuses' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <PlusCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Bonificação não encontrada
            </h2>
            <Button onClick={() => router.push('/hr/bonuses')}>
              Voltar para Bonificações
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Bonificações', href: '/hr/bonuses' },
            { label: bonus.name },
          ]}
          buttons={[
            {
              id: 'delete',
              title: 'Excluir',
              icon: Trash,
              onClick: () => setIsDeleteModalOpen(true),
              variant: 'outline',
              disabled: deleteMutation.isPending,
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-lime-500 to-lime-600">
              <PlusCircle className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {bonus.name}
                </h1>
                <Badge variant={getPaidColor(bonus)}>
                  {getPaidLabel(bonus)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatCurrency(bonus.amount)}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {bonus.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-lime-500" />
                  <span>{formatDate(bonus.createdAt)}</span>
                </div>
              )}
              {bonus.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>{formatDate(bonus.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados da Bonificação */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <NotebookText className="h-5 w-5" />
            Dados da Bonificação
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Nome"
              value={bonus.name}
              showCopyButton
              copyTooltip="Copiar nome"
            />
            <InfoField
              label="Valor"
              value={formatCurrency(bonus.amount)}
              className="text-green-600 dark:text-green-400"
              showCopyButton
              copyTooltip="Copiar valor"
            />
            <InfoField label="Data" value={formatDate(bonus.date)} />
            <InfoField
              label="Funcionário"
              value={getName(bonus.employeeId)}
              showCopyButton
              copyTooltip="Copiar nome do funcionário"
            />
          </div>
        </Card>

        {/* Motivo */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <FileText className="h-5 w-5" />
            Motivo
          </h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {bonus.reason}
          </p>
        </Card>

        {/* Metadados */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Clock className="h-5 w-5" />
            Metadados
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField label="Criado em" value={formatDate(bonus.createdAt)} />
            <InfoField
              label="Atualizado em"
              value={formatDate(bonus.updatedAt)}
            />
          </div>
        </Card>
      </PageBody>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageLayout>
  );
}
