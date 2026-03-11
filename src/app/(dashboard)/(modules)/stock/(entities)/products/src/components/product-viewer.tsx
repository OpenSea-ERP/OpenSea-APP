/**
 * Product Viewer Component
 * Componente reutilizável para visualização de produtos com suas variantes
 * Responsabilidade única: Renderizar detalhes do produto e gerenciar variantes
 */

'use client';

import { CareIcon } from '@/components/care';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { CopyButton } from '@/components/shared/copy-button';
import { InfoField } from '@/components/shared/info-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePrintQueue } from '@/core/print-queue';
import { useSelection } from '@/core/selection/hooks/use-selection';
import { formatQuantity, formatUnitOfMeasure } from '@/helpers/formatters';
import { useCareOptions } from '@/hooks/stock';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import {
  itemMovementsService,
  itemsService,
  productsService,
} from '@/services/stock';
import type { ExitMovementType, Item, Product, Variant } from '@/types/stock';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Edit,
  Expand,
  Package,
  Palette,
  Plus,
  Printer,
  Search,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ItemRow } from '../components/item-row';
import { ItemsActionBar } from '../components/items-action-bar';
import { VariantRow } from '../components/variant-row';
import {
  ChangeLocationModal,
  ExitItemsModal,
  ItemHistoryModal,
  ItemEntryFormModal,
  VariantFormModal,
} from '../modals';
import type { ExitType } from '../types/products.types';

export interface ProductViewerProps {
  product: Product;
  variants?: Variant[];
  isLoadingVariants?: boolean;
  showHeader?: boolean;
  className?: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function ProductViewer({
  product,
  variants = [],
  isLoadingVariants = false,
  showHeader = true,
  className = '',
  onDelete,
  onEdit,
}: ProductViewerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { actions: printActions } = usePrintQueue();

  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [variantsSearch, setVariantsSearch] = useState('');
  const [itemsSearch, setItemsSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Modal states
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [changeLocationModalOpen, setChangeLocationModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditVariantModal, setShowEditVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [sessionExitReasonMap, setSessionExitReasonMap] = useState<
    Record<string, string>
  >({});
  const [hideExitedItems, setHideExitedItems] = useState(true);
  const [exitInitialType, setExitInitialType] = useState<
    ExitType | undefined
  >();

  // ============================================================================
  // DATA FETCHING - CARE OPTIONS
  // ============================================================================

  const { data: careOptionsData, isLoading: isLoadingCare } = useCareOptions();

  // ============================================================================
  // DATA FETCHING - VARIANT STATS
  // ============================================================================

  const { data: variantStatsMap } = useQuery({
    queryKey: ['items', 'stats-by-variants', product.id],
    queryFn: async () => {
      if (!variants || variants.length === 0) return {};

      const stats: Record<string, { count: number; totalQty: number }> = {};
      for (const variant of variants) {
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
    enabled: variants.length > 0,
    refetchOnMount: 'always',
  });

  // ============================================================================
  // DATA FETCHING - ITEMS
  // ============================================================================

  const {
    data: itemsData,
    isLoading: isLoadingItems,
    error: itemsError,
  } = useQuery({
    queryKey: ['items', 'by-variant', selectedVariant?.id],
    queryFn: async () => {
      if (!selectedVariant?.id) return { items: [] };
      const response = await itemsService.listItems(selectedVariant.id);
      return response;
    },
    enabled: !!selectedVariant?.id,
  });

  // ============================================================================
  // DATA FETCHING - EXIT REASONS (for exited items badges)
  // ============================================================================

  const exitedItemIds = useMemo(
    () =>
      (itemsData?.items || [])
        .filter((item: Item) => item.currentQuantity === 0)
        .map((item: Item) => item.id),
    [itemsData]
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
        // Find the most recent exit movement (not entry/transfer/adjustment)
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
    enabled: exitedItemIds.length > 0,
  });

  // Merge fetched reasons with session-local reasons (session overrides)
  const exitReasonMap = useMemo(
    () => ({ ...(fetchedExitReasons || {}), ...sessionExitReasonMap }),
    [fetchedExitReasons, sessionExitReasonMap]
  );

  // ============================================================================
  // ITEM SELECTION
  // ============================================================================

  const items = useMemo(() => itemsData?.items || [], [itemsData]);
  // Apenas itens com qty > 0 são selecionáveis
  const itemIds = useMemo(
    () =>
      items
        .filter((item: Item) => item.currentQuantity > 0)
        .map((item: Item) => item.id),
    [items]
  );

  const {
    state: selectionState,
    actions: selectionActions,
    setAvailableIds,
  } = useSelection({
    onSelectionChange: () => {
      /* noop */
    },
  });

  // Update available IDs when items change
  useEffect(() => {
    setAvailableIds(itemIds);
  }, [itemIds, setAvailableIds]);

  // Store deselectAll in a ref to avoid infinite loops
  const deselectAllRef = useRef(selectionActions.deselectAll);

  // Update ref when selectionActions changes
  useEffect(() => {
    deselectAllRef.current = selectionActions.deselectAll;
  }, [selectionActions.deselectAll]);

  // Clear selection when variant changes
  useEffect(() => {
    deselectAllRef.current();
  }, [selectedVariant?.id]);

  // Get selected items
  const selectedItems = useMemo(() => {
    const selectedIds = Array.from(selectionState.selectedIds);
    return items.filter((item: Item) => selectedIds.includes(item.id));
  }, [items, selectionState.selectedIds]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const filteredVariants = useMemo(() => {
    const variantsArray = Array.isArray(variants) ? variants : [];
    if (!variantsArray || variantsArray.length === 0) return [];
    if (!variantsSearch.trim()) return variantsArray;
    const q = variantsSearch.toLowerCase();
    return variantsArray.filter(
      variant =>
        variant.name.toLowerCase().includes(q) ||
        (variant.sku?.toLowerCase().includes(q) ?? false) ||
        (variant.barcode?.toLowerCase().includes(q) ?? false)
    );
  }, [variants, variantsSearch]);

  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    let result = items;

    // Ocultar itens que saíram do estoque (qty=0)
    if (hideExitedItems) {
      result = result.filter((item: Item) => item.currentQuantity > 0);
    }

    if (!itemsSearch.trim()) return result;
    const q = itemsSearch.toLowerCase();
    return result.filter((item: Item) => {
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
    () =>
      filteredItems.reduce(
        (sum: number, item: Item) => sum + item.currentQuantity,
        0
      ),
    [filteredItems]
  );

  const unitOfMeasure = formatUnitOfMeasure(
    product.template?.unitOfMeasure || 'UNITS'
  );

  // Mapear care options selecionadas
  // TODO: migrate to ProductCareInstruction API
  const selectedCareOptions = useMemo((): Array<{ code: string; assetPath: string; label: string }> => {
    if (!careOptionsData) return [];
    return [];
  }, [careOptionsData]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleVariantSelect = useCallback((variant: Variant) => {
    setSelectedVariant(variant);
    setItemsSearch('');
  }, []);

  const handleDeleteProduct = async () => {
    try {
      await productsService.deleteProduct(product.id);
      toast.success('Produto excluído com sucesso!');
      if (onDelete) {
        onDelete();
      } else {
        router.push('/stock/products');
      }
    } catch (error) {
      toast.error('Erro ao excluir produto');
      logger.error(
        'Erro ao excluir produto',
        error instanceof Error ? error : undefined
      );
    }
  };

  const handleEditProduct = () => {
    if (onEdit) {
      onEdit();
    } else {
      router.push(`/stock/products/${product.id}/edit`);
    }
  };

  // ============================================================================
  // ITEM SELECTION HANDLERS
  // ============================================================================

  const handleItemClick = useCallback(
    (item: Item, e: React.MouseEvent) => {
      // Items com qty=0 não podem ser selecionados
      if (item.currentQuantity === 0) return;

      if (e.shiftKey && selectionState.lastSelectedId) {
        // Shift+Click: Range selection
        selectionActions.selectRange(selectionState.lastSelectedId, item.id);
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+Click: Toggle selection
        selectionActions.toggle(item.id);
      } else {
        // Normal click: Select only this item
        selectionActions.select(item.id);
      }
    },
    [selectionState.lastSelectedId, selectionActions]
  );

  const handleItemDoubleClick = useCallback((item: Item) => {
    setHistoryItem(item);
    setHistoryModalOpen(true);
  }, []);

  // ============================================================================
  // ACTION BAR HANDLERS
  // ============================================================================

  // Map ExitType to backend's ExitMovementType (now 1:1 except TRANSFER)
  const mapExitType = (exitType: ExitType): ExitMovementType => {
    if (exitType === 'TRANSFER') return 'LOSS'; // fallback, TRANSFER uses different flow
    return exitType as ExitMovementType;
  };

  const handleChangeLocation = useCallback(
    async (newBinId: string, reason: string) => {
      try {
        // Transfer each selected item to the new location
        const transferPromises = selectedItems.map(item =>
          itemsService.transferItem({
            itemId: item.id,
            destinationBinId: newBinId,
            notes: reason || undefined,
          })
        );

        await Promise.all(transferPromises);

        toast.success(
          `${selectedItems.length} ${selectedItems.length === 1 ? 'item transferido' : 'itens transferidos'} com sucesso!`
        );
        selectionActions.deselectAll();
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({
          queryKey: ['items', 'by-variant', selectedVariant?.id],
        });
        await queryClient.invalidateQueries({
          queryKey: ['items', 'stats-by-variants', product.id],
        });
        await queryClient.invalidateQueries({ queryKey: ['item-history'] });
      } catch (error) {
        logger.error(
          'Error changing location',
          error instanceof Error ? error : undefined
        );
        toast.error('Erro ao transferir itens');
        throw error;
      }
    },
    [selectedItems, selectionActions, queryClient, selectedVariant, product.id]
  );

  const handleExitItems = useCallback(
    async (exitType: ExitType, reason: string) => {
      try {
        // Register exit for each selected item
        const exitPromises = selectedItems.map(item =>
          itemsService.registerExit({
            itemId: item.id,
            quantity: item.currentQuantity, // Exit the entire quantity
            movementType: mapExitType(exitType),
            reasonCode: exitType,
            notes: reason || undefined,
          })
        );

        await Promise.all(exitPromises);

        // Registrar motivos de saída localmente para exibir badges imediatamente
        const newReasons: Record<string, string> = {};
        for (const item of selectedItems) {
          newReasons[item.id] = exitType;
        }
        setSessionExitReasonMap(prev => ({ ...prev, ...newReasons }));

        toast.success(
          `Saída de ${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'itens'} registrada com sucesso!`
        );
        selectionActions.deselectAll();
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({
          queryKey: ['items', 'by-variant', selectedVariant?.id],
        });
        await queryClient.invalidateQueries({
          queryKey: ['items', 'stats-by-variants', product.id],
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
    [selectedItems, selectionActions, queryClient, selectedVariant, product.id]
  );

  const handleActionSell = useCallback(() => {
    setExitInitialType('SALE');
    setExitModalOpen(true);
  }, []);

  const handleActionInternalUse = useCallback(() => {
    setExitInitialType('PRODUCTION');
    setExitModalOpen(true);
  }, []);

  const handleActionReturn = useCallback(() => {
    setExitInitialType('SUPPLIER_RETURN');
    setExitModalOpen(true);
  }, []);

  const handleActionLoss = useCallback(() => {
    setExitInitialType('LOSS');
    setExitModalOpen(true);
  }, []);

  const handleActionTransfer = useCallback(() => {
    setChangeLocationModalOpen(true);
  }, []);

  const handleReserveItem = useCallback(() => {
    toast.info('Funcionalidade em desenvolvimento');
  }, []);

  // Print single item
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

  // Exit single item (from ItemRow button)
  const handleExitItem = useCallback(
    (item: Item) => {
      selectionActions.deselectAll();
      selectionActions.select(item.id);
      setExitModalOpen(true);
    },
    [selectionActions]
  );

  // Print all selected items (from action bar)
  const handlePrintLabel = useCallback(() => {
    if (selectedItems.length === 0) {
      toast.warning('Nenhum item selecionado para imprimir');
      return;
    }
    printActions.addToQueue(
      selectedItems.map(item => ({
        item,
        variant: selectedVariant || undefined,
        product: product || undefined,
      }))
    );
    toast.success(
      `${selectedItems.length} item(s) adicionado(s) à fila de impressão`
    );
  }, [printActions, selectedItems, selectedVariant, product]);

  // Print all filtered items
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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={className}>
      {/* Header com Breadcrumb e Editar */}
      {showHeader && (
        <div className="flex w-full items-center justify-between mb-6">
          <PageBreadcrumb
            items={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Produtos', href: '/stock/products' },
              { label: product.name, href: `/stock/products/${product.id}` },
            ]}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/import/stock/variants/by-product/${product.id}`)
              }
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar Variantes
            </Button>
            <Button size="sm" onClick={handleEditProduct} className="gap-2">
              <Edit className="h-4 w-4" />
              Editar Produto
            </Button>
          </div>
        </div>
      )}

      {/* Product Info Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-center w-full justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-cyan-500">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {product.template?.name} {product.name}
                </h1>
                {product.outOfLine && (
                  <span className="px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-md">
                    Fora de Linha
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {product.manufacturer
                  ? product.manufacturer?.name
                  : 'Fabricante não informado'}
              </p>
            </div>
          </div>
          {/* Modo de Conservação - Care Symbols */}
          {selectedCareOptions.length > 0 && (
            <div className="flex items-center gap-3">
              {isLoadingCare ? (
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-md bg-gray-200 dark:bg-slate-700 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <TooltipProvider>
                  <div className="flex flex-wrap gap-2">
                    {selectedCareOptions.map(option => (
                      <Tooltip key={option.code} delayDuration={150}>
                        <TooltipTrigger asChild>
                          <div className="p-2 bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <CareIcon
                              assetPath={option.assetPath}
                              size={32}
                              className="dark:brightness-0 dark:invert"
                              alt={option.label}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-xs space-y-1"
                        >
                          <p className="text-sm font-semibold">
                            {option.label}
                          </p>
                          <p className="text-xs text-muted-foreground leading-snug">
                            Código: {option.code}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </Card>
      {/* Product Details */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoField
            label="Template"
            value={product.template?.name || 'Não informado'}
            showCopyButton
          />
          <InfoField
            label="Código"
            value={product.fullCode || 'Não informado'}
            showCopyButton
          />
          <InfoField
            label="Categoria"
            value={product.productCategories?.[0]?.name || 'Sem categoria'}
            showCopyButton
          />
          <InfoField
            label="Descrição"
            value={product.description || 'Sem descrição'}
            truncate
            action={
              product.description ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-50 hover:opacity-100"
                  onClick={() => setShowDescriptionModal(true)}
                  title="Ver descrição completa"
                >
                  <Expand className="h-3.5 w-3.5" />
                </Button>
              ) : undefined
            }
          />
        </div>
      </Card>

      {/* Atributos Personalizados */}
      {(() => {
        const attrs = product.template?.productAttributes || {};
        return Object.keys(attrs).length > 0 ? (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Atributos Personalizados
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(attrs)
                .sort(([keyA, configA], [keyB, configB]) => {
                  const labelA = (configA.label || keyA).toLowerCase();
                  const labelB = (configB.label || keyB).toLowerCase();
                  return labelA.localeCompare(labelB);
                })
                .map(([key, config]) => {
                  const value = product.attributes?.[key];
                  const cfg = config;
                  const baseLabel = cfg?.label || key;
                  // Adiciona unidade de medida ao label quando existir
                  const label = cfg?.unitOfMeasure
                    ? `${baseLabel} (${cfg.unitOfMeasure})`
                    : baseLabel;

                  const renderValue = () => {
                    if (value === null || value === undefined) {
                      return 'NÃO INFORMADO';
                    }
                    if (typeof value === 'boolean') {
                      return value ? 'Sim' : 'Não';
                    }
                    if (typeof value === 'object') {
                      return JSON.stringify(value);
                    }
                    return String(value);
                  };

                  return (
                    <InfoField
                      key={key}
                      label={label}
                      value={renderValue()}
                      showCopyButton
                    />
                  );
                })}
            </div>
          </Card>
        ) : null;
      })()}

      {/* Two-column layout - Variantes e Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN - Variants */}
        <div className="flex flex-col bg-background rounded-lg border shadow-sm overflow-hidden">
          {/* Variants Header */}
          <div className="p-4 bg-linear-to-r from-muted/50 to-muted/30 dark:from-muted/30 dark:to-muted/30 border-b">
            <div className="flex items-center justify-between mb-3 min-h-[28px]">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium">Variantes</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {filteredVariants.length} de {variants.length}
              </span>
            </div>

            {/* Variants Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar variantes..."
                value={variantsSearch}
                onChange={e => setVariantsSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Variants List */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {isLoadingVariants ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredVariants.length === 0 ? (
              <div className="p-8 text-center">
                <Palette className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
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
                  variantAttributes={product.template?.variantAttributes}
                />
              ))
            )}
          </div>

          {/* Add Variant Button */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => setShowAddVariantModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Variante
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN - Items */}
        <div className="flex flex-col bg-background rounded-lg border shadow-sm overflow-hidden">
          {selectedVariant ? (
            <>
              {/* Items Header */}
              <div className="p-4 bg-linear-to-r from-muted/50 to-muted/30 dark:from-muted/30 dark:to-muted/30 border-b">
                <div className="flex items-center justify-between mb-3 min-h-[28px]">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium">{selectedVariant.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {filteredItems.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrintAllItems}
                        className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        Imprimir Todos
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {filteredItems.length} itens •{' '}
                      {formatQuantity(totalItemsQuantity)} {unitOfMeasure}
                    </span>
                  </div>
                </div>

                {/* Hide exited items switch + Search */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar itens..."
                      value={itemsSearch}
                      onChange={e => setItemsSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  {items.some((i: Item) => i.currentQuantity === 0) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Switch
                        id="hide-exited"
                        checked={hideExitedItems}
                        onCheckedChange={setHideExitedItems}
                        className="scale-75"
                      />
                      <Label
                        htmlFor="hide-exited"
                        className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
                      >
                        Ocultar saídas
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {isLoadingItems ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
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
                    <Box className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
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
                      itemAttributes={product.template?.itemAttributes}
                      isSelected={selectionActions.isSelected(item.id)}
                      onClick={e => handleItemClick(item, e)}
                      onDoubleClick={() => handleItemDoubleClick(item)}
                      onPrint={handlePrintItem}
                      onExit={handleExitItem}
                      lastExitReasonCode={exitReasonMap[item.id]}
                    />
                  ))
                )}
              </div>

              {/* Add Item Button */}
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white"
                  onClick={() => setShowAddItemModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Entrada
                </Button>
              </div>
            </>
          ) : (
            /* Empty state when no variant selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                  'bg-muted'
                )}
              >
                <Box className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">Selecione uma variante</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Clique em uma variante à esquerda para ver seus itens
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Product Confirmation */}
      <VerifyActionPinModal
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={() => handleDeleteProduct()}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de ação para excluir o produto "${product.name}". Esta ação não pode ser desfeita e todas as variantes associadas serão removidas.`}
      />

      {/* Items Action Bar */}
      <ItemsActionBar
        selectedCount={selectionState.count}
        onClearSelection={() => selectionActions.deselectAll()}
        onSell={handleActionSell}
        onInternalUse={handleActionInternalUse}
        onReturn={handleActionReturn}
        onTransfer={handleActionTransfer}
        onLoss={handleActionLoss}
        onReserve={handleReserveItem}
        onPrintLabel={handlePrintLabel}
      />

      {/* Change Location Modal */}
      <ChangeLocationModal
        open={changeLocationModalOpen}
        onOpenChange={setChangeLocationModalOpen}
        selectedItems={selectedItems}
        onConfirm={handleChangeLocation}
        onBack={() => {
          setChangeLocationModalOpen(false);
          setExitModalOpen(true);
        }}
      />

      {/* Exit Items Modal */}
      <ExitItemsModal
        open={exitModalOpen}
        onOpenChange={open => {
          setExitModalOpen(open);
          if (!open) setExitInitialType(undefined);
        }}
        selectedItems={selectedItems}
        onConfirm={handleExitItems}
        onTransfer={handleActionTransfer}
        initialExitType={exitInitialType}
      />

      {/* Item History Modal */}
      <ItemHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        item={historyItem}
      />

      {/* Edit Variant Modal */}
      <VariantFormModal
        product={product}
        variant={editingVariant}
        open={showEditVariantModal}
        onOpenChange={setShowEditVariantModal}
      />

      {/* Add Variant Modal */}
      <VariantFormModal
        product={product}
        open={showAddVariantModal}
        onOpenChange={setShowAddVariantModal}
      />

      {/* Quick Add Item Modal */}
      <ItemEntryFormModal
        product={product}
        variant={selectedVariant}
        open={showAddItemModal}
        onOpenChange={setShowAddItemModal}
      />

      {/* Description Modal */}
      <Dialog
        open={showDescriptionModal}
        onOpenChange={setShowDescriptionModal}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Descrição do Produto</DialogTitle>
              {product.description && (
                <CopyButton
                  content={product.description}
                  tooltipText="Copiar descrição"
                />
              )}
            </div>
          </DialogHeader>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {product.description || 'Sem descrição'}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
