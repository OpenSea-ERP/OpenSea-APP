/**
 * OpenSea OS - Quote Detail Page
 * Página de detalhes do orçamento com itens, ações e informações
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
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useQuote,
  useSendQuote,
  useConvertQuoteToOrder,
  useDuplicateQuote,
} from '@/hooks/sales/use-quotes';
import { usePermissions } from '@/hooks/use-permissions';
import { quotesConfig } from '@/config/entities/quotes.config';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { Quote, QuoteItem, QuoteStatus } from '@/types/sales';
import { QUOTE_STATUS_LABELS } from '@/types/sales';
import { SignatureStatusSection } from '../../src/components/signature-status-section';
import {
  Calendar,
  Clock,
  Copy,
  DollarSign,
  Edit,
  FileText,
  Package,
  Send,
  ShoppingCart,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ============================================================================
// STATUS BADGE COLORS
// ============================================================================

const STATUS_COLORS: Record<QuoteStatus, string> = {
  DRAFT:
    'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
  SENT: 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  ACCEPTED:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  REJECTED:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  EXPIRED:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
};

// ============================================================================
// INFO ROW COMPONENT
// ============================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const quoteId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: quoteData, isLoading, error } = useQuote(quoteId);

  const quote = quoteData?.quote as Quote | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const sendMutation = useSendQuote();
  const convertMutation = useConvertQuoteToOrder();
  const duplicateMutation = useDuplicateQuote();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSend = async () => {
    try {
      await sendMutation.mutateAsync(quoteId);
      toast.success('Orçamento enviado com sucesso!');
    } catch {
      toast.error('Erro ao enviar orçamento');
    }
  };

  const handleConvert = async () => {
    try {
      await convertMutation.mutateAsync(quoteId);
      toast.success('Orçamento convertido em pedido com sucesso!');
      router.push('/sales/quotes');
    } catch {
      toast.error('Erro ao converter orçamento em pedido');
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateMutation.mutateAsync(quoteId);
      toast.success('Orçamento duplicado com sucesso!');
    } catch {
      toast.error('Erro ao duplicar orçamento');
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(quote?.status === 'DRAFT' &&
    quotesConfig.permissions.update &&
    hasPermission(quotesConfig.permissions.update)
      ? [
          {
            id: 'edit',
            title: 'Editar',
            icon: Edit,
            onClick: () => router.push(`/sales/quotes/${quoteId}/edit`),
            variant: 'default' as const,
          },
        ]
      : []),
  ];

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Orçamentos', href: '/sales/quotes' },
    { label: quote?.title || '...' },
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

  if (error || !quote) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Orçamento não encontrado"
            message="O orçamento que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Orçamentos',
              onClick: () => router.push('/sales/quotes'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const createdDate = new Date(quote.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const items = (quote.items ?? []) as QuoteItem[];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="quote-detail">
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-sky-500 to-cyan-600">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {quote.customerName || 'Cliente'}
              </p>
              <h1 className="text-xl font-bold truncate">{quote.title}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                  STATUS_COLORS[quote.status]
                )}
              >
                {QUOTE_STATUS_LABELS[quote.status]}
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card className="bg-white/5 p-4">
          <div className="flex flex-wrap gap-2">
            {quote.status === 'DRAFT' &&
              hasPermission(SALES_PERMISSIONS.QUOTES.SEND) && (
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={sendMutation.isPending}
                  className="h-9 px-2.5"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  Enviar
                </Button>
              )}
            {(quote.status === 'SENT' || quote.status === 'ACCEPTED') &&
              hasPermission(SALES_PERMISSIONS.QUOTES.CONVERT) && (
                <Button
                  size="sm"
                  onClick={handleConvert}
                  disabled={convertMutation.isPending}
                  className="h-9 px-2.5"
                >
                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                  Converter em Pedido
                </Button>
              )}
            {hasPermission(SALES_PERMISSIONS.QUOTES.REGISTER) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDuplicate}
                disabled={duplicateMutation.isPending}
                className="h-9 px-2.5"
              >
                <Copy className="h-4 w-4 mr-1.5" />
                Duplicar
              </Button>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="items">Itens ({items.length})</TabsTrigger>
            <TabsTrigger value="signature">Assinatura</TabsTrigger>
          </TabsList>

          {/* TAB: Informações */}
          <TabsContent value="info" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Dados do Orçamento
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Informações gerais do orçamento
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow
                      icon={User}
                      label="Cliente"
                      value={quote.customerName}
                    />
                    <InfoRow
                      icon={DollarSign}
                      label="Total"
                      value={formatCurrency(quote.total)}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Válido até"
                      value={
                        quote.validUntil
                          ? new Date(quote.validUntil).toLocaleDateString(
                              'pt-BR'
                            )
                          : undefined
                      }
                    />
                    <InfoRow
                      icon={Clock}
                      label="Criado em"
                      value={createdDate}
                    />
                    {quote.discount > 0 && (
                      <InfoRow
                        icon={DollarSign}
                        label="Desconto"
                        value={formatCurrency(quote.discount)}
                      />
                    )}
                    <InfoRow
                      icon={DollarSign}
                      label="Subtotal"
                      value={formatCurrency(quote.subtotal)}
                    />
                  </div>

                  {quote.notes && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Observações
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {quote.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Itens */}
          <TabsContent value="items" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Itens do Orçamento
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Produtos e serviços incluídos
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-semibold text-muted-foreground">
                      Nenhum item
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Este orçamento ainda não possui itens adicionados.
                    </p>
                  </div>
                ) : (
                  <div className="w-full rounded-xl border border-border bg-white dark:bg-slate-800/60 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-gray-50 dark:bg-slate-800/80">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            Produto
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Qtd.
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Preço Unit.
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Desconto
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr
                            key={item.id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-4 py-3 font-medium">
                              {item.productName}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatCurrency(item.discount)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 dark:bg-slate-800/80">
                          <td
                            colSpan={4}
                            className="px-4 py-3 text-right font-semibold"
                          >
                            Total
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {formatCurrency(quote.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Assinatura Digital */}
          <TabsContent value="signature" className="space-y-6">
            <SignatureStatusSection
              entityId={quoteId}
              entityType="quote"
              signatureEnvelopeId={quote.signatureEnvelopeId}
              canRequestSignature={
                quote.status === 'SENT' &&
                hasPermission(SALES_PERMISSIONS.QUOTES.SEND)
              }
              defaultSignerName={quote.customerName || ''}
              defaultSignerEmail=""
            />
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
