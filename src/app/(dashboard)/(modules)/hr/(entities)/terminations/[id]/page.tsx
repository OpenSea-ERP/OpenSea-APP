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
import type { Termination } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calculator,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  DollarSign,
  Download,
  FileText,
  FileX2,
  NotebookText,
  Trash,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { terminationsService } from '@/services/hr/terminations.service';
import { toast } from 'sonner';
import {
  terminationsApi,
  terminationKeys,
  formatCurrency,
  formatDate,
  getTerminationTypeLabel,
  getTerminationStatusLabel,
  getTerminationStatusVariant,
  getNoticeTypeLabel,
  useDeleteTermination,
  useCalculateTermination,
  useMarkTerminationAsPaid,
} from '../src';

export default function TerminationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const terminationId = params.id as string;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: termination, isLoading } = useQuery<Termination>({
    queryKey: terminationKeys.detail(terminationId),
    queryFn: () => terminationsApi.get(terminationId),
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const deleteMutation = useDeleteTermination({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.lists() });
      router.push('/hr/terminations');
    },
  });

  const calculateMutation = useCalculateTermination({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: terminationKeys.detail(terminationId),
      });
    },
  });

  const markAsPaidMutation = useMarkTerminationAsPaid({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: terminationKeys.detail(terminationId),
      });
    },
  });

  const { getName } = useEmployeeMap(
    termination ? [termination.employeeId] : []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = async () => {
    if (!termination) return;
    await deleteMutation.mutateAsync(termination.id);
    setIsDeleteModalOpen(false);
  };

  const handleCalculate = async () => {
    if (!termination) return;
    await calculateMutation.mutateAsync(termination.id);
  };

  const handleMarkAsPaid = async () => {
    if (!termination) return;
    await markAsPaidMutation.mutateAsync(termination.id);
  };

  const handleDownloadTrct = async () => {
    if (!termination) return;
    setIsDownloadingPdf(true);
    try {
      const { blob } = await terminationsService.downloadTrctPdf(
        termination.id
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TRCT-${getName(termination.employeeId)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('TRCT baixado com sucesso!');
    } catch {
      toast.error('Erro ao baixar TRCT');
    } finally {
      setIsDownloadingPdf(false);
    }
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
              { label: 'Rescisões', href: '/hr/terminations' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!termination) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Rescisões', href: '/hr/terminations' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <FileX2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Rescisão não encontrada
            </h2>
            <Button onClick={() => router.push('/hr/terminations')}>
              Voltar para Rescisões
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // VERBAS TABLE HELPER
  // ============================================================================

  const hasVerbas =
    termination.status === 'CALCULATED' || termination.status === 'PAID';

  const verbasRows = [
    { label: 'Saldo de Salário', value: termination.saldoSalario },
    { label: 'Aviso Prévio Indenizado', value: termination.avisoIndenizado },
    { label: '13º Proporcional', value: termination.decimoTerceiroProp },
    { label: 'Férias Vencidas', value: termination.feriasVencidas },
    {
      label: 'Férias Vencidas + 1/3',
      value: termination.feriasVencidasTerco,
    },
    { label: 'Férias Proporcionais', value: termination.feriasProporcional },
    {
      label: 'Férias Proporcionais + 1/3',
      value: termination.feriasProporcionalTerco,
    },
    { label: 'Multa FGTS (40%)', value: termination.multaFgts },
  ];

  const descontosRows = [
    { label: 'INSS', value: termination.inssRescisao },
    { label: 'IRRF', value: termination.irrfRescisao },
    { label: 'Outros Descontos', value: termination.outrosDescontos },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Rescisões', href: '/hr/terminations' },
            { label: getTerminationTypeLabel(termination.type) },
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
            ...(hasVerbas
              ? [
                  {
                    id: 'download-trct' as const,
                    title: 'Baixar TRCT',
                    icon: Download,
                    onClick: handleDownloadTrct,
                    variant: 'outline' as const,
                    disabled: isDownloadingPdf,
                  },
                ]
              : []),
            ...(termination.status === 'PENDING'
              ? [
                  {
                    id: 'calculate' as const,
                    title: 'Calcular Verbas',
                    icon: Calculator,
                    onClick: handleCalculate,
                    variant: 'outline' as const,
                    disabled: calculateMutation.isPending,
                  },
                ]
              : []),
            ...(termination.status === 'CALCULATED'
              ? [
                  {
                    id: 'mark-paid' as const,
                    title: 'Marcar como Pago',
                    icon: CheckCircle,
                    onClick: handleMarkAsPaid,
                    variant: 'default' as const,
                    disabled: markAsPaidMutation.isPending,
                  },
                ]
              : []),
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-rose-500 to-rose-600">
              <FileX2 className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {getTerminationTypeLabel(termination.type)}
                </h1>
                <Badge
                  variant={getTerminationStatusVariant(termination.status)}
                >
                  {getTerminationStatusLabel(termination.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getName(termination.employeeId)} ·{' '}
                {formatDate(termination.terminationDate)}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {termination.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-rose-500" />
                  <span>{formatDate(termination.createdAt)}</span>
                </div>
              )}
              {termination.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>{formatDate(termination.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados da Rescisão */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <NotebookText className="h-5 w-5" />
            Dados da Rescisão
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Funcionário"
              value={getName(termination.employeeId)}
              icon={<User className="h-4 w-4" />}
              showCopyButton
              copyTooltip="Copiar nome"
            />
            <InfoField
              label="Tipo de Rescisão"
              value={getTerminationTypeLabel(termination.type)}
            />
            <InfoField
              label="Data da Rescisão"
              value={formatDate(termination.terminationDate)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <InfoField
              label="Último Dia Trabalhado"
              value={formatDate(termination.lastWorkDay)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <InfoField
              label="Tipo de Aviso Prévio"
              value={getNoticeTypeLabel(termination.noticeType)}
            />
            <InfoField
              label="Dias de Aviso"
              value={`${termination.noticeDays} dias`}
            />
            <InfoField
              label="Prazo de Pagamento"
              value={formatDate(termination.paymentDeadline)}
              icon={<Calendar className="h-4 w-4" />}
            />
            {termination.paidAt && (
              <InfoField
                label="Pago em"
                value={formatDate(termination.paidAt)}
                icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
              />
            )}
          </div>
        </Card>

        {/* Verbas Rescisórias */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <DollarSign className="h-5 w-5" />
            Verbas Rescisórias
          </h3>

          {!hasVerbas ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                As verbas ainda não foram calculadas
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Clique em &quot;Calcular Verbas&quot; para processar os valores.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* VERBAS */}
              <div>
                <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-3">
                  Verbas
                </h4>
                <div className="space-y-2">
                  {verbasRows.map(
                    row =>
                      row.value !== undefined &&
                      row.value !== null && (
                        <div
                          key={row.label}
                          className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-muted/30"
                        >
                          <span className="text-sm">{row.label}</span>
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(row.value)}
                          </span>
                        </div>
                      )
                  )}
                  <div className="border-t border-dashed pt-2 mt-2">
                    <div className="flex items-center justify-between py-1.5 px-3 font-semibold">
                      <span className="text-sm uppercase">Total Bruto</span>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(termination.totalBruto)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DESCONTOS */}
              <div>
                <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-3">
                  Descontos
                </h4>
                <div className="space-y-2">
                  {descontosRows.map(
                    row =>
                      row.value !== undefined &&
                      row.value !== null && (
                        <div
                          key={row.label}
                          className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-muted/30"
                        >
                          <span className="text-sm">{row.label}</span>
                          <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                            - {formatCurrency(row.value)}
                          </span>
                        </div>
                      )
                  )}
                  <div className="border-t border-dashed pt-2 mt-2">
                    <div className="flex items-center justify-between py-1.5 px-3 font-semibold">
                      <span className="text-sm uppercase">Total Descontos</span>
                      <span className="text-sm text-rose-600 dark:text-rose-400">
                        - {formatCurrency(termination.totalDescontos)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOTAL LÍQUIDO */}
              <div className="border-t-2 border-double pt-4">
                <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                  <span className="text-base font-bold uppercase">
                    Total Líquido
                  </span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(termination.totalLiquido)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Observações */}
        {termination.notes && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <FileText className="h-5 w-5" />
              Observações
            </h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {termination.notes}
            </p>
          </Card>
        )}

        {/* Offboarding Checklist Link */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <ClipboardList className="h-5 w-5" />
            Checklist de Desligamento
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            O checklist de offboarding é criado automaticamente ao registrar a
            rescisão. Acompanhe as pendências de desligamento do colaborador.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(
                `/hr/offboarding?employeeId=${termination.employeeId}`
              )
            }
          >
            <ClipboardList className="h-4 w-4 mr-1" />
            Ver Checklist de Offboarding
          </Button>
        </Card>

        {/* Metadados */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Clock className="h-5 w-5" />
            Metadados
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Criado em"
              value={formatDate(termination.createdAt)}
            />
            <InfoField
              label="Atualizado em"
              value={formatDate(termination.updatedAt)}
            />
          </div>
        </Card>
      </PageBody>

      {/* Delete Confirm Modal */}
      <VerifyActionPinModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDelete}
        title="Excluir Rescisão"
        description="Digite seu PIN de ação para excluir esta rescisão. Esta ação não pode ser desfeita."
      />
    </PageLayout>
  );
}
