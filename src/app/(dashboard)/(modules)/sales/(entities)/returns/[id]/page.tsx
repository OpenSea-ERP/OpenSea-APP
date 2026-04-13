/**
 * OpenSea OS - Return Detail Page
 * Página de detalhes da devolucao com informações completas
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
import { useReturn } from '@/hooks/sales/use-returns';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { OrderReturnDTO } from '@/types/sales';
import {
  ArrowLeftRight,
  Banknote,
  Calendar,
  ClipboardList,
  Edit,
  Hash,
  NotebookText,
  RotateCcw,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// ============================================================================
// LABELS
// ============================================================================

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Solicitada',
  APPROVED: 'Aprovada',
  RECEIVING: 'Recebendo',
  RECEIVED: 'Recebida',
  CREDIT_ISSUED: 'Credito emitido',
  EXCHANGE_COMPLETED: 'Troca concluida',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
};

const REASON_LABELS: Record<string, string> = {
  DEFECTIVE: 'Defeituoso',
  WRONG_ITEM: 'Item errado',
  CHANGED_MIND: 'Desistencia',
  DAMAGED: 'Danificado',
  NOT_AS_DESCRIBED: 'Diferente do descrito',
  OTHER: 'Outro',
};

const TYPE_LABELS: Record<string, string> = {
  FULL_RETURN: 'Devolucao total',
  PARTIAL_RETURN: 'Devolucao parcial',
  EXCHANGE: 'Troca',
};

const REFUND_METHOD_LABELS: Record<string, string> = {
  SAME_METHOD: 'Mesmo metodo de pagamento',
  STORE_CREDIT: 'Credito na loja',
  BANK_TRANSFER: 'Transferencia bancaria',
  PIX: 'PIX',
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED:
    'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  APPROVED:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  RECEIVING:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  RECEIVED:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  CREDIT_ISSUED:
    'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
  EXCHANGE_COMPLETED:
    'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
  REJECTED:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  CANCELLED:
    'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
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
// SECTION HEADER
// ============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// PAGE
// ============================================================================

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const returnId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: returnData, isLoading, error } = useReturn(returnId);

  const orderReturn = returnData?.orderReturn as OrderReturnDTO | undefined;

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.RETURNS.REGISTER)
      ? [
          {
            id: 'edit',
            title: 'Editar Devolucao',
            icon: Edit,
            onClick: () => router.push(`/sales/returns/${returnId}/edit`),
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
    { label: 'Devolucoes', href: '/sales/returns' },
    { label: orderReturn?.returnNumber || '...' },
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

  if (error || !orderReturn) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Devolucao não encontrada"
            message="A devolucao que você está procurando não existe ou foi removida."
            action={{
              label: 'Voltar para Devolucoes',
              onClick: () => router.push('/sales/returns'),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-orange-500 to-amber-600">
              <RotateCcw className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {TYPE_LABELS[orderReturn.type] || orderReturn.type}
              </p>
              <h1 className="text-xl font-bold truncate">
                {orderReturn.returnNumber}
              </h1>
              <p className="text-sm text-muted-foreground">
                Criada em {formatDate(orderReturn.createdAt)}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                  STATUS_COLORS[orderReturn.status] || STATUS_COLORS.CANCELLED
                }`}
              >
                {STATUS_LABELS[orderReturn.status] || orderReturn.status}
              </div>
            </div>
          </div>
        </Card>

        {/* Dados da Devolucao */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <SectionHeader
              icon={ClipboardList}
              title="Dados da Devolucao"
              subtitle="Informações gerais sobre a devolucao"
            />

            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={Hash}
                  label="Número da devolucao"
                  value={orderReturn.returnNumber}
                />
                <InfoRow
                  icon={Hash}
                  label="Pedido vinculado"
                  value={orderReturn.orderId}
                />
                <InfoRow
                  icon={ArrowLeftRight}
                  label="Tipo"
                  value={TYPE_LABELS[orderReturn.type] || orderReturn.type}
                />
                <InfoRow
                  icon={ClipboardList}
                  label="Motivo"
                  value={
                    REASON_LABELS[orderReturn.reason] || orderReturn.reason
                  }
                />
                <InfoRow
                  icon={NotebookText}
                  label="Detalhes do motivo"
                  value={orderReturn.reasonDetails}
                />
                <InfoRow
                  icon={Calendar}
                  label="Data de criação"
                  value={formatDateTime(orderReturn.createdAt)}
                />
                <InfoRow
                  icon={Calendar}
                  label="Última atualização"
                  value={formatDateTime(orderReturn.updatedAt)}
                />
                {orderReturn.exchangeOrderId && (
                  <InfoRow
                    icon={ArrowLeftRight}
                    label="Pedido de troca"
                    value={orderReturn.exchangeOrderId}
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Valores e Reembolso */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <SectionHeader
              icon={Banknote}
              title="Valores e Reembolso"
              subtitle="Informações financeiras da devolucao"
            />

            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={Banknote}
                  label="Valor do reembolso"
                  value={formatCurrency(orderReturn.refundAmount)}
                />
                <InfoRow
                  icon={Banknote}
                  label="Valor em credito"
                  value={
                    orderReturn.creditAmount > 0
                      ? formatCurrency(orderReturn.creditAmount)
                      : null
                  }
                />
                <InfoRow
                  icon={Banknote}
                  label="Metodo de reembolso"
                  value={
                    orderReturn.refundMethod
                      ? REFUND_METHOD_LABELS[orderReturn.refundMethod] ||
                        orderReturn.refundMethod
                      : null
                  }
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Aprovação e Recebimento */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <SectionHeader
              icon={ShieldCheck}
              title="Aprovação e Recebimento"
              subtitle="Histórico de aprovação e recebimento da devolucao"
            />

            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={User}
                  label="Solicitado por"
                  value={orderReturn.requestedByUserId}
                />
                <InfoRow
                  icon={User}
                  label="Aprovado por"
                  value={orderReturn.approvedByUserId}
                />
                <InfoRow
                  icon={Calendar}
                  label="Data de aprovação"
                  value={formatDateTime(orderReturn.approvedAt)}
                />
                <InfoRow
                  icon={Calendar}
                  label="Data de recebimento"
                  value={formatDateTime(orderReturn.receivedAt)}
                />
                {orderReturn.rejectedReason && (
                  <InfoRow
                    icon={NotebookText}
                    label="Motivo da rejeicao"
                    value={orderReturn.rejectedReason}
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Observações */}
        {orderReturn.notes && (
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-6 py-4 space-y-6">
              <SectionHeader
                icon={NotebookText}
                title="Observações"
                subtitle="Notas adicionais sobre a devolucao"
              />

              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <p className="text-sm whitespace-pre-wrap">
                  {orderReturn.notes}
                </p>
              </div>
            </div>
          </Card>
        )}
      </PageBody>
    </PageLayout>
  );
}
