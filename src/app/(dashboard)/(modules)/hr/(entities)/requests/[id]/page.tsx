/**
 * HR Employee Request Detail Page
 * Detalhes da solicitacao do colaborador
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
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { usePermissions } from '@/hooks/use-permissions';
import type { RequestType } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Ban,
  Calendar,
  Check,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  PalmtreeIcon,
  Send,
  UserCog,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  requestKeys,
  requestsApi,
  useApproveRequest,
  useCancelRequest,
} from '../src/api';
import {
  getRequestTypeLabel,
  getRequestStatusLabel,
  getRequestStatusVariant,
  getRequestTypeGradient,
} from '../src/utils';

const RejectModal = dynamic(
  () =>
    import('../src/modals/reject-modal').then((m) => ({
      default: m.RejectModal,
    })),
  { ssr: false }
);

// ============================================================================
// CONSTANTS
// ============================================================================

const REQUEST_TYPE_ICONS: Record<RequestType, LucideIcon> = {
  VACATION: PalmtreeIcon,
  ABSENCE: Calendar,
  ADVANCE: FileText,
  DATA_CHANGE: UserCog,
  SUPPORT: Send,
};

const DATA_FIELD_LABELS: Record<string, string> = {
  startDate: 'Data Início',
  endDate: 'Data Fim',
  description: 'Descrição',
  reason: 'Motivo',
  amount: 'Valor (R$)',
  field: 'Campo',
  newValue: 'Novo Valor',
  subject: 'Assunto',
  message: 'Mensagem',
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const requestId = params.id as string;

  const canApprove = hasPermission(HR_PERMISSIONS.EMPLOYEE_REQUESTS.APPROVE);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelPin, setShowCancelPin] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: requestData,
    isLoading,
    error,
  } = useQuery({
    queryKey: requestKeys.detail(requestId),
    queryFn: async () => {
      const response = await requestsApi.get(requestId);
      return response.employeeRequest;
    },
    enabled: !!requestId,
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const approveRequest = useApproveRequest({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: requestKeys.detail(requestId),
      });
    },
  });

  const cancelRequest = useCancelRequest({
    onSuccess: () => {
      router.push('/hr/requests');
    },
  });

  const handleApprove = useCallback(() => {
    approveRequest.mutate(requestId);
  }, [approveRequest, requestId]);

  const handleCancelConfirm = useCallback(() => {
    cancelRequest.mutate(requestId);
    setShowCancelPin(false);
  }, [cancelRequest, requestId]);

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
              { label: 'Solicitações', href: '/hr/requests' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !requestData) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Solicitações', href: '/hr/requests' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Solicitação não encontrada
            </h2>
            <Button onClick={() => router.push('/hr/requests')}>
              Voltar para Solicitações
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const request = requestData;
  const typeLabel = getRequestTypeLabel(request.type);
  const statusLabel = getRequestStatusLabel(request.status);
  const statusVariant = getRequestStatusVariant(request.status);
  const TypeIcon = REQUEST_TYPE_ICONS[request.type];
  const gradient = getRequestTypeGradient(request.type);

  // Render request data fields
  const dataEntries = Object.entries(request.data || {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons = [];

  if (request.status === 'PENDING') {
    // Cancel button for own requests
    actionButtons.push({
      id: 'cancel',
      title: 'Cancelar Solicitação',
      icon: Ban,
      onClick: () => setShowCancelPin(true),
      variant: 'outline' as const,
    });

    if (canApprove) {
      actionButtons.push({
        id: 'reject',
        title: 'Rejeitar',
        icon: XCircle,
        onClick: () => setShowRejectModal(true),
        variant: 'outline' as const,
      });
      actionButtons.push({
        id: 'approve',
        title: 'Aprovar',
        icon: Check,
        onClick: handleApprove,
      });
    }
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
            { label: 'Solicitações', href: '/hr/requests' },
            { label: typeLabel },
          ]}
          buttons={actionButtons}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br ${gradient}`}
            >
              <TypeIcon className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {typeLabel}
                </h1>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {request.employee && (
                  <span>
                    {request.employee.fullName}
                    {request.employee.department
                      ? ` - ${request.employee.department.name}`
                      : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>
                  {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {request.approvedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  <span>
                    {new Date(request.approvedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Request Details */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <ClipboardList className="h-5 w-5" />
            Detalhes da Solicitação
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField label="Tipo" value={typeLabel} />
            <InfoField
              label="Status"
              value={statusLabel}
              badge={<Badge variant={statusVariant}>{statusLabel}</Badge>}
            />
            {request.employee && (
              <InfoField
                label="Colaborador"
                value={request.employee.fullName}
              />
            )}
            {request.employee?.department && (
              <InfoField
                label="Departamento"
                value={request.employee.department.name}
              />
            )}
            <InfoField
              label="Data da Solicitação"
              value={new Date(request.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            />
            {request.approverEmployee && (
              <InfoField
                label="Aprovador"
                value={request.approverEmployee.fullName}
              />
            )}
            {request.approvedAt && (
              <InfoField
                label="Data da Aprovacao"
                value={new Date(request.approvedAt).toLocaleDateString(
                  'pt-BR',
                  {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              />
            )}
          </div>

          {/* Rejection reason */}
          {request.rejectionReason && (
            <div className="mt-4 p-4 rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5">
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300 mb-1">
                Motivo da Rejeição
              </p>
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {request.rejectionReason}
              </p>
            </div>
          )}
        </Card>

        {/* Additional Data */}
        {dataEntries.length > 0 && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <FileText className="h-5 w-5" />
              Dados Adicionais
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {dataEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <span className="text-sm font-medium">
                    {DATA_FIELD_LABELS[key] ||
                      key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </PageBody>

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        requestId={requestId}
      />

      {/* Cancel PIN Modal */}
      <VerifyActionPinModal
        isOpen={showCancelPin}
        onClose={() => setShowCancelPin(false)}
        onSuccess={handleCancelConfirm}
        title="Confirmar Cancelamento"
        description="Digite seu PIN de ação para cancelar esta solicitação."
      />
    </PageLayout>
  );
}
