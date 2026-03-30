'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import type { RequestType, EmployeeRequest } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Ban,
  Calendar,
  Check,
  ClipboardList,
  FileText,
  Loader2,
  PalmtreeIcon,
  Send,
  Trash2,
  UserCog,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import {
  requestKeys,
  requestsApi,
  useApproveRequest,
  useRejectRequest,
  useCancelRequest,
} from '../src/api';
import {
  getRequestTypeLabel,
  getRequestStatusLabel,
  getRequestStatusVariant,
  getRequestTypeGradient,
} from '../src/utils';

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

export default function RequestEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const requestId = params.id as string;

  const canApprove = hasPermission(HR_PERMISSIONS.EMPLOYEE_REQUESTS.APPROVE);

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
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

  const rejectRequest = useRejectRequest({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: requestKeys.detail(requestId),
      });
      setShowRejectForm(false);
      setRejectionReason('');
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

  const handleReject = useCallback(() => {
    if (!rejectionReason.trim()) return;
    rejectRequest.mutate({ id: requestId, reason: rejectionReason.trim() });
  }, [rejectRequest, requestId, rejectionReason]);

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

  if (error || !requestData) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Solicitações', href: '/hr/requests' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Solicitação não encontrada"
            message="A solicitação do colaborador não foi encontrada."
            action={{
              label: 'Voltar',
              onClick: () => router.push('/hr/requests'),
            }}
          />
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
  const isPending = request.status === 'PENDING';

  // Data fields
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

  const dataEntries = Object.entries(request.data || {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Solicitações', href: '/hr/requests' },
            { label: typeLabel, href: `/hr/requests/${requestId}` },
            { label: 'Editar' },
          ]}
          buttons={
            isPending
              ? [
                  {
                    id: 'cancel',
                    title: 'Cancelar Solicitação',
                    icon: Ban,
                    onClick: () => setShowCancelPin(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []
          }
        />
      </PageHeader>

      <PageBody>
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
                <h2 className="text-lg font-semibold">{typeLabel}</h2>
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
              <p className="text-xs text-muted-foreground mt-1">
                Criada em{' '}
                {new Date(request.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="space-y-6 p-5">
            {/* Detalhes da Solicitacao */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Detalhes da Solicitação
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Tipo
                    </p>
                    <p className="text-sm font-medium">{typeLabel}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Status
                    </p>
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                  </div>
                </div>

                {request.employee && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Colaborador
                    </p>
                    <p className="text-sm font-medium">
                      {request.employee.fullName}
                      {request.employee.department
                        ? ` - ${request.employee.department.name}`
                        : ''}
                    </p>
                  </div>
                )}

                {request.approverEmployee && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Aprovador
                    </p>
                    <p className="text-sm font-medium">
                      {request.approverEmployee.fullName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dados Adicionais */}
            {dataEntries.length > 0 && (
              <>
                <div className="border-t" />
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Dados Adicionais
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
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
                </div>
              </>
            )}

            {/* Motivo da Rejeicao (exibir se ja foi rejeitada) */}
            {request.rejectionReason && (
              <>
                <div className="border-t" />
                <div className="rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 p-4">
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300 mb-1">
                    Motivo da Rejeição
                  </p>
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    {request.rejectionReason}
                  </p>
                </div>
              </>
            )}

            {/* Acoes de Aprovacao/Rejeicao (somente se pendente e com permissao) */}
            {isPending && canApprove && (
              <>
                <div className="border-t" />
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Ações de Aprovação
                  </h3>

                  {!showRejectForm ? (
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        className="h-9 px-2.5 rounded-lg text-sm shadow-sm"
                        onClick={handleApprove}
                        disabled={approveRequest.isPending}
                      >
                        {approveRequest.isPending ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-1.5 h-4 w-4" />
                        )}
                        Aprovar Solicitação
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-2.5 rounded-lg text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        onClick={() => setShowRejectForm(true)}
                      >
                        <XCircle className="mr-1.5 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="rejection-reason">
                          Motivo da Rejeição *
                        </Label>
                        <Textarea
                          id="rejection-reason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Informe o motivo da rejeição..."
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-2.5 rounded-lg text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          onClick={handleReject}
                          disabled={
                            rejectRequest.isPending ||
                            !rejectionReason.trim()
                          }
                        >
                          {rejectRequest.isPending ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-1.5 h-4 w-4" />
                          )}
                          Confirmar Rejeição
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 px-2.5 rounded-lg text-sm"
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectionReason('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Aviso para solicitacoes ja processadas */}
            {!isPending && (
              <>
                <div className="border-t" />
                <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-3">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Esta solicitação já foi {statusLabel.toLowerCase()} e não
                    pode mais ser alterada.
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Cancel PIN Modal */}
        <VerifyActionPinModal
          isOpen={showCancelPin}
          onClose={() => setShowCancelPin(false)}
          onSuccess={handleCancelConfirm}
          title="Cancelar Solicitação"
          description="Digite seu PIN de ação para cancelar esta solicitação. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
