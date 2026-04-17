/**
 * OpenSea OS - Recurring Detail Page
 * Follows the standard detail page pattern: PageLayout > PageHeader > PageBody
 * with Identity Card, info sections, and generated entries history.
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useRecurringConfig,
  usePauseRecurring,
  useResumeRecurring,
  useCancelRecurring,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import type { RecurringStatus } from '@/types/finance';
import {
  RECURRING_STATUS_LABELS,
  FREQUENCY_LABELS,
  FINANCE_ENTRY_TYPE_LABELS,
} from '@/types/finance';
import {
  Calendar,
  DollarSign,
  Edit,
  FileText,
  Info,
  Landmark,
  Pause,
  Play,
  RefreshCw,
  Settings,
  XCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useRouter } from 'next/navigation';
import { use, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr));
}

function getStatusColor(status: RecurringStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300';
    case 'PAUSED':
      return 'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300';
    case 'CANCELLED':
      return 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300';
    default:
      return 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300';
  }
}

function getFrequencyLabel(unit: string, interval: number): string {
  const label = FREQUENCY_LABELS[unit as keyof typeof FREQUENCY_LABELS] ?? unit;
  if (interval > 1) return `A cada ${interval} ${label.toLowerCase()}s`;
  return label;
}

// =============================================================================
// INFO ROW
// =============================================================================

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-right ${className ?? ''}`}>{value}</span>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function RecurringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data, isLoading, error } = useRecurringConfig(id);
  const pauseMutation = usePauseRecurring();
  const resumeMutation = useResumeRecurring();
  const cancelMutation = useCancelRecurring();

  const canEdit = hasPermission(FINANCE_PERMISSIONS.RECURRING.MODIFY);
  const canAdmin = hasPermission(FINANCE_PERMISSIONS.RECURRING.ADMIN);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const config = data?.config;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePause = useCallback(async () => {
    if (!config) return;
    try {
      await pauseMutation.mutateAsync(config.id);
      toast.success('Recorrência pausada com sucesso.');
    } catch {
      toast.error('Erro ao pausar recorrência.');
    }
  }, [config, pauseMutation]);

  const handleResume = useCallback(async () => {
    if (!config) return;
    try {
      await resumeMutation.mutateAsync(config.id);
      toast.success('Recorrência retomada com sucesso.');
    } catch {
      toast.error('Erro ao retomar recorrência.');
    }
  }, [config, resumeMutation]);

  const handleCancelConfirm = useCallback(async () => {
    if (!config) return;
    try {
      await cancelMutation.mutateAsync(config.id);
      toast.success('Recorrência cancelada com sucesso.');
      setCancelModalOpen(false);
    } catch {
      toast.error('Erro ao cancelar recorrência.');
    }
  }, [config, cancelMutation]);

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];

    // Pause/Resume toggle
    if (canEdit && config?.status === 'ACTIVE') {
      buttons.push({
        id: 'pause',
        title: 'Pausar',
        icon: Pause,
        onClick: handlePause,
        variant: 'outline',
      });
    }
    if (canEdit && config?.status === 'PAUSED') {
      buttons.push({
        id: 'resume',
        title: 'Retomar',
        icon: Play,
        onClick: handleResume,
        variant: 'outline',
      });
    }

    if (canEdit) {
      buttons.push({
        id: 'edit',
        title: 'Editar',
        icon: Edit,
        onClick: () => router.push(`/finance/recurring/${id}/edit`),
        variant: 'outline',
      });
    }

    if (canAdmin && config?.status !== 'CANCELLED') {
      buttons.push({
        id: 'cancel-recurring',
        title: 'Cancelar',
        icon: XCircle,
        onClick: () => setCancelModalOpen(true),
        variant: 'default',
        className:
          'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
      });
    }

    return buttons;
  }, [canEdit, canAdmin, config, router, id, handlePause, handleResume]);

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Financeiro', href: '/finance' },
    { label: 'Recorrências', href: '/finance/recurring' },
    { label: config?.description || '...' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !config) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Recorrência não encontrada"
            message="A recorrência solicitada não foi encontrada."
            action={{
              label: 'Voltar para Recorrências',
              onClick: () => router.push('/finance/recurring'),
            }}
          />
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
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-violet-600 shadow-lg">
              <RefreshCw className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold truncate">
                  {config.description}
                </h1>
                <Badge
                  variant="outline"
                  className={getStatusColor(config.status)}
                >
                  {RECURRING_STATUS_LABELS[config.status]}
                </Badge>
                <Badge variant="outline">
                  {FINANCE_ENTRY_TYPE_LABELS[config.type]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getFrequencyLabel(
                  config.frequencyUnit,
                  config.frequencyInterval
                )}
                {' \u2022 '}
                Criada em {formatDate(config.createdAt)}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Valor Base</p>
                <p className="text-base font-bold font-mono">
                  {formatCurrency(config.expectedAmount)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Dados da Recorrencia */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Dados da Recorrência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Descrição" value={config.description} />
              <InfoRow
                label="Tipo"
                value={FINANCE_ENTRY_TYPE_LABELS[config.type]}
              />
              <InfoRow
                label="Frequência"
                value={getFrequencyLabel(
                  config.frequencyUnit,
                  config.frequencyInterval
                )}
              />
              <InfoRow
                label="Unidade"
                value={FREQUENCY_LABELS[config.frequencyUnit]}
              />
              <InfoRow
                label="Valor Base"
                value={formatCurrency(config.expectedAmount)}
                className="font-semibold"
              />
              <InfoRow
                label="Valor Variável"
                value={config.isVariable ? 'Sim' : 'Não'}
              />
            </CardContent>
          </Card>

          {/* Card 2: Período */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Data de Início"
                value={formatDate(config.startDate)}
              />
              <InfoRow
                label="Data de Término"
                value={config.endDate ? formatDate(config.endDate) : 'Sem fim'}
              />
              <InfoRow
                label="Próxima Ocorrência"
                value={formatDate(config.nextDueDate)}
              />
              {config.totalOccurrences != null && (
                <InfoRow
                  label="Total de Ocorrências"
                  value={String(config.totalOccurrences)}
                />
              )}
              <InfoRow
                label="Lançamentos Gerados"
                value={String(config.generatedCount)}
              />
              {config.lastGeneratedDate && (
                <InfoRow
                  label="Último Gerado em"
                  value={formatDate(config.lastGeneratedDate)}
                />
              )}
            </CardContent>
          </Card>

          {/* Card 3: Vinculação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Vinculação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.categoryId && (
                <InfoRow label="Categoria" value={config.categoryId} />
              )}
              {config.costCenterId && (
                <InfoRow label="Centro de Custo" value={config.costCenterId} />
              )}
              {config.bankAccountId && (
                <InfoRow label="Conta Bancária" value={config.bankAccountId} />
              )}
              {config.supplierName && (
                <InfoRow label="Fornecedor" value={config.supplierName} />
              )}
              {config.customerName && (
                <InfoRow label="Cliente" value={config.customerName} />
              )}
              {!config.costCenterId &&
                !config.bankAccountId &&
                !config.supplierName &&
                !config.customerName && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma vinculação configurada.
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Card 4: Configuracao */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Status"
                value={RECURRING_STATUS_LABELS[config.status]}
              />
              <InfoRow
                label="Valor Variável"
                value={config.isVariable ? 'Sim' : 'Não'}
              />
              {config.interestRate != null && (
                <InfoRow
                  label="Taxa de Juros"
                  value={`${config.interestRate}%`}
                />
              )}
              {config.penaltyRate != null && (
                <InfoRow
                  label="Taxa de Multa"
                  value={`${config.penaltyRate}%`}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {config.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{config.notes}</p>
            </CardContent>
          </Card>
        )}
      </PageBody>

      {/* Cancel Confirmation */}
      <VerifyActionPinModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={handleCancelConfirm}
        title="Confirmar Cancelamento"
        description={`Digite seu PIN de Ação para cancelar a recorrência "${config.description}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
