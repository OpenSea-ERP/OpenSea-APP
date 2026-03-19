'use client';

import { useState, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Loader2,
  Package,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// ============================================
// TYPES
// ============================================

export interface AffectedBin {
  binId: string;
  address: string;
  itemCount: number;
}

export interface ItemsImpactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affectedBins: AffectedBin[];
  /** Called when user chooses to relocate items first */
  onRelocate?: (bins: AffectedBin[]) => void;
  /** Called when user confirms to proceed (detach items) — receives the execute function */
  onConfirmDetach: () => Promise<void>;
  /** PIN modal title */
  pinTitle?: string;
  /** PIN modal description */
  pinDescription?: string;
}

// ============================================
// COMPONENT
// ============================================

export function ItemsImpactModal({
  open,
  onOpenChange,
  affectedBins,
  onRelocate,
  onConfirmDetach,
  pinTitle = 'Confirmar Ação',
  pinDescription = 'Digite seu PIN de ação para confirmar.',
}: ItemsImpactModalProps) {
  const [showPin, setShowPin] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const totalItems = affectedBins.reduce((sum, b) => sum + b.itemCount, 0);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleRelocate = useCallback(() => {
    onRelocate?.(affectedBins);
    onOpenChange(false);
  }, [affectedBins, onRelocate, onOpenChange]);

  const handlePinSuccess = useCallback(async () => {
    setShowPin(false);
    setIsExecuting(true);
    try {
      await onConfirmDetach();
      onOpenChange(false);
    } catch {
      // Error handled by caller
    } finally {
      setIsExecuting(false);
    }
  }, [onConfirmDetach, onOpenChange]);

  return (
    <>
      <Dialog open={open && !showPin} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Itens Afetados
            </DialogTitle>
            <DialogDescription>
              Esta ação afetará {affectedBins.length}{' '}
              {affectedBins.length === 1 ? 'nicho' : 'nichos'} contendo{' '}
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Warning */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-500/8 border border-rose-200 dark:border-rose-500/20">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 dark:text-rose-300">
                Os itens abaixo serão desvinculados dos seus nichos. Você pode
                optar por relocá-los para outros nichos antes de prosseguir.
              </p>
            </div>

            {/* Affected bins list */}
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1 pr-3">
                {affectedBins.map((bin) => (
                  <div
                    key={bin.binId}
                    className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/40"
                  >
                    <span className="text-xs font-mono text-foreground">
                      {bin.address}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Package className="h-3 w-3" />
                      {bin.itemCount} {bin.itemCount === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button variant="outline" onClick={handleClose} disabled={isExecuting}>
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPin(true)}
                disabled={isExecuting}
                variant="outline"
                className="gap-1.5 text-rose-600 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
              >
                {isExecuting && <Loader2 className="h-4 w-4 animate-spin" />}
                Desvincular e Prosseguir
              </Button>
              {onRelocate && (
                <Button
                  onClick={handleRelocate}
                  disabled={isExecuting}
                  className="gap-1.5"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Relocar Itens
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VerifyActionPinModal
        isOpen={showPin}
        onClose={() => setShowPin(false)}
        onSuccess={handlePinSuccess}
        title={pinTitle}
        description={pinDescription}
      />
    </>
  );
}
