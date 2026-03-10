/**
 * Contract Detail Page
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
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
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Edit,
  FileText,
  Loader2,
  Paperclip,
  Play,
  Trash2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useRef, useState } from 'react';
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
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? '\u2014'}</p>
    </div>
  );
}

// =============================================================================
// MAIN
// =============================================================================

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const { data, isLoading, refetch } = useContract(id);
  const deleteContract = useDeleteContract();
  const generateEntries = useGenerateContractEntries();

  const contract = data?.contract;
  const generatedEntriesCount = data?.generatedEntriesCount ?? 0;
  const nextPaymentDate = data?.nextPaymentDate;

  // Supplier history
  const { data: historyData } = useSupplierHistory({
    companyName: contract?.companyName,
  });

  // Permissions
  const canEdit = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.UPDATE);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.DELETE);
  const canManage = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.MANAGE);

  // Delete modal
  const [pinModalOpen, setPinModalOpen] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<StorageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!contract) return;
    storageFilesService
      .listFiles({ entityType: 'CONTRACT', entityId: contract.id, limit: 50 })
      .then((res) => setAttachments(res.files ?? []))
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
        setAttachments((prev) => [...prev, result.file]);
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
    try {
      await deleteContract.mutateAsync(id);
      toast.success('Contrato excluido com sucesso.');
      router.push('/finance/contracts');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir contrato';
      toast.error(message);
    }
  }, [id, deleteContract, router]);

  const handleGenerateEntries = useCallback(async () => {
    try {
      const result = await generateEntries.mutateAsync(id);
      toast.success(
        `${result.entriesCreated} lancamento(s) gerado(s) com sucesso.`
      );
      refetch();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro ao gerar lancamentos';
      toast.error(message);
    }
  }, [id, generateEntries, refetch]);

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Not found
  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <p className="text-destructive text-lg font-medium">
          Contrato nao encontrado.
        </p>
        <Link href="/finance/contracts">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para contratos
          </Button>
        </Link>
      </div>
    );
  }

  const isNearExpiry =
    contract.daysUntilExpiration > 0 &&
    contract.daysUntilExpiration <= contract.alertDaysBefore;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/contracts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{contract.title}</h1>
              <Badge variant={getStatusVariant(contract.status)}>
                {CONTRACT_STATUS_LABELS[contract.status]}
              </Badge>
              <span className="text-sm font-mono text-muted-foreground">
                {contract.code}
              </span>
            </div>
            {contract.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {contract.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManage && !contract.isCancelled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateEntries}
              disabled={generateEntries.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              {generateEntries.isPending
                ? 'Gerando...'
                : 'Gerar Lancamentos'}
            </Button>
          )}
          {canEdit && !contract.isCancelled && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/finance/contracts/${id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          )}
          {canDelete && !contract.isCancelled && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setPinModalOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {isNearExpiry && !contract.isExpired && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Contrato proximo do vencimento
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Este contrato vence em {contract.daysUntilExpiration} dia(s) (
                {formatDate(contract.endDate)}).
              </p>
            </div>
          </div>
        </Card>
      )}

      {contract.isExpired && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                Contrato expirado
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                Este contrato expirou em {formatDate(contract.endDate)}.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contract details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Values */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valores e Pagamento
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoRow
                label="Valor Total"
                value={
                  <span className="text-lg font-bold">
                    {formatCurrency(contract.totalValue)}
                  </span>
                }
              />
              <InfoRow
                label="Valor da Parcela"
                value={
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(contract.paymentAmount)}
                  </span>
                }
              />
              <InfoRow
                label="Frequencia"
                value={
                  PAYMENT_FREQUENCY_LABELS[contract.paymentFrequency] ??
                  contract.paymentFrequency
                }
              />
              <InfoRow
                label="Lancamentos Gerados"
                value={generatedEntriesCount}
              />
            </div>
            {nextPaymentDate && (
              <div className="mt-4 pt-4 border-t">
                <InfoRow
                  label="Proximo Pagamento"
                  value={
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      {formatDate(nextPaymentDate)}
                    </span>
                  }
                />
              </div>
            )}
          </Card>

          {/* Vigencia */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Vigencia
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoRow
                label="Inicio"
                value={formatDate(contract.startDate)}
              />
              <InfoRow
                label="Termino"
                value={formatDate(contract.endDate)}
              />
              <InfoRow
                label="Dias ate o Vencimento"
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
            </div>
            {contract.autoRenew && (
              <div className="mt-4 pt-4 border-t">
                <InfoRow
                  label="Renovacao Automatica"
                  value={`Sim - a cada ${contract.renewalPeriodMonths ?? 12} meses`}
                />
              </div>
            )}
          </Card>

          {/* Classification */}
          {(contract.categoryId ||
            contract.costCenterId ||
            contract.bankAccountId) && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Classificacao</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contract.categoryId && (
                  <InfoRow
                    label="Categoria"
                    value={contract.categoryId}
                  />
                )}
                {contract.costCenterId && (
                  <InfoRow
                    label="Centro de Custo"
                    value={contract.costCenterId}
                  />
                )}
                {contract.bankAccountId && (
                  <InfoRow
                    label="Conta Bancaria"
                    value={contract.bankAccountId}
                  />
                )}
              </div>
            </Card>
          )}

          {/* Notes */}
          {contract.notes && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2">Observacoes</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {contract.notes}
              </p>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Supplier info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Fornecedor
            </h2>
            <div className="space-y-3">
              <InfoRow label="Empresa" value={contract.companyName} />
              {contract.contactName && (
                <InfoRow label="Contato" value={contract.contactName} />
              )}
              {contract.contactEmail && (
                <InfoRow label="E-mail" value={contract.contactEmail} />
              )}
            </div>
          </Card>

          {/* Supplier history */}
          {historyData && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historico do Fornecedor
              </h2>
              <div className="space-y-3">
                <InfoRow
                  label="Total de Contratos"
                  value={historyData.totalContracts}
                />
                <InfoRow
                  label="Total de Pagamentos"
                  value={historyData.totalPaymentsCount}
                />
                <InfoRow
                  label="Valor Total Pago"
                  value={
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(historyData.totalPaymentsValue)}
                    </span>
                  }
                />
              </div>
            </Card>
          )}

          {/* Attachments */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Documentos
                {attachments.length > 0 && (
                  <Badge variant="secondary">{attachments.length}</Badge>
                )}
              </h2>
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
            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((file) => (
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
          </Card>

          {/* Metadata */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Metadados
            </h2>
            <div className="space-y-2 text-xs">
              <InfoRow label="ID" value={contract.id} />
              <InfoRow label="Criado em" value={formatDate(contract.createdAt)} />
              {contract.updatedAt && (
                <InfoRow
                  label="Atualizado em"
                  value={formatDate(contract.updatedAt)}
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete PIN modal */}
      <VerifyActionPinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={handleDelete}
        title="Confirmar Exclusao"
        description={`Digite seu PIN de Acao para excluir o contrato "${contract.title}". Os lancamentos pendentes serao cancelados.`}
      />
    </div>
  );
}
