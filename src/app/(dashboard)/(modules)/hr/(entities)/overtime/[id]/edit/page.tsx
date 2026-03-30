'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { overtimeService } from '@/services/hr/overtime.service';
import type { Overtime } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import { Coffee, Save, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  overtimeKeys,
  formatDate,
  formatHours,
  getApprovalLabel,
  getApprovalColor,
  useUpdateOvertime,
  useDeleteOvertime,
} from '../../src';
import { Badge } from '@/components/ui/badge';

export default function OvertimeEditPage() {
  const router = useRouter();
  const params = useParams();
  const overtimeId = params.id as string;

  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(HR_PERMISSIONS.OVERTIME.DELETE);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data: overtimeData,
    isLoading,
    error,
  } = useQuery<Overtime>({
    queryKey: overtimeKeys.detail(overtimeId),
    queryFn: async () => {
      const response = await overtimeService.get(overtimeId);
      return response.overtime;
    },
  });

  const overtime = overtimeData;

  const { getName } = useEmployeeMap(
    overtime ? [overtime.employeeId] : []
  );

  // ============================================================================
  // FORM STATE
  // ============================================================================

  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (overtime) {
      setDate(overtime.date ? overtime.date.slice(0, 10) : '');
      setHours(String(overtime.hours));
      setReason(overtime.reason ?? '');
    }
  }, [overtime]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateOvertime({
    onSuccess: () => router.push(`/hr/overtime/${overtimeId}`),
  });

  const deleteMutation = useDeleteOvertime({
    onSuccess: () => router.push('/hr/overtime'),
  });

  const handleSave = useCallback(async () => {
    await updateMutation.mutateAsync({
      id: overtimeId,
      data: {
        date: date || undefined,
        hours: hours ? Number(hours) : undefined,
        reason: reason.trim() || undefined,
      },
    });
  }, [date, hours, reason, overtimeId, updateMutation]);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteMutation.mutateAsync(overtimeId);
    setIsDeleteOpen(false);
  }, [deleteMutation, overtimeId]);

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Horas Extras', href: '/hr/overtime' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={1} layout="list" size="lg" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !overtime) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Horas Extras', href: '/hr/overtime' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Hora extra não encontrada"
            message="O registro de hora extra solicitado não foi encontrado."
            action={{
              label: 'Voltar',
              onClick: () => router.push('/hr/overtime'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const isPending = overtime.approved === null;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Horas Extras', href: '/hr/overtime' },
            {
              label: `Hora Extra - ${formatDate(overtime.date)}`,
              href: `/hr/overtime/${overtimeId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={[
            ...(canDelete
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setIsDeleteOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              variant: 'default' as const,
              disabled: updateMutation.isPending,
            },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-orange-600">
              <Coffee className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">
                  Hora Extra - {formatDate(overtime.date)}
                </h2>
                <Badge variant={getApprovalColor(overtime)}>
                  {getApprovalLabel(overtime)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Cadastrado em{' '}
                {new Date(overtime.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="space-y-6 p-5">
            {/* Funcionario (read-only) */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Funcionário
              </h3>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">
                  {getName(overtime.employeeId)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O funcionário não pode ser alterado
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Dados da Hora Extra */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Dados da Hora Extra
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-date">Data *</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      disabled={!isPending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-hours">Horas *</Label>
                    <Input
                      id="edit-hours"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="Ex: 2"
                      disabled={!isPending}
                    />
                    {hours && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatHours(Number(hours))}
                      </p>
                    )}
                  </div>
                </div>

                {!isPending && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-3">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Esta hora extra já foi{' '}
                      {overtime.approved ? 'aprovada' : 'rejeitada'} e não pode
                      ter data e horas alteradas.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Motivo */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Motivo
              </h3>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da hora extra (mínimo 10 caracteres)..."
                rows={4}
              />
            </div>
          </div>
        </Card>

        {/* Delete Modal */}
        <VerifyActionPinModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Excluir Hora Extra"
          description="Digite seu PIN de ação para excluir este registro de hora extra. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
