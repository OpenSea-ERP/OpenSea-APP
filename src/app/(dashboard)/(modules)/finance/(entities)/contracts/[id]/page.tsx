/**
 * OpenSea OS - Contract Detail Page
 * Follows the standard detail page pattern: PageLayout > PageHeader > PageBody
 * with Identity Card, info sections, supplier history, and attachments.
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useContract,
  useDeleteContract,
  useGenerateContractEntries,
  useSupplierHistory,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { storageFilesService } from '@/services/storage/files.service';
import type { ContractStatus } from '@/types/finance';
import {
  CONTRACT_STATUS_LABELS,
  PAYMENT_FREQUENCY_LABELS,
} from '@/types/finance';
import type { StorageFile } from '@/types/storage';
import {
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Edit,
  FileText,
  Info,
  Landmark,
  Loader2,
  Paperclip,
  Play,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '\u2014';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr));
}

function getStatusVariant(
  status: ContractStatus
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'DRAFT':
      return 'secondary';
    case 'EXPIRED':
      return 'destructive';
    case 'RENEWED':
      return 'default';
    case 'CANCELLED':
      return 'warning';
    default:
      return 'secondary';
  }
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
  value: React.ReactNode;
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

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data, isLoading, error, refetch } = useContract(id);
  const deleteContract = useDeleteContract();
  const generateEntries = useGenerateContractEntries();

  const contract = data?.contract;
  const generatedEntriesCount = data?.generatedEntriesCount ?? 0;
  const nextPaymentDate = data?.nextPaymentDate;

  const canEdit = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.REMOVE);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Supplier history
  const { data: historyData } = useSupplierHistory({
    companyName: contract?.companyName,
  });

  // Attachments
  const [attachments, setAttachments] = useState<StorageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!contract) return;
    storageFilesService
      .listFiles({ entityType: 'CONTRACT', entityId: contract.id, limit: 50 })
      .then(res => setAttachments(res.files ?? []))
      .catch(() => {});
  }, [contract]);

  const handleUploadFile = useCallback(
    async (file: File) => {
      if (!contract) return;
      setUploading(true);
      try {
        const result = await storageFilesService.uploadFile(null, file, {
          entityType: 'CONTRACT',
          entityId: contract.id,
        });
        setAttachments(prev => [...prev, result.file]);
        toast.success('Documento enviado com sucesso!');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao enviar documento.';
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [contract]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUploadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleUploadFile]
  );

  const handleDelete = useCallback(async () => {
    if (!contract) return;
    try {
      await deleteContract.mutateAsync(contract.id);
      toast.success('Contrato excluído com sucesso.');
      router.push('/finance/contracts');
    } catch {
      toast.error('Erro ao excluir contrato.');
    }
  }, [contract, deleteContract, router]);

  const handleGenerateEntries = useCallback(async () => {
    try {
      const result = await generateEntries.mutateAsync(id);
      toast.success(
        `${result.entriesCreated} lançamento(s) gerado(s) com sucesso.`
      );
      refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao gerar lançamentos';
      toast.error(message);
    }
  }, [id, generateEntries, refetch]);

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];

    if (canEdit && contract && !contract.isCancelled) {
      buttons.push({
        id: 'generate-entries',
        title: generateEntries.isPending ? 'Gerando...' : 'Gerar Lançamentos',
        icon: generateEntries.isPending ? Loader2 : Play,
        onClick: handleGenerateEntries,
        variant: 'outline',
        disabled: generateEntries.isPending,
      });
    }

    if (canEdit) {
      buttons.push({
        id: 'edit-contract',
        title: 'Editar',
        icon: Edit,
        onClick: () => router.push(`/finance/contracts/${id}/edit`),
        variant: 'outline',
      });
    }

    if (canDelete) {
      buttons.push({
        id: 'delete-contract',
        title: 'Excluir',
        icon: Trash2,
        onClick: () => setDeleteModalOpen(true),
        variant: 'default',
        className:
          'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
      });
    }

    return buttons;
  }, [canEdit, canDelete, router, id, contract, generateEntries, handleGenerateEntries]);

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Financeiro', href: '/finance' },
    { label: 'Contratos', href: '/finance/contracts' },
    { label: contract?.title || '...' },
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

  if (error || !contract) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Contrato não encontrado"
            message="O contrato solicitado não foi encontrado."
            action={{
              label: 'Voltar para Contratos',
              onClick: () => router.push('/finance/contracts'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const isNearExpiry =
    contract.daysUntilExpiration > 0 &&
    contract.daysUntilExpiration <= contract.alertDaysBefore;

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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-teal-600 shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold truncate">
                  {contract.title}
                </h1>
                <Badge variant={getStatusVariant(contract.status)}>
                  {CONTRACT_STATUS_LABELS[contract.status]}
                </Badge>
                {contract.autoRenew && (
                  <Badge variant="outline" className="gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Auto-renovação
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {contract.companyName}
                {contract.code && ` · ${contract.code}`}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Parcela</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {formatCurrency(contract.paymentAmount)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Alerts */}
        {isNearExpiry && !contract.isExpired && (
          <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-base font-semibold text-amber-800 dark:text-amber-200">
                    Contrato próximo do vencimento
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Este contrato vence em {contract.daysUntilExpiration} dia(s) ({formatDate(contract.endDate)}).
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {contract.isExpired && (
          <Card className="border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/20">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="text-base font-semibold text-rose-800 dark:text-rose-200">
                    Contrato expirado
                  </p>
                  <p className="text-sm text-rose-700 dark:text-rose-300">
                    Este contrato expirou em {formatDate(contract.endDate)}.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Dados do Contrato */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Dados do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Título" value={contract.title} />
              {contract.code && <InfoRow label="Código" value={contract.code} />}
              {contract.description && (
                <InfoRow label="Descrição" value={contract.description} />
              )}
              <InfoRow
                label="Status"
                value={CONTRACT_STATUS_LABELS[contract.status]}
              />
              <InfoRow
                label="Frequência"
                value={
                  PAYMENT_FREQUENCY_LABELS[contract.paymentFrequency] ??
                  contract.paymentFrequency
                }
              />
            </CardContent>
          </Card>

          {/* Card 2: Período e Renovação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período e Renovação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Início" value={formatDate(contract.startDate)} />
              <InfoRow label="Término" value={formatDate(contract.endDate)} />
              <InfoRow
                label="Dias até o Vencimento"
                value={
                  contract.daysUntilExpiration > 0
                    ? `${contract.daysUntilExpiration} dia(s)`
                    : 'Expirado'
                }
              />
              <InfoRow
                label="Alerta"
                value={`${contract.alertDaysBefore} dias antes`}
              />
              <InfoRow
                label="Renovação Automática"
                value={
                  contract.autoRenew
                    ? `Sim - a cada ${contract.renewalPeriodMonths ?? 12} meses`
                    : 'Não'
                }
              />
            </CardContent>
          </Card>

          {/* Card 3: Valores */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Valor Total"
                value={formatCurrency(contract.totalValue)}
                className="font-bold"
              />
              <InfoRow
                label="Valor da Parcela"
                value={formatCurrency(contract.paymentAmount)}
              />
              <InfoRow
                label="Lançamentos Gerados"
                value={String(generatedEntriesCount)}
              />
              {nextPaymentDate && (
                <div className="pt-2 border-t">
                  <InfoRow
                    label="Próximo Pagamento"
                    value={formatDate(nextPaymentDate)}
                    className="font-semibold text-amber-600 dark:text-amber-400"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Vinculação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Vinculação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contract.bankAccountId && (
                <InfoRow label="Conta Bancária" value={contract.bankAccountId} />
              )}
              {contract.costCenterId && (
                <InfoRow label="Centro de Custo" value={contract.costCenterId} />
              )}
              {contract.categoryId && (
                <InfoRow label="Categoria" value={contract.categoryId} />
              )}
              {!contract.bankAccountId && !contract.costCenterId && !contract.categoryId && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma vinculação configurada.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fornecedor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Empresa" value={contract.companyName} />
            {contract.contactName && (
              <InfoRow label="Contato" value={contract.contactName} />
            )}
            {contract.contactEmail && (
              <InfoRow label="E-mail" value={contract.contactEmail} />
            )}
          </CardContent>
        </Card>

        {/* Supplier History */}
        {historyData && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Histórico do Fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Total de Contratos"
                value={String(historyData.totalContracts)}
              />
              <InfoRow
                label="Total de Pagamentos"
                value={String(historyData.totalPaymentsCount)}
              />
              <InfoRow
                label="Valor Total Pago"
                value={formatCurrency(historyData.totalPaymentsValue)}
                className="font-semibold text-emerald-600 dark:text-emerald-400"
              />
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {contract.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Documentos
                {attachments.length > 0 && (
                  <Badge variant="secondary">{attachments.length}</Badge>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Enviar Documento
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
              />
            </div>
          </CardHeader>
          <CardContent>
            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {file.size
                              ? `${(file.size / 1024).toFixed(1)} KB`
                              : ''}
                          </span>
                          <span>{formatDate(file.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={storageFilesService.getServeUrl(file.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum documento anexado. Envie PDFs, aditivos ou outros
                documentos do contrato.
              </p>
            )}
          </CardContent>
        </Card>
      </PageBody>

      {/* Delete Confirmation */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDelete}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de Ação para excluir o contrato "${contract.title}". Os lançamentos pendentes serão cancelados. Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
