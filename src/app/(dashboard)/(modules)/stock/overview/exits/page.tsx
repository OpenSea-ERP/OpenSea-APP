/**
 * OpenSea OS - Saídas de Estoque (Exited Stock Items)
 * Listagem de itens que já tiveram saída (quantity = 0, status = EXPIRED)
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
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { STOCK_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
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
import { cn } from '@/lib/utils';
import type { Item } from '@/types/stock';
import { getUnitAbbreviation } from '@/helpers/formatters';
import {
  ArrowLeft,
  ArrowUpRight,
  Building,
  CalendarDays,
  Copy,
  Factory,
  History,
  LogOut,
  MapPin,
  Palette,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingCart,
  Undo2,
  X,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { DateRange } from 'react-day-picker';
import { usePrintQueue } from '@/core/print-queue';
import { toast } from 'sonner';
import { ItemHistoryModal } from '../../(entities)/products/src/modals/item-history-modal';

// =============================================================================
// EXIT TYPE CONFIG
// =============================================================================

interface ExitTypeConfig {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EXIT_TYPE_CONFIGS: Record<string, ExitTypeConfig> = {
  SALE: {
    label: 'Vendido',
    color:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    icon: ShoppingCart,
  },
  PRODUCTION: {
    label: 'Utilização',
    color:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    icon: Building,
  },
  SAMPLE: {
    label: 'Amostra',
    color:
      'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
    icon: ArrowUpRight,
  },
  LOSS: {
    label: 'Perda/Furto',
    color:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
    icon: ShieldAlert,
  },
  SUPPLIER_RETURN: {
    label: 'Devolvido',
    color:
      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
    icon: Undo2,
  },
};

const EXIT_TYPE_FILTER_OPTIONS = [
  { id: 'SALE', label: 'Vendido' },
  { id: 'PRODUCTION', label: 'Utilização' },
  { id: 'SAMPLE', label: 'Amostra' },
  { id: 'LOSS', label: 'Perda/Furto' },
  { id: 'SUPPLIER_RETURN', label: 'Devolvido' },
];

function getExitTypeConfig(exitType?: string | null): ExitTypeConfig {
  if (!exitType) {
    return {
      label: 'Saída',
      color:
        'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
      icon: History,
    };
  }
  return (
    EXIT_TYPE_CONFIGS[exitType] ?? {
      label: exitType,
      color:
        'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
      icon: History,
    }
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatExitDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function maskDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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
// DATE PRESETS
// =============================================================================

type DatePreset = '1d' | '7d' | '30d' | '60d' | 'custom';

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: '1d', label: '1 dia' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: '60d', label: '60 dias' },
  { id: 'custom', label: 'Personalizado' },
];

function getPresetRange(preset: DatePreset): { from: Date; to: Date } {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  switch (preset) {
    case '1d':
      from.setDate(from.getDate() - 1);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '60d':
      from.setDate(from.getDate() - 60);
      break;
    default:
      from.setDate(from.getDate() - 30);
  }
  return { from, to };
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// =============================================================================
// ENTITY CONFIG
// =============================================================================

const exitsConfig: EntityConfig<Item> = {
  name: 'exit',
  namePlural: 'exits',
  icon: History,
  api: {
    baseUrl: '/api/v1/items',
    queryKey: 'items-exits',
  },
  routes: {
    list: '/stock/overview/exits',
  },
  display: {
    titleField: 'productName',
    subtitleField: 'fullCode',
    labels: {
      singular: 'saída',
      plural: 'saídas',
      createButton: '',
      emptyState: 'Nenhuma saída de estoque registrada',
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
// PAGE WRAPPER
// =============================================================================

export default function StockExitsPage() {
  return (
    <Suspense fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}>
      <StockExitsPageContent />
    </Suspense>
  );
}

// =============================================================================
// PAGE CONTENT
// =============================================================================

function StockExitsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  const canView = hasPermission(STOCK_PERMISSIONS.ITEMS.ACCESS);
  const { actions: printQueueActions } = usePrintQueue();

  // ============================================================================
  // FILTER STATE
  // ============================================================================

  const exitTypeFromUrl = useMemo(() => {
    const raw = searchParams.get('exitType');
    return raw ? [raw] : [];
  }, [searchParams]);

  const manufacturerIdFromUrl = useMemo(() => {
    const raw = searchParams.get('manufacturerId');
    return raw ? [raw] : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Date range filter (default: last 30 days)
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const { from, to } = getPresetRange('30d');
    return { from, to };
  });
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [customFromInput, setCustomFromInput] = useState('');
  const [customToInput, setCustomToInput] = useState('');

  const handlePresetChange = useCallback((preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const { from, to } = getPresetRange(preset);
      setDateRange({ from, to });
      setDatePopoverOpen(false);
    } else {
      setDatePopoverOpen(true);
    }
  }, []);

  const handleCalendarSelect = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setDatePreset('custom');
    if (range?.from) {
      setCustomFromInput(formatShortDate(range.from));
    }
    if (range?.to) {
      setCustomToInput(formatShortDate(range.to));
    }
  }, []);

  const handleDateInputApply = useCallback(() => {
    const parseDate = (str: string): Date | undefined => {
      const parts = str.split('/');
      if (parts.length !== 3) return undefined;
      const [d, m, y] = parts.map(Number);
      if (!d || !m || !y) return undefined;
      const date = new Date(y, m - 1, d);
      if (isNaN(date.getTime())) return undefined;
      return date;
    };
    const from = parseDate(customFromInput);
    const to = parseDate(customToInput);
    if (from) {
      from.setHours(0, 0, 0, 0);
      const toDate = to ?? new Date();
      toDate.setHours(23, 59, 59, 999);
      setDateRange({ from, to: toDate });
      setDatePreset('custom');
      setDatePopoverOpen(false);
    }
  }, [customFromInput, customToInput]);

  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);

  // ============================================================================
  // DATA
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

  const filters: ItemsInfiniteFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: 'EXPIRED',
      manufacturerId:
        manufacturerIdFromUrl.length === 1
          ? manufacturerIdFromUrl[0]
          : undefined,
      hideEmpty: false,
      updatedFrom: dateRange?.from?.toISOString(),
      updatedTo: dateRange?.to?.toISOString(),
      sortBy,
      sortOrder,
    }),
    [debouncedSearch, manufacturerIdFromUrl, dateRange, sortBy, sortOrder]
  );

  const {
    items: allItems,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useItemsInfinite(filters);

  // Client-side filter by exitMovementType (if URL param set)
  const items = useMemo(() => {
    if (exitTypeFromUrl.length === 0) return allItems;
    return allItems.filter(
      (item) => item.exitMovementType === exitTypeFromUrl[0]
    );
  }, [allItems, exitTypeFromUrl]);

  // ============================================================================
  // URL HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: { exitType?: string[]; manufacturerId?: string[] }) => {
      const parts: string[] = [];
      const et =
        params.exitType !== undefined ? params.exitType : exitTypeFromUrl;
      const mfr =
        params.manufacturerId !== undefined
          ? params.manufacturerId
          : manufacturerIdFromUrl;
      if (et.length > 0) parts.push(`exitType=${et[0]}`);
      if (mfr.length > 0) parts.push(`manufacturerId=${mfr[0]}`);
      return parts.length > 0
        ? `/stock/overview/exits?${parts.join('&')}`
        : '/stock/overview/exits';
    },
    [exitTypeFromUrl, manufacturerIdFromUrl]
  );

  const setExitTypeFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ exitType: ids })),
    [router, buildFilterUrl]
  );

  const setManufacturerFilter = useCallback(
    (ids: string[]) =>
      router.push(buildFilterUrl({ manufacturerId: ids })),
    [router, buildFilterUrl]
  );

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
          observerEntries[0]?.isIntersecting &&
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
  // HANDLERS
  // ============================================================================

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

  const handleViewProduct = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        const item = items.find((i) => i.id === ids[0]);
        if (item?.productId) {
          router.push(`/stock/products/${item.productId}`);
        }
      }
    },
    [items, router]
  );

  const handlePrintLabel = useCallback(
    (ids: string[]) => {
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
    [items, printQueueActions]
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = useCallback(
    (item: Item, _isSelected: boolean) => {
      const exitCfg = getExitTypeConfig(item.exitMovementType);
      const variantColor = item.variantColorHex || '#64748b';

      const customActions: ContextMenuAction[] = [];

      if (canView) {
        customActions.push({
          id: 'history',
          label: 'Ver histórico',
          icon: History,
          onClick: handleHistory,
          separator: 'before',
        });
        customActions.push({
          id: 'print',
          label: 'Gerar etiqueta',
          icon: Printer,
          onClick: handlePrintLabel,
        });
      }

      const badges: {
        label: string;
        variant: 'outline';
        color: string;
      }[] = [];

      // Unified exit badge: "Devolução em 01 de abr. de 2026"
      badges.push({
        label: item.updatedAt
          ? `${exitCfg.label} em ${formatExitDate(item.updatedAt)}`
          : exitCfg.label,
        variant: 'outline',
        color: exitCfg.color,
      });

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

      if (item.batchNumber) {
        badges.push({
          label: `Lote: ${item.batchNumber}`,
          variant: 'outline',
          color:
            'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
        });
      }

      const locationText =
        item.lastKnownAddress || item.bin?.address || item.resolvedAddress;

      return (
        <EntityContextMenu
          itemId={item.id}
          onView={canView && item.productId ? handleViewProduct : undefined}
          labels={{ view: 'Ver Produto' }}
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
              background: `linear-gradient(135deg, ${variantColor}80, ${variantColor}40)`,
            }}
            badges={badges}
            footer={{
              type: 'split',
              left: {
                icon: MapPin,
                label: locationText || 'Sem localização',
                color: 'cyan',
              },
              right: {
                icon: History,
                label: formatItemQuantity(
                  item.initialQuantity,
                  item.templateUnitOfMeasure
                ),
                onClick: () => handleHistory([item.id]),
                color: 'cyan',
              },
            }}
            isSelected={false}
            showSelection={false}
            clickable={false}
            createdAt={item.createdAt}
            updatedAt={item.updatedAt}
            showStatusBadges={false}
          />
        </EntityContextMenu>
      );
    },
    [canView, handleHistory, handleViewProduct, handlePrintLabel]
  );

  const renderListCard = useCallback(
    (item: Item, _isSelected: boolean) => {
      const exitCfg = getExitTypeConfig(item.exitMovementType);
      const variantColor = item.variantColorHex || '#64748b';
      const locationText =
        item.lastKnownAddress || item.bin?.address || item.resolvedAddress;

      const customActions: ContextMenuAction[] = [];

      if (canView) {
        customActions.push({
          id: 'history',
          label: 'Ver histórico',
          icon: History,
          onClick: handleHistory,
          separator: 'before',
        });
        customActions.push({
          id: 'print',
          label: 'Gerar etiqueta',
          icon: Printer,
          onClick: handlePrintLabel,
        });
      }

      return (
        <EntityContextMenu
          itemId={item.id}
          onView={canView && item.productId ? handleViewProduct : undefined}
          labels={{ view: 'Ver Produto' }}
          actions={customActions}
        >
          <div
            className="flex border rounded-lg overflow-hidden transition-all bg-white dark:bg-white/5 border-border hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 opacity-75"
          >
            {/* Left color bar - muted for exited items */}
            <div
              className="w-1 shrink-0"
              style={{ backgroundColor: `${variantColor}80` }}
            />
            <div className="flex-1 flex items-center gap-3 px-3 py-2">
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${variantColor}80, ${variantColor}40)`,
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
              {/* Exit type + date badge */}
              <div className="w-[180px] shrink-0 text-center hidden md:block">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                    exitCfg.color
                  )}
                >
                  {item.updatedAt
                    ? `${exitCfg.label} em ${formatExitDate(item.updatedAt)}`
                    : exitCfg.label}
                </span>
              </div>
              {/* Quantity column (initial, since current = 0) */}
              <div className="w-[80px] shrink-0 text-right">
                <span className="text-[15px] font-bold text-muted-foreground">
                  {formatItemQuantity(
                    item.initialQuantity,
                    item.templateUnitOfMeasure
                  )}
                </span>
              </div>
            </div>
          </div>
        </EntityContextMenu>
      );
    },
    [canView, handleHistory, handleViewProduct, handlePrintLabel]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Estoque Geral', href: '/stock/overview/list' },
            { label: 'Saídas' },
          ]}
          buttons={[
            {
              id: 'back',
              title: 'Voltar ao Estoque',
              icon: ArrowLeft,
              onClick: () => router.push('/stock/overview/list'),
              variant: 'outline' as const,
            },
          ]}
        />

        {/* Hero Banner */}
        <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
          <div className="absolute top-0 right-0 w-44 h-44 bg-rose-500/15 dark:bg-rose-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-500/15 dark:bg-slate-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-linear-to-br from-rose-500 to-slate-600">
                  <LogOut className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                    Saídas de Estoque
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    Histórico de itens que já tiveram saída completa do estoque
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
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <TooltipProvider delayDuration={300}>
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

        {isLoading ? (
          <GridLoading count={9} layout="list" size="md" gap="gap-4" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar saídas"
            message="Não foi possível carregar o histórico de saídas. Tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : (
          <EntityGrid
            config={exitsConfig}
            items={items}
            showItemCount={false}
            toolbarStart={
              <>
                <FilterDropdown
                  label="Tipo de Saída"
                  icon={History}
                  options={EXIT_TYPE_FILTER_OPTIONS}
                  selected={exitTypeFromUrl}
                  onSelectionChange={setExitTypeFilter}
                  activeColor="violet"
                  searchPlaceholder="Buscar tipo..."
                  emptyText="Nenhum tipo encontrado."
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

                {/* Date range filter */}
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 h-8 text-xs font-medium transition-colors cursor-pointer',
                        datePreset !== '30d'
                          ? 'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      {datePreset === 'custom' && dateRange?.from
                        ? `${formatShortDate(dateRange.from)}${dateRange.to ? ` — ${formatShortDate(dateRange.to)}` : ''}`
                        : DATE_PRESETS.find((p) => p.id === datePreset)?.label ?? '30 dias'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 space-y-3">
                      {/* Quick presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {DATE_PRESETS.filter((p) => p.id !== 'custom').map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handlePresetChange(preset.id)}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                              datePreset === preset.id
                                ? 'bg-violet-600 text-white'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Período personalizado
                        </p>
                        {/* Date inputs */}
                        <div className="flex items-center gap-2 mb-3">
                          <Input
                            placeholder="dd/mm/aaaa"
                            value={customFromInput}
                            onChange={(e) => setCustomFromInput(maskDateInput(e.target.value))}
                            maxLength={10}
                            className="h-8 text-xs w-[110px]"
                          />
                          <span className="text-xs text-muted-foreground">até</span>
                          <Input
                            placeholder="dd/mm/aaaa"
                            value={customToInput}
                            onChange={(e) => setCustomToInput(maskDateInput(e.target.value))}
                            maxLength={10}
                            className="h-8 text-xs w-[110px]"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs px-2"
                            onClick={handleDateInputApply}
                          >
                            Aplicar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs px-2 text-muted-foreground"
                            onClick={() => {
                              handlePresetChange('30d');
                              setCustomFromInput('');
                              setCustomToInput('');
                            }}
                          >
                            Resetar
                          </Button>
                        </div>

                        {/* Calendar */}
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={handleCalendarSelect}
                          numberOfMonths={2}
                          disabled={{ after: new Date() }}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {items.length} {items.length === 1 ? 'saída' : 'saídas'}
                </p>
              </>
            }
            renderGridItem={renderGridCard}
            renderListItem={renderListCard}
            defaultView="list"
            showSorting
            defaultSortField="createdAt"
            defaultSortDirection="desc"
            customSortOptions={[
              { field: 'createdAt', direction: 'desc', label: 'Mais Recente' },
              { field: 'name', direction: 'asc', label: 'Nome' },
            ]}
            onSortChange={(field, direction) => {
              setSortBy(field);
              setSortOrder(direction);
            }}
            enableDragSelection={false}
          />
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {/* History Modal */}
        <ItemHistoryModal
          open={historyModalOpen}
          onOpenChange={setHistoryModalOpen}
          item={historyItem}
          productId={historyItem?.productId}
        />
      </PageBody>
    </PageLayout>
  );
}
