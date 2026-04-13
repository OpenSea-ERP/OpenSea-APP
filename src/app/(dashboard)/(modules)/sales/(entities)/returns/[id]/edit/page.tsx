/**
 * OpenSea OS - Edit Return Page
 * Página de edicao da devolucao seguindo o padrão: PageLayout > PageHeader > PageBody
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
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useReturn,
  useUpdateReturn,
  useDeleteReturn,
} from '@/hooks/sales/use-returns';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type { OrderReturnDTO, RefundMethod, ReturnReason } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  ClipboardList,
  Loader2,
  NotebookText,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// LABELS
// ============================================================================

const TYPE_LABELS: Record<string, string> = {
  FULL_RETURN: 'Devolucao total',
  PARTIAL_RETURN: 'Devolucao parcial',
  EXCHANGE: 'Troca',
};

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
// PAGE
// ============================================================================

export default function EditReturnPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const returnId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: returnData,
    isLoading: isLoadingReturn,
    error,
  } = useReturn(returnId);

  const orderReturn = returnData?.orderReturn as OrderReturnDTO | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateReturn();
  const deleteMutation = useDeleteReturn();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reason, setReason] = useState<ReturnReason>('DEFECTIVE');
  const [reasonDetails, setReasonDetails] = useState('');
  const [refundMethod, setRefundMethod] = useState<RefundMethod | ''>('');
  const [refundAmount, setRefundAmount] = useState('');
  const [notes, setNotes] = useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (orderReturn) {
      setReason(orderReturn.reason || 'DEFECTIVE');
      setReasonDetails(orderReturn.reasonDetails || '');
      setRefundMethod(orderReturn.refundMethod || '');
      setRefundAmount(
        orderReturn.refundAmount ? String(orderReturn.refundAmount) : ''
      );
      setNotes(orderReturn.notes || '');
    }
  }, [orderReturn]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        returnId,
        data: {
          reason,
          reasonDetails: reasonDetails.trim() || undefined,
          refundMethod: refundMethod || undefined,
          refundAmount: refundAmount ? Number(refundAmount) : undefined,
          notes: notes.trim() || undefined,
        },
      });

      toast.success('Devolucao atualizada com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['returns', returnId],
      });
      router.push(`/sales/returns/${returnId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar devolucao',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar devolucao', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(returnId);
      toast.success('Devolucao excluída com sucesso!');
      router.push('/sales/returns');
    } catch (err) {
      logger.error(
        'Erro ao excluir devolucao',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir devolucao', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const canDelete = hasPermission(SALES_PERMISSIONS.RETURNS.ADMIN);

  const actionButtons: HeaderButton[] = [
    ...(canDelete
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => setDeleteModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving,
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Devolucoes', href: '/sales/returns' },
    {
      label: orderReturn?.returnNumber || '...',
      href: `/sales/returns/${returnId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingReturn) {
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
            message="A devolucao solicitada não foi encontrada."
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
                Editando devolucao
              </p>
              <h1 className="text-xl font-bold truncate">
                {orderReturn.returnNumber}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                  STATUS_COLORS[orderReturn.status] || STATUS_COLORS.CANCELLED
                }`}
              >
                {STATUS_LABELS[orderReturn.status] || orderReturn.status}
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Tipo</p>
                  <p className="text-[11px] text-muted-foreground">
                    {TYPE_LABELS[orderReturn.type] || orderReturn.type}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Motivo da Devolucao */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={ClipboardList}
                title="Motivo da Devolucao"
                subtitle="Informações sobre o motivo da devolucao"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="reason">
                      Motivo <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={reason}
                      onValueChange={v => setReason(v as ReturnReason)}
                    >
                      <SelectTrigger id="reason">
                        <SelectValue placeholder="Selecione o motivo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEFECTIVE">Defeituoso</SelectItem>
                        <SelectItem value="WRONG_ITEM">Item errado</SelectItem>
                        <SelectItem value="CHANGED_MIND">
                          Desistencia
                        </SelectItem>
                        <SelectItem value="DAMAGED">Danificado</SelectItem>
                        <SelectItem value="NOT_AS_DESCRIBED">
                          Diferente do descrito
                        </SelectItem>
                        <SelectItem value="OTHER">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reasonDetails">Detalhes do motivo</Label>
                  <Textarea
                    id="reasonDetails"
                    value={reasonDetails}
                    onChange={e => setReasonDetails(e.target.value)}
                    placeholder="Descreva detalhes adicionais sobre o motivo da devolucao..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Reembolso */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Banknote}
                title="Reembolso"
                subtitle="Informações sobre o reembolso ao cliente"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="refundMethod">Metodo de reembolso</Label>
                    <Select
                      value={refundMethod}
                      onValueChange={v =>
                        setRefundMethod(v as RefundMethod | '')
                      }
                    >
                      <SelectTrigger id="refundMethod">
                        <SelectValue placeholder="Selecione o metodo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAME_METHOD">
                          Mesmo metodo de pagamento
                        </SelectItem>
                        <SelectItem value="STORE_CREDIT">
                          Credito na loja
                        </SelectItem>
                        <SelectItem value="BANK_TRANSFER">
                          Transferencia bancaria
                        </SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="refundAmount">Valor do reembolso</Label>
                    <Input
                      id="refundAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={refundAmount}
                      onChange={e => setRefundAmount(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Observações */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Observações"
                subtitle="Notas internas sobre a devolucao"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notas internas sobre a devolucao..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Devolucao"
        description={`Digite seu PIN de ação para excluir a devolucao "${orderReturn.returnNumber}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
