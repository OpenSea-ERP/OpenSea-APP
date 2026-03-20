'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ArrowRightLeft,
  ArrowRight,
  Package,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { toast } from 'sonner';
import { useBinDetail, useBinOccupancy } from '../api/bins.queries';
import { useTransferItem } from '../api/items.queries';
import { BinSelector } from '../components/bin-selector';
import type { BinItem } from '@/types/stock';

// ============================================
// TYPES
// ============================================

export interface BinRelocationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId: string;
  warehouseId: string;
  affectedBins?: Array<{ binId: string; address: string; itemCount: number }>;
  /** Additional bin IDs to exclude from destination (e.g. bins being removed) */
  additionalExcludeBinIds?: string[];
  /** Called when user wants to skip relocation and proceed with the action (e.g. reconfig with detach) */
  onSkipRelocate?: () => void;
  onComplete?: () => void;
}

// ============================================
// HELPER: Item Transfer Card
// ============================================

function ItemTransferCard({
  item,
  fromBinId,
  zoneId,
  warehouseId,
  excludeBinIds,
  onTransferred,
}: {
  item: BinItem;
  fromBinId: string;
  zoneId: string;
  warehouseId: string;
  excludeBinIds?: string[];
  onTransferred: () => void;
}) {
  const [destinationAddress, setDestinationAddress] = useState<string | null>(
    null
  );
  const [destinationBinId, setDestinationBinId] = useState<string | null>(null);
  const [transferred, setTransferred] = useState(false);
  const transferItem = useTransferItem();

  const handleMove = useCallback(async () => {
    if (!destinationBinId) return;
    try {
      await transferItem.mutateAsync({
        itemId: item.id,
        destinationBinId,
        notes: 'Realocação por reconfiguração de zona',
      });
      setTransferred(true);
      onTransferred();
    } catch {
      toast.error('Erro ao mover item. Tente novamente.');
    }
  }, [item.id, destinationBinId, transferItem, onTransferred]);

  const productLabel = item.variantName
    ? `${item.productName} — ${item.variantName}`
    : item.productName;

  if (transferred) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-xs text-emerald-700 dark:text-emerald-300 truncate">
          {productLabel}
        </span>
        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 shrink-0 ml-auto">
          Realocado
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border border-border">
      {/* Product + variant + code */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">
          {productLabel}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground truncate">
          {item.itemCode}
        </p>
      </div>

      {/* Quantity badge */}
      <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
        {item.quantity}
      </Badge>

      {/* Destination selector */}
      <div className="w-[160px] shrink-0">
        <BinSelector
          warehouseId={warehouseId}
          value={destinationAddress || undefined}
          onChange={(address, bin) => {
            setDestinationAddress(address);
            setDestinationBinId(bin?.id ?? null);
          }}
          placeholder="Destino"
          onlyAvailable
          excludeBinIds={excludeBinIds}
        />
      </div>

      {/* Move button */}
      <Button
        type="button"
        size="sm"
        onClick={handleMove}
        disabled={!destinationBinId || transferItem.isPending}
        className="shrink-0 h-7 w-7 p-0"
      >
        {transferItem.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowRight className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

// ============================================
// HELPER: Bin Items List (Step 2 content)
// ============================================

function BinItemsList({
  binId,
  binAddress,
  zoneId,
  warehouseId,
  excludeBinIds,
  onAllMoved,
}: {
  binId: string;
  binAddress: string;
  zoneId: string;
  warehouseId: string;
  excludeBinIds?: string[];
  onAllMoved: () => void;
}) {
  const { data: binDetail, isLoading } = useBinDetail(binId);
  const [movedCount, setMovedCount] = useState(0);

  const items = binDetail?.items ?? [];
  const totalItems = items.length;

  const handleItemTransferred = useCallback(() => {
    setMovedCount(prev => {
      const next = prev + 1;
      // Check if all items have been moved
      if (next >= totalItems) {
        // Small delay to show the success state before navigating back
        setTimeout(() => {
          onAllMoved();
        }, 800);
      }
      return next;
    });
  }, [totalItems, onAllMoved]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20">
        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-sm text-emerald-700 dark:text-emerald-300">
          Todos os itens deste nicho já foram realocados.
        </span>
      </div>
    );
  }

  const allMoved = movedCount >= totalItems;

  return (
    <div className="space-y-3">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-muted-foreground">
          {movedCount} de {totalItems}{' '}
          {totalItems === 1 ? 'item movido' : 'itens movidos'}
        </span>
        {allMoved && <CheckCircle className="h-4 w-4 text-emerald-500" />}
      </div>

      {items.map(item => (
        <ItemTransferCard
          key={item.id}
          item={item}
          fromBinId={binId}
          zoneId={zoneId}
          warehouseId={warehouseId}
          excludeBinIds={excludeBinIds}
          onTransferred={handleItemTransferred}
        />
      ))}
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function BinRelocationWizard({
  open,
  onOpenChange,
  zoneId,
  warehouseId,
  affectedBins: affectedBinsProp,
  additionalExcludeBinIds,
  onSkipRelocate,
  onComplete,
}: BinRelocationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [resolvedBinIds, setResolvedBinIds] = useState<Set<string>>(new Set());
  const [showPin, setShowPin] = useState(false);

  // Fetch occupied bins from zone when affectedBins is not provided
  const shouldFetchBins = open && !affectedBinsProp && !!zoneId;
  const { data: occupancyData, isLoading: isLoadingOccupancy } =
    useBinOccupancy(shouldFetchBins ? zoneId : '');

  const affectedBins = useMemo(() => {
    if (affectedBinsProp) return affectedBinsProp;
    if (!occupancyData?.bins) return [];
    return occupancyData.bins
      .filter(bin => bin.itemCount > 0)
      .map(bin => ({
        binId: bin.id,
        address: bin.address,
        itemCount: bin.itemCount,
      }));
  }, [affectedBinsProp, occupancyData]);

  const resolvedCount = resolvedBinIds.size;
  const totalBins = affectedBins.length;
  const allResolved = resolvedCount >= totalBins;

  // Exclude affected bins + any additional bins (e.g. bins being removed) from destination
  const excludeBinIds = useMemo(() => {
    const ids = affectedBins.map(b => b.binId);
    if (additionalExcludeBinIds) {
      for (const id of additionalExcludeBinIds) {
        if (!ids.includes(id)) ids.push(id);
      }
    }
    return ids;
  }, [affectedBins, additionalExcludeBinIds]);

  const selectedBin = useMemo(
    () => affectedBins.find(b => b.binId === selectedBinId),
    [affectedBins, selectedBinId]
  );

  const handleClose = useCallback(() => {
    onOpenChange(false);
    if (allResolved) {
      onComplete?.();
    }
  }, [onOpenChange, allResolved, onComplete]);

  const handleSelectBin = useCallback((binId: string) => {
    setSelectedBinId(binId);
    setCurrentStep(2);
  }, []);

  const handleBinResolved = useCallback(() => {
    if (!selectedBinId) return;
    setResolvedBinIds(prev => new Set([...prev, selectedBinId]));
    toast.success('Nicho realocado com sucesso!');
    setCurrentStep(1);
    setSelectedBinId(null);
  }, [selectedBinId]);

  const handleBackToList = useCallback(() => {
    setCurrentStep(1);
    setSelectedBinId(null);
  }, []);

  // Mark all unresolved bins as "detached" (resolved without relocation)
  const handleDetachUnresolved = useCallback(() => {
    setResolvedBinIds(prev => {
      const next = new Set(prev);
      for (const bin of affectedBins) {
        next.add(bin.binId);
      }
      return next;
    });
  }, [affectedBins]);

  // Reset all resolutions
  const handleUndoAll = useCallback(() => {
    setResolvedBinIds(new Set());
  }, []);

  // Advance to PIN confirmation
  const handleAdvance = useCallback(() => {
    setShowPin(true);
  }, []);

  // PIN confirmed — execute the pending action
  const handlePinSuccess = useCallback(async () => {
    setShowPin(false);
    if (onSkipRelocate) {
      onSkipRelocate();
    }
    onComplete?.();
  }, [onSkipRelocate, onComplete]);

  // ============================================
  // STEP TITLE
  // ============================================

  const step1Title = (
    <span className="inline-flex items-center gap-2 flex-wrap">
      Realocação de Itens
    </span>
  );

  const step2Title = (
    <span className="inline-flex items-center gap-2 flex-wrap">
      Relocar Itens
      {selectedBin && (
        <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium uppercase font-mono text-muted-foreground">
          {selectedBin.address}
        </span>
      )}
    </span>
  );

  // ============================================
  // STEPS
  // ============================================

  const steps = useMemo<WizardStep[]>(() => {
    // Step 1: Affected bins list
    const listStep: WizardStep = {
      title: step1Title,
      description: 'Selecione um nicho para relocar seus itens.',
      icon: <ArrowRightLeft className="h-16 w-16 text-amber-500/60" />,
      content: isLoadingOccupancy ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : affectedBins.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-700 dark:text-emerald-300">
            Nenhum nicho com itens encontrado. Não é necessária realocação.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 h-full overflow-hidden">
          {/* Counter + undo */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {resolvedCount}
              </span>{' '}
              de{' '}
              <span className="font-semibold text-foreground">{totalBins}</span>{' '}
              {totalBins === 1 ? 'nicho resolvido' : 'nichos resolvidos'}
            </span>
            {resolvedCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUndoAll}
                className="text-xs text-muted-foreground hover:text-foreground h-7"
              >
                Desfazer tudo
              </Button>
            )}
          </div>

          {/* Bin list */}
          <ScrollArea className="flex-1 min-h-0" type="always">
            <div className="space-y-2 pr-4">
              {affectedBins.map(bin => {
                const isResolved = resolvedBinIds.has(bin.binId);
                return (
                  <div
                    key={bin.binId}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                      isResolved
                        ? 'bg-emerald-50 dark:bg-emerald-500/8 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-muted/50 border-border hover:border-blue-300 dark:hover:border-blue-500/40'
                    }`}
                  >
                    {isResolved ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-mono font-medium text-foreground">
                        {bin.address}
                      </span>
                    </div>

                    <Badge
                      variant="secondary"
                      className={`shrink-0 ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : ''
                      }`}
                    >
                      {bin.itemCount} {bin.itemCount === 1 ? 'item' : 'itens'}
                    </Badge>

                    {!isResolved && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectBin(bin.binId)}
                        className="shrink-0 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                      >
                        Relocar
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      ),
      isValid: !isLoadingOccupancy,
      footer: (
        <div className="flex items-center justify-between w-full">
          <Button type="button" variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          <div className="flex items-center gap-2">
            {!allResolved && affectedBins.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDetachUnresolved}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                Desvincular não resolvidos
              </Button>
            )}
            <Button
              type="button"
              onClick={handleAdvance}
              disabled={!allResolved}
            >
              Avançar
            </Button>
          </div>
        </div>
      ),
    };

    // Step 2: Relocate items from selected bin
    const relocateStep: WizardStep = {
      title: step2Title,
      description: 'Mova cada item para um nicho disponível.',
      icon: <Package className="h-16 w-16 text-blue-500/60" />,
      content: selectedBinId ? (
        <ScrollArea className="flex-1 min-h-0" type="always">
          <div className="pr-4">
            <BinItemsList
              binId={selectedBinId}
              binAddress={selectedBin?.address ?? ''}
              zoneId={zoneId}
              warehouseId={warehouseId}
              excludeBinIds={excludeBinIds}
              onAllMoved={handleBinResolved}
            />
          </div>
        </ScrollArea>
      ) : null,
      isValid: true,
      footer: (
        <div className="flex items-center justify-end w-full">
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToList}
            className="gap-1.5"
          >
            &larr; Voltar
          </Button>
        </div>
      ),
    };

    return [listStep, relocateStep];
  }, [
    step1Title,
    step2Title,
    affectedBins,
    isLoadingOccupancy,
    resolvedBinIds,
    resolvedCount,
    totalBins,
    selectedBinId,
    selectedBin,
    handleClose,
    handleSelectBin,
    handleBackToList,
    handleBinResolved,
  ]);

  return (
    <>
      <StepWizardDialog
        open={open}
        onOpenChange={onOpenChange}
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onClose={handleClose}
      />

      <VerifyActionPinModal
        isOpen={showPin}
        onClose={() => setShowPin(false)}
        onSuccess={handlePinSuccess}
        title="Confirmar Ação"
        description="Digite seu PIN de ação para confirmar. Itens não realocados serão desvinculados."
      />
    </>
  );
}
