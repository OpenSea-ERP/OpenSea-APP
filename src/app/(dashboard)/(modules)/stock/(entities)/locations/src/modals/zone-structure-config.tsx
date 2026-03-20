'use client';

import { useState, useCallback, useMemo } from 'react';
import { Plus, X, Loader2, LayoutGrid } from 'lucide-react';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useConfigureZoneStructure } from '../api/zones.queries';
import { apiClient } from '@/lib/api-client';
import type { Zone, ReconfigurationPreviewResponse } from '@/types/stock';

// ============================================
// TYPES
// ============================================

export interface ZoneStructureConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: Zone;
  warehouseName?: string;
  onSuccess?: () => void;
  /** Called when reconfig would affect bins with items — page opens relocation wizard directly */
  onItemsAffected?: (
    binsWithItems: Array<{ binId: string; address: string; itemCount: number }>,
    executeReconfig: () => Promise<void>,
    allRemovedBinIds: string[]
  ) => void;
}

interface AisleEntry {
  shelves: number;
  bins: number;
}

// ============================================
// HELPER: Summary Cards
// ============================================

function SummaryCards({
  totalAisles,
  totalShelves,
  totalBins,
}: {
  totalAisles: number;
  totalShelves: number;
  totalBins: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {[
        { label: 'Corredores', value: totalAisles },
        { label: 'Prateleiras', value: totalShelves },
        { label: 'Nichos', value: totalBins },
      ].map(stat => (
        <div
          key={stat.label}
          className="flex flex-col items-center rounded-lg bg-muted/60 px-3 py-1.5 min-w-[70px]"
        >
          <span className="text-[10px] text-muted-foreground leading-tight">
            {stat.label}
          </span>
          <span className="text-sm font-bold text-foreground leading-tight">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function ZoneStructureConfig({
  open,
  onOpenChange,
  zone,
  warehouseName,
  onSuccess,
  onItemsAffected,
}: ZoneStructureConfigProps) {
  const [aisles, setAisles] = useState<AisleEntry[]>(() => {
    if (
      zone.structure?.aisleConfigs &&
      zone.structure.aisleConfigs.length > 0
    ) {
      return zone.structure.aisleConfigs.map(a => ({
        shelves: a.shelvesCount,
        bins: a.binsPerShelf,
      }));
    }
    if (zone.structure?.aisles > 0) {
      return Array.from({ length: zone.structure.aisles }, () => ({
        shelves: zone.structure.shelvesPerAisle || 1,
        bins: zone.structure.binsPerShelf || 1,
      }));
    }
    return [{ shelves: 1, bins: 1 }];
  });

  const [defaultCapacity, setDefaultCapacity] = useState<number>(10);
  const [showPin, setShowPin] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const configureStructure = useConfigureZoneStructure();

  const isFirstConfiguration = !zone.structure || zone.structure.aisles === 0;

  const updateAisle = useCallback(
    (index: number, field: 'shelves' | 'bins', value: number) => {
      setAisles(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  const addAisle = useCallback(() => {
    setAisles(prev => [...prev, { shelves: 1, bins: 1 }]);
  }, []);

  const removeAisle = useCallback(
    (index: number) => {
      if (aisles.length <= 1) return;
      setAisles(prev => prev.filter((_, i) => i !== index));
    },
    [aisles.length]
  );

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Build structure payload
  const buildStructurePayload = useCallback(
    () => ({
      defaultCapacity,
      structure: {
        aisles: aisles.length,
        shelvesPerAisle: aisles[0]?.shelves ?? 1,
        binsPerShelf: aisles[0]?.bins ?? 1,
        aisleConfigs: aisles.map((a, i) => ({
          aisleNumber: i + 1,
          shelvesCount: a.shelves,
          binsPerShelf: a.bins,
        })),
        codePattern: zone.structure?.codePattern ?? {
          separator: '-' as const,
          aisleDigits: 1 as const,
          shelfDigits: 2 as const,
          binLabeling: 'LETTERS' as const,
          binDirection: 'BOTTOM_UP' as const,
        },
        dimensions: zone.structure?.dimensions ?? {
          aisleWidth: 100,
          aisleSpacing: 200,
          shelfWidth: 100,
          shelfHeight: 200,
          binHeight: 40,
        },
      },
    }),
    [aisles, defaultCapacity, zone.structure]
  );

  // Execute the actual reconfig
  const executeReconfig = useCallback(
    async (force = false) => {
      const payload = buildStructurePayload();
      const result = await configureStructure.mutateAsync({
        zoneId: zone.id,
        structure: payload,
        forceRemoveOccupiedBins: force ? true : undefined,
      });
      toast.success('Estrutura configurada com sucesso!');
      onSuccess?.();
      onOpenChange(false);
      return result;
    },
    [
      buildStructurePayload,
      configureStructure,
      zone.id,
      onSuccess,
      onOpenChange,
    ]
  );

  // On "Confirmar" click: check for affected items first
  const handleConfirm = useCallback(async () => {
    if (isFirstConfiguration) {
      // First config — no existing bins, go straight to PIN
      setShowPin(true);
      return;
    }

    // Reconfiguration — check preview for affected items
    setIsChecking(true);
    try {
      const payload = buildStructurePayload();
      const preview = await apiClient.post<ReconfigurationPreviewResponse>(
        `/v1/zones/${zone.id}/reconfiguration-preview`,
        { structure: payload.structure }
      );

      if (preview.binsWithItems && preview.binsWithItems.length > 0) {
        // Items affected — delegate to parent via callback
        if (onItemsAffected) {
          const allRemovedBinIds = [
            ...preview.binsWithItems.map(b => b.binId),
            ...(preview.binsToDeleteEmptyIds ?? []),
          ];
          onItemsAffected(
            preview.binsWithItems,
            async () => {
              await executeReconfig(true);
            },
            allRemovedBinIds
          );
        } else {
          // No handler — just go to PIN with force
          setShowPin(true);
        }
      } else {
        // No items affected — go to PIN
        setShowPin(true);
      }
    } catch {
      toast.error('Erro ao verificar impacto da reconfiguração.');
    } finally {
      setIsChecking(false);
    }
  }, [
    isFirstConfiguration,
    buildStructurePayload,
    zone.id,
    onItemsAffected,
    executeReconfig,
  ]);

  // PIN confirmed — execute
  const handlePinSuccess = useCallback(async () => {
    setShowPin(false);
    try {
      await executeReconfig(false);
    } catch {
      toast.error('Erro ao configurar estrutura. Tente novamente.');
    }
  }, [executeReconfig]);

  // Calculate totals
  const totalAisles = aisles.length;
  const totalShelves = aisles.reduce((sum, a) => sum + a.shelves, 0);
  const totalBins = aisles.reduce((sum, a) => sum + a.shelves * a.bins, 0);

  const isReconfiguring = zone.structure && zone.structure.aisles > 0;
  const isPending = configureStructure.isPending || isChecking;

  const steps = useMemo<WizardStep[]>(
    () => [
      {
        title: (
          <span className="inline-flex items-center gap-2 flex-wrap">
            {isReconfiguring
              ? 'Reconfigurar Estrutura'
              : 'Configurar Estrutura'}
            {warehouseName && (
              <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground">
                {warehouseName}
              </span>
            )}
            <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground">
              {zone.name}
            </span>
          </span>
        ),
        description: 'Configure corredores, prateleiras e nichos.',
        icon: <LayoutGrid className="h-16 w-16 text-emerald-500/60" />,
        content: (
          <div className="flex flex-col gap-3 h-full overflow-hidden">
            {/* Top bar: capacity + add button */}
            <div className="flex items-center justify-between shrink-0 py-1">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                  Ocupação máxima por nicho
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={9999}
                  value={defaultCapacity}
                  onChange={e =>
                    setDefaultCapacity(
                      Math.max(1, Math.min(9999, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-16 h-7 text-xs"
                />
                <span className="text-[11px] text-muted-foreground">itens</span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={addAisle}
                className="gap-1.5 h-7 text-xs bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Corredor
              </Button>
            </div>

            {/* Aisle list — scrollable */}
            <ScrollArea className="flex-1 min-h-0" type="always">
              <div className="space-y-2 pr-4">
                {aisles.map((aisle, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg"
                  >
                    <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">
                      Corredor {index + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[11px] text-muted-foreground whitespace-nowrap">
                        Prateleiras
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        value={aisle.shelves}
                        onChange={e =>
                          updateAisle(
                            index,
                            'shelves',
                            Math.max(
                              1,
                              Math.min(999, parseInt(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-16 h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[11px] text-muted-foreground whitespace-nowrap">
                        Nichos
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={26}
                        value={aisle.bins}
                        onChange={e =>
                          updateAisle(
                            index,
                            'bins',
                            Math.max(
                              1,
                              Math.min(26, parseInt(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-16 h-7 text-xs"
                      />
                    </div>
                    {aisles.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 ml-auto"
                        onClick={() => removeAisle(index)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ),
        isValid: totalBins > 0,
        footer: (
          <div className="flex items-center justify-between w-full">
            <SummaryCards
              totalAisles={totalAisles}
              totalShelves={totalShelves}
              totalBins={totalBins}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isPending || totalBins === 0}
                className="gap-1.5"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isChecking
                  ? 'Verificando...'
                  : configureStructure.isPending
                    ? 'Configurando...'
                    : 'Confirmar'}
              </Button>
            </div>
          </div>
        ),
      },
    ],
    [
      isReconfiguring,
      zone.name,
      warehouseName,
      aisles,
      totalAisles,
      totalShelves,
      totalBins,
      defaultCapacity,
      addAisle,
      updateAisle,
      removeAisle,
      handleClose,
      handleConfirm,
      isPending,
      isChecking,
      configureStructure.isPending,
    ]
  );

  return (
    <>
      <StepWizardDialog
        open={open}
        onOpenChange={onOpenChange}
        steps={steps}
        currentStep={1}
        onStepChange={() => {}}
        onClose={handleClose}
      />

      <VerifyActionPinModal
        isOpen={showPin}
        onClose={() => setShowPin(false)}
        onSuccess={handlePinSuccess}
        title="Confirmar Reconfiguração"
        description="Digite seu PIN de ação para confirmar a reconfiguração da estrutura da zona."
      />
    </>
  );
}
