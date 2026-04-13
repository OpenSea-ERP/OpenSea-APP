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
import { Switch } from '@/components/ui/switch';
import {
  useMarketplaceConnection,
  useUpdateMarketplaceConnection,
  useDeleteMarketplaceConnection,
} from '@/hooks/sales/use-marketplaces';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type {
  MarketplaceConnectionDTO,
  MarketplaceConnectionStatus,
  MarketplaceFulfillmentType,
  UpdateMarketplaceConnectionRequest,
} from '@/types/sales';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown,
  Loader2,
  RefreshCw,
  Save,
  Settings,
  ShoppingBag,
  Trash2,
  Wifi,
  WifiOff,
  AlertTriangle,
  Pause,
  Truck,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// CONSTANTS
// =============================================================================

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
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ElementType;
  }
> = {
  ACTIVE: { label: 'Ativo', variant: 'default', icon: Wifi },
  PAUSED: { label: 'Pausado', variant: 'secondary', icon: Pause },
  DISCONNECTED: { label: 'Desconectado', variant: 'outline', icon: WifiOff },
  ERROR: { label: 'Erro', variant: 'destructive', icon: AlertTriangle },
};

// =============================================================================
// COLLAPSIBLE SECTION
// =============================================================================

function CollapsibleSection({
  icon: Icon,
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className="flex w-full items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-foreground" />
            <div className="text-left">
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20 transition-colors">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
        <div className="border-b border-border" />
      </div>

      {open && children}
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditConnectionPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const connectionId = params.connectionId as string;

  // Data
  const {
    data: connection,
    isLoading,
    error,
  } = useMarketplaceConnection(connectionId);

  const updateMutation = useUpdateMarketplaceConnection();
  const deleteMutation = useDeleteMarketplaceConnection();

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [status, setStatus] = useState<MarketplaceConnectionStatus>('ACTIVE');
  const [sellerName, setSellerName] = useState('');
  const [syncProducts, setSyncProducts] = useState(true);
  const [syncPrices, setSyncPrices] = useState(true);
  const [syncStock, setSyncStock] = useState(true);
  const [syncOrders, setSyncOrders] = useState(true);
  const [syncMessages, setSyncMessages] = useState(false);
  const [syncIntervalMin, setSyncIntervalMin] = useState('30');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [autoCalcPrice, setAutoCalcPrice] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState('1');
  const [fulfillmentType, setFulfillmentType] =
    useState<MarketplaceFulfillmentType>('SELF');

  // Initialize form from data
  useEffect(() => {
    if (connection) {
      setName(connection.name || '');
      setStatus(connection.status || 'ACTIVE');
      setSellerName(connection.sellerName || '');
      setSyncProducts(connection.syncProducts ?? true);
      setSyncPrices(connection.syncPrices ?? true);
      setSyncStock(connection.syncStock ?? true);
      setSyncOrders(connection.syncOrders ?? true);
      setSyncMessages(connection.syncMessages ?? false);
      setSyncIntervalMin(String(connection.syncIntervalMin ?? 30));
      setCommissionPercent(
        connection.commissionPercent != null
          ? String(connection.commissionPercent)
          : ''
      );
      setAutoCalcPrice(connection.autoCalcPrice ?? false);
      setPriceMultiplier(String(connection.priceMultiplier ?? 1));
      setFulfillmentType(connection.fulfillmentType || 'SELF');
    }
  }, [connection]);

  // Handlers
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome da conexao e obrigatório');
      return;
    }

    try {
      setIsSaving(true);

      const data: UpdateMarketplaceConnectionRequest = {
        name: name.trim(),
        status,
        sellerName: sellerName.trim() || undefined,
        syncProducts,
        syncPrices,
        syncStock,
        syncOrders,
        syncMessages,
        syncIntervalMin: Number(syncIntervalMin) || 30,
        commissionPercent: commissionPercent
          ? Number(commissionPercent)
          : undefined,
        autoCalcPrice,
        priceMultiplier: Number(priceMultiplier) || 1,
        fulfillmentType,
      };

      await updateMutation.mutateAsync({ id: connectionId, data });
      toast.success('Conexao atualizada com sucesso!');
      router.push(`/sales/marketplaces/${connectionId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar conexao',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar conexao', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(connectionId);
      toast.success('Conexao excluída com sucesso!');
      router.push('/sales/marketplaces');
    } catch (err) {
      logger.error(
        'Erro ao excluir conexao',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir conexao', { description: message });
    }
  };

  // Action buttons
  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.MARKETPLACE_CONNECTIONS.REMOVE)
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
      disabled: isSaving || !name.trim(),
    },
  ];

  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'Vendas' },
    { label: 'Marketplaces', href: '/sales/marketplaces' },
    {
      label: connection?.name || '...',
      href: `/sales/marketplaces/${connectionId}`,
    },
    { label: 'Editar' },
  ];

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

  if (error || !connection) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Conexao não encontrada"
            message="A conexao solicitada não foi encontrada."
            action={{
              label: 'Voltar para Marketplaces',
              onClick: () => router.push('/sales/marketplaces'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const statusCfg = STATUS_CONFIG[connection.status] ?? STATUS_CONFIG.ERROR;

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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 text-white">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando conexao</p>
              <h1 className="text-xl font-bold truncate">{connection.name}</h1>
              <p className="text-xs text-muted-foreground">
                {MARKETPLACE_LABELS[connection.marketplace] ??
                  connection.marketplace}
                {connection.sellerId && ` - ID: ${connection.sellerId}`}
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm">
                {(() => {
                  const StatusIcon = statusCfg.icon;
                  return <StatusIcon className="h-4 w-4" />;
                })()}
                <span>{statusCfg.label}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Informações Gerais */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <CollapsibleSection
              icon={Settings}
              title="Informações Gerais"
              subtitle="Nome, status e identificação da conexao"
            >
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="name">
                      Nome da Conexao <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome da conexao"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={v =>
                        setStatus(v as MarketplaceConnectionStatus)
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                        <SelectItem value="PAUSED">Pausado</SelectItem>
                        <SelectItem value="DISCONNECTED">
                          Desconectado
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sellerName">Nome do Vendedor</Label>
                    <Input
                      id="sellerName"
                      value={sellerName}
                      onChange={e => setSellerName(e.target.value)}
                      placeholder="Nome no marketplace"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </Card>

        {/* Section: Sincronização */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <CollapsibleSection
              icon={RefreshCw}
              title="Sincronização"
              subtitle="Configure quais dados sincronizar e o intervalo"
            >
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      label: 'Sincronizar Produtos',
                      checked: syncProducts,
                      onChange: setSyncProducts,
                    },
                    {
                      label: 'Sincronizar Preços',
                      checked: syncPrices,
                      onChange: setSyncPrices,
                    },
                    {
                      label: 'Sincronizar Estoque',
                      checked: syncStock,
                      onChange: setSyncStock,
                    },
                    {
                      label: 'Sincronizar Pedidos',
                      checked: syncOrders,
                      onChange: setSyncOrders,
                    },
                    {
                      label: 'Sincronizar Mensagens',
                      checked: syncMessages,
                      onChange: setSyncMessages,
                    },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <Label className="text-sm">{item.label}</Label>
                      <Switch
                        checked={item.checked}
                        onCheckedChange={item.onChange}
                      />
                    </div>
                  ))}

                  <div className="grid gap-2">
                    <Label htmlFor="syncInterval">
                      Intervalo de Sincronização (min)
                    </Label>
                    <Input
                      id="syncInterval"
                      type="number"
                      min={5}
                      max={1440}
                      value={syncIntervalMin}
                      onChange={e => setSyncIntervalMin(e.target.value)}
                      placeholder="30"
                    />
                  </div>
                </div>

                {connection.lastSyncAt && (
                  <div className="rounded-lg border border-border bg-white/5 p-3 text-sm text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Última sincronização:{' '}
                    {new Date(connection.lastSyncAt).toLocaleString('pt-BR')}
                    {connection.lastSyncStatus &&
                      ` - Status: ${connection.lastSyncStatus}`}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>
        </Card>

        {/* Section: Preços e Fulfillment */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <CollapsibleSection
              icon={Truck}
              title="Preços e Logistica"
              subtitle="Comissão, calculo de preço e tipo de envio"
            >
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="commission">Comissão (%)</Label>
                    <Input
                      id="commission"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={commissionPercent}
                      onChange={e => setCommissionPercent(e.target.value)}
                      placeholder="Ex: 12.5"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="multiplier">Multiplicador de Preco</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      min={0.1}
                      max={10}
                      step={0.01}
                      value={priceMultiplier}
                      onChange={e => setPriceMultiplier(e.target.value)}
                      placeholder="1.00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fulfillment">Tipo de Envio</Label>
                    <Select
                      value={fulfillmentType}
                      onValueChange={v =>
                        setFulfillmentType(v as MarketplaceFulfillmentType)
                      }
                    >
                      <SelectTrigger id="fulfillment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SELF">Proprio</SelectItem>
                        <SelectItem value="MARKETPLACE">
                          Marketplace (Fulfillment)
                        </SelectItem>
                        <SelectItem value="HYBRID">Hibrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:col-span-2 lg:col-span-3">
                    <div>
                      <Label className="text-sm">
                        Calculo Automático de Preco
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Aplica o multiplicador automáticamente sobre a tabela de
                        preços
                      </p>
                    </div>
                    <Switch
                      checked={autoCalcPrice}
                      onCheckedChange={setAutoCalcPrice}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Conexao"
        description={`Digite seu PIN de ação para excluir a conexao "${connection.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
