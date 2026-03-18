'use client';

import { use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MapPin,
  Settings,
  LayoutGrid,
  Info,
  Layers,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

import {
  useWarehouse,
  useZone,
  useBinOccupancy,
  useZoneItemStats,
  API_ENDPOINTS,
  QUERY_KEYS,
} from '../../../src/api';
import { ZoneMap } from '../../../src/components';
import type { BinOccupancy, BinResponse } from '@/types/stock';
import { apiClient } from '@/lib/api-client';
import { itemsService } from '@/services/stock/items.service';
import { useQueryClient } from '@tanstack/react-query';

interface PageProps {
  params: Promise<{
    warehouseId: string;
    zoneId: string;
  }>;
}

export default function ZoneMapPage({ params }: PageProps) {
  const { warehouseId, zoneId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Validar se os IDs são válidos (não "undefined")
  const isValidWarehouseId =
    warehouseId && warehouseId !== 'undefined' && warehouseId.length === 36;
  const isValidZoneId =
    zoneId && zoneId !== 'undefined' && zoneId.length === 36;

  // URL params para highlight de bin
  const highlightBinId = searchParams.get('highlight') || undefined;

  // Data fetching - apenas se IDs são válidos
  const { data: warehouse, isLoading: isLoadingWarehouse } = useWarehouse(
    isValidWarehouseId ? warehouseId : ''
  );
  const { data: zone, isLoading: isLoadingZone } = useZone(
    isValidZoneId ? zoneId : ''
  );
  const {
    data: occupancyData,
    isLoading: isLoadingBins,
    error,
    refetch,
  } = useBinOccupancy(isValidZoneId ? zoneId : '');
  const { data: itemStats } = useZoneItemStats(isValidZoneId ? zoneId : '');
  const queryClient = useQueryClient();

  const handleMoveItem = async (
    itemId: string,
    targetBinAddress: string,
    quantity: number
  ) => {
    const binResponse = await apiClient.get<BinResponse>(
      API_ENDPOINTS.bins.getByAddress(targetBinAddress)
    );
    const targetBin = binResponse.bin;

    await itemsService.transferItem({
      itemId,
      destinationBinId: targetBin.id,
    });

    toast.success(`Item transferido para ${targetBinAddress}`);

    refetch();
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.zoneItemStats(zoneId),
    });
  };

  const handlePrintLabels = (binIds: string[]) => {
    toast.info(`Gerando ${binIds.length} etiquetas...`);
  };

  const handleConfigure = () => {
    router.push(`/stock/locations/${warehouseId}/zones/${zoneId}/structure`);
  };

  const handleEditLayout = () => {
    router.push(`/stock/locations/${warehouseId}/zones/${zoneId}/layout`);
  };

  // ============================================================================
  // BREADCRUMB
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Estoque', href: '/stock' },
    { label: 'Localizações', href: '/stock/locations' },
    {
      label: warehouse?.name || '...',
      href: `/stock/locations/${warehouseId}`,
    },
    {
      label: zone?.name || '...',
      href: `/stock/locations/${warehouseId}/zones/${zoneId}`,
    },
  ];

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'edit-layout',
      title: 'Layout',
      icon: LayoutGrid,
      onClick: handleEditLayout,
      variant: 'outline' as const,
    },
    {
      id: 'configure-structure',
      title: 'Estrutura',
      icon: Settings,
      onClick: handleConfigure,
      variant: 'outline' as const,
    },
  ];

  // ============================================================================
  // INVALID IDS
  // ============================================================================

  if (!isValidWarehouseId || !isValidZoneId) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Localizações', href: '/stock/locations' },
            ]}
          />
          <Header title="URL inválida" />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="URL inválida"
            message="Os parâmetros da URL são inválidos. Por favor, acesse a zona através do menu de localizações."
            icon={MapPin}
            action={{
              label: 'Ir para Localizações',
              onClick: () => router.push('/stock/locations'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoadingZone || isLoadingWarehouse) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Localizações', href: '/stock/locations' },
              { label: '...' },
            ]}
          />
          <Header title="Carregando..." />
        </PageHeader>
        <PageBody>
          <GridLoading count={4} layout="grid" size="sm" />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
          <Header title="Erro" />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Erro ao carregar dados da zona"
            message="Ocorreu um erro ao tentar carregar os dados da zona."
            action={{
              label: 'Tentar Novamente',
              onClick: () => void refetch(),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // ZONE NOT FOUND
  // ============================================================================

  if (!zone) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Localizações', href: '/stock/locations' },
              {
                label: warehouse?.name || '...',
                href: `/stock/locations/${warehouseId}`,
              },
            ]}
          />
          <Header title="Zona não encontrada" />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Zona não encontrada"
            message="A zona que você está procurando não existe ou foi removida."
            icon={MapPin}
            action={{
              label: 'Voltar para Zonas',
              onClick: () => router.push(`/stock/locations/${warehouseId}`),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // STRUCTURE NOT CONFIGURED
  // ============================================================================

  if (!zone.structure) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
          <Header
            title={zone.name}
            description={`${warehouse?.code}-${zone.code}`}
          />
        </PageHeader>
        <PageBody>
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 rounded-lg border border-dashed p-8">
            <Settings className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="text-lg font-medium">Estrutura não configurada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Configure a estrutura de corredores, prateleiras e nichos
              </p>
            </div>
            <Button onClick={handleConfigure}>
              <Settings className="mr-2 h-4 w-4" />
              Configurar Estrutura
            </Button>
          </div>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const bins: BinOccupancy[] = occupancyData?.bins || [];
  const stats = occupancyData?.stats;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />

        {/* Zone Identity */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <Layers className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{zone.name}</h1>
              <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                {zone.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {warehouse?.code}-{zone.code}
              {zone.description && ` • ${zone.description}`}
            </p>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {/* Stats Cards */}
        {stats && stats.total !== undefined && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total de Nichos
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.total?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ocupados</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.occupied?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vazios</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {stats.empty?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ocupação</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {stats.occupancyPercentage?.toFixed(1) || '0'}%
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Info className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Blocked Bins Alert */}
        {itemStats &&
          itemStats.blockedBins > 0 &&
          itemStats.itemsInBlockedBins > 0 && (
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-900/20">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-300">
                {itemStats.blockedBins} nicho(s) bloqueado(s) com itens
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                <span>
                  {itemStats.itemsInBlockedBins} item(ns) precisam ser
                  realocados. Use o filtro &quot;Bloqueados&quot; no mapa para
                  visualizá-los e mover os itens individualmente.
                </span>
              </AlertDescription>
            </Alert>
          )}

        {/* Zone Map */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Mapa da Zona
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ZoneMap
              zone={zone}
              bins={bins}
              isLoading={isLoadingBins}
              onPrintLabels={handlePrintLabels}
              highlightBinId={highlightBinId}
              onMoveItem={handleMoveItem}
            />
          </CardContent>
        </Card>

        {/* Structure Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Informações da Estrutura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Corredores</p>
                <p className="text-lg font-semibold">{zone.structure.aisles}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Prateleiras por Corredor
                </p>
                <p className="text-lg font-semibold">
                  {zone.structure.shelvesPerAisle}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Nichos por Prateleira
                </p>
                <p className="text-lg font-semibold">
                  {zone.structure.binsPerShelf}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Direção dos Nichos
                </p>
                <p className="text-lg font-semibold">
                  {zone.structure.codePattern.binDirection.toUpperCase() ===
                  'BOTTOM_UP'
                    ? 'Baixo → Cima'
                    : 'Cima → Baixo'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
