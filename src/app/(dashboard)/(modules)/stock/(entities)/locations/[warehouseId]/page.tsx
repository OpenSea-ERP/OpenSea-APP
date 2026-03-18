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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Zone } from '@/types/stock';
import {
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Warehouse,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useDeleteWarehouse,
  useDeleteZone,
  useWarehouse,
  useZones,
} from '../src/api';
import { ZoneExpandableCard } from '../src/components';
import {
  BinDetailSheet,
  CreateZoneModal,
  EditZoneModal,
  ZoneStructureConfig,
} from '../src/modals';

interface PageProps {
  params: Promise<{ warehouseId: string }>;
}

export default function WarehouseDetailPage({ params }: PageProps) {
  const { warehouseId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightBinId = searchParams.get('highlight');

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

  // ============================================================================
  // STATE
  // ============================================================================

  const [expandedZoneIds, setExpandedZoneIds] = useState<Set<string>>(new Set());
  const [createZoneOpen, setCreateZoneOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [configuringZone, setConfiguringZone] = useState<Zone | null>(null);
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);
  const [deleteWarehouseOpen, setDeleteWarehouseOpen] = useState(false);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const deleteWarehouseMutation = useDeleteWarehouse();
  const deleteZoneMutation = useDeleteZone();

  // ============================================================================
  // AUTO-EXPAND ZONE WITH HIGHLIGHTED BIN
  // ============================================================================

  useEffect(() => {
    if (highlightBinId && zones && zones.length > 0) {
      // Expand all zones when a bin highlight is present
      // The correct zone will show the highlighted bin
      setExpandedZoneIds(new Set(zones.map((z) => z.id)));
    }
  }, [highlightBinId, zones]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleZone = useCallback((zoneId: string) => {
    setExpandedZoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  }, []);

  const handleDeleteWarehouseConfirm = useCallback(async () => {
    try {
      await deleteWarehouseMutation.mutateAsync(warehouseId);
      toast.success('Armazém excluído com sucesso');
      router.push('/stock/locations');
    } catch {
      toast.error('Erro ao excluir armazém.');
    }
  }, [deleteWarehouseMutation, warehouseId, router]);

  const handleDeleteZoneConfirm = useCallback(async () => {
    if (!deletingZone) return;
    try {
      await deleteZoneMutation.mutateAsync({
        id: deletingZone.id,
        warehouseId,
      });
      toast.success('Zona excluída com sucesso');
      setDeletingZone(null);
    } catch {
      toast.error('Erro ao excluir zona.');
    }
  }, [deletingZone, deleteZoneMutation, warehouseId]);

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const actionButtons = useMemo(
    () => [
      {
        id: 'delete-warehouse',
        title: 'Excluir',
        icon: Trash2,
        onClick: () => setDeleteWarehouseOpen(true),
        variant: 'outline' as const,
      },
      {
        id: 'edit-warehouse',
        title: 'Editar',
        icon: Pencil,
        onClick: () => router.push(`/stock/locations/${warehouseId}/edit`),
        variant: 'default' as const,
      },
    ],
    [router, warehouseId]
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
        <div className="bg-white/5 p-5 rounded-lg border border-border">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Warehouse className="h-7 w-7 text-white" />
            </div>
            {isLoadingWarehouse ? (
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-7 w-48 mb-1" />
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-muted-foreground">
                  {warehouse?.code}
                </p>
                <h1 className="text-2xl font-bold tracking-tight">
                  {warehouse?.name}
                </h1>
                {warehouse?.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {warehouse.description}
                  </p>
                )}
              </div>
            )}
            {warehouse && (
              <Badge
                variant={warehouse.isActive ? 'default' : 'secondary'}
                className={cn(
                  'shrink-0',
                  warehouse.isActive &&
                    'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300'
                )}
              >
                {warehouse.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            )}
          </div>

          {/* Warehouse stats row */}
          {warehouse?.stats && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {warehouse.stats.totalZones}{' '}
                {warehouse.stats.totalZones === 1 ? 'zona' : 'zonas'}
              </span>
              <span className="text-sm text-muted-foreground">
                {warehouse.stats.totalBins.toLocaleString()} bins
              </span>
              <span className="text-sm text-muted-foreground">
                {warehouse.stats.occupancyPercentage.toFixed(0)}% ocupação
              </span>
            </div>
          )}
        </div>
      </PageHeader>

      <PageBody>
        {/* Zones Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Zonas</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateZoneOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nova Zona
            </Button>
          </div>

          {isLoadingZones ? (
            <GridLoading count={3} layout="grid" size="md" gap="gap-3" />
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
            <div className="space-y-3">
              {zones.map((zone) => (
                <ZoneExpandableCard
                  key={zone.id}
                  zone={zone}
                  warehouseId={warehouseId}
                  isExpanded={expandedZoneIds.has(zone.id)}
                  highlightBinId={highlightBinId ?? undefined}
                  onToggle={() => toggleZone(zone.id)}
                  onEdit={() => setEditingZone(zone)}
                  onDelete={() => setDeletingZone(zone)}
                  onConfigureStructure={() => setConfiguringZone(zone)}
                  onBinClick={(binId) => setSelectedBinId(binId)}
                  hasEditPermission={true}
                  hasDeletePermission={true}
                  hasConfigurePermission={true}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[200px] rounded-lg border border-dashed">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Nenhuma zona cadastrada</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie zonas para organizar este armazém
              </p>
              <Button onClick={() => setCreateZoneOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Zona
              </Button>
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateZoneModal
          open={createZoneOpen}
          onOpenChange={setCreateZoneOpen}
          warehouseId={warehouseId}
        />

        <EditZoneModal
          open={!!editingZone}
          onOpenChange={(open) => {
            if (!open) setEditingZone(null);
          }}
          zone={editingZone}
        />

        {configuringZone && (
          <ZoneStructureConfig
            open={!!configuringZone}
            onOpenChange={(open) => {
              if (!open) setConfiguringZone(null);
            }}
            zone={configuringZone}
          />
        )}

        <BinDetailSheet
          open={!!selectedBinId}
          onOpenChange={(open) => {
            if (!open) setSelectedBinId(null);
          }}
          binId={selectedBinId}
        />

        {/* Delete Zone Confirmation */}
        <VerifyActionPinModal
          isOpen={!!deletingZone}
          onClose={() => setDeletingZone(null)}
          onSuccess={handleDeleteZoneConfirm}
          title="Confirmar Exclusão"
          description={`Digite seu PIN para excluir a zona ${deletingZone?.code}. Todos os bins associados serão removidos.`}
        />

        {/* Delete Warehouse Confirmation */}
        <VerifyActionPinModal
          isOpen={deleteWarehouseOpen}
          onClose={() => setDeleteWarehouseOpen(false)}
          onSuccess={handleDeleteWarehouseConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN para excluir este armazém. Todas as zonas e bins serão removidos."
        />
      </PageBody>
    </PageLayout>
  );
}
