/**
 * ProductVariantsItemsModal - Two-column management modal
 * Left: Product context (bg-slate-50) + variants list
 * Right: Selected variant header with pattern preview + items list
 */

'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { usePrintQueue } from '@/core/print-queue';
import { formatQuantity, formatUnitOfMeasure } from '@/helpers/formatters';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import {
  itemMovementsService,
  itemsService,
  variantsService,
} from '@/services/stock';
import type {
  ExitMovementType,
  Item,
  Pattern,
  Product,
  Variant,
} from '@/types/stock';
import { PATTERN_LABELS } from '@/types/stock';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Edit,
  Package,
  Palette,
  Plus,
  Printer,
  Search,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ItemRow } from '../components/item-row';
import { VariantRow } from '../components/variant-row';
import type { ExitType } from '../types/products.types';
import { ExitItemsModal } from './exit-items-modal';
import { ItemHistoryModal } from './item-history-modal';
import { ItemEntryFormModal } from './item-entry-form-modal';
import { VariantFormModal } from './variant-form-modal';

interface ProductVariantsItemsModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveItem?: (item: Item) => void;
}

export function ProductVariantsItemsModal({
  product,
  open,
  onOpenChange,
}: ProductVariantsItemsModalProps) {
  const { actions: printActions } = usePrintQueue();
  const queryClient = useQueryClient();

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [variantsSearch, setVariantsSearch] = useState('');
  const [itemsSearch, setItemsSearch] = useState('');
  const [hideExitedItems, setHideExitedItems] = useState(true);
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditVariantModal, setShowEditVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [exitItem, setExitItem] = useState<Item | null>(null);
  const [sessionExitReasonMap, setSessionExitReasonMap] = useState<
    Record<string, string>
  >({});

  // Track previous product to reset state when it changes
  const previousProductIdRef = useRef<string | null>(null);
  if (product?.id !== previousProductIdRef.current) {
    previousProductIdRef.current = product?.id ?? null;
    if (selectedVariant !== null) setSelectedVariant(null);
    if (variantsSearch !== '') setVariantsSearch('');
    if (itemsSearch !== '') setItemsSearch('');
  }

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const {
    data: variantsData,
    isLoading: isLoadingVariants,
    error: variantsError,
  } = useQuery({
    queryKey: ['variants', 'by-product', product?.id],
    queryFn: async () => {
      if (!product?.id) return { variants: [] };
      return variantsService.listVariants(product.id);
    },
    enabled: !!product?.id && open,
  });

  const { data: variantStatsMap } = useQuery({
    queryKey: ['items', 'stats-by-variants', product?.id],
    queryFn: async () => {
      if (!variantsData?.variants?.length) return {};
      const stats: Record<string, { count: number; totalQty: number }> = {};
      for (const variant of variantsData.variants) {
        const itemsResponse = await itemsService.listItems(variant.id);
        const inStockItems = itemsResponse.items.filter(
          item => item.currentQuantity > 0
        );
        stats[variant.id] = {
          count: inStockItems.length,
          totalQty: inStockItems.reduce(
            (sum, item) => sum + item.currentQuantity,
            0
          ),
        };
      }
      return stats;
    },
    enabled: !!variantsData?.variants?.length && open,
  });

  const {
    data: itemsData,
    isLoading: isLoadingItems,
    error: itemsError,
  } = useQuery({
    queryKey: ['items', 'by-variant', selectedVariant?.id],
    queryFn: async () => {
      if (!selectedVariant?.id) return { items: [] };
      return itemsService.listItems(selectedVariant.id);
    },
    enabled: !!selectedVariant?.id && open,
  });

  // ==========================================================================
  // EXIT REASONS
  // ==========================================================================

  const items = useMemo(() => itemsData?.items || [], [itemsData]);

  const exitedItemIds = useMemo(
    () =>
      items
        .filter((item: Item) => item.currentQuantity === 0)
        .map((item: Item) => item.id),
    [items]
  );

  const { data: fetchedExitReasons } = useQuery({
    queryKey: ['exit-reasons', selectedVariant?.id, exitedItemIds],
    queryFn: async () => {
      if (exitedItemIds.length === 0) return {};
      const results = await Promise.all(
        exitedItemIds.map(itemId =>
          itemMovementsService.listMovements({ itemId })
        )
      );
      const reasonMap: Record<string, string> = {};
      for (let i = 0; i < exitedItemIds.length; i++) {
        const movements = results[i].movements;
        const exitMovement = movements.find(
          m =>
            m.movementType !== 'PURCHASE' &&
            m.movementType !== 'CUSTOMER_RETURN' &&
            m.movementType !== 'TRANSFER' &&
            m.movementType !== 'INVENTORY_ADJUSTMENT' &&
            m.movementType !== 'ZONE_RECONFIGURE'
        );
        if (exitMovement) {
          reasonMap[exitedItemIds[i]] = exitMovement.movementType;
        }
      }
      return reasonMap;
    },
    enabled: exitedItemIds.length > 0 && open,
  });

  const exitReasonMap = useMemo(
    () => ({ ...(fetchedExitReasons || {}), ...sessionExitReasonMap }),
    [fetchedExitReasons, sessionExitReasonMap]
  );

  // ==========================================================================
  // COMPUTED
  // ==========================================================================

  const variants = useMemo(() => variantsData?.variants || [], [variantsData]);

  const filteredVariants = useMemo(
    () =>
      variants.filter(variant => {
        const q = variantsSearch.toLowerCase();
        return (
          variant.name.toLowerCase().includes(q) ||
          (variant.sku?.toLowerCase().includes(q) ?? false) ||
          (variant.barcode?.toLowerCase().includes(q) ?? false)
        );
      }),
    [variants, variantsSearch]
  );

  const filteredItems = useMemo(() => {
    let result = items;
    if (hideExitedItems) {
      result = result.filter((item: Item) => item.currentQuantity > 0);
    }
    if (!itemsSearch.trim()) return result;
    const q = itemsSearch.toLowerCase();
    return result.filter(item => {
      const locationAddress =
        item.bin?.address ||
        item.resolvedAddress ||
        item.binId ||
        item.locationId ||
        '';
      const fullCode = item.fullCode || '';
      const uniqueCode = item.uniqueCode || '';
      const quantity = String(item.currentQuantity ?? '');
      return (
        fullCode.toLowerCase().includes(q) ||
        uniqueCode.toLowerCase().includes(q) ||
        locationAddress.toLowerCase().includes(q) ||
        quantity.includes(q)
      );
    });
  }, [items, itemsSearch, hideExitedItems]);

  const totalItemsQuantity = useMemo(
    () => filteredItems.reduce((sum, item) => sum + item.currentQuantity, 0),
    [filteredItems]
  );

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleVariantSelect = useCallback((variant: Variant) => {
    setSelectedVariant(variant);
    setItemsSearch('');
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setSelectedVariant(null);
    setVariantsSearch('');
    setItemsSearch('');
  }, [onOpenChange]);

  const handleItemDoubleClick = useCallback((item: Item) => {
    setHistoryItem(item);
    setHistoryModalOpen(true);
  }, []);

  const handlePrintItem = useCallback(
    (item: Item) => {
      printActions.addToQueue({
        item,
        variant: selectedVariant || undefined,
        product: product || undefined,
      });
      toast.success('Item adicionado à fila de impressão');
    },
    [printActions, selectedVariant, product]
  );

  const handlePrintAllItems = useCallback(() => {
    if (filteredItems.length === 0) {
      toast.warning('Nenhum item para imprimir');
      return;
    }
    printActions.addToQueue(
      filteredItems.map(item => ({
        item,
        variant: selectedVariant || undefined,
        product: product || undefined,
      }))
    );
    toast.success(
      `${filteredItems.length} item(s) adicionado(s) à fila de impressão`
    );
  }, [printActions, filteredItems, selectedVariant, product]);

  const handleItemExit = useCallback((item: Item) => {
    setExitItem(item);
    setExitModalOpen(true);
  }, []);

  const mapExitType = (exitType: ExitType): ExitMovementType => {
    if (exitType === 'TRANSFER') return 'LOSS';
    return exitType as ExitMovementType;
  };

  const handleExitConfirm = useCallback(
    async (exitType: ExitType, reason: string) => {
      if (!exitItem) return;
      try {
        await itemsService.registerExit({
          itemId: exitItem.id,
          quantity: exitItem.currentQuantity,
          movementType: mapExitType(exitType),
          reasonCode: exitType,
          notes: reason || undefined,
        });

        setSessionExitReasonMap(prev => ({
          ...prev,
          [exitItem.id]: exitType,
        }));

        toast.success('Saída registrada com sucesso!');
        setExitItem(null);

        await queryClient.invalidateQueries({
          queryKey: ['items', 'by-variant', selectedVariant?.id],
        });
        await queryClient.invalidateQueries({
          queryKey: ['items', 'stats-by-variants', product?.id],
        });
        await queryClient.invalidateQueries({ queryKey: ['item-history'] });
      } catch (error) {
        logger.error(
          'Error processing exit',
          error instanceof Error ? error : undefined
        );
        toast.error('Erro ao processar saída');
        throw error;
      }
    },
    [exitItem, queryClient, selectedVariant, product]
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!product) return null;

  const templateName = product.template?.name || 'Template';
  const unitOfMeasure = formatUnitOfMeasure(
    product.template?.unitOfMeasure || 'UNITS'
  );
  const manufacturerName = product.manufacturer?.name;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[1200px] h-[650px] overflow-hidden flex flex-row p-0 gap-0">
          <VisuallyHidden>
            <DialogTitle>Variantes e Itens — {product.name}</DialogTitle>
          </VisuallyHidden>

          {/* ================================================================ */}
          {/* LEFT COLUMN — Product context + Variants */}
          {/* ================================================================ */}
          <div className="w-[380px] shrink-0 flex flex-col border-r border-border/50 bg-slate-50 dark:bg-white/[0.03]">
            {/* Product Header */}
            <div className="px-4 pt-5 pb-4 border-b border-border/30">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {manufacturerName || 'Fabricante não informado'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                      {templateName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {unitOfMeasure}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Variants Search */}
            <div className="px-3 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar variantes..."
                  value={variantsSearch}
                  onChange={e => setVariantsSearch(e.target.value)}
                  className="pl-9 h-8 text-sm bg-white dark:bg-white/5"
                />
              </div>
              <div className="flex items-center justify-between mt-2 px-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Variantes
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {filteredVariants.length} de {variants.length}
                </span>
              </div>
            </div>

            {/* Variants List */}
            <div className="flex-1 overflow-auto px-3 pb-2 space-y-1">
              {isLoadingVariants ? (
                <div className="space-y-1.5 pt-1">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : variantsError ? (
                <div className="p-8 text-center">
                  <p className="text-destructive text-sm">
                    Erro ao carregar variantes
                  </p>
                </div>
              ) : filteredVariants.length === 0 ? (
                <div className="p-8 text-center">
                  <Palette className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {variantsSearch
                      ? 'Nenhuma variante encontrada'
                      : 'Nenhuma variante cadastrada'}
                  </p>
                </div>
              ) : (
                filteredVariants.map(variant => (
                  <VariantRow
                    key={variant.id}
                    variant={variant}
                    itemsCount={variantStatsMap?.[variant.id]?.count || 0}
                    totalQuantity={variantStatsMap?.[variant.id]?.totalQty || 0}
                    unitLabel={unitOfMeasure}
                    isSelected={selectedVariant?.id === variant.id}
                    onClick={() => handleVariantSelect(variant)}
                    onEdit={v => {
                      setEditingVariant(v);
                      setShowEditVariantModal(true);
                    }}
                  />
                ))
              )}
            </div>

            {/* Add Variant Footer */}
            <div className="px-3 py-3 border-t border-border/30">
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={() => setShowAddVariantModal(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Adicionar Variante
              </Button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* RIGHT COLUMN — Variant detail + Items */}
          {/* ================================================================ */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {selectedVariant ? (
              <>
                {/* Variant Header */}
                <VariantDetailHeader
                  variant={selectedVariant}
                  itemsCount={variantStatsMap?.[selectedVariant.id]?.count || 0}
                  totalQuantity={
                    variantStatsMap?.[selectedVariant.id]?.totalQty || 0
                  }
                  unitLabel={unitOfMeasure}
                  onEdit={() => {
                    setEditingVariant(selectedVariant);
                    setShowEditVariantModal(true);
                  }}
                  onPrintAll={handlePrintAllItems}
                  hasPrintableItems={filteredItems.length > 0}
                />

                {/* Items Search + Filters */}
                <div className="px-4 pt-3 pb-2 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Buscar itens..."
                        value={itemsSearch}
                        onChange={e => setItemsSearch(e.target.value)}
                        className="pl-9 h-8 text-sm"
                      />
                    </div>
                    {items.some((i: Item) => i.currentQuantity === 0) && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch
                          id="hide-exited-modal"
                          checked={hideExitedItems}
                          onCheckedChange={setHideExitedItems}
                          className="scale-75"
                        />
                        <Label
                          htmlFor="hide-exited-modal"
                          className="text-[11px] text-muted-foreground cursor-pointer whitespace-nowrap"
                        >
                          Ocultar saídas
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-auto p-4 pt-2 space-y-1.5">
                  {isLoadingItems ? (
                    <div className="space-y-1.5">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : itemsError ? (
                    <div className="p-8 text-center">
                      <p className="text-destructive text-sm">
                        Erro ao carregar itens
                      </p>
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="p-8 text-center">
                      <Box className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {itemsSearch
                          ? 'Nenhum item encontrado'
                          : 'Nenhum item cadastrado'}
                      </p>
                    </div>
                  ) : (
                    filteredItems.map((item: Item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        unitLabel={unitOfMeasure}
                        onDoubleClick={() => handleItemDoubleClick(item)}
                        onPrint={handlePrintItem}
                        onExit={handleItemExit}
                        lastExitReasonCode={exitReasonMap[item.id]}
                      />
                    ))
                  )}
                </div>

                {/* Items Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
                  <span className="text-xs text-muted-foreground">
                    {filteredItems.length} itens ·{' '}
                    {formatQuantity(totalItemsQuantity)} {unitOfMeasure}
                  </span>
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-500 text-white"
                    onClick={() => setShowAddItemModal(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Registrar Entrada
                  </Button>
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Box className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-sm mb-1">
                  Selecione uma variante
                </h3>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Clique em uma variante à esquerda para ver seus itens
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-modals */}
      <ItemHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        item={historyItem}
      />

      <ExitItemsModal
        open={exitModalOpen}
        onOpenChange={o => {
          setExitModalOpen(o);
          if (!o) setExitItem(null);
        }}
        selectedItems={exitItem ? [exitItem] : []}
        onConfirm={handleExitConfirm}
      />

      <VariantFormModal
        product={product}
        variant={editingVariant}
        open={showEditVariantModal}
        onOpenChange={setShowEditVariantModal}
      />

      <VariantFormModal
        product={product}
        open={showAddVariantModal}
        onOpenChange={setShowAddVariantModal}
      />

      <ItemEntryFormModal
        product={product}
        variant={selectedVariant}
        open={showAddItemModal}
        onOpenChange={setShowAddItemModal}
      />
    </>
  );
}

// ============================================================================
// Variant Detail Header — rich header for the right column
// ============================================================================

interface VariantDetailHeaderProps {
  variant: Variant;
  itemsCount: number;
  totalQuantity: number;
  unitLabel: string;
  onEdit: () => void;
  onPrintAll: () => void;
  hasPrintableItems: boolean;
}

function VariantDetailHeader({
  variant,
  itemsCount,
  totalQuantity,
  unitLabel,
  onEdit,
  onPrintAll,
  hasPrintableItems,
}: VariantDetailHeaderProps) {
  const hasPattern = variant.pattern && variant.pattern !== ('none' as string);
  const hasColor = !!variant.colorHex;
  const hasVisual = hasPattern || hasColor;
  const patternLabel = PATTERN_LABELS[variant.pattern as Pattern] || '';

  const previewStyle = hasVisual ? getHeaderPreviewStyle(variant) : undefined;

  return (
    <div className="shrink-0 border-b border-border/30">
      {/* Pattern preview strip */}
      {hasVisual && previewStyle && (
        <div className="h-2" style={previewStyle} />
      )}

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: name + details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold truncate">
                {variant.name}
              </h3>
              {variant.outOfLine && (
                <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-medium bg-orange-500/15 text-orange-600 dark:text-orange-400 rounded">
                  Fora de Linha
                </span>
              )}
              {!variant.isActive && (
                <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-medium bg-gray-500/15 text-gray-500 rounded">
                  Inativo
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {variant.sku && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                  SKU: {variant.sku}
                </span>
              )}
              {variant.reference && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  Ref: {variant.reference}
                </span>
              )}
              {patternLabel && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {patternLabel}
                </span>
              )}
              {hasColor && (
                <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block ring-1 ring-black/10"
                    style={{ background: variant.colorHex! }}
                  />
                  {variant.secondaryColorHex && (
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block ring-1 ring-black/10 -ml-1"
                      style={{ background: variant.secondaryColorHex }}
                    />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Right: stats + actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Stats */}
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums leading-none">
                {formatQuantity(totalQuantity)}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {unitLabel}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {itemsCount} {itemsCount === 1 ? 'item' : 'itens'} em estoque
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 border-l border-border/50 pl-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onEdit}
                title="Editar variante"
              >
                <Edit className="h-4 w-4" />
              </Button>
              {hasPrintableItems && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onPrintAll}
                  title="Imprimir todos os itens"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Pattern preview helpers
// ============================================================================

function getHeaderPreviewStyle(variant: Variant): React.CSSProperties {
  const primary = variant.colorHex || '#cbd5e1';
  const secondary = variant.secondaryColorHex || '';
  const pattern = variant.pattern || '';
  const hasSecondary = !!secondary;
  const sec = secondary || '#94a3b8';

  switch (pattern) {
    case 'SOLID':
      if (hasSecondary) {
        return {
          background: `linear-gradient(90deg, ${primary} 50%, ${sec} 50%)`,
        };
      }
      return { background: primary };

    case 'STRIPED':
      return {
        background: `repeating-linear-gradient(45deg, ${primary}, ${primary} 4px, ${sec} 4px, ${sec} 8px)`,
      };

    case 'PLAID':
      return {
        background: `
          repeating-linear-gradient(0deg, ${sec}00 0px, ${sec}00 4px, ${sec}BB 4px, ${sec}BB 6px, ${sec}00 6px, ${sec}00 10px),
          repeating-linear-gradient(90deg, ${sec}00 0px, ${sec}00 4px, ${sec}BB 4px, ${sec}BB 6px, ${sec}00 6px, ${sec}00 10px),
          ${primary}`,
      };

    case 'PRINTED':
      return {
        background: `
          radial-gradient(circle 1.5px at 15% 50%, ${sec} 99%, transparent),
          radial-gradient(circle 1px at 35% 30%, ${sec} 99%, transparent),
          radial-gradient(circle 1.5px at 55% 70%, ${sec} 99%, transparent),
          radial-gradient(circle 1px at 75% 40%, ${sec} 99%, transparent),
          radial-gradient(circle 1.5px at 90% 55%, ${sec} 99%, transparent),
          ${primary}`,
      };

    case 'GRADIENT':
      return {
        background: `linear-gradient(90deg, ${primary}, ${sec})`,
      };

    case 'JACQUARD':
      return {
        background: `repeating-conic-gradient(${primary} 0% 25%, ${sec} 0% 50%) 0 0 / 6px 6px`,
      };

    default:
      return { background: primary };
  }
}
