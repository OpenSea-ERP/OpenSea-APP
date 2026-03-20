/**
 * OpenSea OS - Warehouse Detail Page
 * Página de detalhes do armazém com zonas expansíveis
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Zone } from '@/types/stock';
import {
  Calendar,
  Clock,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Settings,
  Edit,
  Trash2,
  Warehouse,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter, useSearchParams } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { usePermissions } from '@/hooks/use-permissions';
import { STOCK_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useWarehouse,
  useZones,
  useBinDetail,
  useBinOccupancy,
} from '../src/api';
import { AisleBinGrid } from '../src/components';
import { getOccupancyBarColor } from '../src/constants/occupancy-colors';
import {
  BinDetailSheet,
  CreateZoneModal,
  EditZoneModal,
  ZoneStructureConfig,
  ZoneDeleteWizard,
  BinRelocationWizard,
  ItemsImpactModal,
  type AffectedBin,
} from '../src/modals';

interface PageProps {
  params: Promise<{ warehouseId: string }>;
}

export default function WarehouseDetailPage({ params }: PageProps) {
  const { warehouseId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightBinId = searchParams.get('highlight');
  const highlightZoneId = searchParams.get('zone');
  const highlightItemId = searchParams.get('item');
  const { hasPermission } = usePermissions();

  const canEditWarehouse = hasPermission(STOCK_PERMISSIONS.WAREHOUSES.UPDATE);
  const canCreateZone = hasPermission(STOCK_PERMISSIONS.ZONES.CREATE);
  const canEditZone = hasPermission(STOCK_PERMISSIONS.ZONES.UPDATE);
  const canDeleteZone = hasPermission(STOCK_PERMISSIONS.ZONES.DELETE);
  const canConfigureZone = hasPermission(STOCK_PERMISSIONS.ZONES.CONFIGURE);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: warehouse,
    isLoading: isLoadingWarehouse,
    error: warehouseError,
    refetch: refetchWarehouse,
  } = useWarehouse(warehouseId);
  const {
    data: zones,
    isLoading: isLoadingZones,
    error: zonesError,
    refetch: refetchZones,
  } = useZones(warehouseId);
  const { data: highlightBinDetail } = useBinDetail(highlightBinId ?? '');

  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeBinHighlight, setActiveBinHighlight] = useState<string | null>(
    null
  );
  const [activeItemHighlight, setActiveItemHighlight] = useState<string | null>(
    null
  );
  const [createZoneOpen, setCreateZoneOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [configuringZone, setConfiguringZone] = useState<Zone | null>(null);
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);
  const [relocatingBins, setRelocatingBins] = useState<AffectedBin[] | null>(
    null
  );
  const [relocatingZoneId, setRelocatingZoneId] = useState<string | null>(null);
  const [impactBins, setImpactBins] = useState<AffectedBin[] | null>(null);
  const [impactExecute, setImpactExecute] = useState<
    (() => Promise<void>) | null
  >(null);
  const [excludeBinIdsForRelocation, setExcludeBinIdsForRelocation] = useState<
    string[]
  >([]);
  const [binFilter, setBinFilter] = useState<
    'all' | 'empty' | 'occupied' | 'full' | 'blocked'
  >('all');

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  // Fetch bin data for selected zone
  const { data: occupancyData, isLoading: isLoadingBins } = useBinOccupancy(
    selectedZoneId ?? ''
  );

  const selectedZone = useMemo(
    () => zones?.find(z => z.id === selectedZoneId) ?? null,
    [zones, selectedZoneId]
  );

  // ============================================================================
  // AUTO-SELECT FIRST ZONE (or highlighted bin zone)
  // ============================================================================

  useEffect(() => {
    if (!zones || zones.length === 0) return;

    if (highlightBinId) {
      // Use zone from URL param, or fallback to bin detail lookup
      const zoneId = highlightZoneId ?? highlightBinDetail?.zone?.id;
      if (zoneId) {
        setSelectedZoneId(zoneId);
        setActiveBinHighlight(highlightBinId);
        setActiveItemHighlight(highlightItemId);
        setSelectedBinId(highlightBinId); // Open bin detail panel
        router.replace(`/stock/locations/${warehouseId}`, { scroll: false });
        return;
      }
      // Still waiting for bin detail to load
      if (!highlightZoneId && !highlightBinDetail) return;
    }

    if (!selectedZoneId) {
      setSelectedZoneId(zones[0].id);
    }
  }, [
    zones,
    highlightBinId,
    highlightZoneId,
    highlightBinDetail,
    router,
    warehouseId,
    selectedZoneId,
  ]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectZone = useCallback((zoneId: string) => {
    setSelectedZoneId(prev => (prev === zoneId ? null : zoneId));
    setBinFilter('all');
  }, []);

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const actionButtons = useMemo(
    () => [
      ...(canEditWarehouse
        ? [
            {
              id: 'edit-warehouse',
              title: 'Editar',
              icon: Pencil,
              onClick: () =>
                router.push(`/stock/locations/${warehouseId}/edit`),
              variant: 'default' as const,
            },
          ]
        : []),
    ],
    [router, warehouseId, canEditWarehouse]
  );

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (warehouseError) {
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
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Erro ao carregar armazém"
            message="Ocorreu um erro ao tentar carregar este armazém."
            action={{
              label: 'Tentar Novamente',
              onClick: () => void refetchWarehouse(),
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
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Localizações', href: '/stock/locations' },
            {
              label: warehouse?.name ?? '...',
              href: `/stock/locations/${warehouseId}`,
            },
          ]}
          buttons={actionButtons}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Warehouse className="h-6 w-6 text-white" />
            </div>

            {isLoadingWarehouse ? (
              <div className="flex-1">
                <Skeleton className="h-7 w-48 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="truncate text-xl font-bold">
                    {warehouse?.name}
                  </h1>
                  {warehouse &&
                    (warehouse.isActive ? (
                      <span className="inline-flex shrink-0 items-center rounded-md border border-emerald-600/25 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center rounded-md border border-gray-300 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-gray-400">
                        Inativo
                      </span>
                    ))}
                </div>
                <p className="mt-0.5 text-sm font-mono text-muted-foreground">
                  {warehouse?.code}
                </p>
              </div>
            )}

            {/* Metadata (right) */}
            {warehouse && (
              <div className="hidden flex-col items-end gap-0.5 text-right sm:flex">
                {warehouse.createdAt && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 text-sky-400" />
                    Criado em{' '}
                    {new Date(warehouse.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
                {warehouse.updatedAt &&
                  warehouse.updatedAt !== warehouse.createdAt && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 text-amber-400" />
                      Atualizado em{' '}
                      {new Date(warehouse.updatedAt).toLocaleDateString(
                        'pt-BR',
                        {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        }
                      )}
                    </p>
                  )}
              </div>
            )}
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        {/* Zones Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Zonas</h2>
            {canCreateZone && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateZoneOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nova Zona
              </Button>
            )}
          </div>

          {isLoadingZones ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 w-[250px] shrink-0 rounded-lg border border-border bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          ) : zonesError ? (
            <GridError
              type="server"
              title="Erro ao carregar zonas"
              message="Ocorreu um erro ao tentar carregar as zonas deste armazém."
              action={{
                label: 'Tentar Novamente',
                onClick: () => void refetchZones(),
              }}
            />
          ) : zones && zones.length > 0 ? (
            <>
              {/* Horizontal zone cards */}
              <div className="flex gap-3 overflow-x-auto p-1 -m-1 mb-4">
                {zones.map(zone => {
                  const isSelected = selectedZoneId === zone.id;
                  const stats = zone.stats;
                  const structure = zone.structure;
                  const hasStructure = structure && structure.aisles > 0;
                  const occupancy = stats?.occupancyPercentage ?? 0;

                  return (
                    <button
                      key={zone.id}
                      onClick={() => hasStructure && handleSelectZone(zone.id)}
                      className={cn(
                        'h-24 w-[250px] shrink-0 rounded-lg border p-3 text-left transition-all duration-200',
                        'flex flex-col justify-between',
                        !hasStructure
                          ? 'border-dashed border-border/60 bg-muted/20 dark:bg-white/[0.02]'
                          : isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10 cursor-pointer'
                            : 'border-border bg-white dark:bg-slate-800/60 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-sm cursor-pointer',
                        !zone.isActive && 'opacity-60'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-between gap-1.5 min-w-0',
                          !hasStructure && 'opacity-50'
                        )}
                      >
                        <p className="text-sm font-semibold text-foreground truncate">
                          {zone.name}
                        </p>
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium border border-border bg-muted/50 text-muted-foreground">
                          {zone.code}
                        </span>
                      </div>

                      {hasStructure ? (
                        <div className="space-y-1">
                          {stats?.totalCapacity && stats.totalCapacity > 0 ? (
                            <>
                              <span className="text-[10px] text-muted-foreground">
                                Ocupação
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
                                  <div
                                    className={cn(
                                      'h-full rounded-full',
                                      getOccupancyBarColor(occupancy)
                                    )}
                                    style={{
                                      width: `${Math.min(occupancy, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                                  {occupancy.toFixed(0)}%
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">
                              Capacidade não definida
                            </span>
                          )}
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-center gap-1 rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 py-1 text-[11px] font-medium text-white cursor-pointer transition-colors"
                          onClick={e => {
                            e.stopPropagation();
                            setConfiguringZone(zone);
                          }}
                        >
                          <Settings className="h-3 w-3" />
                          Configurar
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected zone detail */}
              {selectedZone && (
                <div className="border border-border rounded-lg overflow-hidden bg-white dark:bg-slate-800/60">
                  {/* Zone detail header */}
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    {/* Left: icon + title */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground">
                        {selectedZone.name}
                      </span>
                      <p className="text-xs font-mono text-muted-foreground">
                        {selectedZone.code}
                      </p>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Right: filter toggle group + actions dropdown */}
                    <div className="flex items-center gap-2">
                      {/* Toggle group */}
                      <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
                        {(
                          [
                            'all',
                            'empty',
                            'occupied',
                            'full',
                            'blocked',
                          ] as const
                        ).map(opt => (
                          <button
                            key={opt}
                            onClick={() => setBinFilter(opt)}
                            className={cn(
                              'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                              binFilter === opt
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {
                              {
                                all: 'Todos',
                                empty: 'Vazios',
                                occupied: 'Ocupados',
                                full: 'Cheios',
                                blocked: 'Bloqueados',
                              }[opt]
                            }
                          </button>
                        ))}
                      </div>

                      {/* Dropdown menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Ações da zona"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canConfigureZone && (
                            <DropdownMenuItem
                              onClick={() => setConfiguringZone(selectedZone)}
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              Reconfigurar
                            </DropdownMenuItem>
                          )}
                          {canEditZone && (
                            <DropdownMenuItem
                              onClick={() => setEditingZone(selectedZone)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Renomear
                            </DropdownMenuItem>
                          )}
                          {canDeleteZone && (
                            <>
                              <DropdownMenuSeparator className="!bg-gray-200 dark:!bg-gray-600" />
                              <DropdownMenuItem
                                onClick={() => setDeletingZone(selectedZone)}
                              >
                                <Trash2 className="mr-2 h-4 w-4 text-rose-500" />
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Bin content */}
                  <div className="p-4">
                    {isLoadingBins ? (
                      <div className="space-y-3">
                        <Skeleton className="h-8 w-full rounded" />
                        <Skeleton className="h-24 w-full rounded" />
                        <Skeleton className="h-24 w-full rounded" />
                      </div>
                    ) : occupancyData?.bins && occupancyData.bins.length > 0 ? (
                      <AisleBinGrid
                        bins={occupancyData.bins}
                        zoneId={selectedZone.id}
                        highlightBinId={activeBinHighlight ?? undefined}
                        onBinClick={binId => setSelectedBinId(binId)}
                        filter={binFilter}
                      />
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        {selectedZone.structure &&
                        selectedZone.structure.aisles > 0
                          ? 'Nenhum nicho encontrado nesta zona.'
                          : 'Configure a estrutura da zona para visualizar os nichos.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[200px] rounded-lg border border-dashed">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Nenhuma zona cadastrada</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie zonas para organizar este armazém
              </p>
              {canCreateZone && (
                <Button onClick={() => setCreateZoneOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Zona
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateZoneModal
          open={createZoneOpen}
          onOpenChange={setCreateZoneOpen}
          warehouseId={warehouseId}
          warehouseName={warehouse?.name}
        />

        <EditZoneModal
          open={!!editingZone}
          onOpenChange={open => {
            if (!open) setEditingZone(null);
          }}
          zone={editingZone}
        />

        {configuringZone && (
          <ZoneStructureConfig
            open={!!configuringZone}
            onOpenChange={open => {
              if (!open) setConfiguringZone(null);
            }}
            zone={configuringZone}
            warehouseName={warehouse?.name}
            onItemsAffected={(bins, executeReconfig, allRemovedBinIds) => {
              const zoneId = configuringZone.id;
              setConfiguringZone(null);
              setRelocatingZoneId(zoneId);
              setRelocatingBins(bins);
              setExcludeBinIdsForRelocation(allRemovedBinIds);
              setImpactExecute(() => executeReconfig);
            }}
          />
        )}

        <BinDetailSheet
          open={!!selectedBinId}
          onOpenChange={open => {
            if (!open) {
              setSelectedBinId(null);
              setActiveBinHighlight(null);
              setActiveItemHighlight(null);
            }
          }}
          binId={selectedBinId}
          highlightItemId={activeItemHighlight}
        />

        {/* Delete Zone Wizard */}
        {deletingZone && (
          <ZoneDeleteWizard
            open={!!deletingZone}
            onOpenChange={open => {
              if (!open) setDeletingZone(null);
            }}
            zone={deletingZone}
            warehouseId={warehouseId}
            warehouseName={warehouse?.name}
            onSuccess={() => {
              setDeletingZone(null);
              toast.success('Zona excluída com sucesso');
            }}
            onRelocate={() => {
              const zoneId = deletingZone.id;
              setDeletingZone(null);
              setRelocatingZoneId(zoneId);
              // Open relocation wizard without explicit bins — it will fetch internally
              setRelocatingBins([]);
            }}
          />
        )}

        {/* Items Impact Modal (from reconfig) */}
        {impactBins && impactExecute && (
          <ItemsImpactModal
            open={!!impactBins}
            onOpenChange={open => {
              if (!open) {
                setImpactBins(null);
                setImpactExecute(null);
              }
            }}
            affectedBins={impactBins}
            onRelocate={bins => {
              setImpactBins(null);
              setImpactExecute(null);
              setRelocatingZoneId(configuringZone?.id ?? selectedZoneId);
              setRelocatingBins(bins);
              // excludeBinIdsForRelocation already set from onItemsAffected
            }}
            onConfirmDetach={impactExecute}
            pinTitle="Confirmar Reconfiguração"
            pinDescription="Digite seu PIN de ação para reconfigurar a estrutura. Os itens afetados serão desvinculados."
          />
        )}

        {/* Bin Relocation Wizard */}
        {relocatingBins && (
          <BinRelocationWizard
            open={!!relocatingBins}
            onOpenChange={open => {
              if (!open) {
                setRelocatingBins(null);
                setRelocatingZoneId(null);
              }
            }}
            zoneId={relocatingZoneId ?? selectedZoneId ?? ''}
            warehouseId={warehouseId}
            affectedBins={
              relocatingBins.length > 0 ? relocatingBins : undefined
            }
            additionalExcludeBinIds={excludeBinIdsForRelocation}
            onSkipRelocate={
              impactExecute
                ? () => {
                    setRelocatingBins(null);
                    setRelocatingZoneId(null);
                    // Open impact modal to confirm with PIN
                    setImpactBins(relocatingBins);
                  }
                : undefined
            }
            onComplete={() => {
              setRelocatingBins(null);
              setRelocatingZoneId(null);
              setExcludeBinIdsForRelocation([]);
              setImpactExecute(null);
            }}
          />
        )}
      </PageBody>
    </PageLayout>
  );
}
