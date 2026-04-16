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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmployeeWarningHistory } from '@/components/hr/employee-warning-history';
import { WarningEscalationStepper } from '@/components/hr/warning-escalation-stepper';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { usePermissions } from '@/hooks/use-permissions';
import {
  getEscalationHint,
  getEscalationStepLabel,
  getNextWarningType,
} from '@/lib/hr/warning-escalation';
import { warningsService } from '@/services/hr/warnings.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  CircleCheck,
  Download,
  FileText,
  Loader2,
  Paperclip,
  RotateCcw,
  ShieldAlert,
  Trash2,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import {
  useAcknowledgeWarning,
  useDeleteWarning,
  warningKeys,
} from '../src/api';
import {
  getWarningSeverityBadgeClass,
  getWarningSeverityLabel,
  getWarningStatusBadgeClass,
  getWarningStatusLabel,
  getWarningTypeBadgeClass,
  getWarningTypeLabel,
} from '../src/utils';
import { HR_PERMISSIONS } from '../../../_shared/constants/hr-permissions';

const RevokeWarningModal = dynamic(
  () =>
    import('../src/modals/revoke-warning-modal').then(m => ({
      default: m.RevokeWarningModal,
    })),
  { ssr: false }
);

const CreateWarningModal = dynamic(
  () =>
    import('../src/modals/create-warning-modal').then(m => ({
      default: m.CreateWarningModal,
    })),
  { ssr: false }
);

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function WarningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const warningId = params.id as string;
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const canDelete = hasPermission(HR_PERMISSIONS.WARNINGS.DELETE);
  const canManage = hasPermission(HR_PERMISSIONS.WARNINGS.MANAGE);
  const canEscalate = hasPermission(HR_PERMISSIONS.WARNINGS.UPDATE);
  const canCreate = hasPermission(HR_PERMISSIONS.WARNINGS.CREATE);

  const [showDeletePin, setShowDeletePin] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showEscalatePin, setShowEscalatePin] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  const deleteWarning = useDeleteWarning();
  const acknowledgeWarning = useAcknowledgeWarning();

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  const {
    data: warningData,
    isLoading,
    error,
  } = useQuery({
    queryKey: warningKeys.detail(warningId),
    queryFn: () => warningsService.get(warningId),
    enabled: !!warningId,
  });

  const warning = warningData?.warning;

  const { data: employeeWarningsData } = useQuery({
    queryKey: ['hr', 'warnings', 'by-employee', warning?.employeeId ?? null],
    queryFn: () =>
      warning
        ? warningsService.list({ employeeId: warning.employeeId, perPage: 100 })
        : Promise.resolve({
            warnings: [],
            meta: { total: 0, page: 1, perPage: 100, totalPages: 0 },
          }),
    enabled: !!warning?.employeeId,
  });

  const allEmployeeWarnings = useMemo(
    () => employeeWarningsData?.warnings ?? [],
    [employeeWarningsData]
  );

  // Histórico estritamente anterior à advertência atual (cronologia limpa).
  const previousWarnings = useMemo(() => {
    if (!warning) return [];
    return allEmployeeWarnings.filter(
      historicalWarning =>
        historicalWarning.id !== warning.id &&
        historicalWarning.incidentDate <= warning.incidentDate
    );
  }, [allEmployeeWarnings, warning]);

  const employeeIds = useMemo(
    () => (warning ? [warning.employeeId, warning.issuedBy] : []),
    [warning]
  );
  const { getName } = useEmployeeMap(employeeIds);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  const handleDeleteConfirm = () => {
    deleteWarning.mutate(warningId, {
      onSuccess: () => {
        router.push('/hr/warnings');
      },
    });
    setShowDeletePin(false);
  };

  const handleAcknowledge = () => {
    acknowledgeWarning.mutate(warningId, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: warningKeys.detail(warningId),
        });
      },
    });
  };

  const handleEscalateConfirmed = () => {
    setShowEscalatePin(false);
    setShowEscalateModal(true);
  };

  // ===========================================================================
  // LOADING / ERROR STATES
  // ===========================================================================

  if (isLoading) {
    return (
      <PageLayout data-testid="warnings-detail-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Advertências', href: '/hr/warnings' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" gap="gap-4" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !warning) {
    return (
      <PageLayout data-testid="warnings-detail-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Advertências', href: '/hr/warnings' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Advertência não encontrada"
            message="A advertência solicitada não foi encontrada."
            action={{
              label: 'Voltar',
              onClick: () => router.push('/hr/warnings'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  const isActive = warning.status === 'ACTIVE';
  const nextEscalationType = getNextWarningType(warning.type);
  const escalationHint = getEscalationHint(warning.type);
  const canShowEscalateAction = isActive && canEscalate && canCreate;

  return (
    <PageLayout data-testid="warnings-detail-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Advertências', href: '/hr/warnings' },
            { label: getWarningTypeLabel(warning.type) },
          ]}
          buttons={[
            ...(canManage && isActive
              ? [
                  {
                    id: 'revoke-warning',
                    title: 'Revogar',
                    icon: RotateCcw,
                    onClick: () => setShowRevokeModal(true),
                    variant: 'outline' as const,
                  },
                ]
              : []),
            ...(canDelete
              ? [
                  {
                    id: 'delete-warning',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setShowDeletePin(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* ================================================================= */}
        {/* IDENTITY CARD                                                       */}
        {/* ================================================================= */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-amber-600 text-white shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">
                {getName(warning.employeeId) || 'Funcionário'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Advertência {getEscalationStepLabel(warning.type).toLowerCase()}{' '}
                emitida em {formatDateTime(warning.createdAt)}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={getWarningTypeBadgeClass(warning.type)}
                >
                  {getWarningTypeLabel(warning.type)}
                </Badge>
                <Badge
                  variant="outline"
                  className={getWarningSeverityBadgeClass(warning.severity)}
                >
                  Gravidade {getWarningSeverityLabel(warning.severity)}
                </Badge>
                <Badge
                  variant="outline"
                  className={getWarningStatusBadgeClass(warning.status)}
                >
                  {getWarningStatusLabel(warning.status)}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* ================================================================= */}
        {/* ESCALATION STEPPER                                                  */}
        {/* ================================================================= */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">
                Escala disciplinar progressiva
              </h3>
              <p className="text-xs text-muted-foreground">
                Visualize em qual estágio o colaborador se encontra e qual é o
                próximo passo previsto pela CLT.
              </p>
            </div>
          </div>
          <WarningEscalationStepper
            currentType={warning.type}
            previousWarnings={previousWarnings}
          />
        </Card>

        {/* ================================================================= */}
        {/* TWO-COLUMN LAYOUT: details/actions (left) + history (right)        */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* ---------------------------------------------------------------
              CURRENT WARNING DETAILS
            --------------------------------------------------------------- */}
            <Card
              className="bg-white dark:bg-slate-800/60 border border-border py-2 overflow-hidden"
              data-testid="warning-current-details"
            >
              <div className="divide-y">
                <div className="px-5 py-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Detalhes da advertência atual
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Funcionário
                        </p>
                        <p className="text-sm font-medium">
                          {getName(warning.employeeId)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Emitida por
                        </p>
                        <p className="text-sm font-medium">
                          {getName(warning.issuedBy)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Data do incidente
                        </p>
                        <p className="text-sm font-medium">
                          {formatShortDate(warning.incidentDate)}
                        </p>
                      </div>
                    </div>
                    {warning.witnessName && (
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Testemunha
                          </p>
                          <p className="text-sm font-medium">
                            {warning.witnessName}
                          </p>
                        </div>
                      </div>
                    )}
                    {warning.suspensionDays && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Dias de suspensão
                          </p>
                          <p className="text-sm font-medium">
                            {warning.suspensionDays}{' '}
                            {warning.suspensionDays === 1 ? 'dia' : 'dias'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 py-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Motivo registrado
                  </h3>
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">
                        {warning.reason}
                      </p>
                      {warning.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">
                          {warning.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {warning.attachmentUrl && (
                  <div className="px-5 py-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Documento anexado
                    </h3>
                    <a
                      href={warning.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-800/40 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                      data-testid="warning-attachment-download"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span>Baixar documento</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                )}

                <div className="px-5 py-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Reconhecimento do colaborador
                  </h3>
                  {warning.employeeAcknowledged ? (
                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                      <CircleCheck className="h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium">
                          Advertência reconhecida
                        </p>
                        {warning.acknowledgedAt && (
                          <p className="text-xs text-muted-foreground">
                            Em {formatDateTime(warning.acknowledgedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : isActive ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Aguardando assinatura do funcionário.
                        </p>
                      </div>
                      {canManage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAcknowledge}
                          disabled={acknowledgeWarning.isPending}
                          className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                        >
                          {acknowledgeWarning.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Registrar reconhecimento
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Advertência encerrada sem reconhecimento.
                    </p>
                  )}
                </div>

                {warning.status === 'REVOKED' && (
                  <div className="px-5 py-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Revogação
                    </h3>
                    <div className="space-y-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/8 border border-rose-200 dark:border-rose-500/20">
                      <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                        Advertência revogada
                      </p>
                      {warning.revokedAt && (
                        <p className="text-xs text-rose-600 dark:text-rose-400">
                          Revogada em {formatDateTime(warning.revokedAt)}
                        </p>
                      )}
                      {warning.revokeReason && (
                        <p className="text-sm text-rose-600 dark:text-rose-400">
                          Motivo: {warning.revokeReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* ---------------------------------------------------------------
              SUGGESTED NEXT ACTIONS
            --------------------------------------------------------------- */}
            <Card
              data-testid="warning-suggested-actions"
              className="bg-rose-50 dark:bg-rose-500/8 border border-rose-200 dark:border-rose-500/20 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-rose-500 to-rose-600 text-white shrink-0">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                    Próximas ações sugeridas
                  </h3>
                  <p className="mt-1 text-sm text-rose-800 dark:text-rose-200">
                    {escalationHint}
                  </p>
                  {nextEscalationType && (
                    <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                      Próximo passo da escala:{' '}
                      <span className="font-semibold">
                        {getEscalationStepLabel(nextEscalationType)}
                      </span>
                    </p>
                  )}
                  {canShowEscalateAction && nextEscalationType && (
                    <div className="mt-4">
                      <Button
                        size="sm"
                        onClick={() => setShowEscalatePin(true)}
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                        data-testid="warning-apply-next"
                      >
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        Aplicar próxima advertência (
                        {getEscalationStepLabel(nextEscalationType)})
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* ---------------------------------------------------------------
            SIDEBAR: EMPLOYEE WARNING HISTORY
          --------------------------------------------------------------- */}
          <aside className="lg:col-span-1">
            <EmployeeWarningHistory
              warnings={allEmployeeWarnings}
              currentWarningId={warning.id}
            />
          </aside>
        </div>

        {/* ================================================================= */}
        {/* MODALS                                                              */}
        {/* ================================================================= */}
        <RevokeWarningModal
          isOpen={showRevokeModal}
          onClose={() => setShowRevokeModal(false)}
          warningId={warningId}
        />

        <VerifyActionPinModal
          isOpen={showDeletePin}
          onClose={() => setShowDeletePin(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar exclusão"
          description="Digite seu PIN de ação para excluir esta advertência."
        />

        <VerifyActionPinModal
          isOpen={showEscalatePin}
          onClose={() => setShowEscalatePin(false)}
          onSuccess={handleEscalateConfirmed}
          title="Confirmar escalada disciplinar"
          description="Esta ação registrará uma nova advertência com efeitos jurídicos previstos na CLT. Digite seu PIN de ação para prosseguir."
        />

        <CreateWarningModal
          isOpen={showEscalateModal}
          onClose={() => setShowEscalateModal(false)}
          defaultEmployeeId={warning.employeeId}
          defaultType={nextEscalationType ?? undefined}
        />
      </PageBody>
    </PageLayout>
  );
}
