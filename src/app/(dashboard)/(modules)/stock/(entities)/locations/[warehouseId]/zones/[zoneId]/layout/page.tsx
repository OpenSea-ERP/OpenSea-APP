'use client';

import { logger } from '@/lib/logger';
import React, { use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

import {
  useWarehouse,
  useZone,
  useZoneLayout,
  useSaveZoneLayout,
  useResetZoneLayout,
} from '../../../../src/api';
import { LayoutEditor } from '../../../../src/components';
import type { ZoneLayout, AislePosition } from '@/types/stock';

interface PageProps {
  params: Promise<{
    warehouseId: string;
    zoneId: string;
  }>;
}

export default function LayoutEditorPage({ params }: PageProps) {
  const { warehouseId, zoneId } = use(params);
  const router = useRouter();

  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<
    string | null
  >(null);

  // Data fetching
  const { data: warehouse, isLoading: isLoadingWarehouse } =
    useWarehouse(warehouseId);
  const { data: zone, isLoading: isLoadingZone } = useZone(zoneId);
  const { data: layoutData, isLoading: isLoadingLayout } =
    useZoneLayout(zoneId);

  // Mutations
  const saveLayout = useSaveZoneLayout();
  const resetLayout = useResetZoneLayout();

  // Gerar layout padrão se não houver
  const defaultLayout = useMemo((): ZoneLayout | null => {
    if (!zone?.structure) return null;

    const structure = zone.structure;
    const aisleSpacing = 120;
    const startX = 50;
    const startY = 80;

    const aislePositions: AislePosition[] = Array.from(
      { length: structure.aisles },
      (_, i) => ({
        aisleNumber: i + 1,
        x: startX,
        y: startY + i * aisleSpacing,
        rotation: 0 as const,
      })
    );

    const canvasWidth = Math.max(
      800,
      startX * 2 + structure.shelvesPerAisle * 10
    );
    const canvasHeight = Math.max(
      600,
      startY * 2 + structure.aisles * aisleSpacing
    );

    return {
      aislePositions,
      canvasWidth,
      canvasHeight,
      gridSize: 10,
      annotations: [],
      lastModified: new Date().toISOString(),
      isCustom: false,
    };
  }, [zone?.structure]);

  const currentLayout = layoutData || defaultLayout;

  const handleSave = async (layout: ZoneLayout) => {
    try {
      await saveLayout.mutateAsync({
        zoneId,
        layout,
      });
      toast.success('Layout salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar layout');
      logger.error(
        'Error saving layout',
        error instanceof Error ? error : undefined
      );
    }
  };

  const handleCancel = () => {
    router.push(`/stock/locations/${warehouseId}/zones/${zoneId}`);
  };

  const handleNavigateAway = (path: string) => {
    // TODO: Check if dirty
    router.push(path);
  };

  // Loading state
  if (isLoadingZone || isLoadingWarehouse || isLoadingLayout) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 border-b">
          <Skeleton className="h-4 w-24" />
          <span>/</span>
          <Skeleton className="h-4 w-16" />
          <span>/</span>
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Zone not found or structure not configured
  if (!zone || !zone.structure) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
        <AlertCircle className="h-12 w-12 text-amber-500" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            {!zone ? 'Zona não encontrada' : 'Estrutura não configurada'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {!zone
              ? 'A zona solicitada não existe ou foi removida.'
              : 'Configure a estrutura da zona antes de editar o layout.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/stock/locations/${warehouseId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          {zone && !zone.structure && (
            <Button asChild>
              <Link
                href={`/stock/locations/${warehouseId}/zones/${zoneId}/structure`}
              >
                Configurar Estrutura
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!currentLayout) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <PageBreadcrumb
          items={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Localizações', href: '/stock/locations' },
            {
              label: warehouse?.name || '...',
              href: `/stock/locations/${warehouseId}`,
            },
            {
              label: zone.name || '...',
              href: `/stock/locations/${warehouseId}/zones/${zoneId}`,
            },
            {
              label: 'Layout',
              href: `/stock/locations/${warehouseId}/zones/${zoneId}/layout`,
            },
          ]}
        />

        <Button variant="outline" size="sm" onClick={handleCancel}>
          Voltar ao Mapa
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <LayoutEditor
          initialLayout={currentLayout}
          structure={zone.structure}
          warehouseCode={warehouse?.code || ''}
          zoneCode={zone.code}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>

      {/* Unsaved changes dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingNavigation) {
                  router.push(pendingNavigation);
                }
                setShowUnsavedDialog(false);
                setPendingNavigation(null);
              }}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
