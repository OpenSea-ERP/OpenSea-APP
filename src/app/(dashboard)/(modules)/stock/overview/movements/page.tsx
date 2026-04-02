'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRightLeft,
  CalendarDays,
  Clock,
  Copy,
  Filter,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { getUnitAbbreviation } from '@/helpers/formatters';
import { printListing } from '@/helpers/print-listing';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import type { FilterOption } from '@/components/ui/filter-dropdown';
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
import { useRouter } from 'next/navigation';
import { BsBoxSeam } from 'react-icons/bs';
import { useItemMovements, useItems } from '@/hooks/stock/use-items';
import { cn } from '@/lib/utils';
import type { Item, ItemMovement } from '@/types/stock';
import { MOVEMENT_TYPE_LABELS } from '@/types/stock';

import {
  MOVEMENT_CONFIG,
  MOVEMENT_CONFIG_FALLBACK,
  MOVEMENT_SUBTYPE_CONFIG,
  formatDateTime,
  getMovementDirection,
} from './src';
import type { DirectionFilter } from './src';

// =============================================================================
// FILTER OPTIONS
// =============================================================================

const DIRECTION_OPTIONS: FilterOption[] = [
  { id: 'IN', label: 'Entrada' },
  { id: 'OUT', label: 'Saída' },
];

const SUBTYPE_OPTIONS: FilterOption[] = Object.entries(
  MOVEMENT_SUBTYPE_CONFIG
).map(([key, { label }]) => ({ id: key, label }));

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
    case '1d': from.setDate(from.getDate() - 1); break;
    case '7d': from.setDate(from.getDate() - 7); break;
    case '30d': from.setDate(from.getDate() - 30); break;
    case '60d': from.setDate(from.getDate() - 60); break;
    default: from.setDate(from.getDate() - 30);
  }
  return { from, to };
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function maskDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// =============================================================================
// HELPERS
// =============================================================================

interface ItemInfo {
  productLabel: string;
  sku?: string;
  fullCode: string;
  unitAbbr: string;
}

function buildItemInfoMap(items: Item[]): Map<string, ItemInfo> {
  const map = new Map<string, ItemInfo>();
  for (const item of items) {
    const parts = [item.templateName, item.productName, item.variantName].filter(Boolean) as string[];
    const productLabel = parts.length > 0 ? parts.join(' ') : 'Item sem nome';
    map.set(item.id, {
      productLabel,
      sku: item.variantSku && item.variantSku !== item.variantName ? item.variantSku : undefined,
      fullCode: item.fullCode || item.uniqueCode || item.id.slice(0, 8),
      unitAbbr: item.templateUnitOfMeasure
        ? (getUnitAbbreviation(item.templateUnitOfMeasure) || item.templateUnitOfMeasure)
        : 'un',
    });
  }
  return map;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function stripBinPrefix(ref: string): string {
  return ref.startsWith('Bin: ') ? ref.slice(5) : ref;
}

function getReference(m: ItemMovement): string {
  if ((m.movementType === 'TRANSFER' || m.movementType === 'ZONE_RECONFIGURE') && (m.originRef || m.destinationRef)) {
    const from = m.originRef ? stripBinPrefix(m.originRef) : '?';
    const to = m.destinationRef ? stripBinPrefix(m.destinationRef) : '?';
    return `${from} → ${to}`;
  }
  if (m.notes) return m.notes;
  if (m.batchNumber) return `Lote: ${m.batchNumber}`;
  return '';
}

function getPrintReference(m: ItemMovement): string {
  if ((m.movementType === 'TRANSFER' || m.movementType === 'ZONE_RECONFIGURE') && (m.originRef || m.destinationRef)) {
    const from = m.originRef ? stripBinPrefix(m.originRef) : '?';
    const to = m.destinationRef ? stripBinPrefix(m.destinationRef) : '?';
    return `<span style="color:#64748b">De:</span> ${from}<br><span style="color:#64748b">Para:</span> ${to}`;
  }
  if (m.notes) return m.notes;
  if (m.batchNumber) return `Lote: ${m.batchNumber}`;
  return '—';
}

function printMovements(movements: ItemMovement[], infoMap: Map<string, ItemInfo>) {
  const rows = movements.map((m) => {
    const info = infoMap.get(m.itemId);
    const code = info?.fullCode ?? m.itemId.slice(0, 8);
    const name = info?.productLabel ?? 'Item sem nome';
    const unitAbbr = info?.unitAbbr ?? 'un';
    const qty = Number(m.quantity).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
    const dir = getMovementDirection(m);
    const sign = dir === 'IN' ? '+' : dir === 'OUT' ? '-' : '';
    const userName = m.user?.name ?? '—';
    return {
      type: MOVEMENT_TYPE_LABELS[m.movementType] ?? m.movementType,
      product: `${name}<br><span style="font-family:'Cascadia Code','Fira Code',monospace;font-size:10px;color:#64748b">${code}</span>`,
      reference: getPrintReference(m),
      qty: `${sign}${qty} ${unitAbbr}`,
      registro: `${formatDateTime(m.createdAt)}<br><span style="font-size:10px;color:#64748b">${userName}</span>`,
    };
  });

  printListing({
    brandText: 'Movimentações de Estoque',
    title: 'Movimentações de Estoque',
    columns: [
      { key: 'type', label: 'Movimento', width: '100px' },
      { key: 'registro', label: 'Registro', width: '130px' },
      { key: 'product', label: 'Produto' },
      { key: 'reference', label: 'Referência', width: '140px' },
      { key: 'qty', label: 'Quantidade', align: 'right', width: '90px', bold: true },
    ],
    rows,
    summary: [
      { label: 'Total de movimentações', value: String(movements.length) },
      ...Object.entries(
        movements.reduce<Record<string, number>>((acc, m) => {
          const label = MOVEMENT_TYPE_LABELS[m.movementType] ?? m.movementType;
          acc[label] = (acc[label] || 0) + 1;
          return acc;
        }, {})
      ).map(([label, count]) => ({ label, value: String(count) })),
    ],
    footerRight: 'Estoque — Movimentações',
  });
}

// =============================================================================
// DIRECTION COLORS (for left bar)
// =============================================================================

const DIRECTION_BAR_COLORS = {
  IN: '#22c55e',
  OUT: '#ef4444',
  NEUTRAL: '#3b82f6',
} as const;

/** Gradient background for type icon */
const TYPE_ICON_BG: Record<string, string> = {
  PURCHASE: 'bg-linear-to-br from-green-500 to-green-700 dark:from-green-600 dark:to-green-800',
  CUSTOMER_RETURN: 'bg-linear-to-br from-green-500 to-green-700 dark:from-green-600 dark:to-green-800',
  SALE: 'bg-linear-to-br from-rose-500 to-rose-700 dark:from-rose-600 dark:to-rose-800',
  PRODUCTION: 'bg-linear-to-br from-rose-500 to-rose-700 dark:from-rose-600 dark:to-rose-800',
  SAMPLE: 'bg-linear-to-br from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-700',
  LOSS: 'bg-linear-to-br from-rose-600 to-rose-800 dark:from-rose-700 dark:to-rose-900',
  SUPPLIER_RETURN: 'bg-linear-to-br from-rose-500 to-rose-700 dark:from-rose-600 dark:to-rose-800',
  TRANSFER: 'bg-linear-to-br from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800',
  INVENTORY_ADJUSTMENT: 'bg-linear-to-br from-amber-500 to-amber-700 dark:from-amber-600 dark:to-amber-800',
  ZONE_RECONFIGURE: 'bg-linear-to-br from-violet-500 to-violet-700 dark:from-violet-600 dark:to-violet-800',
};

/** Outline badge for type label — thick colored border, neutral text */
const TYPE_BADGE_BG: Record<string, string> = {
  PURCHASE: 'border-green-500 dark:border-green-500',
  CUSTOMER_RETURN: 'border-green-500 dark:border-green-500',
  SALE: 'border-rose-500 dark:border-rose-500',
  PRODUCTION: 'border-rose-500 dark:border-rose-500',
  SAMPLE: 'border-slate-400 dark:border-slate-500',
  LOSS: 'border-rose-600 dark:border-rose-500',
  SUPPLIER_RETURN: 'border-rose-500 dark:border-rose-500',
  TRANSFER: 'border-blue-500 dark:border-blue-500',
  INVENTORY_ADJUSTMENT: 'border-amber-500 dark:border-amber-500',
  ZONE_RECONFIGURE: 'border-violet-500 dark:border-violet-500',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// =============================================================================
// PAGE
// =============================================================================

export default function MovementsListPage() {
  const router = useRouter();

  // ============================================================================
  // FILTER STATE
  // ============================================================================

  const [search, setSearch] = useState('');
  const [selectedDirection, setSelectedDirection] = useState<string[]>([]);
  const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>([]);

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
    if (range?.from) setCustomFromInput(formatShortDate(range.from));
    if (range?.to) setCustomToInput(formatShortDate(range.to));
  }, []);

  const handleDateInputApply = useCallback(() => {
    const parseDate = (str: string): Date | undefined => {
      const parts = str.split('/');
      if (parts.length !== 3) return undefined;
      const [d, m, y] = parts.map(Number);
      if (!d || !m || !y) return undefined;
      const date = new Date(y, m - 1, d);
      return isNaN(date.getTime()) ? undefined : date;
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

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data: movementsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useItemMovements();
  const { data: itemsData } = useItems();

  const allMovements = movementsData?.movements ?? [];
  const allItems: Item[] = itemsData?.items ?? [];
  const itemInfoMap = useMemo(() => buildItemInfoMap(allItems), [allItems]);

  // ============================================================================
  // CLIENT-SIDE FILTER CHAIN
  // ============================================================================

  const dateFiltered = useMemo(() => {
    if (!dateRange?.from) return allMovements;
    const from = dateRange.from.getTime();
    const to = dateRange.to ? dateRange.to.getTime() : Date.now();
    return allMovements.filter((m) => {
      const t = new Date(m.createdAt).getTime();
      return t >= from && t <= to;
    });
  }, [allMovements, dateRange]);

  const searchFiltered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const s = search.toLowerCase().trim();
    return dateFiltered.filter((m) => {
      const info = itemInfoMap.get(m.itemId);
      return (
        (info?.productLabel ?? '').toLowerCase().includes(s) ||
        (info?.fullCode ?? '').toLowerCase().includes(s) ||
        (m.user?.name ?? '').toLowerCase().includes(s) ||
        m.batchNumber?.toLowerCase().includes(s) ||
        m.notes?.toLowerCase().includes(s) ||
        m.itemId.toLowerCase().includes(s)
      );
    });
  }, [dateFiltered, search, itemInfoMap]);

  const directionFiltered = useMemo(() => {
    if (selectedDirection.length === 0 || selectedDirection.length === 2) return searchFiltered;
    const dir = selectedDirection[0] as DirectionFilter;
    return dir === 'IN'
      ? searchFiltered.filter((m) => getMovementDirection(m) === 'IN')
      : searchFiltered.filter((m) => getMovementDirection(m) !== 'IN');
  }, [searchFiltered, selectedDirection]);

  const filteredMovements = useMemo(() => {
    if (selectedSubtypes.length === 0) return directionFiltered;
    return directionFiltered.filter((m) =>
      selectedSubtypes.some((subtype) => MOVEMENT_SUBTYPE_CONFIG[subtype]?.match(m))
    );
  }, [directionFiltered, selectedSubtypes]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Movimentações', href: '/stock/overview/movements' },
          ]}
          buttons={[
            {
              id: 'stock',
              title: 'Consultar Estoque',
              icon: BsBoxSeam,
              onClick: () => router.push('/stock/overview/list'),
              variant: 'outline' as const,
            },
          ]}
        />

        {/* Hero Banner */}
        <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
          <div className="absolute top-0 right-0 w-44 h-44 bg-sky-500/15 dark:bg-sky-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/15 dark:bg-blue-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-linear-to-br from-sky-500 to-blue-600">
                  <ArrowRightLeft className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                    Movimentações de Estoque
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    Histórico de entradas, saídas e transferências
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
                    placeholder="Buscar por produto, código, usuário, lote..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm bg-white dark:bg-white/5"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
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
                          onClick={() => printMovements(filteredMovements, itemInfoMap)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Imprimir listagem</TooltipContent>
                    </Tooltip>
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
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Movimento"
            icon={ArrowDownToLine}
            options={DIRECTION_OPTIONS}
            selected={selectedDirection}
            onSelectionChange={setSelectedDirection}
            activeColor="emerald"
            searchPlaceholder="Buscar..."
            emptyText="Nenhuma opção."
          />
          <FilterDropdown
            label="Tipo"
            icon={Filter}
            options={SUBTYPE_OPTIONS}
            selected={selectedSubtypes}
            onSelectionChange={setSelectedSubtypes}
            activeColor="violet"
            searchPlaceholder="Buscar tipo..."
            emptyText="Nenhum tipo encontrado."
          />

          {/* Date range filter */}
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 h-8 text-xs font-medium transition-colors cursor-pointer',
                  datePreset !== '30d'
                    ? 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300'
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
                <div className="flex flex-wrap gap-1.5">
                  {DATE_PRESETS.filter((p) => p.id !== 'custom').map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetChange(preset.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                        datePreset === preset.id
                          ? 'bg-sky-600 text-white'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Período personalizado</p>
                  <div className="flex items-center gap-2 mb-3">
                    <Input placeholder="dd/mm/aaaa" value={customFromInput} onChange={(e) => setCustomFromInput(maskDateInput(e.target.value))} maxLength={10} className="h-8 text-xs w-[110px]" />
                    <span className="text-xs text-muted-foreground">até</span>
                    <Input placeholder="dd/mm/aaaa" value={customToInput} onChange={(e) => setCustomToInput(maskDateInput(e.target.value))} maxLength={10} className="h-8 text-xs w-[110px]" />
                    <Button size="sm" variant="outline" className="h-8 text-xs px-2" onClick={handleDateInputApply}>Aplicar</Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs px-2 text-muted-foreground" onClick={() => { handlePresetChange('30d'); setCustomFromInput(''); setCustomToInput(''); }}>Resetar</Button>
                  </div>
                  <Calendar mode="range" selected={dateRange} onSelect={handleCalendarSelect} numberOfMonths={2} disabled={{ after: new Date() }} />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredMovements.length} {filteredMovements.length === 1 ? 'movimentação' : 'movimentações'}
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <GridLoading count={8} layout="list" size="md" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar movimentações"
            message="Não foi possível carregar as movimentações. Tente novamente."
            action={{ label: 'Tentar Novamente', onClick: () => void refetch() }}
          />
        ) : filteredMovements.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Nenhuma movimentação encontrada.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredMovements.map((movement) => {
              const info = itemInfoMap.get(movement.itemId);
              const dir = getMovementDirection(movement);
              const barColor = DIRECTION_BAR_COLORS[dir];
              const typeCfg = MOVEMENT_CONFIG[movement.movementType] ?? MOVEMENT_CONFIG_FALLBACK;
              const TypeIcon = typeCfg.icon;
              const typeLabel = MOVEMENT_TYPE_LABELS[movement.movementType] ?? typeCfg.label;
              const ref = getReference(movement);
              const code = info?.fullCode ?? movement.itemId.slice(0, 8);
              const unitAbbr = info?.unitAbbr ?? 'un';
              const iconBg = TYPE_ICON_BG[movement.movementType] ?? 'bg-linear-to-br from-slate-400 to-slate-600';
              const badgeBg = TYPE_BADGE_BG[movement.movementType] ?? 'bg-linear-to-r from-slate-400 to-slate-500 text-white';
              const hasDetails = !!ref;

              return (
                <div
                  key={movement.id}
                  className="flex border rounded-lg overflow-hidden transition-all bg-white dark:bg-white/5 border-border hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600"
                >
                  {/* Left color bar */}
                  <div className="w-1 shrink-0" style={{ backgroundColor: barColor }} />

                  <div className="flex-1 flex items-center gap-3 px-3 py-2">
                    {/* Type icon — solid background */}
                    <div className={cn('w-9 h-9 rounded-lg shrink-0 flex items-center justify-center', iconBg)}>
                      <TypeIcon className="h-4 w-4 text-white" />
                    </div>

                    {/* Product + Code */}
                    <div className="flex-1 min-w-0">
                      {info?.sku ? (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="font-semibold text-[13px] text-foreground truncate cursor-default">
                                {info.productLabel}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>SKU: {info.sku}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <div className="font-semibold text-[13px] text-foreground truncate">
                          {info?.productLabel ?? 'Item sem nome'}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-muted-foreground">{code}</span>
                        <button
                          type="button"
                          className="text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(code);
                            toast.success('Código copiado!');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Type badge — gradient + tooltip for details */}
                    <div className="shrink-0 hidden md:block">
                      {hasDetails ? (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={cn('inline-flex items-center whitespace-nowrap rounded-full border-2 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 cursor-default', badgeBg)}>
                                {typeLabel}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{ref}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className={cn('inline-flex items-center whitespace-nowrap rounded-full border-2 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-200', badgeBg)}>
                          {typeLabel}
                        </span>
                      )}
                    </div>

                    {/* Date + Time */}
                    <div className="w-[90px] shrink-0 hidden md:block">
                      <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400">
                        <CalendarDays className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                        {formatDate(movement.createdAt)}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">
                        <Clock className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                        {formatTime(movement.createdAt)}
                      </div>
                    </div>

                    {/* User — avatar + name */}
                    <div className="w-[140px] shrink-0 hidden lg:flex items-center gap-2">
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="text-[10px] font-medium bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                          {movement.user?.name ? getInitials(movement.user.name) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                        {movement.user?.name ?? '—'}
                      </span>
                    </div>

                    {/* Quantity + unit */}
                    <div className="w-[80px] shrink-0 text-right">
                      <span className={cn(
                        'text-sm font-bold tabular-nums',
                        dir === 'IN' ? 'text-green-600 dark:text-green-400' : dir === 'OUT' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                      )}>
                        {dir === 'IN' ? '+' : dir === 'OUT' ? '-' : ''}{Number(movement.quantity).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                      </span>
                      {' '}<span className="text-[10px] text-muted-foreground">{unitAbbr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isFetching && !isLoading && (
          <div className="flex items-center justify-center gap-1 py-4 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Atualizando...
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}
