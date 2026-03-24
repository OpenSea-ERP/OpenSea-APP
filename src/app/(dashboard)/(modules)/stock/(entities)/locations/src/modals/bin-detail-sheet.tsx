'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  ArrowRightLeft,
  Lock,
  Unlock,
  Package,
  Loader2,
  MapPin,
  Calendar,
  Copy,
  Printer,
  Plus,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatUnitAbbreviation } from '@/helpers/formatters';
import { getOccupancyBarColor } from '../constants/occupancy-colors';
import { toast } from 'sonner';
import { useBinDetail } from '../api/bins.queries';
import { useBlockBin, useUnblockBin } from '../api/bins.queries';
import { useTransferItem } from '../api/items.queries';
import { HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2';
import { usePrintQueue } from '@/core/print-queue';
import { BlockBinModal } from './block-bin-modal';
import { MoveItemModal } from './move-item-modal';
import { AddItemToBinModal } from './add-item-to-bin-modal';
import { AdjustCapacityModal } from './adjust-capacity-modal';
import type { BinItem, Bin } from '@/types/stock';

// ============================================
// TYPES
// ============================================

export interface BinDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binId: string | null;
  highlightItemId?: string | null;
}

// ============================================
// HELPERS
// ============================================

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getItemPreviewStyle(item: BinItem): React.CSSProperties | null {
  const primary = item.colorHex;
  if (!primary && !item.pattern) return null;

  const color = primary || '#cbd5e1';
  const secondary = item.secondaryColorHex || '';
  const hasSecondary = !!secondary;
  const sec = secondary || '#94a3b8';

  switch (item.pattern) {
    case 'SOLID':
      if (hasSecondary) {
        return {
          background: `linear-gradient(135deg, ${color} 50%, ${sec} 50%)`,
        };
      }
      return { background: color };
    case 'STRIPED':
      return {
        background: `repeating-linear-gradient(45deg, ${color}, ${color} 4px, ${sec} 4px, ${sec} 8px)`,
      };
    case 'PLAID':
      return {
        background: `repeating-linear-gradient(0deg, ${sec}00 0px, ${sec}00 6px, ${sec}BB 6px, ${sec}BB 8px, ${sec}00 8px, ${sec}00 14px), repeating-linear-gradient(90deg, ${sec}00 0px, ${sec}00 6px, ${sec}BB 6px, ${sec}BB 8px, ${sec}00 8px, ${sec}00 14px), ${color}`,
      };
    case 'PRINTED':
      return {
        background: `radial-gradient(circle 2px at 25% 30%, ${sec} 99%, transparent), radial-gradient(circle 1.5px at 60% 20%, ${sec} 99%, transparent), radial-gradient(circle 2px at 80% 60%, ${sec} 99%, transparent), radial-gradient(circle 1.5px at 40% 75%, ${sec} 99%, transparent), ${color}`,
      };
    case 'GRADIENT':
      return { background: `linear-gradient(135deg, ${color}, ${sec})` };
    case 'JACQUARD':
      return {
        background: `repeating-conic-gradient(${color} 0% 25%, ${sec} 0% 50%) 0 0 / 8px 8px`,
      };
    default:
      if (primary) return { background: color };
      return null;
  }
}

// ============================================
// COMPONENT
// ============================================

export function BinDetailSheet({
  open,
  onOpenChange,
  binId,
  highlightItemId,
}: BinDetailSheetProps) {
  const { data, isLoading } = useBinDetail(binId || '');
  const blockBin = useBlockBin();
  const unblockBin = useUnblockBin();
  const { actions: printActions } = usePrintQueue();

  const [moveItem, setMoveItem] = useState<BinItem | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const transferItem = useTransferItem();

  const bin = data?.bin;
  const items = data?.items ?? [];
  const zone = data?.zone;
  const warehouse = data?.warehouse;

  const handleUnblock = useCallback(async () => {
    if (!bin || !zone) return;
    try {
      await unblockBin.mutateAsync({ id: bin.id, zoneId: zone.id });
      toast.success('Nicho desbloqueado com sucesso!');
    } catch {
      toast.error('Erro ao desbloquear nicho.');
    }
  }, [bin, zone, unblockBin]);

  const handleBlock = useCallback(
    async (binId: string, reason?: string) => {
      if (!zone) return;
      await blockBin.mutateAsync({ id: binId, reason, zoneId: zone.id });
      toast.success('Nicho bloqueado com sucesso!');
    },
    [zone, blockBin]
  );

  const handleUnblockFromModal = useCallback(
    async (binId: string) => {
      if (!zone) return;
      await unblockBin.mutateAsync({ id: binId, zoneId: zone.id });
      toast.success('Nicho desbloqueado com sucesso!');
    },
    [zone, unblockBin]
  );

  const handleMoveItem = useCallback(
    async (itemId: string, destinationBinId: string) => {
      await transferItem.mutateAsync({
        itemId,
        destinationBinId,
      });
      toast.success('Item movido com sucesso!');
      setMoveItem(null);
    },
    [transferItem]
  );

  const handlePrintItem = useCallback(
    (item: BinItem) => {
      printActions.addToQueue({
        item: {
          id: item.id,
          fullCode: item.itemCode,
          uniqueCode: item.itemCode,
          currentQuantity: item.quantity,
        } as never,
      });
      toast.success('Item adicionado à fila de impressão');
    },
    [printActions]
  );

  const handlePrintAllItems = useCallback(() => {
    if (items.length === 0) return;
    const inputs = items.map(item => ({
      item: {
        id: item.id,
        fullCode: item.itemCode,
        uniqueCode: item.itemCode,
        currentQuantity: item.quantity,
      } as never,
    }));
    printActions.addToQueue(inputs);
    toast.success(`${items.length} ${items.length === 1 ? 'item adicionado' : 'itens adicionados'} à fila de impressão`);
  }, [items, printActions]);

  // Item highlight with 10s auto-fade
  const [activeHighlightItemId, setActiveHighlightItemId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!highlightItemId || !open || items.length === 0) return;
    setActiveHighlightItemId(highlightItemId);
    // Scroll to item
    const scrollTimer = setTimeout(() => {
      const el = document.querySelector(`[data-item-id="${highlightItemId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    // Auto-fade after 10s
    const fadeTimer = setTimeout(() => {
      setActiveHighlightItemId(null);
    }, 10000);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(fadeTimer);
    };
  }, [highlightItemId, open, items]);

  const itemCount = items.length || bin?.currentOccupancy || 0;
  const occupancyPercent =
    bin?.capacity && bin.capacity > 0
      ? Math.round((itemCount / bin.capacity) * 100)
      : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="sm:max-w-md w-full flex flex-col p-0 gap-0"
          showCloseButton={false}
        >
          {/* Header */}
          <SheetHeader className="p-5 pb-4 border-b border-border space-y-0">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="font-mono text-lg font-bold leading-tight">
                    {bin?.address ?? '...'}
                  </SheetTitle>
                  {/* Status badge — inline with title */}
                  {bin && (
                    <>
                      {bin.isBlocked ? (
                        <Badge className="bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-0 text-[10px] px-1.5 py-0">
                          Bloqueado
                        </Badge>
                      ) : !bin.isActive ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Inativo
                        </Badge>
                      ) : itemCount === 0 ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-0 text-[10px] px-1.5 py-0">
                          Disponível
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-0 text-[10px] px-1.5 py-0">
                          Ocupado
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <SheetDescription asChild>
                  <div className="flex items-center gap-2 mt-1">
                    {warehouse && zone && (
                      <span className="text-xs text-muted-foreground">
                        {warehouse.name} → {zone.name}
                      </span>
                    )}
                  </div>
                </SheetDescription>
              </div>
              {/* Header actions */}
              <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-2">
                {bin &&
                  (bin.isBlocked ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      onClick={handleUnblock}
                      disabled={unblockBin.isPending}
                      title="Desbloquear nicho"
                    >
                      {unblockBin.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                      onClick={() => setShowBlockModal(true)}
                      title="Bloquear nicho"
                    >
                      <Lock className="h-4 w-4" />
                    </Button>
                  ))}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : bin ? (
            <div className="flex-1 overflow-y-auto">
              {/* Occupancy bar */}
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Ocupação
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground tabular-nums">
                      {occupancyPercent !== null
                        ? `${itemCount}/${bin.capacity} (${occupancyPercent}%)`
                        : `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCapacityModal(true)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Ajustar capacidade"
                    >
                      <HiOutlineAdjustmentsHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {occupancyPercent !== null && (
                  <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        getOccupancyBarColor(occupancyPercent)
                      )}
                      style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                    />
                  </div>
                )}

                {/* Block reason */}
                {bin.isBlocked && bin.blockReason && (
                  <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-md bg-rose-50 dark:bg-rose-500/8 border border-rose-200 dark:border-rose-500/20">
                    <Lock className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      {bin.blockReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Items section */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">
                    Itens
                    {items.length > 0 && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        ({items.length})
                      </span>
                    )}
                  </h4>
                  {items.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-violet-600"
                      onClick={handlePrintAllItems}
                    >
                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                      Imprimir Todos
                    </Button>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">Nenhum item neste nicho</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map(item => {
                      const isHighlighted = activeHighlightItemId === item.id;
                      const previewStyle = getItemPreviewStyle(item);
                      return (
                        <div
                          key={item.id}
                          data-item-id={item.id}
                          className={cn(
                            'flex gap-3 p-3 rounded-lg border transition-all',
                            isHighlighted
                              ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/30 animate-pulse'
                              : 'bg-muted/40 border-border hover:border-blue-300 dark:hover:border-blue-500/40'
                          )}
                        >
                          {/* Color/Pattern preview or fallback icon */}
                          {previewStyle ? (
                            <div
                              className="h-9 w-9 shrink-0 rounded-lg mt-0.5 border border-black/10 dark:border-white/10"
                              style={previewStyle}
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/15 mt-0.5">
                              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}

                          {/* Info — 4 lines */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            {/* Line 1: Full code + copy */}
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-mono font-medium text-foreground truncate">
                                {item.itemCode}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.itemCode);
                                  toast.success('Código copiado!');
                                }}
                                className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                title="Copiar código"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            {/* Line 2: Template Product - Manufacturer */}
                            <p className="text-xs text-muted-foreground truncate">
                              {item.templateName && (
                                <span>{item.templateName} </span>
                              )}
                              {item.productName}
                              {item.manufacturerName && (
                                <span> — {item.manufacturerName}</span>
                              )}
                            </p>
                            {/* Line 3: Variant + Reference */}
                            {(item.variantName || item.variantReference) && (
                              <p className="text-[11px] text-muted-foreground/70 truncate">
                                {item.variantName}
                                {item.variantName &&
                                  item.variantReference &&
                                  ' · '}
                                {item.variantReference && (
                                  <span className="font-mono">
                                    {item.variantReference}
                                  </span>
                                )}
                              </p>
                            )}
                            {/* Line 4: Entry date */}
                            {item.addedAt && (
                              <p className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                <Calendar className="h-2.5 w-2.5" />
                                {formatDate(item.addedAt)}
                              </p>
                            )}
                          </div>

                          {/* Quantity + Print + Move */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge
                              variant="secondary"
                              className="tabular-nums text-xs"
                            >
                              {item.quantity}{' '}
                              {formatUnitAbbreviation(item.unitLabel)}
                            </Badge>
                            <div className="flex items-center gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-violet-600"
                                onClick={() => handlePrintItem(item)}
                                title="Imprimir etiqueta"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-blue-600"
                                onClick={() => setMoveItem(item)}
                                title="Mover item"
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Item Button */}
                <Button
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowAddItemModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Nicho não encontrado
              </p>
            </div>
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
          warehouseId={warehouse?.id}
          onMove={handleMoveItem}
        />
      )}

      {/* Add Item to Bin Modal */}
      {bin && (
        <AddItemToBinModal
          open={showAddItemModal}
          onOpenChange={setShowAddItemModal}
          binId={bin.id}
        />
      )}

      {/* Adjust Capacity Modal */}
      {bin && zone && (
        <AdjustCapacityModal
          open={showCapacityModal}
          onOpenChange={setShowCapacityModal}
          binId={bin.id}
          binAddress={bin.address}
          currentCapacity={bin.capacity ?? null}
          zoneId={zone.id}
        />
      )}
    </>
  );
}
