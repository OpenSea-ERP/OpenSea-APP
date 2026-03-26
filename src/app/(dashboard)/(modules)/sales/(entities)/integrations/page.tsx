'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
  useSyncIntegration,
} from '@/hooks/sales/use-integrations';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Search,
  AlertTriangle,
  Plug,
  Unplug,
  RefreshCw,
  Loader2,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type {
  Integration,
  IntegrationCategory,
  IntegrationStatus,
} from '@/types/sales';
import {
  INTEGRATION_CATEGORY_LABELS,
  INTEGRATION_STATUS_LABELS,
} from '@/types/sales';
import { IntegrationConfigModal } from './src/components/integration-config-modal';

const CATEGORY_COLORS: Record<IntegrationCategory, string> = {
  CRM: 'bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300',
  MARKETING:
    'bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300',
  MESSAGING:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
  PAYMENT:
    'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
  ECOMMERCE:
    'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300',
  ANALYTICS:
    'bg-teal-50 text-teal-700 dark:bg-teal-500/8 dark:text-teal-300',
  SOCIAL:
    'bg-pink-50 text-pink-700 dark:bg-pink-500/8 dark:text-pink-300',
  OTHER:
    'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400',
};

const STATUS_ICONS: Record<IntegrationStatus, React.ElementType> = {
  CONNECTED: CheckCircle2,
  DISCONNECTED: XCircle,
  ERROR: AlertCircle,
};

const STATUS_COLORS: Record<IntegrationStatus, string> = {
  CONNECTED: 'text-emerald-500',
  DISCONNECTED: 'text-slate-400',
  ERROR: 'text-rose-500',
};

export default function IntegrationsPage() {
  const { hasPermission } = usePermissions();
  const canAccess = hasPermission(SALES_PERMISSIONS.PIPELINES.ACCESS);

  const [search, setSearch] = useState('');
  const [configTarget, setConfigTarget] = useState<Integration | null>(null);

  const connectIntegration = useConnectIntegration();
  const disconnectIntegration = useDisconnectIntegration();
  const syncIntegration = useSyncIntegration();

  const { data, isLoading, isError } = useIntegrations({
    search: search || undefined,
  });

  const integrations = data?.integrations ?? [];
  const connected = integrations.filter(i => i.status === 'CONNECTED');
  const available = integrations.filter(i => i.status !== 'CONNECTED');

  function handleDisconnect(integration: Integration) {
    disconnectIntegration.mutate(integration.id, {
      onSuccess: () => {
        toast.success(`${integration.name} desconectado com sucesso.`);
      },
      onError: () => {
        toast.error(`Erro ao desconectar ${integration.name}.`);
      },
    });
  }

  function handleSync(integration: Integration) {
    syncIntegration.mutate(integration.id, {
      onSuccess: () => {
        toast.success(`Sincronização de ${integration.name} iniciada.`);
      },
      onError: () => {
        toast.error(`Erro ao sincronizar ${integration.name}.`);
      },
    });
  }

  async function handleConnect(
    integration: Integration,
    config: Record<string, unknown>
  ) {
    try {
      await connectIntegration.mutateAsync({
        id: integration.id,
        data: { config },
      });
      toast.success(`${integration.name} conectado com sucesso!`);
      setConfigTarget(null);
    } catch {
      toast.error(`Erro ao conectar ${integration.name}.`);
    }
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">Acesso negado</h2>
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para acessar as integrações.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Integrações' },
        ]}
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar integrações..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-muted-foreground">
            Erro ao carregar integrações.
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && integrations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-500/10">
            <Zap className="h-10 w-10 text-violet-500" />
          </div>
          <h2 className="text-lg font-semibold">
            Nenhuma integração disponível
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            As integrações estarão disponíveis em breve.
          </p>
        </div>
      )}

      {!isLoading && !isError && integrations.length > 0 && (
        <>
          {/* Connected Section */}
          {connected.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h2 className="text-base font-semibold">
                  Integrações Conectadas
                </h2>
                <Badge
                  variant="secondary"
                  className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300"
                >
                  {connected.length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connected.map(integration => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onConfigure={() => setConfigTarget(integration)}
                    onDisconnect={() => handleDisconnect(integration)}
                    onSync={() => handleSync(integration)}
                    isSyncing={
                      syncIntegration.isPending &&
                      syncIntegration.variables === integration.id
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* Available Section */}
          {available.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-violet-500" />
                <h2 className="text-base font-semibold">
                  Integrações Disponíveis
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {available.length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {available.map(integration => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onConfigure={() => setConfigTarget(integration)}
                    onConnect={() => setConfigTarget(integration)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Config Modal */}
      {configTarget && (
        <IntegrationConfigModal
          integration={configTarget}
          open={!!configTarget}
          onOpenChange={open => {
            if (!open) setConfigTarget(null);
          }}
          onConnect={config => handleConnect(configTarget, config)}
          isConnecting={connectIntegration.isPending}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Integration Card Component
   ────────────────────────────────────────────────────────── */

function IntegrationCard({
  integration,
  onConfigure,
  onConnect,
  onDisconnect,
  onSync,
  isSyncing,
}: {
  integration: Integration;
  onConfigure: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}) {
  const isConnected = integration.status === 'CONNECTED';
  const StatusIcon = STATUS_ICONS[integration.status];

  return (
    <Card
      className={cn(
        'relative p-5 transition-all',
        'bg-white dark:bg-slate-800/60 border border-border',
        'hover:shadow-md',
        isConnected &&
          'border-emerald-200 dark:border-emerald-500/20'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {integration.logoUrl ? (
            <img
              src={integration.logoUrl}
              alt={integration.name}
              className="h-10 w-10 rounded-lg object-contain"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
              <Plug className="h-5 w-5 text-violet-500" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold">{integration.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusIcon
                className={cn(
                  'h-3.5 w-3.5',
                  STATUS_COLORS[integration.status]
                )}
              />
              <span className="text-xs text-muted-foreground">
                {INTEGRATION_STATUS_LABELS[integration.status]}
              </span>
            </div>
          </div>
        </div>

        <Badge
          variant="secondary"
          className={cn(
            'text-xs',
            CATEGORY_COLORS[integration.category]
          )}
        >
          {INTEGRATION_CATEGORY_LABELS[integration.category]}
        </Badge>
      </div>

      {/* Description */}
      {integration.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
          {integration.description}
        </p>
      )}

      {/* Last sync */}
      {isConnected && integration.lastSyncAt && (
        <p className="text-[10px] text-muted-foreground mb-3">
          Última sincronização:{' '}
          {new Date(integration.lastSyncAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            {onSync && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs flex-1"
                onClick={onSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Sincronizar
              </Button>
            )}
            {onDisconnect && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                onClick={onDisconnect}
              >
                <Unplug className="h-3.5 w-3.5" />
                Desconectar
              </Button>
            )}
          </>
        ) : (
          <Button
            size="sm"
            className="gap-1.5 text-xs w-full"
            onClick={onConnect}
            disabled={!integration.isAvailable}
          >
            <Plug className="h-3.5 w-3.5" />
            {integration.isAvailable ? 'Conectar' : 'Em breve'}
          </Button>
        )}
      </div>
    </Card>
  );
}
