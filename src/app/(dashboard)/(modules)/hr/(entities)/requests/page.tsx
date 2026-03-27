/**
 * HR Requests Management Page
 * Gestao de solicitacoes pendentes (acesso de gestores/RH)
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { GridError } from '@/components/handlers/grid-error';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { usePermissions } from '@/hooks/use-permissions';
import { portalService } from '@/services/hr';
import type {
  EmployeeRequest,
  RequestType,
  RequestStatus,
} from '@/types/hr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Inbox,
  Loader2,
  PalmtreeIcon,
  Send,
  UserCog,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  VACATION: 'Ferias',
  ABSENCE: 'Ausencia',
  ADVANCE: 'Adiantamento',
  DATA_CHANGE: 'Alteracao de Dados',
  SUPPORT: 'Suporte',
};

const REQUEST_TYPE_ICONS: Record<RequestType, React.ReactNode> = {
  VACATION: <PalmtreeIcon className="h-4 w-4" />,
  ABSENCE: <Calendar className="h-4 w-4" />,
  ADVANCE: <FileText className="h-4 w-4" />,
  DATA_CHANGE: <UserCog className="h-4 w-4" />,
  SUPPORT: <Send className="h-4 w-4" />,
};

const STATUS_CONFIG: Record<RequestStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendente', variant: 'outline' },
  APPROVED: { label: 'Aprovada', variant: 'default' },
  REJECTED: { label: 'Rejeitada', variant: 'destructive' },
  CANCELLED: { label: 'Cancelada', variant: 'secondary' },
};

// ============================================================================
// PAGE
// ============================================================================

export default function RequestsPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const canApprove = hasPermission(HR_PERMISSIONS.EMPLOYEES.MANAGE);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Action state
  const [actionTarget, setActionTarget] = useState<{
    request: EmployeeRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Query
  const {
    data: requestsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['hr-pending-requests', typeFilter],
    queryFn: async () => {
      const response = await portalService.listPendingApprovals({
        type: typeFilter || undefined,
        perPage: 100,
      });
      return response.requests;
    },
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => portalService.approveRequest(id),
    onSuccess: () => {
      toast.success('Solicitacao aprovada');
      queryClient.invalidateQueries({ queryKey: ['hr-pending-requests'] });
      setActionTarget(null);
    },
    onError: () => {
      toast.error('Erro ao aprovar solicitacao');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      portalService.rejectRequest(id, reason),
    onSuccess: () => {
      toast.success('Solicitacao rejeitada');
      queryClient.invalidateQueries({ queryKey: ['hr-pending-requests'] });
      setActionTarget(null);
      setRejectionReason('');
    },
    onError: () => {
      toast.error('Erro ao rejeitar solicitacao');
    },
  });

  const handleAction = useCallback(() => {
    if (!actionTarget) return;

    if (actionTarget.action === 'approve') {
      approveMutation.mutate(actionTarget.request.id);
    } else {
      if (!rejectionReason.trim()) {
        toast.error('Informe o motivo da rejeicao');
        return;
      }
      rejectMutation.mutate({
        id: actionTarget.request.id,
        reason: rejectionReason.trim(),
      });
    }
  }, [actionTarget, rejectionReason, approveMutation, rejectMutation]);

  const renderRequestDetails = (request: EmployeeRequest) => {
    const data = request.data || {};
    const entries = Object.entries(data).filter(
      ([, v]) => v !== null && v !== undefined && v !== ''
    );
    if (entries.length === 0) return null;

    return (
      <div className="mt-2 p-3 rounded-lg bg-muted/30 text-xs space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <span>{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Recursos Humanos', href: '/hr' },
            { label: 'Solicitacoes' },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Solicitacoes</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie solicitacoes dos colaboradores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Tipos</SelectItem>
                <SelectItem value="VACATION">Ferias</SelectItem>
                <SelectItem value="ABSENCE">Ausencia</SelectItem>
                <SelectItem value="ADVANCE">Adiantamento</SelectItem>
                <SelectItem value="DATA_CHANGE">Alteracao de Dados</SelectItem>
                <SelectItem value="SUPPORT">Suporte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <GridLoading count={5} layout="list" size="md" />
        ) : error ? (
          <GridError message="Erro ao carregar solicitacoes" />
        ) : !requestsData || requestsData.length === 0 ? (
          <Card className="p-12 text-center bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <Inbox className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-1">Nenhuma solicitacao pendente</p>
            <p className="text-sm text-muted-foreground">
              Todas as solicitacoes foram processadas
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {requestsData.map((request: EmployeeRequest) => {
              const typeLabel = REQUEST_TYPE_LABELS[request.type];
              const typeIcon = REQUEST_TYPE_ICONS[request.type];
              const statusConfig = STATUS_CONFIG[request.status];

              return (
                <Card
                  key={request.id}
                  className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shrink-0">
                      {typeIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{typeLabel}</p>
                        <Badge
                          variant={statusConfig.variant}
                          className="text-xs"
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                      {request.employee && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {request.employee.fullName}
                          {request.employee.department
                            ? ` - ${request.employee.department.name}`
                            : ''}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Criada em{' '}
                        {new Date(request.createdAt).toLocaleDateString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          }
                        )}
                      </p>
                      {renderRequestDetails(request)}
                    </div>

                    {/* Actions */}
                    {canApprove && request.status === 'PENDING' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          onClick={() =>
                            setActionTarget({
                              request,
                              action: 'approve',
                            })
                          }
                        >
                          <Check className="h-3.5 w-3.5" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          onClick={() =>
                            setActionTarget({
                              request,
                              action: 'reject',
                            })
                          }
                        >
                          <X className="h-3.5 w-3.5" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Approve/Reject Dialog */}
        <Dialog
          open={!!actionTarget}
          onOpenChange={v => {
            if (!v) {
              setActionTarget(null);
              setRejectionReason('');
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionTarget?.action === 'approve'
                  ? 'Aprovar Solicitacao'
                  : 'Rejeitar Solicitacao'}
              </DialogTitle>
              <DialogDescription>
                {actionTarget?.action === 'approve'
                  ? `Confirma a aprovacao da solicitacao de ${REQUEST_TYPE_LABELS[actionTarget?.request.type || 'SUPPORT']}?`
                  : 'Informe o motivo da rejeicao.'}
              </DialogDescription>
            </DialogHeader>

            {actionTarget?.action === 'reject' && (
              <div className="space-y-2 py-2">
                <Label>Motivo da Rejeicao</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Descreva o motivo da rejeicao..."
                  rows={3}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setActionTarget(null);
                  setRejectionReason('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant={
                  actionTarget?.action === 'approve'
                    ? 'default'
                    : 'destructive'
                }
                onClick={handleAction}
                disabled={
                  approveMutation.isPending || rejectMutation.isPending
                }
              >
                {(approveMutation.isPending || rejectMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                )}
                {actionTarget?.action === 'approve' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Confirmar Aprovacao
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Confirmar Rejeicao
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageBody>
    </PageLayout>
  );
}
