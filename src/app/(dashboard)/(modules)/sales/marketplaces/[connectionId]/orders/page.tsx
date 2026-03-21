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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  useMarketplaceConnection,
  useMarketplaceOrdersInfinite,
  useAcknowledgeMarketplaceOrder,
} from '@/hooks/sales/use-marketplaces';
import type { MarketplaceOrderDTO, MarketplaceOrderStatus } from '@/types/sales';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ListOrdered,
  Package,
  Truck,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }
> = {
  RECEIVED: { label: 'Recebido', variant: 'secondary', icon: Clock },
  ACKNOWLEDGED: { label: 'Confirmado', variant: 'default', icon: CheckCircle },
  PROCESSING: { label: 'Processando', variant: 'default', icon: Package },
  SHIPPED: { label: 'Enviado', variant: 'default', icon: Truck },
  DELIVERED: { label: 'Entregue', variant: 'default', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
  RETURNED: { label: 'Devolvido', variant: 'destructive', icon: XCircle },
  DISPUTE: { label: 'Disputa', variant: 'destructive', icon: XCircle },
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'RECEIVED', label: 'Recebido' },
  { value: 'ACKNOWLEDGED', label: 'Confirmado' },
  { value: 'PROCESSING', label: 'Processando' },
  { value: 'SHIPPED', label: 'Enviado' },
  { value: 'DELIVERED', label: 'Entregue' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'RETURNED', label: 'Devolvido' },
  { value: 'DISPUTE', label: 'Disputa' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function OrderRow({
  order,
  onAcknowledge,
}: {
  order: MarketplaceOrderDTO;
  onAcknowledge: (id: string) => void;
}) {
  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.RECEIVED;
  const StatusIcon = statusCfg.icon;

  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListOrdered className="h-5 w-5 text-primary/60" />
          <div>
            <p className="text-sm font-medium">{order.externalOrderId}</p>
            <p className="text-xs text-muted-foreground">
              {order.buyerName}
              {order.buyerEmail && ` - ${order.buyerEmail}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {formatCurrency(order.netAmount)}
          </span>
          <Badge variant={statusCfg.variant} className="text-xs">
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusCfg.label}
          </Badge>
          {order.status === 'RECEIVED' && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onAcknowledge(order.id)}
            >
              Confirmar
            </Button>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Recebido: {new Date(order.receivedAt).toLocaleString('pt-BR')}
        </span>
        <span>Subtotal: {formatCurrency(order.subtotal)}</span>
        <span>Frete: {formatCurrency(order.shippingCost)}</span>
        <span>Taxa: {formatCurrency(order.marketplaceFee)}</span>
        {order.trackingCode && <span>Rastreio: {order.trackingCode}</span>}
      </div>
    </Card>
  );
}

export default function MarketplaceOrdersPage() {
  const router = useRouter();
  const params = useParams();
  const connectionId = params.connectionId as string;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: connection } = useMarketplaceConnection(connectionId);
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMarketplaceOrdersInfinite(
    connectionId,
    statusFilter ? (statusFilter as MarketplaceOrderStatus) : undefined,
  );
  const acknowledgeMutation = useAcknowledgeMarketplaceOrder();

  const orders = data?.pages.flatMap((page) => page.orders) ?? [];

  const handleAcknowledge = useCallback(
    async (id: string) => {
      try {
        await acknowledgeMutation.mutateAsync(id);
        toast.success('Pedido confirmado com sucesso!');
      } catch {
        toast.error('Erro ao confirmar pedido.');
      }
    },
    [acknowledgeMutation],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Marketplaces', href: '/sales/marketplaces' },
            {
              label: connection?.name ?? '...',
              href: `/sales/marketplaces/${connectionId}`,
            },
            { label: 'Pedidos' },
          ]}
        >
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2.5"
            onClick={() =>
              router.push(`/sales/marketplaces/${connectionId}`)
            }
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </PageActionBar>
      </PageHeader>
      <PageBody>
        <div className="mb-4">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
          />
        </div>

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ListOrdered className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium">
              Nenhum pedido encontrado
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pedidos recebidos do marketplace aparecrao aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onAcknowledge={handleAcknowledge}
              />
            ))}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && <GridLoading />}
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}
