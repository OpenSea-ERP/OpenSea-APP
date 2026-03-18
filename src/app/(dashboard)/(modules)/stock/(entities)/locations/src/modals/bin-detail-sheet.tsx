'use client';

import { useState, useCallback } from 'react';
import {
  ArrowRightLeft,
  Lock,
  Unlock,
  Package,
  Loader2,
  MoveRight,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useBinDetail } from '../api/bins.queries';
import { useBlockBin, useUnblockBin } from '../api/bins.queries';
import { BlockBinModal } from './block-bin-modal';
import { MoveItemModal } from './move-item-modal';
import type { BinItem, Bin } from '@/types/stock';

// ============================================
// TYPES
// ============================================

export interface BinDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binId: string | null;
}

// ============================================
// COMPONENT
// ============================================

export function BinDetailSheet({
  open,
  onOpenChange,
  binId,
}: BinDetailSheetProps) {
  const { data, isLoading } = useBinDetail(binId || '');
  const blockBin = useBlockBin();
  const unblockBin = useUnblockBin();

  const [moveItem, setMoveItem] = useState<BinItem | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const bin = data?.bin;
  const items = data?.items ?? [];
  const zone = data?.zone;
  const warehouse = data?.warehouse;

  const handleUnblock = useCallback(async () => {
    if (!bin || !zone) return;

    try {
      await unblockBin.mutateAsync({ id: bin.id, zoneId: zone.id });
      toast.success('Bin desbloqueado com sucesso!');
    } catch {
      toast.error('Erro ao desbloquear bin.');
    }
  }, [bin, zone, unblockBin]);

  const handleBlock = useCallback(
    async (binId: string, reason?: string) => {
      if (!zone) return;
      await blockBin.mutateAsync({ id: binId, reason, zoneId: zone.id });
      toast.success('Bin bloqueado com sucesso!');
    },
    [zone, blockBin]
  );

  const handleUnblockFromModal = useCallback(
    async (binId: string) => {
      if (!zone) return;
      await unblockBin.mutateAsync({ id: binId, zoneId: zone.id });
      toast.success('Bin desbloqueado com sucesso!');
    },
    [zone, unblockBin]
  );

  const handleMoveItem = useCallback(
    async (_itemId: string, _targetAddress: string, _quantity: number) => {
      // The actual move logic will be handled by the parent page
      // This is a placeholder that the MoveItemModal will call
      toast.info('Movimentação será implementada na integração.');
    },
    []
  );

  // Occupancy percentage
  const occupancyPercent =
    bin?.capacity && bin.capacity > 0
      ? Math.round((bin.currentOccupancy / bin.capacity) * 100)
      : null;

  // Status badge
  const getStatusBadge = () => {
    if (!bin) return null;
    if (bin.isBlocked) {
      return (
        <Badge className="bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-0">
          Bloqueado
        </Badge>
      );
    }
    if (!bin.isActive) {
      return (
        <Badge variant="secondary">Inativo</Badge>
      );
    }
    if (bin.currentOccupancy === 0) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">
          Disponível
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-0">
        Ocupado
      </Badge>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-md w-full flex flex-col">
          <SheetHeader>
            <SheetTitle className="font-mono text-lg font-bold">
              {bin?.address ?? '...'}
            </SheetTitle>
            <SheetDescription asChild>
              <div className="space-y-2">
                {/* Breadcrumb */}
                {warehouse && zone && (
                  <div className="text-xs text-muted-foreground">
                    {warehouse.name} → {zone.name}
                    {bin && ` → Corredor ${bin.aisle} → Prateleira ${bin.shelf}`}
                  </div>
                )}
                {/* Status */}
                {getStatusBadge()}
              </div>
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : bin ? (
            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              {/* Occupation section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Ocupação</h4>
                {occupancyPercent !== null ? (
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {bin.currentOccupancy} de {bin.capacity} ({occupancyPercent}%)
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {bin.currentOccupancy} item(ns)
                  </p>
                )}
              </div>

              <Separator />

              {/* Items section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Itens neste Bin</h4>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum item neste bin
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {item.productName}
                              {item.variantName && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  · {item.variantName}
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-xs text-muted-foreground">
                              {item.sku}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-medium">
                            {item.quantity}
                            {item.unitLabel && (
                              <span className="text-xs text-muted-foreground ml-1">
                                {item.unitLabel}
                              </span>
                            )}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setMoveItem(item)}
                            title="Mover"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Bin não encontrado
              </p>
            </div>
          )}

          {/* Footer actions */}
          {bin && (
            <SheetFooter className="flex-row gap-2 border-t pt-4">
              {bin.isBlocked ? (
                <Button
                  variant="outline"
                  onClick={handleUnblock}
                  disabled={unblockBin.isPending}
                  className="gap-1.5"
                >
                  {unblockBin.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                  Desbloquear
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowBlockModal(true)}
                  className="gap-1.5 text-amber-600"
                >
                  <Lock className="h-4 w-4" />
                  Bloquear Bin
                </Button>
              )}
              {items.length > 0 && (
                <Button variant="outline" className="gap-1.5">
                  <MoveRight className="h-4 w-4" />
                  Mover Todos
                </Button>
              )}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Block Bin Modal */}
      {bin && (
        <BlockBinModal
          open={showBlockModal}
          onOpenChange={setShowBlockModal}
          bin={bin}
          onBlock={handleBlock}
          onUnblock={handleUnblockFromModal}
        />
      )}

      {/* Move Item Modal */}
      {moveItem && bin && (
        <MoveItemModal
          open={!!moveItem}
          onOpenChange={val => {
            if (!val) setMoveItem(null);
          }}
          item={moveItem}
          currentBin={bin}
          onMove={handleMoveItem}
        />
      )}
    </>
  );
}
