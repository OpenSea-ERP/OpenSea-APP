'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useOrder,
  useDeleteOrder,
  useConfirmOrder,
  useCancelOrder,
  useConvertQuote,
} from '@/hooks/sales/use-orders';
import { PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  CheckCircle,
  FileText,
  Pencil,
  RotateCcw,
  ShoppingCart,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const ORDER_TYPE_LABELS: Record<string, string> = {
  QUOTE: 'Orçamento',
  ORDER: 'Pedido',
};

const CHANNEL_LABELS: Record<string, string> = {
  PDV: 'PDV',
  WEB: 'Web',
  WHATSAPP: 'WhatsApp',
  MARKETPLACE: 'Marketplace',
  BID: 'Licitação',
  MANUAL: 'Manual',
  API: 'API',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dateStr));
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(PERMISSIONS.SALES.ORDERS.MODIFY);
  const canDelete = hasPermission(PERMISSIONS.SALES.ORDERS.REMOVE);

  const { data, isLoading, error } = useOrder(orderId);
  const deleteOrder = useDeleteOrder();
  const confirmOrder = useConfirmOrder();
  const cancelOrder = useCancelOrder();
  const convertQuote = useConvertQuote();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbs={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Pedidos', href: '/sales/orders' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbs={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Pedidos', href: '/sales/orders' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError />
        </PageBody>
      </PageLayout>
    );
  }

  const { order, items } = data;

  const handleDelete = async () => {
    try {
      await deleteOrder.mutateAsync(orderId);
      toast.success('Pedido excluído com sucesso.');
      router.push('/sales/orders');
    } catch {
      toast.error('Erro ao excluir pedido.');
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmOrder.mutateAsync(orderId);
      toast.success('Pedido confirmado com sucesso.');
    } catch {
      toast.error('Erro ao confirmar pedido.');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOrder.mutateAsync({ id: orderId, data: {} });
      toast.success('Pedido cancelado.');
    } catch {
      toast.error('Erro ao cancelar pedido.');
    }
  };

  const handleConvert = async () => {
    try {
      await convertQuote.mutateAsync(orderId);
      toast.success('Orçamento convertido em pedido.');
    } catch {
      toast.error('Erro ao converter orçamento.');
    }
  };

  const actionButtons = [];

  if (canDelete) {
    actionButtons.push({
      label: 'Excluir',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => setDeleteModalOpen(true),
    });
  }

  if (canEdit) {
    actionButtons.push({
      label: 'Editar',
      icon: Pencil,
      onClick: () => router.push(`/sales/orders/${orderId}/edit`),
    });
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Pedidos', href: '/sales/orders' },
            { label: order.orderNumber },
          ]}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              {order.type === 'QUOTE' ? (
                <FileText className="h-6 w-6 text-blue-500" />
              ) : (
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{order.orderNumber}</h1>
              <p className="text-sm text-muted-foreground">
                {ORDER_TYPE_LABELS[order.type]} via{' '}
                {CHANNEL_LABELS[order.channel]} - Criado em{' '}
                {formatDate(order.createdAt)}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">
                  {ORDER_TYPE_LABELS[order.type]}
                </Badge>
                <Badge variant="secondary">
                  {CHANNEL_LABELS[order.channel]}
                </Badge>
                {order.needsApproval && (
                  <Badge variant="destructive">Aprovação pendente</Badge>
                )}
                {order.cancelledAt && (
                  <Badge variant="destructive">Cancelado</Badge>
                )}
                {order.confirmedAt && (
                  <Badge className="bg-green-500/10 text-green-500">
                    Confirmado
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {formatCurrency(order.grandTotal)}
              </p>
              {order.remainingAmount > 0 && (
                <p className="text-sm text-amber-500">
                  Restante: {formatCurrency(order.remainingAmount)}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        {canEdit && (
          <div className="flex gap-2">
            {order.type === 'QUOTE' && (
              <Button
                size="sm"
                onClick={handleConvert}
                disabled={convertQuote.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Converter em Pedido
              </Button>
            )}
            {!order.confirmedAt && !order.cancelledAt && (
              <>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={confirmOrder.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={cancelOrder.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        )}

        {/* Pricing Card */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-5 py-3">
            <h2 className="font-semibold mb-3">Resumo Financeiro</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Subtotal</p>
                <p className="font-medium">{formatCurrency(order.subtotal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Desconto</p>
                <p className="font-medium text-green-500">
                  -{formatCurrency(order.discountTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impostos</p>
                <p className="font-medium">{formatCurrency(order.taxTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Frete</p>
                <p className="font-medium">
                  {formatCurrency(order.shippingTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-bold text-lg">
                  {formatCurrency(order.grandTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pago</p>
                <p className="font-medium text-green-500">
                  {formatCurrency(order.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Crédito Utilizado
                </p>
                <p className="font-medium">{formatCurrency(order.creditUsed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Restante</p>
                <p className="font-bold text-amber-500">
                  {formatCurrency(order.remainingAmount)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Items Table */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-5 py-3">
            <h2 className="font-semibold mb-3">
              Itens ({items.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2 pr-4">#</th>
                    <th className="text-left py-2 pr-4">Produto</th>
                    <th className="text-left py-2 pr-4">SKU</th>
                    <th className="text-right py-2 pr-4">Qtd</th>
                    <th className="text-right py-2 pr-4">Preço Unit.</th>
                    <th className="text-right py-2 pr-4">Desconto</th>
                    <th className="text-right py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="py-2 pr-4 font-medium">{item.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {item.sku ?? '-'}
                      </td>
                      <td className="py-2 pr-4 text-right">{item.quantity}</td>
                      <td className="py-2 pr-4 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2 pr-4 text-right text-green-500">
                        {item.discountValue > 0
                          ? `-${formatCurrency(item.discountValue)}`
                          : '-'}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {(order.notes || order.internalNotes) && (
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-5 py-3">
              <h2 className="font-semibold mb-3">Observações</h2>
              {order.notes && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Notas públicas
                  </p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
              {order.internalNotes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Notas internas
                  </p>
                  <p className="text-sm">{order.internalNotes}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDelete}
          title="Confirmar Exclusão"
          description={`Digite seu PIN de ação para excluir o pedido ${order.orderNumber}.`}
        />
      </PageBody>
    </PageLayout>
  );
}
