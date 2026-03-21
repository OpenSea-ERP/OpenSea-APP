/**
 * Receivable Entry Detail Page
 * Complete page with payment history, attachments, baixa button, and rateio.
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BaixaModal } from '@/components/finance/baixa-modal';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { useDeleteFinanceEntry, useFinanceEntry } from '@/hooks/finance';
import { useFinanceCategories } from '@/hooks/finance/use-finance-categories';
import { financeEntriesService } from '@/services/finance';
import type {
  FinanceAttachmentType,
  FinanceEntryStatus,
} from '@/types/finance';
import {
  FINANCE_ENTRY_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  RECURRENCE_TYPE_LABELS,
  RECURRENCE_UNIT_LABELS,
} from '@/types/finance';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Info,
  Layers,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getStatusBadgeVariant(
  status: FinanceEntryStatus
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'RECEIVED':
      return 'success';
    case 'PENDING':
      return 'secondary';
    case 'OVERDUE':
      return 'destructive';
    case 'PARTIALLY_PAID':
      return 'warning';
    case 'CANCELLED':
      return 'outline';
    case 'SCHEDULED':
      return 'default';
    default:
      return 'secondary';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ATTACHMENT_TYPE_LABELS: Record<string, string> = {
  BOLETO: 'Boleto',
  PAYMENT_RECEIPT: 'Comprovante',
  CONTRACT: 'Contrato',
  INVOICE: 'Nota Fiscal',
  OTHER: 'Outro',
};

const RECEIVABLE_STATUSES: FinanceEntryStatus[] = [
  'PENDING',
  'OVERDUE',
  'PARTIALLY_PAID',
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ReceivableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, refetch } = useFinanceEntry(id);
  const deleteMutation = useDeleteFinanceEntry();
  const entry = data?.entry;

  // Category rates for baixa modal
  const { data: categoriesData } = useFinanceCategories();
  const categories = categoriesData?.categories ?? [];

  // Baixa modal state
  const [baixaOpen, setBaixaOpen] = useState(false);

  // Delete state
  const [pinModalOpen, setPinModalOpen] = useState(false);

  // Attachment upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const categoryRates = useMemo(() => {
    if (!entry) return { interestRate: undefined, penaltyRate: undefined };
    const cat = categories.find(c => c.id === entry.categoryId);
    return {
      interestRate: cat?.interestRate ?? undefined,
      penaltyRate: cat?.penaltyRate ?? undefined,
    };
  }, [entry, categories]);

  const handleDeleteConfirmed = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Conta a receber excluída com sucesso.');
      router.push('/finance/receivable');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir conta a receber.';
      toast.error(message);
    }
  }, [id, deleteMutation, router]);

  const handleUploadAttachment = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        await financeEntriesService.uploadAttachment(
          id,
          file,
          'OTHER' as FinanceAttachmentType
        );
        toast.success('Anexo enviado com sucesso!');
        refetch();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao enviar anexo.';
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [id, refetch]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUploadAttachment(file);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleUploadAttachment]
  );

  // --------------------------------------------------------------------------
  // Loading / Not Found
  // --------------------------------------------------------------------------

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Contas a Receber', href: '/finance/receivable' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-6">
            <div className="flex gap-6 items-center">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <Skeleton className="h-5 w-48 mb-4" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  if (!entry) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Contas a Receber', href: '/finance/receivable' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-12 text-center">
            <p className="text-destructive text-lg">
              Lançamento não encontrado.
            </p>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const canReceive = RECEIVABLE_STATUSES.includes(entry.status);
  const hasAllocations =
    entry.costCenterAllocations && entry.costCenterAllocations.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/receivable">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <div className="flex gap-2">
          {canReceive && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setBaixaOpen(true)}
            >
              <DollarSign className="h-4 w-4" />
              Registrar Recebimento
            </Button>
          )}
          <Link href={`/finance/receivable/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPinModalOpen(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Entry Header Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex gap-4 sm:flex-row items-center sm:gap-6">
          <div className="flex items-center justify-center h-10 w-10 md:h-16 md:w-16 rounded-lg bg-linear-to-br from-green-500 to-emerald-600 shrink-0">
            <DollarSign className="md:h-8 md:w-8 text-white" />
          </div>
          <div className="flex justify-between flex-1 gap-4 flex-row items-center">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-3xl font-bold tracking-tight">
                  {entry.description}
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm text-muted-foreground">
                  {entry.code}
                </span>
                {entry.customerName && (
                  <>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-sm text-muted-foreground">
                      {entry.customerName}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(entry.status)}>
                {FINANCE_ENTRY_STATUS_LABELS[entry.status]}
              </Badge>
              {entry.currentInstallment != null &&
                entry.totalInstallments != null &&
                entry.totalInstallments > 1 && (
                  <Badge variant="outline">
                    Parcela {entry.currentInstallment}/{entry.totalInstallments}
                  </Badge>
                )}
            </div>
          </div>
        </div>
      </Card>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Dados Gerais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Dados Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Tipo" value="A Receber" />
            {entry.customerName && (
              <InfoRow label="Cliente" value={entry.customerName} />
            )}
            {entry.categoryName && (
              <InfoRow label="Categoria" value={entry.categoryName} />
            )}
            {entry.costCenterName && !hasAllocations && (
              <InfoRow label="Centro de Custo" value={entry.costCenterName} />
            )}
            {hasAllocations && (
              <InfoRow label="Centro de Custo" value="Rateio (ver abaixo)" />
            )}
            {entry.bankAccountName && (
              <InfoRow label="Conta Bancária" value={entry.bankAccountName} />
            )}
            {entry.recurrenceType && (
              <InfoRow
                label="Recorrência"
                value={RECURRENCE_TYPE_LABELS[entry.recurrenceType]}
              />
            )}
            {entry.notes && <InfoRow label="Observações" value={entry.notes} />}
          </CardContent>
        </Card>

        {/* Card 2: Valores */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label="Valor Esperado"
              value={formatCurrency(entry.expectedAmount)}
            />
            {entry.discount > 0 && (
              <InfoRow
                label="Desconto"
                value={`-${formatCurrency(entry.discount)}`}
                className="text-green-600"
              />
            )}
            {entry.interest > 0 && (
              <InfoRow
                label="Juros"
                value={`+${formatCurrency(entry.interest)}`}
                className="text-red-600"
              />
            )}
            {entry.penalty > 0 && (
              <InfoRow
                label="Multa"
                value={`+${formatCurrency(entry.penalty)}`}
                className="text-red-600"
              />
            )}
            <div className="pt-2 border-t">
              <InfoRow
                label="Total Devido"
                value={formatCurrency(entry.totalDue)}
                className="font-bold text-lg"
              />
            </div>
            <InfoRow
              label="Saldo Restante"
              value={formatCurrency(entry.remainingBalance)}
              className={
                entry.remainingBalance > 0
                  ? 'text-orange-600 font-semibold'
                  : 'text-green-600 font-semibold'
              }
            />
            {entry.totalDue - entry.remainingBalance > 0 && (
              <InfoRow
                label="Total Recebido"
                value={formatCurrency(entry.totalDue - entry.remainingBalance)}
                className="text-green-600"
              />
            )}
          </CardContent>
        </Card>

        {/* Card 3: Datas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Emissao" value={formatDate(entry.issueDate)} />
            <InfoRow
              label="Vencimento"
              value={formatDate(entry.dueDate)}
              className={
                entry.isOverdue &&
                entry.status !== 'RECEIVED' &&
                entry.status !== 'PAID'
                  ? 'text-destructive font-medium'
                  : ''
              }
            />
            {entry.competenceDate && (
              <InfoRow
                label="Competencia"
                value={formatDate(entry.competenceDate)}
              />
            )}
            {entry.paymentDate && (
              <InfoRow
                label="Recebimento"
                value={formatDate(entry.paymentDate)}
              />
            )}
          </CardContent>
        </Card>

        {/* Card 4: Parcelamento (if installment) */}
        {entry.recurrenceType === 'INSTALLMENT' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Parcelamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {entry.currentInstallment != null &&
                entry.totalInstallments != null && (
                  <InfoRow
                    label="Parcela"
                    value={`${entry.currentInstallment} de ${entry.totalInstallments}`}
                  />
                )}
              {entry.recurrenceUnit && (
                <InfoRow
                  label="Frequencia"
                  value={RECURRENCE_UNIT_LABELS[entry.recurrenceUnit]}
                />
              )}
              {entry.parentEntryId && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Lançamento Pai
                  </span>
                  <Link
                    href={`/finance/receivable/${entry.parentEntryId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Ver lançamento original
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cost Center Allocations (Rateio) */}
      {hasAllocations && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Rateio de Centro de Custo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table aria-label="Tabela de rateio de centro de custo">
              <TableHeader>
                <TableRow>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead className="text-right">Percentual</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.costCenterAllocations!.map((alloc, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {alloc.costCenterName || alloc.costCenterId}
                    </TableCell>
                    <TableCell className="text-right">
                      {alloc.percentage.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(alloc.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Histórico de Recebimentos
            {entry.payments && entry.payments.length > 0 && (
              <Badge variant="secondary">{entry.payments.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entry.payments && entry.payments.length > 0 ? (
            <Table aria-label="Tabela de histórico de recebimentos">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {formatDate(payment.paidAt)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.method
                        ? (PAYMENT_METHOD_LABELS[
                            payment.method as keyof typeof PAYMENT_METHOD_LABELS
                          ] ?? payment.method)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.bankAccountName || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.reference || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum recebimento registrado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Anexos
              {entry.attachments && entry.attachments.length > 0 && (
                <Badge variant="secondary">{entry.attachments.length}</Badge>
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
              Enviar Anexo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </CardHeader>
        <CardContent>
          {entry.attachments && entry.attachments.length > 0 ? (
            <div className="space-y-2">
              {entry.attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {attachment.fileName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {ATTACHMENT_TYPE_LABELS[attachment.type] ||
                            attachment.type}
                        </Badge>
                        <span>{formatFileSize(attachment.fileSize)}</span>
                        <span>{formatDate(attachment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {attachment.fileUrl && (
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum anexo enviado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Child Entries (Installments) */}
      {entry.childEntries && entry.childEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Parcelas
              <Badge variant="secondary">{entry.childEntries.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table aria-label="Tabela de parcelas do recebimento">
              <TableHeader>
                <TableRow>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.childEntries.map(child => (
                  <TableRow key={child.id}>
                    <TableCell className="text-sm">
                      {child.currentInstallment != null &&
                      child.totalInstallments != null
                        ? `${child.currentInstallment}/${child.totalInstallments}`
                        : child.code}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(child.dueDate)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(child.expectedAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(child.status)}>
                        {FINANCE_ENTRY_STATUS_LABELS[child.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/finance/receivable/${child.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <Card className="p-4 sm:p-6">
          <p className="text-sm text-muted-foreground mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Baixa Modal */}
      {canReceive && (
        <BaixaModal
          open={baixaOpen}
          onOpenChange={setBaixaOpen}
          entry={entry}
          categoryInterestRate={categoryRates.interestRate}
          categoryPenaltyRate={categoryRates.penaltyRate}
        />
      )}

      {/* Delete PIN Confirmation Modal */}
      <VerifyActionPinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={handleDeleteConfirmed}
        title="Confirmar Exclusão"
        description="Digite seu PIN de Ação para confirmar a exclusão desta conta a receber."
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

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
      <span className={cn('text-sm text-right', className)}>{value}</span>
    </div>
  );
}
