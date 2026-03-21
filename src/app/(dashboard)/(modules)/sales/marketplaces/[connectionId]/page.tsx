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
import {
  useMarketplaceConnection,
  useMarketplaceReconciliation,
} from '@/hooks/sales/use-marketplaces';
import {
  ArrowLeft,
  Box,
  DollarSign,
  ListOrdered,
  ShoppingBag,
  Wifi,
  WifiOff,
  AlertTriangle,
  Pause,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const MARKETPLACE_LABELS: Record<string, string> = {
  MERCADO_LIVRE: 'Mercado Livre',
  SHOPEE: 'Shopee',
  AMAZON: 'Amazon',
  MAGALU: 'Magazine Luiza',
  TIKTOK_SHOP: 'TikTok Shop',
  AMERICANAS: 'Americanas',
  ALIEXPRESS: 'AliExpress',
  CASAS_BAHIA: 'Casas Bahia',
  SHEIN: 'Shein',
  CUSTOM: 'Personalizado',
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }
> = {
  ACTIVE: { label: 'Ativo', variant: 'default', icon: Wifi },
  PAUSED: { label: 'Pausado', variant: 'secondary', icon: Pause },
  DISCONNECTED: { label: 'Desconectado', variant: 'outline', icon: WifiOff },
  ERROR: { label: 'Erro', variant: 'destructive', icon: AlertTriangle },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function ConnectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const connectionId = params.connectionId as string;

  const { data: connection, isLoading, error } = useMarketplaceConnection(connectionId);
  const { data: reconciliation } = useMarketplaceReconciliation(connectionId);

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbs={[
              { label: 'Vendas' },
              { label: 'Marketplaces', href: '/sales/marketplaces' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody><GridLoading /></PageBody>
      </PageLayout>
    );
  }

  if (error || !connection) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbs={[
              { label: 'Vendas' },
              { label: 'Marketplaces', href: '/sales/marketplaces' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody><GridError /></PageBody>
      </PageLayout>
    );
  }

  const statusCfg = STATUS_CONFIG[connection.status] ?? STATUS_CONFIG.ERROR;
  const StatusIcon = statusCfg.icon;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Marketplaces', href: '/sales/marketplaces' },
            { label: connection.name },
          ]}
        >
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2.5"
            onClick={() => router.push('/sales/marketplaces')}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </PageActionBar>
      </PageHeader>
      <PageBody>
        <div className="space-y-6">
          {/* Identity Card */}
          <Card className="bg-white/5 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{connection.name}</h2>
                  <Badge variant={statusCfg.variant} className="text-xs">
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusCfg.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {MARKETPLACE_LABELS[connection.marketplace] ?? connection.marketplace}
                  {connection.sellerName && ` - ${connection.sellerName}`}
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card
              className="bg-white dark:bg-slate-800/60 border border-border p-4 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => router.push(`/sales/marketplaces/${connectionId}/listings`)}
            >
              <div className="flex items-center gap-3">
                <Box className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">Anuncios</p>
                  <p className="text-xs text-muted-foreground">
                    Gerenciar produtos publicados
                  </p>
                </div>
              </div>
            </Card>
            <Card
              className="bg-white dark:bg-slate-800/60 border border-border p-4 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => router.push(`/sales/marketplaces/${connectionId}/orders`)}
            >
              <div className="flex items-center gap-3">
                <ListOrdered className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-sm">Pedidos</p>
                  <p className="text-xs text-muted-foreground">
                    Pedidos recebidos do marketplace
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-sm">Financeiro</p>
                  <p className="text-xs text-muted-foreground">
                    Reconciliacao e pagamentos
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Reconciliation Summary */}
          {reconciliation && (
            <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
              <h3 className="font-medium mb-4">Resumo Financeiro</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div>
                  <p className="text-xs text-muted-foreground">Bruto</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(reconciliation.totalGross)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taxas</p>
                  <p className="text-lg font-semibold text-rose-500">
                    -{formatCurrency(reconciliation.totalFees)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Liquido</p>
                  <p className="text-lg font-semibold text-emerald-500">
                    {formatCurrency(reconciliation.totalNet)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-lg font-semibold">
                    {reconciliation.pendingCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Liquidados</p>
                  <p className="text-lg font-semibold">
                    {reconciliation.settledCount}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Sync Config */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <h3 className="font-medium mb-4">Configuracoes de Sincronizacao</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-sm">
              {[
                { label: 'Produtos', active: connection.syncProducts },
                { label: 'Precos', active: connection.syncPrices },
                { label: 'Estoque', active: connection.syncStock },
                { label: 'Pedidos', active: connection.syncOrders },
                { label: 'Mensagens', active: connection.syncMessages },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-lg px-3 py-2 text-center ${
                    item.active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'
                  }`}
                >
                  {item.label}: {item.active ? 'Ativo' : 'Inativo'}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Intervalo de sincronizacao: {connection.syncIntervalMin} min
              {connection.commissionPercent !== undefined &&
                ` | Comissao: ${connection.commissionPercent}%`}
              {connection.autoCalcPrice && ' | Calculo automatico de preco'}
            </p>
          </Card>
        </div>
      </PageBody>
    </PageLayout>
  );
}
