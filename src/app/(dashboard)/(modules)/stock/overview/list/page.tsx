/**
 * OpenSea OS - Listagem de Estoque (Stock Items)
 * Listagem com infinite scroll, EntityGrid e filtros server-side
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
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { STOCK_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import type { EntityConfig } from '@/core/types';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useItemsInfinite,
  type ItemsInfiniteFilters,
} from '@/hooks/stock/use-items';
import { useManufacturers } from '@/hooks/stock';
import { useWarehouses } from '@/hooks/stock/use-warehouses';
import { itemsService } from '@/services/stock';
import { cn } from '@/lib/utils';
import type { Item } from '@/types/stock';
import { getUnitAbbreviation } from '@/helpers/formatters';
import { printListing } from '@/helpers/print-listing';
import {
  ArrowRightLeft,
  Copy,
  Factory,
  Grid3X3,
  History,
  LogOut,
  Loader2,
  MapPin,
  PackageMinus,
  Palette,
  Printer,
  RefreshCw,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoPackageDependents } from 'react-icons/go';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ItemHistoryModal } from '../../(entities)/products/src/modals/item-history-modal';
import { ChangeLocationModal } from '../../(entities)/products/src/modals/change-location-modal';
import { ExitItemsModal } from '../../(entities)/products/src/modals/exit-items-modal';
import { useTransferItem, useRegisterItemExit } from '@/hooks/stock/use-items';
import {
  SelectionToolbar,
  type SelectionAction,
} from '@/core/components/selection-toolbar';
import { useSelectionContext } from '@/core/selection/selection-context';
import { usePrintQueue } from '@/core/print-queue';

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_OPTIONS = [
  { id: 'AVAILABLE', label: 'Disponível' },
  { id: 'RESERVED', label: 'Reservado' },
  { id: 'IN_TRANSIT', label: 'Em Trânsito' },
  { id: 'DAMAGED', label: 'Danificado' },
];

// =============================================================================
// ENTITY CONFIG
// =============================================================================

const itemsConfig: EntityConfig<Item> = {
  name: 'item',
  namePlural: 'items',
  icon: Palette,
  api: {
    baseUrl: '/api/v1/items',
    queryKey: 'items',
  },
  routes: {
    list: '/stock/overview/list',
    detail: '/stock/overview/list/:id',
  },
  display: {
    titleField: 'productName',
    subtitleField: 'fullCode',
    labels: {
      singular: 'item',
      plural: 'itens',
      createButton: 'Novo Item',
      emptyState: 'Nenhum item encontrado no estoque',
      searchPlaceholder: 'Buscar por código, produto, fabricante, lote...',
    },
  },
  permissions: {
    view: STOCK_PERMISSIONS.ITEMS.ACCESS,
    create: STOCK_PERMISSIONS.ITEMS.ACCESS,
    update: STOCK_PERMISSIONS.ITEMS.ADMIN,
    delete: STOCK_PERMISSIONS.ITEMS.ADMIN,
  },
};

// =============================================================================
// HELPERS
// =============================================================================

function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; color: string }> = {
    AVAILABLE: {
      label: 'Disponível',
      color:
        'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    },
    RESERVED: {
      label: 'Reservado',
      color:
        'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    },
    IN_TRANSIT: {
      label: 'Em Trânsito',
      color:
        'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
    },
    DAMAGED: {
      label: 'Danificado',
      color:
        'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
    },
    EXPIRED: {
      label: 'Vencido',
      color:
        'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
    },
    DISPOSED: {
      label: 'Descartado',
      color:
        'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
    },
  };
  return (
    configs[status] ?? {
      label: status,
      color: 'border-slate-600/25 bg-slate-50 text-slate-700',
    }
  );
}

function formatItemQuantity(qty: number, unit?: string): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 3,
  }).format(qty);
  const abbr = unit ? getUnitAbbreviation(unit) || unit : 'un';
  return `${formatted} ${abbr}`;
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveItemName(item: Item): string {
  return (
    [item.templateName, item.productName, item.variantName]
      .filter(Boolean)
      .join(' ') || 'Item sem identificação'
  );
}

// =============================================================================
// TEMPLATE ATTRIBUTE HELPERS
// =============================================================================

interface ViewableField {
  key: string;
  label: string;
  value: string;
}

function getViewableFields(item: Item): ViewableField[] {
  const fields: ViewableField[] = [];
  const templateAttrs = item.templateItemAttributes;
  if (!templateAttrs || !item.attributes) return fields;

  for (const [key, def] of Object.entries(templateAttrs)) {
    if (!def.enableView) continue;
    const val = item.attributes[key];
    if (val === undefined || val === null || val === '') continue;
    fields.push({
      key,
      label: def.label || key,
      value: String(val) + (def.unitOfMeasure ? ` ${def.unitOfMeasure}` : ''),
    });
  }
  return fields;
}

function getPrintableFields(item: Item): ViewableField[] {
  const fields: ViewableField[] = [];

  // Item-level printable fields
  const itemAttrs = item.templateItemAttributes;
  if (itemAttrs && item.attributes) {
    for (const [key, def] of Object.entries(itemAttrs)) {
      if (!def.enablePrint) continue;
      const val = item.attributes[key];
      if (val === undefined || val === null || val === '') continue;
      fields.push({
        key: `item.${key}`,
        label: def.label || key,
        value: String(val) + (def.unitOfMeasure ? ` ${def.unitOfMeasure}` : ''),
      });
    }
  }

  // Variant-level printable fields
  const variantAttrs = item.templateVariantAttributes;
  if (variantAttrs && item.variantAttributes) {
    for (const [key, def] of Object.entries(variantAttrs)) {
      if (!def.enablePrint) continue;
      const val = item.variantAttributes[key];
      if (val === undefined || val === null || val === '') continue;
      fields.push({
        key: `variant.${key}`,
        label: def.label || key,
        value: String(val) + (def.unitOfMeasure ? ` ${def.unitOfMeasure}` : ''),
      });
    }
  }

  // Product-level printable fields
  const productAttrs = item.templateProductAttributes;
  if (productAttrs && item.productAttributes) {
    for (const [key, def] of Object.entries(productAttrs)) {
      if (!def.enablePrint) continue;
      const val = item.productAttributes[key];
      if (val === undefined || val === null || val === '') continue;
      fields.push({
        key: `product.${key}`,
        label: def.label || key,
        value: String(val) + (def.unitOfMeasure ? ` ${def.unitOfMeasure}` : ''),
      });
    }
  }

  return fields;
}

// =============================================================================
// PRINT
// =============================================================================

function printItems(itemsToPrint: Item[]) {
  const totalQty = Math.round(
    itemsToPrint.reduce((s, i) => s + i.currentQuantity, 0) * 1000
  ) / 1000;
  const unit = getUnitAbbreviation(itemsToPrint[0]?.templateUnitOfMeasure || '') || 'un';

  // Collect dynamic printable columns
  const dynamicColMap = new Map<string, string>();
  for (const item of itemsToPrint) {
    for (const field of getPrintableFields(item)) {
      if (!dynamicColMap.has(field.key)) {
        dynamicColMap.set(field.key, field.label);
      }
    }
  }

  const dynamicColumns: import('@/helpers/print-listing').PrintColumn[] = [...dynamicColMap.entries()].map(
    ([key, label]) => ({ key, label })
  );

  const columns: import('@/helpers/print-listing').PrintColumn[] = [
    { key: 'name', label: 'Item' },
    { key: 'code', label: 'Código', mono: true },
    { key: 'ref', label: 'Ref.' },
    { key: 'manufacturer', label: 'Fabricante' },
    { key: 'location', label: 'Localização' },
    ...dynamicColumns,
    { key: 'qty', label: 'Quantidade', align: 'right', bold: true },
  ];

  const rows = itemsToPrint.map((item) => {
    const printFields = getPrintableFields(item);
    const fieldMap = Object.fromEntries(printFields.map((f) => [f.key, f.value]));
    return {
      name: resolveItemName(item),
      code: item.fullCode || item.uniqueCode || '',
      ref: item.variantReference || '',
      manufacturer: toTitleCase(item.manufacturerName || ''),
      location: item.bin?.address || item.resolvedAddress || item.lastKnownAddress || '',
      qty: formatItemQuantity(item.currentQuantity, item.templateUnitOfMeasure),
      ...fieldMap,
    };
  });

  printListing({
    brandText: 'Consulta de Estoque',
    title: 'Listagem de Estoque',
    columns,
    rows,
    summary: [
      { label: 'Itens', value: String(itemsToPrint.length) },
      { label: 'Quantidade total', value: totalQty.toLocaleString('pt-BR', { maximumFractionDigits: 3 }), unit },
    ],
    footerLabel: `Total — ${itemsToPrint.length} ${itemsToPrint.length === 1 ? 'item' : 'itens'}`,
    footerValue: `${totalQty.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${unit}`,
    footerValueColumn: 'qty',
    footerRight: 'Estoque Geral — Consulta',
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function StockOverviewListPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <StockOverviewListPageContent />
    </Suspense>
  );
}

function StockOverviewListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSION FLAGS
  // ============================================================================

  const canView = hasPermission(STOCK_PERMISSIONS.ITEMS.ACCESS);
  const canAdmin = hasPermission(STOCK_PERMISSIONS.ITEMS.ADMIN);
  const canPrint = hasPermission(STOCK_PERMISSIONS.ITEMS.PRINT);
  const { actions: printQueueActions } = usePrintQueue();

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const statusFromUrl = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? [raw] : [];
  }, [searchParams]);

  const manufacturerIdFromUrl = useMemo(() => {
    const raw = searchParams.get('manufacturerId');
    return raw ? [raw] : [];
  }, [searchParams]);

  const zoneIdFromUrl = useMemo(() => {
    const raw = searchParams.get('zoneId');
    return raw ? [raw] : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);
  const [actionSelectorOpen, setActionSelectorOpen] = useState(false);
  const [actionItems, setActionItems] = useState<Item[]>([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);

  // ============================================================================
  // DATA: Manufacturers for filter dropdown
  // ============================================================================

  const { data: manufacturersData } = useManufacturers();

  const manufacturerOptions = useMemo(
    () =>
      (manufacturersData?.manufacturers ?? []).map((m) => ({
        id: m.id,
        label: m.name,
      })),
    [manufacturersData]
  );

  // ============================================================================
  // DATA: Infinite scroll
  // ============================================================================

  const filters: ItemsInfiniteFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFromUrl.length === 1 ? statusFromUrl[0] : undefined,
      manufacturerId:
        manufacturerIdFromUrl.length === 1
          ? manufacturerIdFromUrl[0]
          : undefined,
      zoneId: zoneIdFromUrl.length === 1 ? zoneIdFromUrl[0] : undefined,
      hideEmpty: true,
      sortBy,
      sortOrder,
    }),
    [
      debouncedSearch,
      statusFromUrl,
      manufacturerIdFromUrl,
      zoneIdFromUrl,
      sortBy,
      sortOrder,
    ]
  );

  const {
    items,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useItemsInfinite(filters);

  // Extract zone options from loaded items (derived, not state)
  const zoneOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) {
      const zone = item.bin?.zone;
      if (zone?.id && !seen.has(zone.id)) {
        seen.set(zone.id, zone.name || zone.code);
      }
    }
    return [...seen.entries()].map(([id, label]) => ({ id, label }));
  }, [items]);

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        if (
          observerEntries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: {
      status?: string[];
      manufacturerId?: string[];
      zoneId?: string[];
    }) => {
      const parts: string[] = [];
      const sts =
        params.status !== undefined ? params.status : statusFromUrl;
      const mfr =
        params.manufacturerId !== undefined
          ? params.manufacturerId
          : manufacturerIdFromUrl;
      const zn =
        params.zoneId !== undefined ? params.zoneId : zoneIdFromUrl;
      if (sts.length > 0) parts.push(`status=${sts[0]}`);
      if (mfr.length > 0) parts.push(`manufacturerId=${mfr[0]}`);
      if (zn.length > 0) parts.push(`zoneId=${zn[0]}`);
      return parts.length > 0
        ? `/stock/overview/list?${parts.join('&')}`
        : '/stock/overview/list';
    },
    [statusFromUrl, manufacturerIdFromUrl, zoneIdFromUrl]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  const setManufacturerFilter = useCallback(
    (ids: string[]) =>
      router.push(buildFilterUrl({ manufacturerId: ids })),
    [router, buildFilterUrl]
  );

  const setZoneFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ zoneId: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        // Open history modal for the item
        const item = items.find((i) => i.id === ids[0]);
        if (item) {
          setHistoryItem(item);
          setHistoryModalOpen(true);
        }
      }
    },
    [items]
  );

  const handleContextDelete = useCallback((ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await itemsService.deleteItem(id);
    }
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    toast.success(
      itemsToDelete.length === 1
        ? 'Item excluído com sucesso!'
        : `${itemsToDelete.length} itens excluídos!`
    );
    refetch();
  }, [itemsToDelete, refetch]);

  const handleHistory = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        const item = items.find((i) => i.id === ids[0]);
        if (item) {
          setHistoryItem(item);
          setHistoryModalOpen(true);
        }
      }
    },
    [items]
  );

  const transferMutation = useTransferItem();
  const exitMutation = useRegisterItemExit();

  const handleTransfer = useCallback(
    (ids: string[]) => {
      const selected = items.filter((i) => ids.includes(i.id));
      if (selected.length > 0) {
        setActionItems(selected);
        setTransferModalOpen(true);
      }
    },
    [items]
  );

  const handleExit = useCallback(
    (ids: string[]) => {
      const selected = items.filter((i) => ids.includes(i.id));
      if (selected.length > 0) {
        setActionItems(selected);
        setExitModalOpen(true);
      }
    },
    [items]
  );

  const handleOpenActionSelector = useCallback(
    (item: Item) => {
      setActionItems([item]);
      setActionSelectorOpen(true);
    },
    []
  );

  const handleTransferConfirm = useCallback(
    async (newBinId: string, reason: string) => {
      if (actionItems.length === 0) return;
      const toTransfer = actionItems.filter((item) => item.binId !== newBinId);
      const skipped = actionItems.length - toTransfer.length;
      if (toTransfer.length === 0) {
        toast.info(
          actionItems.length === 1
            ? 'O item já está neste local.'
            : 'Todos os itens já estão neste local.'
        );
        return;
      }
      for (const item of toTransfer) {
        await transferMutation.mutateAsync({
          itemId: item.id,
          destinationBinId: newBinId,
          notes: reason || undefined,
        });
      }
      setTransferModalOpen(false);
      setActionItems([]);
      if (skipped > 0) {
        toast.success(
          `${toTransfer.length} ${toTransfer.length === 1 ? 'item transferido' : 'itens transferidos'} com sucesso! ${skipped} ${skipped === 1 ? 'item já estava' : 'itens já estavam'} no destino.`
        );
      } else {
        toast.success(
          toTransfer.length === 1
            ? 'Item transferido com sucesso!'
            : `${toTransfer.length} itens transferidos com sucesso!`
        );
      }
      refetch();
    },
    [actionItems, transferMutation, refetch]
  );

  const handleExitConfirm = useCallback(
    async (exitType: string, reason: string) => {
      if (actionItems.length === 0) return;
      for (const item of actionItems) {
        await exitMutation.mutateAsync({
          itemId: item.id,
          quantity: item.currentQuantity,
          movementType: exitType as import('@/types/stock').ExitMovementType,
          reasonCode: reason || undefined,
        });
      }
      setExitModalOpen(false);
      setActionItems([]);
      toast.success(
        actionItems.length === 1
          ? 'Saída registrada com sucesso!'
          : `${actionItems.length} saídas registradas com sucesso!`
      );
      refetch();
    },
    [actionItems, exitMutation, refetch]
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = useCallback(
    (item: Item, isSelected: boolean) => {
      const statusCfg = getStatusConfig(item.status);
      const variantColor = item.variantColorHex || '#64748b';

      const customActions: ContextMenuAction[] = [];

      if (canView) {
        customActions.push({
          id: 'transfer',
          label: 'Transferir',
          icon: ArrowRightLeft,
          onClick: handleTransfer,
          separator: 'before',
        });
        customActions.push({
          id: 'exit',
          label: 'Registrar saída',
          icon: PackageMinus,
          onClick: handleExit,
        });
        customActions.push({
          id: 'history',
          label: 'Ver histórico',
          icon: History,
          onClick: handleHistory,
        });
        if (canPrint) {
          customActions.push({
            id: 'print',
            label: 'Gerar etiqueta',
            icon: Printer,
            onClick: (ids: string[]) => {
              const selected = items.filter((i) => ids.includes(i.id));
              if (selected.length > 0) {
                printQueueActions.addToQueue(
                  selected.map((item) => ({ item }))
                );
                toast.success(
                  selected.length === 1
                    ? 'Etiqueta adicionada à fila de impressão'
                    : `${selected.length} etiquetas adicionadas à fila de impressão`
                );
              }
            },
          });
        }
      }

      const badges: {
        label: string;
        variant: 'outline';
        color: string;
      }[] = [];

      if (item.manufacturerName) {
        badges.push({
          label: toTitleCase(item.manufacturerName),
          variant: 'outline',
          color:
            'border-cyan-600/25 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/8 text-cyan-700 dark:text-cyan-300',
        });
      }

      if (item.variantReference) {
        badges.push({
          label: `Ref: ${item.variantReference}`,
          variant: 'outline',
          color:
            'border-indigo-600/25 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/8 text-indigo-700 dark:text-indigo-300',
        });
      }

      badges.push({
        label: statusCfg.label,
        variant: 'outline',
        color: statusCfg.color,
      });

      if (item.batchNumber) {
        badges.push({
          label: `Lote: ${item.batchNumber}`,
          variant: 'outline',
          color:
            'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
        });
      }

      // Template viewable fields for item level
      for (const field of getViewableFields(item)) {
        badges.push({
          label: `${field.label}: ${field.value}`,
          variant: 'outline',
          color:
            'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
        });
      }

      const locationText =
        item.bin?.address || item.resolvedAddress || item.lastKnownAddress;
      const locationUrl = item.bin
        ? `/stock/locations/${item.bin.zone.warehouseId}?zone=${item.bin.zone.id}&highlight=${item.bin.id}&item=${item.id}`
        : undefined;

      return (
        <EntityContextMenu
          itemId={item.id}
          onView={canView ? handleContextView : undefined}
          actions={customActions}
        >
          <EntityCard
            id={item.id}
            variant="grid"
            title={resolveItemName(item)}
            subtitle={
              <span className="inline-flex items-center gap-1">
                {item.fullCode || item.uniqueCode || ''}
                {(item.fullCode || item.uniqueCode) && (
                  <button
                    type="button"
                    className="text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(item.fullCode || item.uniqueCode || '');
                      toast.success('Código copiado!');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </span>
            }
            icon={Palette}
            iconBgStyle={{
              background: `linear-gradient(135deg, ${variantColor}, ${variantColor}dd)`,
            }}
            badges={badges}
            footer={{
              type: 'split',
              left: {
                icon: MapPin,
                label: locationText || 'Sem localização',
                onClick: () => {
                  if (locationUrl) window.open(locationUrl, '_blank');
                },
                color: 'emerald',
              },
              right: {
                icon: GoPackageDependents,
                label: formatItemQuantity(
                  item.currentQuantity,
                  item.templateUnitOfMeasure
                ),
                onClick: () => handleOpenActionSelector(item),
                color: 'emerald',
              },
            }}
            isSelected={isSelected}
            showSelection={false}
            clickable={false}
            createdAt={item.createdAt}
            updatedAt={item.updatedAt}
            showStatusBadges={false}
          />
        </EntityContextMenu>
      );
    },
    [
      canView,
      canAdmin,
      handleContextView,
      handleContextDelete,
      handleTransfer,
      handleExit,
      handleHistory,
      handleOpenActionSelector,
      router,
    ]
  );

  const renderListCard = useCallback(
    (item: Item, isSelected: boolean) => {
      const statusCfg = getStatusConfig(item.status);
      const variantColor = item.variantColorHex || '#64748b';
      const locationText =
        item.bin?.address || item.resolvedAddress || item.lastKnownAddress;

      const customActions: ContextMenuAction[] = [];

      if (canView) {
        customActions.push({
          id: 'transfer',
          label: 'Transferir',
          icon: ArrowRightLeft,
          onClick: handleTransfer,
          separator: 'before',
        });
        customActions.push({
          id: 'exit',
          label: 'Registrar saída',
          icon: PackageMinus,
          onClick: handleExit,
        });
        customActions.push({
          id: 'history',
          label: 'Ver histórico',
          icon: History,
          onClick: handleHistory,
        });
        if (canPrint) {
          customActions.push({
            id: 'print',
            label: 'Gerar etiqueta',
            icon: Printer,
            onClick: (ids: string[]) => {
              const selected = items.filter((i) => ids.includes(i.id));
              if (selected.length > 0) {
                printQueueActions.addToQueue(
                  selected.map((item) => ({ item }))
                );
                toast.success(
                  selected.length === 1
                    ? 'Etiqueta adicionada à fila de impressão'
                    : `${selected.length} etiquetas adicionadas à fila de impressão`
                );
              }
            },
          });
        }
      }

      return (
        <EntityContextMenu
          itemId={item.id}
          onView={canView ? handleContextView : undefined}
          actions={customActions}
        >
          <div
            className={cn(
              'flex border rounded-lg overflow-hidden transition-all bg-white dark:bg-white/5',
              isSelected
                ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-500/5'
                : 'border-border hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            {/* Left color bar */}
            <div
              className="w-1 shrink-0"
              style={{ backgroundColor: variantColor }}
            />
            <div className="flex-1 flex items-center gap-3 px-3 py-2">
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${variantColor}, ${variantColor}dd)`,
                }}
              >
                <Palette className="h-4 w-4 text-white" />
              </div>
              {/* Name + Code + Batch */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-foreground truncate">
                  {resolveItemName(item)}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {item.fullCode || item.uniqueCode || ''}
                  </span>
                  {(item.fullCode || item.uniqueCode) && (
                    <button
                      type="button"
                      className="text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const code = item.fullCode || item.uniqueCode || '';
                        navigator.clipboard.writeText(code);
                        toast.success('Código copiado!');
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                  {item.variantReference && (
                    <span className="inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium border border-indigo-600/25 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/8 text-indigo-700 dark:text-indigo-300">
                      Ref: {item.variantReference}
                    </span>
                  )}
                  {item.batchNumber && (
                    <span className="inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium border border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300">
                      Lote: {item.batchNumber}
                    </span>
                  )}
                </div>
              </div>
              {/* Fabricante column */}
              <div className="w-[120px] shrink-0 text-xs text-muted-foreground truncate hidden lg:block">
                {item.manufacturerName || '—'}
              </div>
              {/* Localização column */}
              <div className="w-[120px] shrink-0 text-xs text-muted-foreground hidden lg:flex items-center gap-1">
                {locationText ? (
                  <>
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{locationText}</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
              {/* Status column */}
              <div className="w-[100px] shrink-0 text-center hidden md:block">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                    statusCfg.color
                  )}
                >
                  {statusCfg.label}
                </span>
              </div>
              {/* Quantity column */}
              <div className="w-[80px] shrink-0 text-right">
                <span className="text-[15px] font-bold text-foreground">
                  {formatItemQuantity(
                    item.currentQuantity,
                    item.templateUnitOfMeasure
                  )}
                </span>
              </div>
            </div>
          </div>
        </EntityContextMenu>
      );
    },
    [
      canView,
      canAdmin,
      handleContextView,
      handleContextDelete,
      handleTransfer,
      handleExit,
      handleHistory,
    ]
  );

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => items.map((a) => a.id), [items]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'stock-items',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Estoque Geral', href: '/stock/overview/list' },
            ]}
            buttons={[
              {
                id: 'exits',
                title: 'Verificar Saídas',
                icon: LogOut,
                onClick: () => router.push('/stock/overview/exits'),
                variant: 'outline' as const,
              },
            ]}
          />

          {/* Hero Banner */}
          <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
            <div className="absolute top-0 right-0 w-44 h-44 bg-violet-500/15 dark:bg-violet-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                      Consulta de Estoque
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-white/60">
                      Visão consolidada de todos os itens com localização, quantidades e atributos
                    </p>
                  </div>
                </div>
              </div>

              {/* Search + actions strip */}
              <div className="bg-muted/30 dark:bg-white/5 rounded-lg px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Buscar por código, produto, fabricante, lote..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-sm bg-white dark:bg-white/5"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <TooltipProvider delayDuration={300}>
                      {canPrint && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => printItems(items)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Imprimir listagem</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => refetch()}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Atualizar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </PageHeader>

        <PageBody>

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="list" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar estoque"
              message="Não foi possível carregar a listagem de itens. Tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <>
              <EntityGrid
                config={itemsConfig}
                items={items}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={Palette}
                      options={STATUS_OPTIONS}
                      selected={statusFromUrl}
                      onSelectionChange={setStatusFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <FilterDropdown
                      label="Fabricante"
                      icon={Factory}
                      options={manufacturerOptions}
                      selected={manufacturerIdFromUrl}
                      onSelectionChange={setManufacturerFilter}
                      activeColor="cyan"
                      searchPlaceholder="Buscar fabricante..."
                      emptyText="Nenhum fabricante encontrado."
                    />
                    <FilterDropdown
                      label="Zona"
                      icon={Grid3X3}
                      options={zoneOptions}
                      selected={zoneIdFromUrl}
                      onSelectionChange={setZoneFilter}
                      activeColor="emerald"
                      searchPlaceholder="Buscar zona..."
                      emptyText="Nenhuma zona encontrada."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'item' : 'itens'}
                      {items.length < total && ` (${items.length} carregados)`}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={(item) => {
                  setHistoryItem(item);
                  setHistoryModalOpen(true);
                }}
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(field);
                    setSortOrder(direction);
                  }
                }}
              />

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}

          {/* Delete PIN Confirmation Modal */}
          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setItemsToDelete([]);
            }}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de Ação para confirmar a exclusão deste item. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de Ação para excluir ${itemsToDelete.length} itens. Esta ação não pode ser desfeita.`
            }
          />

          {/* Item History Modal */}
          <ItemHistoryModal
            open={historyModalOpen}
            onOpenChange={setHistoryModalOpen}
            item={historyItem}
            productId={historyItem?.productId}
            onBack={actionItems.length > 0 ? () => {
              setHistoryModalOpen(false);
              setActionSelectorOpen(true);
            } : undefined}
          />

          {/* Action Selector Modal */}
          <Dialog
            open={actionSelectorOpen}
            onOpenChange={(open) => {
              setActionSelectorOpen(open);
              if (!open) setActionItems([]);
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ações do Item</DialogTitle>
              </DialogHeader>
              {actionItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-4">
                    {resolveItemName(actionItems[0])}
                    <span className="font-mono text-xs ml-2">
                      {formatItemQuantity(
                        actionItems[0].currentQuantity,
                        actionItems[0].templateUnitOfMeasure
                      )}
                    </span>
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Ver Histórico */}
                    <button
                      type="button"
                      onClick={() => {
                        setActionSelectorOpen(false);
                        setHistoryItem(actionItems[0]);
                        setHistoryModalOpen(true);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-white dark:bg-white/5 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-100 dark:group-hover:bg-sky-500/20 transition-colors">
                        <History className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        Ver Histórico
                      </span>
                    </button>

                    {/* Transferir */}
                    <button
                      type="button"
                      onClick={() => {
                        setActionSelectorOpen(false);
                        setTransferModalOpen(true);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-white dark:bg-white/5 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-colors">
                        <ArrowRightLeft className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        Transferir
                      </span>
                    </button>

                    {/* Dar Baixa */}
                    <button
                      type="button"
                      onClick={() => {
                        setActionSelectorOpen(false);
                        setExitModalOpen(true);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-white dark:bg-white/5 hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20 transition-colors">
                        <GoPackageDependents className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        Dar Baixa
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Transfer Modal */}
          <ChangeLocationModal
            open={transferModalOpen}
            onOpenChange={(open) => {
              setTransferModalOpen(open);
              if (!open) setActionItems([]);
            }}
            selectedItems={actionItems}
            onConfirm={handleTransferConfirm}
            onBack={actionItems.length === 1 ? () => {
              setTransferModalOpen(false);
              setActionSelectorOpen(true);
            } : undefined}
          />

          {/* Exit Modal */}
          <ExitItemsModal
            open={exitModalOpen}
            onOpenChange={(open) => {
              setExitModalOpen(open);
              if (!open) setActionItems([]);
            }}
            selectedItems={actionItems}
            onConfirm={handleExitConfirm}
            onTransfer={actionItems.length === 1 ? () => {
              setExitModalOpen(false);
              setTransferModalOpen(true);
            } : undefined}
          />

          {/* Bulk Selection Toolbar */}
          <StockSelectionToolbar
            items={items}
            total={total}
            onBulkTransfer={handleTransfer}
            onBulkExit={handleExit}
            onBulkPrint={(ids) => {
              const selected = items.filter((i) => ids.includes(i.id));
              if (selected.length > 0) printItems(selected);
            }}
            onBulkLabel={(ids) => {
              const selected = items.filter((i) => ids.includes(i.id));
              if (selected.length > 0) {
                printQueueActions.addToQueue(
                  selected.map((item) => ({ item }))
                );
                toast.success(
                  selected.length === 1
                    ? 'Etiqueta adicionada à fila de impressão'
                    : `${selected.length} etiquetas adicionadas à fila de impressão`
                );
              }
            }}
            canView={canView}
            canPrint={canPrint}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}

// =============================================================================
// SELECTION TOOLBAR
// =============================================================================

function StockSelectionToolbar({
  items,
  total,
  onBulkTransfer,
  onBulkExit,
  onBulkPrint,
  onBulkLabel,
  canView,
  canPrint,
}: {
  items: Item[];
  total: number;
  onBulkTransfer: (ids: string[]) => void;
  onBulkExit: (ids: string[]) => void;
  onBulkPrint: (ids: string[]) => void;
  onBulkLabel: (ids: string[]) => void;
  canView: boolean;
  canPrint: boolean;
}) {
  const { state, actions } = useSelectionContext();
  const selectedIds = useMemo(() => [...state.selectedIds], [state.selectedIds]);

  const selectionActions = useMemo<SelectionAction[]>(() => {
    const acts: SelectionAction[] = [];

    if (canView) {
      acts.push({
        id: 'bulk-transfer',
        label: 'Transferir',
        icon: ArrowRightLeft,
        onClick: onBulkTransfer,
      });
      acts.push({
        id: 'bulk-exit',
        label: 'Dar Baixa',
        icon: GoPackageDependents,
        onClick: onBulkExit,
      });
    }

    if (canPrint) {
      acts.push({
        id: 'bulk-label',
        label: 'Gerar Etiqueta',
        icon: Tag,
        onClick: onBulkLabel,
      });
      acts.push({
        id: 'bulk-print',
        label: 'Imprimir',
        icon: Printer,
        onClick: onBulkPrint,
      });
    }

    return acts;
  }, [canView, canPrint, onBulkTransfer, onBulkExit, onBulkPrint, onBulkLabel]);

  return (
    <SelectionToolbar
      selectedIds={selectedIds}
      totalItems={total}
      onClear={actions.clear}
      onSelectAll={actions.selectAll}
      actions={selectionActions}
    />
  );
}
