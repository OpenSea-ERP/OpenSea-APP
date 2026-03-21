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
import { useMarketplaceConnectionsInfinite } from '@/hooks/sales/use-marketplaces';
import type { MarketplaceConnectionDTO } from '@/types/sales';
import {
  Globe,
  Plus,
  RefreshCw,
  ShoppingBag,
  Wifi,
  WifiOff,
  AlertTriangle,
  Pause,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

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

function ConnectionCard({ connection }: { connection: MarketplaceConnectionDTO }) {
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[connection.status] ?? STATUS_CONFIG.ERROR;
  const StatusIcon = statusCfg.icon;

  return (
    <Card
      className="bg-white dark:bg-slate-800/60 border border-border p-5 cursor-pointer hover:border-primary/40 transition-colors"
      onClick={() =>
        router.push(`/sales/marketplaces/${connection.id}`)
      }
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{connection.name}</h3>
            <p className="text-xs text-muted-foreground">
              {MARKETPLACE_LABELS[connection.marketplace] ?? connection.marketplace}
            </p>
          </div>
        </div>
        <Badge variant={statusCfg.variant} className="text-xs">
          <StatusIcon className="mr-1 h-3 w-3" />
          {statusCfg.label}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-md bg-muted/50 px-2 py-1.5">
          <p className="text-muted-foreground">Produtos</p>
          <p className="font-medium">{connection.syncProducts ? 'Sim' : 'Nao'}</p>
        </div>
        <div className="rounded-md bg-muted/50 px-2 py-1.5">
          <p className="text-muted-foreground">Pedidos</p>
          <p className="font-medium">{connection.syncOrders ? 'Sim' : 'Nao'}</p>
        </div>
        <div className="rounded-md bg-muted/50 px-2 py-1.5">
          <p className="text-muted-foreground">Estoque</p>
          <p className="font-medium">{connection.syncStock ? 'Sim' : 'Nao'}</p>
        </div>
      </div>

      {connection.lastSyncAt && (
        <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Ultima sync: {new Date(connection.lastSyncAt).toLocaleString('pt-BR')}
        </p>
      )}

      {connection.commissionPercent !== undefined && (
        <p className="mt-1 text-xs text-muted-foreground">
          Comissao: {connection.commissionPercent}%
        </p>
      )}
    </Card>
  );
}

export default function MarketplacesPage() {
  const router = useRouter();
  const { data, isLoading, error } = useMarketplaceConnectionsInfinite();

  const connections =
    data?.pages.flatMap((page) => page.connections) ?? [];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Marketplaces' },
          ]}
        >
          <Button
            size="sm"
            className="h-9 px-2.5"
            onClick={() => router.push('/sales/marketplaces/connect')}
          >
            <Plus className="mr-1 h-4 w-4" />
            Conectar Marketplace
          </Button>
        </PageActionBar>
      </PageHeader>
      <PageBody>
        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError />
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium">
              Nenhum marketplace conectado
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Conecte seu primeiro marketplace para comecar a vender em
              multiplos canais.
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push('/sales/marketplaces/connect')}
            >
              <Plus className="mr-1 h-4 w-4" />
              Conectar Marketplace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
              />
            ))}
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}
