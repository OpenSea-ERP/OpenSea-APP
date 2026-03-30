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
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { usePermissions } from '@/hooks/use-permissions';
import { warningsService } from '@/services/hr/warnings.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  CircleCheck,
  FileText,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useDeleteWarning,
  useAcknowledgeWarning,
  warningKeys,
} from '../src/api';
import {
  getWarningTypeLabel,
  getWarningSeverityLabel,
  getWarningStatusLabel,
  getWarningTypeColor,
  getWarningSeverityColor,
  getWarningStatusColor,
  getWarningTypeBadgeClass,
  getWarningSeverityBadgeClass,
  getWarningStatusBadgeClass,
} from '../src/utils';
import { HR_PERMISSIONS } from '../../../_shared/constants/hr-permissions';
import dynamic from 'next/dynamic';

const RevokeWarningModal = dynamic(
  () =>
    import('../src/modals/revoke-warning-modal').then(m => ({
      default: m.RevokeWarningModal,
    })),
  { ssr: false }
);

function formatDate(dateStr?: string | null): string {
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

  const [showDeletePin, setShowDeletePin] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const deleteWarning = useDeleteWarning();
  const acknowledgeWarning = useAcknowledgeWarning();

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

  const employeeIds = useMemo(
    () => (warning ? [warning.employeeId, warning.issuedBy] : []),
    [warning]
  );
  const { getName } = useEmployeeMap(employeeIds);

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

  if (isLoading) {
    return (
      <PageLayout>
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
      <PageLayout>
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

  const isActive = warning.status === 'ACTIVE';

  return (
    <PageLayout>
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
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-amber-600 text-white shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">
                {getWarningTypeLabel(warning.type)}
              </h2>
              <p className="text-sm text-muted-foreground">
                Registrada em {formatDate(warning.createdAt)}
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
                  {getWarningSeverityLabel(warning.severity)}
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

        {/* Details */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="divide-y">
            {/* People */}
            <div className="px-5 py-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Pessoas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Funcionário</p>
                    <p className="text-sm font-medium">
                      {getName(warning.employeeId)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Emitido por</p>
                    <p className="text-sm font-medium">
                      {getName(warning.issuedBy)}
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
              </div>
            </div>

            {/* Incident */}
            <div className="px-5 py-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Detalhes do Incidente
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Data do Incidente
                    </p>
                    <p className="text-sm font-medium">
                      {formatShortDate(warning.incidentDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Motivo</p>
                    <p className="text-sm">{warning.reason}</p>
                  </div>
                </div>
                {warning.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Descrição</p>
                      <p className="text-sm whitespace-pre-wrap">
                        {warning.description}
                      </p>
                    </div>
                  </div>
                )}
                {warning.suspensionDays && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Dias de Suspensão
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

            {/* Acknowledgement */}
            <div className="px-5 py-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Reconhecimento
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
                        Em {formatDate(warning.acknowledgedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ) : isActive ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Advertência ainda não reconhecida pelo funcionário
                    </p>
                  </div>
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
                    Reconhecer
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Advertência não reconhecida
                </p>
              )}
            </div>

            {/* Revocation (if revoked) */}
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
                      Revogada em {formatDate(warning.revokedAt)}
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

        <RevokeWarningModal
          isOpen={showRevokeModal}
          onClose={() => setShowRevokeModal(false)}
          warningId={warningId}
        />

        <VerifyActionPinModal
          isOpen={showDeletePin}
          onClose={() => setShowDeletePin(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir esta advertência."
        />
      </PageBody>
    </PageLayout>
  );
}
