/**
 * Fiscal Document Detail Page
 * Detalhes do documento fiscal com tabs: Dados Gerais, Itens, Impostos, Eventos
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useFiscalDocument,
  useCancelDocument,
  useCorrectionLetter,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { FiscalDocumentStatus, FiscalDocumentType } from '@/types/fiscal';
import {
  FISCAL_DOCUMENT_STATUS_LABELS,
  FISCAL_DOCUMENT_TYPE_LABELS,
} from '@/types/fiscal';
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Info,
  Package,
  PenLine,
  Receipt,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('pt-BR');
}

function getStatusVariant(
  status: FiscalDocumentStatus
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' {
  switch (status) {
    case 'AUTHORIZED':
      return 'success';
    case 'PENDING':
      return 'default';
    case 'CANCELLED':
    case 'DENIED':
      return 'destructive';
    case 'CORRECTED':
      return 'warning';
    case 'DRAFT':
    case 'INUTILIZED':
    default:
      return 'secondary';
  }
}

function getTypeIcon(type: FiscalDocumentType) {
  return type === 'NFCE' ? Receipt : FileText;
}

function getTypeGradient(type: FiscalDocumentType): string {
  return type === 'NFCE'
    ? 'from-teal-500 to-teal-600'
    : 'from-violet-500 to-violet-600';
}

// =============================================================================
// SUB-COMPONENTS
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
      <span className={cn('text-sm text-right', className)}>{value}</span>
    </div>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function DetailSkeleton() {
  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Documentos Fiscais', href: '/finance/fiscal' },
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
      </PageBody>
    </PageLayout>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function FiscalDocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data, isLoading, refetch } = useFiscalDocument(documentId);
  const cancelMutation = useCancelDocument();
  const correctionMutation = useCorrectionLetter();

  const canDelete = hasPermission(FINANCE_PERMISSIONS.FISCAL.REMOVE);
  const canView = hasPermission(FINANCE_PERMISSIONS.FISCAL.ACCESS);

  const [cancelPinOpen, setCancelPinOpen] = useState(false);
  const [cancelReasonOpen, setCancelReasonOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionText, setCorrectionText] = useState('');

  const document = data?.document;

  const handleCancelPinSuccess = useCallback(() => {
    setCancelPinOpen(false);
    setCancelReasonOpen(true);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (!document) return;
    try {
      await cancelMutation.mutateAsync({
        id: document.id,
        data: { reason: cancelReason },
      });
      setCancelReasonOpen(false);
      setCancelReason('');
      toast.success('Documento fiscal cancelado com sucesso.');
      refetch();
    } catch {
      toast.error('Erro ao cancelar documento fiscal.');
    }
  }, [document, cancelReason, cancelMutation, refetch]);

  const handleCorrectionConfirm = useCallback(async () => {
    if (!document) return;
    try {
      await correctionMutation.mutateAsync({
        id: document.id,
        data: { correctionText },
      });
      setCorrectionOpen(false);
      setCorrectionText('');
      toast.success('Carta de correção emitida com sucesso.');
      refetch();
    } catch {
      toast.error('Erro ao emitir carta de correção.');
    }
  }, [document, correctionText, correctionMutation, refetch]);

  if (isLoading) return <DetailSkeleton />;

  if (!document) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Documentos Fiscais', href: '/finance/fiscal' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-12 text-center">
            <p className="text-destructive text-lg">
              Documento fiscal não encontrado.
            </p>
            <Link href="/finance/fiscal">
              <Button variant="outline" className="mt-4">
                Voltar para documentos fiscais
              </Button>
            </Link>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const TypeIcon = getTypeIcon(document.type);

  // Build action buttons for PageActionBar
  const actionBarButtons = [
    ...(canView && document.danfePdfUrl
      ? [
          {
            id: 'download-danfe',
            title: 'Baixar DANFE',
            icon: Download,
            onClick: () => window.open(document.danfePdfUrl!, '_blank'),
            variant: 'outline' as const,
          },
        ]
      : []),
    ...(canView && document.status === 'AUTHORIZED'
      ? [
          {
            id: 'correction-letter',
            title: 'Carta de Correção',
            icon: PenLine,
            onClick: () => {
              setCorrectionText('');
              setCorrectionOpen(true);
            },
            variant: 'outline' as const,
          },
        ]
      : []),
    ...(canDelete && document.status === 'AUTHORIZED'
      ? [
          {
            id: 'cancel-doc',
            title: 'Cancelar',
            icon: XCircle,
            onClick: () => setCancelPinOpen(true),
            variant: 'destructive' as const,
          },
        ]
      : []),
  ];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Documentos Fiscais', href: '/finance/fiscal' },
            {
              label: `${FISCAL_DOCUMENT_TYPE_LABELS[document.type]} ${document.series}/${document.number}`,
            },
          ]}
          buttons={actionBarButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="p-4 sm:p-6">
          <div className="flex gap-4 sm:gap-6 items-center">
            <div
              className={cn(
                'flex items-center justify-center h-12 w-12 md:h-16 md:w-16 rounded-lg bg-linear-to-br shrink-0',
                getTypeGradient(document.type)
              )}
            >
              <TypeIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div className="flex justify-between flex-1 gap-4 flex-row items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-3xl font-bold tracking-tight">
                    {FISCAL_DOCUMENT_TYPE_LABELS[document.type]}{' '}
                    {document.series}/{document.number}
                  </h1>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                  {document.accessKey && (
                    <span className="font-mono text-xs text-muted-foreground break-all">
                      {document.accessKey}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Emitido em {formatDate(document.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(document.status)}>
                  {FISCAL_DOCUMENT_STATUS_LABELS[document.status]}
                </Badge>
                <Badge variant="outline">
                  {FISCAL_DOCUMENT_TYPE_LABELS[document.type]}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Produtos</span>
            </div>
            <p className="text-xl font-bold font-mono">
              {formatCurrency(document.totalProducts)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Impostos</span>
            </div>
            <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatCurrency(document.totalTax)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Valor Total</span>
            </div>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(document.totalValue)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Protocolo</span>
            </div>
            <p className="text-sm font-bold font-mono truncate">
              {document.protocolNumber ?? '-'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(document.protocolDate)}
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 mb-4">
            <TabsTrigger value="general">Dados Gerais</TabsTrigger>
            <TabsTrigger value="items">Itens</TabsTrigger>
            <TabsTrigger value="taxes">Impostos</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
          </TabsList>

          {/* Tab: Dados Gerais */}
          <TabsContent value="general">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Destinatário
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Nome" value={document.recipientName ?? '-'} />
                  <InfoRow
                    label="CNPJ/CPF"
                    value={document.recipientCnpjCpf ?? '-'}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Informações da Nota
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow
                    label="Natureza da Operação"
                    value={document.naturezaOperacao ?? '-'}
                  />
                  <InfoRow
                    label="Série / Número"
                    value={`${document.series} / ${document.number}`}
                  />
                  <InfoRow
                    label="Chave de Acesso"
                    value={document.accessKey ?? '-'}
                    className="font-mono text-xs break-all"
                  />
                  {document.orderId && (
                    <InfoRow
                      label="Pedido Vinculado"
                      value={document.orderId}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Totais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow
                    label="Total Produtos"
                    value={formatCurrency(document.totalProducts)}
                    className="font-mono"
                  />
                  <InfoRow
                    label="Total Impostos"
                    value={formatCurrency(document.totalTax)}
                    className="font-mono"
                  />
                  <InfoRow
                    label="Valor Total"
                    value={formatCurrency(document.totalValue)}
                    className="font-mono font-bold"
                  />
                </CardContent>
              </Card>

              {document.cancelledAt && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <XCircle className="h-4 w-4" />
                      Cancelamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow
                      label="Cancelado em"
                      value={formatDateTime(document.cancelledAt)}
                    />
                    <InfoRow
                      label="Motivo"
                      value={document.cancelReason ?? '-'}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab: Itens */}
          <TabsContent value="items">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens da Nota ({document.items?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {document.items && document.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 pr-4 text-muted-foreground font-medium">
                            #
                          </th>
                          <th className="pb-2 pr-4 text-muted-foreground font-medium">
                            Produto
                          </th>
                          <th className="pb-2 pr-4 text-muted-foreground font-medium">
                            Código
                          </th>
                          <th className="pb-2 pr-4 text-muted-foreground font-medium">
                            NCM
                          </th>
                          <th className="pb-2 pr-4 text-muted-foreground font-medium">
                            CFOP
                          </th>
                          <th className="pb-2 pr-4 text-muted-foreground font-medium text-right">
                            Qtd
                          </th>
                          <th className="pb-2 pr-4 text-muted-foreground font-medium text-right">
                            Unitário
                          </th>
                          <th className="pb-2 text-muted-foreground font-medium text-right">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {document.items.map(item => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="py-3 pr-4 text-muted-foreground">
                              {item.itemNumber}
                            </td>
                            <td className="py-3 pr-4 font-medium">
                              {item.productName}
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs">
                              {item.productCode ?? '-'}
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs">
                              {item.ncm ?? '-'}
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs">
                              {item.cfop}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono">
                              {item.quantity}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="py-3 text-right font-mono font-medium">
                              {formatCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum item encontrado.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Impostos */}
          <TabsContent value="taxes">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Detalhamento de Impostos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {document.taxes ? (
                  <div className="space-y-3">
                    <InfoRow
                      label="ICMS Total"
                      value={formatCurrency(document.taxes.icmsTotal)}
                      className="font-mono"
                    />
                    <InfoRow
                      label="IPI Total"
                      value={formatCurrency(document.taxes.ipiTotal)}
                      className="font-mono"
                    />
                    <InfoRow
                      label="PIS Total"
                      value={formatCurrency(document.taxes.pisTotal)}
                      className="font-mono"
                    />
                    <InfoRow
                      label="COFINS Total"
                      value={formatCurrency(document.taxes.cofinsTotal)}
                      className="font-mono"
                    />
                    <InfoRow
                      label="ISS Total"
                      value={formatCurrency(document.taxes.issTotal)}
                      className="font-mono"
                    />
                    <div className="border-t pt-3 mt-3">
                      <InfoRow
                        label="Total de Impostos"
                        value={formatCurrency(document.taxes.totalTax)}
                        className="font-mono font-bold text-amber-600 dark:text-amber-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Fallback: show per-item ICMS if no aggregated taxes */}
                    {document.items && document.items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="pb-2 pr-4 text-muted-foreground font-medium">
                                #
                              </th>
                              <th className="pb-2 pr-4 text-muted-foreground font-medium">
                                Produto
                              </th>
                              <th className="pb-2 pr-4 text-muted-foreground font-medium text-right">
                                Aliquota ICMS
                              </th>
                              <th className="pb-2 text-muted-foreground font-medium text-right">
                                Valor ICMS
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {document.items.map(item => (
                              <tr
                                key={item.id}
                                className="border-b last:border-0"
                              >
                                <td className="py-3 pr-4 text-muted-foreground">
                                  {item.itemNumber}
                                </td>
                                <td className="py-3 pr-4">
                                  {item.productName}
                                </td>
                                <td className="py-3 pr-4 text-right font-mono">
                                  {item.icmsRate}%
                                </td>
                                <td className="py-3 text-right font-mono">
                                  {formatCurrency(item.icmsValue)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Informações de impostos não disponíveis.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Eventos */}
          <TabsContent value="events">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Histórico de Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {document.events && document.events.length > 0 ? (
                  <div className="relative">
                    {/* Timeline */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-6">
                      {document.events.map(event => (
                        <div key={event.id} className="flex gap-4 relative">
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-border flex items-center justify-center z-10 shrink-0">
                            {event.type === 'AUTHORIZATION' ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : event.type === 'CANCELLATION' ? (
                              <XCircle className="h-4 w-4 text-rose-500" />
                            ) : event.type === 'CORRECTION' ? (
                              <PenLine className="h-4 w-4 text-amber-500" />
                            ) : (
                              <Info className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 pb-1">
                            <p className="text-sm font-medium">
                              {event.description}
                            </p>
                            {event.protocolNumber && (
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                Protocolo: {event.protocolNumber}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDateTime(event.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum evento registrado.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* Cancel PIN Confirmation */}
      <VerifyActionPinModal
        isOpen={cancelPinOpen}
        onClose={() => setCancelPinOpen(false)}
        onSuccess={handleCancelPinSuccess}
        title="Cancelar Documento Fiscal"
        description="Digite seu PIN de Ação para confirmar o cancelamento deste documento fiscal."
      />

      {/* Cancel Reason Dialog */}
      <Dialog
        open={cancelReasonOpen}
        onOpenChange={open => {
          if (!open) {
            setCancelReasonOpen(false);
            setCancelReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo do Cancelamento</DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento do documento fiscal. Este motivo
              será enviado à SEFAZ.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancel-reason">Motivo</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Descreva o motivo do cancelamento..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelReasonOpen(false);
                setCancelReason('');
              }}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
            >
              {cancelMutation.isPending
                ? 'Cancelando...'
                : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Correction Letter Dialog */}
      <Dialog
        open={correctionOpen}
        onOpenChange={open => {
          if (!open) {
            setCorrectionOpen(false);
            setCorrectionText('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carta de Correção</DialogTitle>
            <DialogDescription>
              Informe o texto de correção. Esta carta será enviada à SEFAZ.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="correction-text">Texto de Correção</Label>
              <Textarea
                id="correction-text"
                placeholder="Descreva a correção a ser feita..."
                value={correctionText}
                onChange={e => setCorrectionText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCorrectionOpen(false);
                setCorrectionText('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCorrectionConfirm}
              disabled={!correctionText.trim() || correctionMutation.isPending}
            >
              {correctionMutation.isPending
                ? 'Enviando...'
                : 'Emitir Carta de Correção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
