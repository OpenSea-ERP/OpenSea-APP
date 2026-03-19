'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ArrowRight,
  Loader2,
  MoveRight,
  Package,
  AlertTriangle,
} from 'lucide-react';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BinSelector } from '../components/bin-selector';
import type { BinItem, Bin } from '@/types/stock';

export interface MoveItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BinItem;
  currentBin: Bin;
  warehouseId?: string;
  onMove: (itemId: string, destinationBinId: string) => Promise<void>;
}

export function MoveItemModal({
  open,
  onOpenChange,
  item,
  currentBin,
  warehouseId,
  onMove,
}: MoveItemModalProps) {
  const [targetAddress, setTargetAddress] = useState<string | null>(null);
  const [targetBinId, setTargetBinId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMove = useCallback(async () => {
    if (!targetBinId) return;

    setIsMoving(true);
    setError(null);
    try {
      await onMove(item.id, targetBinId);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover item.');
    } finally {
      setIsMoving(false);
    }
  }, [targetBinId, item.id, onMove, onOpenChange]);

  const handleClose = useCallback(() => {
    setTargetAddress(null);
    setTargetBinId(null);
    setError(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const canMove = targetBinId && targetAddress !== currentBin.address;

  const productLabel = item.variantName
    ? `${item.productName} — ${item.variantName}`
    : item.productName;

  const steps = useMemo<WizardStep[]>(() => [
    {
      title: 'Mover Item',
      description: 'Selecione o nicho de destino para mover este item.',
      icon: <MoveRight className="h-16 w-16 text-blue-500/60" />,
      content: (
        <div className="space-y-4">
          {/* Item card */}
          <div className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-border">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/15 mt-0.5">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono font-medium text-foreground truncate">
                  {item.itemCode}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {item.productName}
              </p>
              {(item.variantName || item.variantReference) && (
                <p className="text-[11px] text-muted-foreground/70 truncate">
                  {item.variantName}
                  {item.variantName && item.variantReference && ' · '}
                  {item.variantReference}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0 tabular-nums text-xs self-start">
              {item.quantity}{item.unitLabel ? ` ${item.unitLabel}` : ''}
            </Badge>
          </div>

          {/* Movement: From → To */}
          <div className="flex items-center gap-3">
            <div className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-muted/30 text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">Origem</p>
              <p className="font-mono font-semibold text-sm">{currentBin.address}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className={cn(
              'flex-1 px-3 py-2.5 rounded-lg border text-center',
              targetAddress
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                : 'border-dashed border-border',
            )}>
              <p className="text-[10px] text-muted-foreground mb-0.5">Destino</p>
              <p className="font-mono font-semibold text-sm">
                {targetAddress || '—'}
              </p>
            </div>
          </div>

          {/* Destination selector */}
          <BinSelector
            label="Nicho de destino"
            value={targetAddress || undefined}
            onChange={(address, bin) => {
              setTargetAddress(address);
              setTargetBinId(bin?.id ?? null);
              setError(null);
            }}
            placeholder="Selecione o nicho de destino"
            warehouseId={warehouseId}
            zoneId={!warehouseId ? currentBin.zoneId : undefined}
            onlyAvailable
            excludeBinIds={[currentBin.id]}
            required
          />

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-rose-50 dark:bg-rose-500/8 border border-rose-200 dark:border-rose-500/20">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          )}
        </div>
      ),
      isValid: !!canMove,
      footer: (
        <div className="flex items-center justify-end w-full gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isMoving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={!canMove || isMoving}
            className="gap-1.5"
          >
            {isMoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoveRight className="h-4 w-4" />
            )}
            {isMoving ? 'Movendo...' : 'Mover'}
          </Button>
        </div>
      ),
    },
  ], [
    item.itemCode,
    item.productName,
    item.variantName,
    item.variantReference,
    item.quantity,
    item.unitLabel,
    currentBin.address,
    currentBin.id,
    currentBin.zoneId,
    warehouseId,
    targetAddress,
    canMove,
    isMoving,
    error,
    handleClose,
    handleMove,
  ]);

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(val); }}
      steps={steps}
      currentStep={1}
      onStepChange={() => {}}
      onClose={handleClose}
    />
  );
}
