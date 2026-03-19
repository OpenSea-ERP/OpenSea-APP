'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Columns3,
  Factory,
  Grid3X3,
  Loader2,
  MapPin,
  Palette,
  Printer,
  RefreshCw,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import type { FilterOption } from '@/components/ui/filter-dropdown';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useItems } from '@/hooks/stock/use-items';
import { useManufacturers, useTemplates } from '@/hooks/stock';
import { itemMovementsService } from '@/services/stock';
import {
  formatQuantity,
  formatUnitOfMeasure,
  getUnitAbbreviation,
} from '@/helpers/formatters';
import { normaliseName } from '@/helpers/normalise-name';
import type { Item } from '@/types/stock';
import type { Template, TemplateAttribute } from '@/types/stock';
import { cn } from '@/lib/utils';
import { ItemHistoryModal } from '../../(entities)/products/src/modals/item-history-modal';

// IDs for optional fixed columns
const COL_FABRICANTE = '_fabricante';
const COL_LOCALIZACAO = '_localizacao';
const COL_QUANTIDADE = '_quantidade';

const OPTIONAL_FIXED_COLUMNS: FilterOption[] = [
  { id: COL_FABRICANTE, label: 'Fabricante' },
  { id: COL_LOCALIZACAO, label: 'Localização' },
  { id: COL_QUANTIDADE, label: 'Quantidade' },
];

const DEFAULT_OPTIONAL_FIXED = [
  COL_FABRICANTE,
  COL_LOCALIZACAO,
  COL_QUANTIDADE,
];

/** Badge config para itens que saíram do estoque (qty=0) */
const EXIT_REASON_BADGE: Record<string, { label: string; className: string }> =
  {
    SALE: {
      label: 'Vendido',
      className:
        'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
    },
    SUPPLIER_RETURN: {
      label: 'Devolvido',
      className:
        'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
    },
    INTERNAL_USE: {
      label: 'Utilizado',
      className:
        'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    },
    LOSS: {
      label: 'Perdido',
      className:
        'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
    },
    PRODUCTION: {
      label: 'Utilizado',
      className:
        'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    },
    SAMPLE: {
      label: 'Amostra',
      className:
        'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
    },
  };

const DEFAULT_EXIT_BADGE = {
  label: 'Saiu',
  className:
    'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30',
};

function resolveItemName(item: Item) {
  const parts = [item.templateName, item.productName, item.variantName].filter(
    Boolean
  ) as string[];
  const name = parts.length > 0 ? parts.join(' ') : 'Item sem identificação';
  const sku = item.variantSku;
  // Don't append the SKU if it was auto-generated from the variant name
  if (sku && item.variantName && normaliseName(item.variantName) === sku) {
    return name;
  }
  return sku ? `${name} - ${sku}` : name;
}

function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

interface DynamicColumn {
  id: string;
  label: string;
  level: 'product' | 'variant' | 'item';
  key: string;
}

function buildDynamicColumns(
  items: Item[],
  templates: Template[]
): DynamicColumn[] {
  const templateIds = new Set(
    items.map(i => i.templateId).filter(Boolean) as string[]
  );
  const columns: DynamicColumn[] = [];
  const seen = new Set<string>();

  for (const template of templates) {
    if (!templateIds.has(template.id)) continue;
    const levels: Array<{
      level: 'product' | 'variant' | 'item';
      attrs?: Record<string, TemplateAttribute>;
    }> = [
      { level: 'product', attrs: template.productAttributes },
      { level: 'variant', attrs: template.variantAttributes },
      { level: 'item', attrs: template.itemAttributes },
    ];
    for (const { level, attrs } of levels) {
      if (!attrs) continue;
      for (const [key, def] of Object.entries(attrs)) {
        const colId = `${level}:${key}`;
        if (seen.has(colId)) continue;
        seen.add(colId);
        columns.push({ id: colId, label: def.label || key, level, key });
      }
    }
  }
  return columns;
}

function getDefaultVisibleColumns(
  items: Item[],
  templates: Template[]
): string[] {
  const templateIds = new Set(
    items.map(i => i.templateId).filter(Boolean) as string[]
  );
  const visible = [...DEFAULT_OPTIONAL_FIXED];
  const seen = new Set<string>();

  for (const template of templates) {
    if (!templateIds.has(template.id)) continue;
    const levels: Array<{
      level: string;
      attrs?: Record<string, TemplateAttribute>;
    }> = [
      { level: 'product', attrs: template.productAttributes },
      { level: 'variant', attrs: template.variantAttributes },
      { level: 'item', attrs: template.itemAttributes },
    ];
    for (const { level, attrs } of levels) {
      if (!attrs) continue;
      for (const [key, def] of Object.entries(attrs)) {
        const colId = `${level}:${key}`;
        if (seen.has(colId)) continue;
        seen.add(colId);
        if (def.enableView) visible.push(colId);
      }
    }
  }
  return visible;
}

function getDynamicValue(item: Item, col: DynamicColumn): string {
  let value: unknown;
  if (col.level === 'product') value = item.productAttributes?.[col.key];
  else if (col.level === 'variant') value = item.variantAttributes?.[col.key];
  else value = item.attributes?.[col.key];
  return formatAttributeValue(value);
}

/** Group items by unit of measure key (raw value or '_none'). */
function groupByUnit(items: Item[]): Map<string, Item[]> {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const key = item.templateUnitOfMeasure || '_none';
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

/** Build an HTML table for a group of items sharing the same unit. */
function buildGroupTable(groupItems: Item[], unitKey: string): string {
  const abbr = unitKey === '_none' ? '' : getUnitAbbreviation(unitKey);
  const unitLabel = abbr || (unitKey === '_none' ? '' : unitKey);

  const rows = groupItems
    .map(item => {
      const name = [item.templateName, item.productName, item.variantName]
        .filter(Boolean)
        .join(' ');
      const isAutoSku =
        item.variantSku &&
        item.variantName &&
        normaliseName(item.variantName) === item.variantSku;
      const sku = item.variantSku && !isAutoSku ? ` - ${item.variantSku}` : '';
      const code = item.fullCode || item.uniqueCode || '';
      const loc =
        item.bin?.address ||
        item.resolvedAddress ||
        item.lastKnownAddress ||
        '';
      const qty = item.currentQuantity;
      const manufacturer = item.manufacturerName || '';
      return `<tr>
        <td>${name}${sku}</td>
        <td style="font-family:monospace;font-size:11px">${code}</td>
        <td>${manufacturer}</td>
        <td>${loc}</td>
        <td style="text-align:right">${qty}${unitLabel ? ` ${unitLabel}` : ''}</td>
      </tr>`;
    })
    .join('');

  const total =
    Math.round(groupItems.reduce((s, i) => s + i.currentQuantity, 0) * 1000) /
    1000;

  return `<table>
  <thead><tr><th>Item</th><th>Código</th><th>Fabricante</th><th>Localização</th><th style="text-align:right">Quantidade</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr><td colspan="4">Total</td><td style="text-align:right">${total}${unitLabel ? ` ${unitLabel}` : ''}</td></tr></tfoot>
</table>`;
}

/** Opens a print window with items grouped by unit of measure. */
function printItems(itemsToPrint: Item[]) {
  const groups = groupByUnit(itemsToPrint);

  let tables: string;

  if (groups.size <= 1) {
    // Single unit (or no items) — one table, no subtitle
    const [unitKey, groupItems] = [...groups.entries()][0] ?? ['_none', []];
    tables = buildGroupTable(groupItems, unitKey);
  } else {
    // Multiple units — one table per unit with a subtitle
    tables = [...groups.entries()]
      .map(([unitKey, groupItems]) => {
        const abbr = unitKey === '_none' ? '' : getUnitAbbreviation(unitKey);
        const label = abbr || unitKey;
        const subtitle = label
          ? `<h2 style="font-size:15px;margin:24px 0 8px">${formatUnitOfMeasure(unitKey)} — ${groupItems.length} ite${groupItems.length === 1 ? 'm' : 'ns'}</h2>`
          : `<h2 style="font-size:15px;margin:24px 0 8px">Sem unidade — ${groupItems.length} ite${groupItems.length === 1 ? 'm' : 'ns'}</h2>`;
        return subtitle + buildGroupTable(groupItems, unitKey);
      })
      .join('');
  }

  const html = `<!DOCTYPE html>
<html><head><title>Listagem de Estoque</title>
<style>
  body{font-family:system-ui,sans-serif;padding:24px;font-size:13px}
  h1{font-size:18px;margin-bottom:4px}
  h2{page-break-before:auto}
  .meta{color:#666;margin-bottom:16px;font-size:12px}
  table{width:100%;border-collapse:collapse;margin-bottom:8px}
  th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}
  th{background:#f5f5f5;font-weight:600}
  tfoot td{font-weight:600;background:#f9f9f9}
</style>
</head><body>
<h1>Listagem de Estoque</h1>
<p class="meta">${itemsToPrint.length} ite${itemsToPrint.length === 1 ? 'm' : 'ns'} &bull; Impresso em ${new Date().toLocaleString('pt-BR')}</p>
${tables}
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export default function StockOverviewListPage() {
  const [search, setSearch] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[] | null>(null);
  const [hideExited, setHideExited] = useState(true);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>(
    []
  );
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedBinAddresses, setSelectedBinAddresses] = useState<string[]>(
    []
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, refetch, isFetching } = useItems();

  const { data: templates = [] } = useTemplates();
  const { data: manufacturersData } = useManufacturers();

  const allItems: Item[] = data?.items ?? [];

  // Fetch exit reasons for items with qty=0
  const exitedItemIds = useMemo(
    () => allItems.filter(i => i.currentQuantity === 0).map(i => i.id),
    [allItems]
  );

  const { data: exitReasonMap = {} } = useQuery({
    queryKey: ['exit-reasons', 'overview', exitedItemIds],
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
    enabled: exitedItemIds.length > 0,
  });

  const manufacturerOptions: FilterOption[] = useMemo(
    () =>
      (manufacturersData?.manufacturers ?? []).map(m => ({
        id: m.name,
        label: m.name,
      })),
    [manufacturersData]
  );

  const zoneOptions: FilterOption[] = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of allItems) {
      const zone = item.bin?.zone;
      if (zone?.id && !seen.has(zone.id)) {
        seen.set(zone.id, zone.name || zone.code);
      }
    }
    return [...seen.entries()].map(([id, label]) => ({ id, label }));
  }, [allItems]);

  const binAddressOptions: FilterOption[] = useMemo(() => {
    const seen = new Set<string>();
    const options: FilterOption[] = [];
    for (const item of allItems) {
      const addr = item.bin?.address || item.resolvedAddress;
      if (addr && !seen.has(addr)) {
        seen.add(addr);
        options.push({ id: addr, label: addr });
      }
    }
    return options;
  }, [allItems]);

  // Client-side search filtering
  const searchedItems = useMemo(() => {
    if (!search.trim()) return allItems;
    const s = search.toLowerCase().trim();
    return allItems.filter(item => {
      const name = resolveItemName(item).toLowerCase();
      const code = (item.fullCode || item.uniqueCode || '').toLowerCase();
      const manufacturer = (item.manufacturerName || '').toLowerCase();
      const location = (
        item.bin?.address ||
        item.resolvedAddress ||
        item.lastKnownAddress ||
        ''
      ).toLowerCase();
      const batch = (item.batchNumber || '').toLowerCase();
      return (
        name.includes(s) ||
        code.includes(s) ||
        manufacturer.includes(s) ||
        location.includes(s) ||
        batch.includes(s)
      );
    });
  }, [allItems, search]);

  // Client-side manufacturer filtering
  const manufacturerFiltered = useMemo(
    () =>
      selectedManufacturers.length === 0
        ? searchedItems
        : searchedItems.filter(item =>
            item.manufacturerName
              ? selectedManufacturers.includes(item.manufacturerName)
              : false
          ),
    [searchedItems, selectedManufacturers]
  );

  // Client-side zone filtering
  const zoneFiltered = useMemo(
    () =>
      selectedZones.length === 0
        ? manufacturerFiltered
        : manufacturerFiltered.filter(item =>
            item.bin?.zone?.id
              ? selectedZones.includes(item.bin.zone.id)
              : false
          ),
    [manufacturerFiltered, selectedZones]
  );

  // Client-side bin address filtering
  const binFiltered = useMemo(
    () =>
      selectedBinAddresses.length === 0
        ? zoneFiltered
        : zoneFiltered.filter(item => {
            const addr = item.bin?.address || item.resolvedAddress;
            return addr ? selectedBinAddresses.includes(addr) : false;
          }),
    [zoneFiltered, selectedBinAddresses]
  );

  // Client-side exit filtering
  const filteredItems = useMemo(
    () =>
      hideExited
        ? binFiltered.filter(item => item.currentQuantity > 0)
        : binFiltered,
    [binFiltered, hideExited]
  );

  // Virtualizer for table rows
  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 49,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Scroll to top when filters change
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [
    search,
    selectedManufacturers,
    selectedZones,
    selectedBinAddresses,
    hideExited,
  ]);

  const dynamicColumns = useMemo(
    () => buildDynamicColumns(filteredItems, templates),
    [filteredItems, templates]
  );

  const defaultVisible = useMemo(
    () => getDefaultVisibleColumns(filteredItems, templates),
    [filteredItems, templates]
  );

  const activeColumns = visibleColumns ?? defaultVisible;

  const columnOptions: FilterOption[] = useMemo(
    () => [
      ...OPTIONAL_FIXED_COLUMNS,
      ...dynamicColumns.map(c => ({ id: c.id, label: c.label })),
    ],
    [dynamicColumns]
  );

  const activeDynamicColumns = useMemo(
    () => dynamicColumns.filter(c => activeColumns.includes(c.id)),
    [dynamicColumns, activeColumns]
  );

  const showFabricante = activeColumns.includes(COL_FABRICANTE);
  const showLocalizacao = activeColumns.includes(COL_LOCALIZACAO);
  const showQuantidade = activeColumns.includes(COL_QUANTIDADE);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // --- Selection ---
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleRowClick = useCallback(
    (item: Item) => {
      // Delay single-click to distinguish from double-click
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(() => {
        toggleSelection(item.id);
      }, 200);
    },
    [toggleSelection]
  );

  const handleRowDoubleClick = useCallback((item: Item) => {
    // Cancel the pending single-click
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    setHistoryItem(item);
    setHistoryModalOpen(true);
  }, []);

  // --- Selection summary (search across all items, not just current page) ---
  const selectedItems = useMemo(
    () => allItems.filter(i => selectedIds.has(i.id)),
    [allItems, selectedIds]
  );

  const selectionSummary = useMemo(() => {
    if (selectedItems.length === 0) return null;
    // Group totals by unit of measure
    const unitTotals = new Map<string, number>();
    for (const item of selectedItems) {
      const key = item.templateUnitOfMeasure || '_none';
      unitTotals.set(key, (unitTotals.get(key) || 0) + item.currentQuantity);
    }
    const totals = [...unitTotals.entries()].map(([unit, total]) => ({
      unit,
      total: Math.round(total * 1000) / 1000,
      abbr: unit === '_none' ? 'un' : getUnitAbbreviation(unit) || 'un',
    }));
    return {
      count: selectedItems.length,
      totals,
    };
  }, [selectedItems]);

  const totalCols =
    2 +
    (showFabricante ? 1 : 0) +
    (showLocalizacao ? 1 : 0) +
    (showQuantidade ? 1 : 0) +
    activeDynamicColumns.length;

  return (
    <PageLayout className="flex flex-col h-[calc(100dvh-10rem)] overflow-hidden">
      <PageHeader className="shrink-0">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Estoque Geral', href: '/stock/overview/list' },
          ]}
          buttons={[
            {
              id: 'print-all',
              title: 'Imprimir',
              icon: Printer,
              onClick: () => printItems(filteredItems),
              variant: 'outline',
            },
            {
              id: 'refresh',
              title: 'Atualizar',
              icon: RefreshCw,
              onClick: handleRefresh,
              variant: 'outline',
            },
          ]}
        />
        <Header
          title="Listagem de Estoque"
          description="Visão consolidada de todos os itens com localização, quantidades e atributos personalizados."
        />
      </PageHeader>

      <PageBody className="flex flex-col flex-1 min-h-0 gap-4">
        <SearchBar
          value={search}
          placeholder="Buscar por código, produto, variante ou atributos..."
          onSearch={setSearch}
          onClear={() => setSearch('')}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterDropdown
              label="Fabricante"
              icon={Factory}
              options={manufacturerOptions}
              selected={selectedManufacturers}
              onSelectionChange={setSelectedManufacturers}
              activeColor="violet"
              searchPlaceholder="Buscar fabricante..."
              emptyText="Nenhum fabricante encontrado."
            />
            <FilterDropdown
              label="Zona"
              icon={Grid3X3}
              options={zoneOptions}
              selected={selectedZones}
              onSelectionChange={setSelectedZones}
              activeColor="cyan"
              searchPlaceholder="Buscar zona..."
              emptyText="Nenhuma zona encontrada."
            />
            <FilterDropdown
              label="Localização"
              icon={MapPin}
              options={binAddressOptions}
              selected={selectedBinAddresses}
              onSelectionChange={setSelectedBinAddresses}
              activeColor="emerald"
              searchPlaceholder="Buscar endereço..."
              emptyText="Nenhuma localização encontrada."
            />
            <span className="text-xs text-muted-foreground tabular-nums">
              {filteredItems.length}{' '}
              {filteredItems.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <Switch
                id="hide-exited-overview"
                checked={hideExited}
                onCheckedChange={setHideExited}
                className="scale-75"
              />
              <Label
                htmlFor="hide-exited-overview"
                className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
              >
                Ocultar saídas
              </Label>
            </div>
            <FilterDropdown
              label="Colunas"
              icon={Columns3}
              options={columnOptions}
              selected={activeColumns}
              onSelectionChange={setVisibleColumns}
              activeColor="blue"
              searchPlaceholder="Buscar coluna..."
            />
          </div>
        </div>

        {isLoading ? (
          <GridLoading count={8} layout="list" size="md" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar estoque"
            message="Não foi possível carregar a listagem. Tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => void refetch(),
            }}
          />
        ) : (
          <div className="flex flex-col flex-1 min-h-0 gap-2">
            <div
              ref={scrollContainerRef}
              className="rounded-lg overflow-auto flex-1 min-h-0"
            >
              <table className="w-full caption-bottom text-sm table-fixed">
                <colgroup>
                  <col style={{ width: 48 }} />
                  <col />
                  {showFabricante && <col style={{ width: 180 }} />}
                  {showLocalizacao && <col style={{ width: 180 }} />}
                  {showQuantidade && <col style={{ width: 160 }} />}
                  {activeDynamicColumns.map(col => (
                    <col key={col.id} style={{ width: 120 }} />
                  ))}
                </colgroup>
                <TableHeader className="sticky top-0 z-10 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <TableRow className="border-b border-slate-200/60 dark:border-white/5 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Cor
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Item
                    </TableHead>
                    {showFabricante && (
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                        Fabricante
                      </TableHead>
                    )}
                    {showLocalizacao && (
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                        Localização
                      </TableHead>
                    )}
                    {showQuantidade && (
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                        Quantidade
                      </TableHead>
                    )}
                    {activeDynamicColumns.map(col => (
                      <TableHead
                        key={col.id}
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70"
                      >
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={totalCols} className="text-center">
                        <div className="py-10 text-sm text-muted-foreground">
                          Nenhum item encontrado.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {virtualItems.length > 0 && virtualItems[0].start > 0 && (
                        <tr>
                          <td
                            colSpan={totalCols}
                            style={{
                              height: virtualItems[0].start,
                              padding: 0,
                              border: 'none',
                            }}
                          />
                        </tr>
                      )}
                      {virtualItems.map(virtualRow => {
                        const item = filteredItems[virtualRow.index];
                        const unitAbbr = getUnitAbbreviation(
                          item.templateUnitOfMeasure
                        );
                        const qtyLabel = unitAbbr
                          ? `${formatQuantity(item.currentQuantity)} ${unitAbbr}`
                          : formatQuantity(item.currentQuantity);

                        const hasBin =
                          item.bin?.zone?.id && item.bin?.zone?.warehouseId;

                        const isSelected = selectedIds.has(item.id);
                        const isExited = item.currentQuantity === 0;

                        return (
                          <TableRow
                            key={item.id}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            className={cn(
                              'cursor-pointer transition-colors border-b border-slate-100 dark:border-white/5',
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100/80 dark:hover:bg-blue-500/15'
                                : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/50',
                              isExited && !isSelected && 'opacity-50'
                            )}
                            onClick={() => handleRowClick(item)}
                            onDoubleClick={() => handleRowDoubleClick(item)}
                          >
                            {/* Cor */}
                            <TableCell>
                              {item.variantColorHex ? (
                                <div
                                  className="h-8 w-8 rounded-full shadow-sm"
                                  style={{
                                    backgroundColor: item.variantColorHex,
                                  }}
                                  title={item.variantColorHex}
                                />
                              ) : (
                                <div
                                  className="flex items-center justify-center bg-muted rounded-full h-8 w-8"
                                  title="Cor não definida"
                                >
                                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>

                            {/* Item */}
                            <TableCell>
                              {(() => {
                                const exitBadge = isExited
                                  ? EXIT_REASON_BADGE[
                                      exitReasonMap[item.id] || ''
                                    ] || DEFAULT_EXIT_BADGE
                                  : null;
                                return (
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-foreground">
                                        {resolveItemName(item)}
                                      </span>
                                      {exitBadge && (
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            'text-[10px] px-1.5 py-0 border',
                                            exitBadge.className
                                          )}
                                        >
                                          {exitBadge.label}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-mono text-muted-foreground/60">
                                      {item.fullCode || item.uniqueCode || ''}
                                    </span>
                                  </div>
                                );
                              })()}
                            </TableCell>

                            {/* Fabricante */}
                            {showFabricante && (
                              <TableCell>
                                {item.manufacturerName ? (
                                  <button
                                    type="button"
                                    className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                                    onClick={e => {
                                      e.stopPropagation();
                                      if (
                                        !selectedManufacturers.includes(
                                          item.manufacturerName!
                                        )
                                      ) {
                                        setSelectedManufacturers(prev => [
                                          ...prev,
                                          item.manufacturerName!,
                                        ]);
                                      }
                                    }}
                                  >
                                    {item.manufacturerName}
                                  </button>
                                ) : (
                                  <span className="text-sm text-gray-700 dark:text-gray-200">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            )}

                            {/* Localização */}
                            {showLocalizacao && (
                              <TableCell>
                                {hasBin ? (
                                  <Link
                                    href={`/stock/locations/${item.bin!.zone!.warehouseId}?zone=${item.bin!.zone!.id}&highlight=${item.bin!.id}`}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {item.bin!.address ||
                                      item.resolvedAddress ||
                                      '-'}
                                  </Link>
                                ) : (
                                  <span className="text-sm text-gray-700 dark:text-gray-200">
                                    {item.resolvedAddress ||
                                      item.lastKnownAddress ||
                                      '-'}
                                  </span>
                                )}
                              </TableCell>
                            )}

                            {/* Quantidade */}
                            {showQuantidade && (
                              <TableCell>
                                <Badge variant="secondary" className="text-sm">
                                  {qtyLabel}
                                </Badge>
                              </TableCell>
                            )}

                            {/* Colunas dinâmicas */}
                            {activeDynamicColumns.map(col => (
                              <TableCell key={col.id} className="text-sm">
                                {getDynamicValue(item, col)}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                      {virtualItems.length > 0 && (
                        <tr>
                          <td
                            colSpan={totalCols}
                            style={{
                              height:
                                rowVirtualizer.getTotalSize() -
                                virtualItems[virtualItems.length - 1].end,
                              padding: 0,
                              border: 'none',
                            }}
                          />
                        </tr>
                      )}
                    </>
                  )}
                </TableBody>
              </table>
            </div>

            {isFetching && !isLoading && (
              <div className="flex items-center justify-end gap-1 shrink-0 pr-1 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Atualizando...
              </div>
            )}
          </div>
        )}

        {/* Floating selection bar */}
        {selectionSummary && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-4 px-5 py-3 rounded-xl border border-blue-200 dark:border-blue-400/30 bg-white dark:bg-blue-600/80 shadow-lg backdrop-blur-md">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {selectionSummary.count}{' '}
                {selectionSummary.count === 1 ? 'item' : 'itens'}
              </span>
              <span className="text-sm text-muted-foreground">
                Total:{' '}
                {selectionSummary.totals.map((t, i) => (
                  <span key={t.unit}>
                    {i > 0 && (
                      <span className="mx-1 text-muted-foreground">|</span>
                    )}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {t.total.toLocaleString('pt-BR', {
                        maximumFractionDigits: 3,
                      })}
                      {t.abbr ? ` ${t.abbr}` : ''}
                    </span>
                  </span>
                ))}
              </span>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
              <Button
                size="sm"
                variant="default"
                className="gap-1.5"
                onClick={() => printItems(selectedItems)}
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir seleção
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-muted-foreground"
                onClick={clearSelection}
              >
                <X className="w-3.5 h-3.5" />
                Limpar
              </Button>
            </div>
          </div>
        )}
        {/* Item History Modal (opened on double-click) */}
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
