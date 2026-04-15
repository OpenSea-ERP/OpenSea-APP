'use client';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
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
import { usePermissions } from '@/hooks/use-permissions';
import type { Absence } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  Ban,
  Calendar,
  Check,
  Clock,
  FileText,
  Heart,
  NotebookText,
  ShieldCheck,
  ShieldX,
  UserX,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  absencesApi,
  getStatusColor,
  getStatusLabel,
  getTypeColor,
  getTypeLabel,
  RejectModal,
  useApproveAbsence,
  useCancelAbsence,
} from '../src';
import { HR_PERMISSIONS } from '../../../_shared/constants/hr-permissions';

export default function AbsenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const absenceId = params.id as string;
  const { hasPermission } = usePermissions();

  const canManage = hasPermission(HR_PERMISSIONS.ABSENCES.MANAGE);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: absence, isLoading } = useQuery<Absence>({
    queryKey: ['absences', absenceId],
    queryFn: async () => {
      const response = await absencesApi.get(absenceId);
      return response.absence;
    },
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const approveAbsence = useApproveAbsence();
  const cancelAbsence = useCancelAbsence();

  const { getName } = useEmployeeMap(
    absence
      ? [
          absence.employeeId,
          ...(absence.approvedBy ? [absence.approvedBy] : []),
        ]
      : []
  );

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout data-testid="absences-detail-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Ausências', href: '/hr/absences' },
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

  if (!absence) {
    return (
      <PageLayout data-testid="absences-detail-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Ausências', href: '/hr/absences' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <UserX className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Ausência não encontrada
            </h2>
            <Button onClick={() => router.push('/hr/absences')}>
              Voltar para Ausências
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const isPending = absence.status === 'PENDING';
  const isApproved = absence.status === 'APPROVED';
  const isRejected = absence.status === 'REJECTED';
  const isSickLeave = absence.type === 'SICK_LEAVE';

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR');

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('pt-BR');

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="absences-detail-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Ausências', href: '/hr/absences' },
            { label: getTypeLabel(absence.type) },
          ]}
          buttons={
            isPending && canManage
              ? [
                  {
                    id: 'approve',
                    title: approveAbsence.isPending
                      ? 'Aprovando...'
                      : 'Aprovar',
                    icon: Check,
                    onClick: () => approveAbsence.mutate(absenceId),
                    className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                    disabled: approveAbsence.isPending,
                  },
                  {
                    id: 'reject',
                    title: 'Rejeitar',
                    icon: XCircle,
                    onClick: () => setRejectModalOpen(true),
                    variant: 'destructive',
                  },
                  {
                    id: 'cancel',
                    title: cancelAbsence.isPending
                      ? 'Cancelando...'
                      : 'Cancelar',
                    icon: Ban,
                    onClick: () => setIsCancelDialogOpen(true),
                    variant: 'outline',
                    disabled: cancelAbsence.isPending,
                  },
                ]
              : []
          }
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-rose-500 to-rose-600">
              <UserX className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  {getTypeLabel(absence.type)}
                </h1>
                <Badge className={getStatusColor(absence.status)}>
                  {getStatusLabel(absence.status)}
                </Badge>
                <Badge className={getTypeColor(absence.type)}>
                  {getTypeLabel(absence.type)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getName(absence.employeeId)} · {formatDate(absence.startDate)}{' '}
                — {formatDate(absence.endDate)}
                {' · '}
                {absence.totalDays} {absence.totalDays === 1 ? 'dia' : 'dias'}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {absence.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-rose-500" />
                  <span>{formatDate(absence.createdAt)}</span>
                </div>
              )}
              {absence.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>{formatDate(absence.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados da Ausência */}
        <Card className="bg-white/5 border border-border overflow-hidden py-0">
          <div className="px-4 pt-4 pb-2 border-b border-border flex items-center gap-3">
            <NotebookText className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-base font-semibold">Dados da Ausência</h3>
              <p className="text-sm text-muted-foreground">
                Informações principais do afastamento
              </p>
            </div>
          </div>
          <div className="p-4 grid md:grid-cols-3 gap-6">
            <InfoField
              label="Tipo"
              value={getTypeLabel(absence.type)}
              badge={
                <Badge className={getTypeColor(absence.type)}>
                  {getTypeLabel(absence.type)}
                </Badge>
              }
            />
            <InfoField
              label="Status"
              value={getStatusLabel(absence.status)}
              badge={
                <Badge className={getStatusColor(absence.status)}>
                  {getStatusLabel(absence.status)}
                </Badge>
              }
            />
            <InfoField
              label="Funcionário"
              value={getName(absence.employeeId)}
              showCopyButton
              copyTooltip="Copiar nome do funcionário"
            />
            <InfoField
              label="Data de Início"
              value={formatDate(absence.startDate)}
            />
            <InfoField
              label="Data de Término"
              value={formatDate(absence.endDate)}
            />
            <InfoField
              label="Total de Dias"
              value={`${absence.totalDays} ${absence.totalDays === 1 ? 'dia' : 'dias'}`}
            />
          </div>
        </Card>

        {/* Motivo */}
        {absence.reason && (
          <Card className="bg-white/5 border border-border overflow-hidden py-0">
            <div className="px-4 pt-4 pb-2 border-b border-border flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-base font-semibold">Motivo</h3>
                <p className="text-sm text-muted-foreground">
                  Justificativa do afastamento
                </p>
              </div>
            </div>
            <div className="p-4">
              <InfoField
                label="Justificativa"
                value={absence.reason}
                showCopyButton
                copyTooltip="Copiar motivo"
              />
            </div>
          </Card>
        )}

        {/* Dados Médicos (apenas para atestado médico) */}
        {isSickLeave && (
          <Card className="bg-white/5 border border-border overflow-hidden py-0">
            <div className="px-4 pt-4 pb-2 border-b border-border flex items-center gap-3">
              <Heart className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-base font-semibold">Dados Médicos</h3>
                <p className="text-sm text-muted-foreground">
                  Informações do atestado médico
                </p>
              </div>
            </div>
            <div className="p-4 grid md:grid-cols-2 gap-6">
              <InfoField
                label="CID"
                value={absence.cid}
                showCopyButton
                copyTooltip="Copiar CID"
              />
              <InfoField
                label="Documento / Atestado"
                value={absence.documentUrl}
                showCopyButton
                copyTooltip="Copiar URL do documento"
              />
            </div>
          </Card>
        )}

        {/* Aprovação */}
        {isApproved && (
          <Card className="bg-white/5 border border-border overflow-hidden py-0">
            <div className="px-4 pt-4 pb-2 border-b border-border flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <div>
                <h3 className="text-base font-semibold">Aprovação</h3>
                <p className="text-sm text-muted-foreground">
                  Detalhes da aprovação
                </p>
              </div>
            </div>
            <div className="p-4 grid md:grid-cols-2 gap-6">
              <InfoField
                label="Aprovado por"
                value={absence.approvedBy ? getName(absence.approvedBy) : null}
                showCopyButton
                copyTooltip="Copiar nome do funcionário"
              />
              <InfoField
                label="Aprovado em"
                value={
                  absence.approvedAt ? formatDateTime(absence.approvedAt) : null
                }
              />
            </div>
          </Card>
        )}

        {/* Rejeição */}
        {isRejected && (
          <Card className="bg-white/5 border border-border overflow-hidden py-0">
            <div className="px-4 pt-4 pb-2 border-b border-border flex items-center gap-3">
              <ShieldX className="h-5 w-5 text-rose-500" />
              <div>
                <h3 className="text-base font-semibold">Rejeição</h3>
                <p className="text-sm text-muted-foreground">
                  Motivo da rejeição do afastamento
                </p>
              </div>
            </div>
            {absence.rejectionReason && (
              <div className="p-4">
                <InfoField
                  label="Motivo da Rejeição"
                  value={absence.rejectionReason}
                  showCopyButton
                  copyTooltip="Copiar motivo da rejeição"
                />
              </div>
            )}
          </Card>
        )}
      </PageBody>

      {/* Reject Modal */}
      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        absenceId={absenceId}
      />

      <VerifyActionPinModal
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onSuccess={() => cancelAbsence.mutate(absenceId)}
        title="Cancelar Afastamento"
        description="Digite seu PIN de ação para cancelar este afastamento. Esta ação não pode ser desfeita."
      />
    </PageLayout>
  );
}
