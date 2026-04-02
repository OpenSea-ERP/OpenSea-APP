'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  Filter,
  Loader2,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { printListing } from '@/helpers/print-listing';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import type { FilterOption } from '@/components/ui/filter-dropdown';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useItemMovements, useItems } from '@/hooks/stock/use-items';
import { cn } from '@/lib/utils';
import type { Item, ItemMovement } from '@/types/stock';
import { MOVEMENT_TYPE_LABELS } from '@/types/stock';

import {
  DIRECTION_CONFIG,
  MOVEMENT_CONFIG,
  MOVEMENT_CONFIG_FALLBACK,
  MOVEMENT_SUBTYPE_CONFIG,
  formatDateTime,
  getMovementDirection,
} from './src';
import type { DirectionFilter } from './src';

// ---------------------------------------------------------------------------
// Filter option configs
// ---------------------------------------------------------------------------

const DIRECTION_OPTIONS: FilterOption[] = [
  { id: 'IN', label: 'Entrada' },
  { id: 'OUT', label: 'Saída' },
];

const SUBTYPE_OPTIONS: FilterOption[] = Object.entries(
  MOVEMENT_SUBTYPE_CONFIG
).map(([key, { label }]) => ({ id: key, label }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ItemInfo {
  productLabel: string;
  fullCode: string;
}

/** Build a map from itemId → display info for product name and item code. */
function buildItemInfoMap(items: Item[]): Map<string, ItemInfo> {
  const map = new Map<string, ItemInfo>();
  for (const item of items) {
    const parts = [
      item.templateName,
      item.productName,
      item.variantName,
    ].filter(Boolean) as string[];
    let productLabel = parts.length > 0 ? parts.join(' ') : 'Item sem nome';
    // Append SKU if present and not auto-generated from variant name
    if (item.variantSku && item.variantSku !== item.variantName) {
      productLabel += ` ${item.variantSku}`;
    }
    map.set(item.id, {
      productLabel,
      fullCode: item.fullCode || item.uniqueCode || item.id.slice(0, 8),
    });
  }
  return map;
}

/** Build reference display for a movement. */
function getReference(m: ItemMovement): string {
  // Transfers / zone reconfig: show addresses
  if (
    (m.movementType === 'TRANSFER' || m.movementType === 'ZONE_RECONFIGURE') &&
    (m.originRef || m.destinationRef)
  ) {
    return `${m.originRef || '?'} → ${m.destinationRef || '?'}`;
  }
  // Notes as reason
  if (m.notes) return m.notes;
  // Batch reference
  if (m.batchNumber) return `Lote: ${m.batchNumber}`;
  return '-';
}

/** Opens a print window with a movements report. */
function printMovements(
  movements: ItemMovement[],
  infoMap: Map<string, ItemInfo>
) {
  const rows = movements.map((m) => {
    const info = infoMap.get(m.itemId);
    const dir = getMovementDirection(m);
    return {
      direction: dir === 'IN' ? 'Entrada' : dir === 'OUT' ? 'Saída' : 'Neutro',
      type: MOVEMENT_TYPE_LABELS[m.movementType] ?? m.movementType,
      product: info?.productLabel ?? 'Item sem nome',
      code: info?.fullCode ?? m.itemId.slice(0, 8),
      reference: getReference(m),
      date: formatDateTime(m.createdAt),
      user: m.user?.name ?? '—',
    };
  });

  printListing({
    brandText: 'Movimentações de Estoque',
    title: 'Movimentações de Estoque',
    columns: [
      { key: 'direction', label: 'Movimento' },
      { key: 'type', label: 'Tipo' },
      { key: 'product', label: 'Produto' },
      { key: 'code', label: 'Item', mono: true },
      { key: 'reference', label: 'Referência' },
      { key: 'date', label: 'Data', align: 'center' },
      { key: 'user', label: 'Usuário' },
    ],
    rows,
    summary: [
      { label: 'Total de movimentações', value: String(movements.length) },
    ],
    footerRight: 'Estoque — Movimentações',
  });
}

// ---------------------------------------------------------------------------
// Total columns (fixed)
// ---------------------------------------------------------------------------
const TOTAL_COLS = 7;

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MovementsListPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDirection, setSelectedDirection] = useState<string[]>([]);
  const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>([]);

  // Data
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

  // ---------------------------------------------------------------------------
  // Client-side filter chain
  // ---------------------------------------------------------------------------

  const searchFiltered = useMemo(() => {
    if (!search.trim()) return allMovements;
    const s = search.toLowerCase().trim();
    return allMovements.filter(m => {
      const info = itemInfoMap.get(m.itemId);
      const productLabel = (info?.productLabel ?? '').toLowerCase();
      const fullCode = (info?.fullCode ?? '').toLowerCase();
      const userName = (m.user?.name ?? '').toLowerCase();
      return (
        productLabel.includes(s) ||
        fullCode.includes(s) ||
        userName.includes(s) ||
        m.batchNumber?.toLowerCase().includes(s) ||
        m.notes?.toLowerCase().includes(s) ||
        m.itemId.toLowerCase().includes(s)
      );
    });
  }, [allMovements, search, itemInfoMap]);

  const directionFiltered = useMemo(() => {
    if (selectedDirection.length === 0 || selectedDirection.length === 2)
      return searchFiltered;
    const dir = selectedDirection[0] as DirectionFilter;
    if (dir === 'IN') {
      return searchFiltered.filter(m => getMovementDirection(m) === 'IN');
    }
    return searchFiltered.filter(m => getMovementDirection(m) !== 'IN');
  }, [searchFiltered, selectedDirection]);

  const filteredMovements = useMemo(() => {
    if (selectedSubtypes.length === 0) return directionFiltered;
    return directionFiltered.filter(m =>
      selectedSubtypes.some(subtype => {
        const config = MOVEMENT_SUBTYPE_CONFIG[subtype];
        return config?.match(m);
      })
    );
  }, [directionFiltered, selectedSubtypes]);

  // ---------------------------------------------------------------------------
  // Virtualizer
  // ---------------------------------------------------------------------------

  const rowVirtualizer = useVirtualizer({
    count: filteredMovements.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 49,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Scroll to top on filter change
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [search, selectedDirection, selectedSubtypes]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderMovementBadge(movement: ItemMovement) {
    const dir = getMovementDirection(movement);
    const cfg = DIRECTION_CONFIG[dir];
    const Icon = cfg.icon;
    return (
      <Badge
        variant="outline"
        className={cn('text-[10px] px-1.5 py-0 border gap-1', cfg.className)}
      >
        <Icon className="w-3 h-3" />
        {cfg.label}
      </Badge>
    );
  }

  function renderTypeCell(movement: ItemMovement) {
    const config =
      MOVEMENT_CONFIG[movement.movementType] ?? MOVEMENT_CONFIG_FALLBACK;
    const Icon = config.icon;
    const label = MOVEMENT_TYPE_LABELS[movement.movementType] ?? config.label;
    return (
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-md border',
            config.bgClass
          )}
        >
          <Icon className={cn('w-3.5 h-3.5', config.className)} />
        </div>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PageLayout className="flex flex-col h-[calc(100dvh-10rem)] overflow-hidden">
      <PageHeader className="shrink-0">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Movimentações', href: '/stock/overview/movements' },
          ]}
          buttons={[
            {
              id: 'print-movements',
              title: 'Imprimir',
              icon: Printer,
              onClick: () => printMovements(filteredMovements, itemInfoMap),
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
          title="Movimentações de Estoque"
          description="Histórico de entradas, saídas e transferências"
        />
      </PageHeader>

      <PageBody className="flex flex-col flex-1 min-h-0 gap-4">
        {/* Search */}
        <SearchBar
          value={search}
          placeholder="Buscar por produto, código, usuário, lote..."
          onSearch={setSearch}
          onClear={() => setSearch('')}
        />

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            <span className="text-xs text-muted-foreground tabular-nums">
              {filteredMovements.length}{' '}
              {filteredMovements.length === 1
                ? 'movimentação'
                : 'movimentações'}
            </span>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <GridLoading count={8} layout="list" size="md" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar movimentações"
            message="Não foi possível carregar as movimentações. Tente novamente."
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
                  <col style={{ width: 90 }} />
                  <col style={{ width: 170 }} />
                  <col />
                  <col style={{ width: 180 }} />
                  <col />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 140 }} />
                </colgroup>
                <TableHeader className="sticky top-0 z-10 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <TableRow className="border-b border-slate-200/60 dark:border-white/5 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Movimento
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Tipo
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Produto
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Item
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Referência
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Data
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Usuário
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={TOTAL_COLS} className="text-center">
                        <div className="py-10 text-sm text-muted-foreground">
                          Nenhuma movimentação encontrada.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {/* Top spacer */}
                      {virtualItems.length > 0 && virtualItems[0].start > 0 && (
                        <tr>
                          <td
                            colSpan={TOTAL_COLS}
                            style={{
                              height: virtualItems[0].start,
                              padding: 0,
                              border: 'none',
                            }}
                          />
                        </tr>
                      )}

                      {/* Virtual rows */}
                      {virtualItems.map(virtualRow => {
                        const movement = filteredMovements[virtualRow.index];
                        const info = itemInfoMap.get(movement.itemId);

                        return (
                          <TableRow
                            key={movement.id}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                          >
                            {/* Movimento (Entrada/Saída/Neutro) */}
                            <TableCell>
                              {renderMovementBadge(movement)}
                            </TableCell>

                            {/* Tipo */}
                            <TableCell>{renderTypeCell(movement)}</TableCell>

                            {/* Produto */}
                            <TableCell>
                              <span className="text-sm font-medium text-foreground truncate block">
                                {info?.productLabel ?? 'Item sem nome'}
                              </span>
                            </TableCell>

                            {/* Item (fullCode) */}
                            <TableCell>
                              <span className="text-[11px] font-mono text-muted-foreground/60">
                                {info?.fullCode ?? movement.itemId.slice(0, 8)}
                              </span>
                            </TableCell>

                            {/* Referência */}
                            <TableCell>
                              <span className="text-xs text-gray-600 dark:text-gray-400 truncate block">
                                {getReference(movement)}
                              </span>
                            </TableCell>

                            {/* Data */}
                            <TableCell>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {formatDateTime(movement.createdAt)}
                              </span>
                            </TableCell>

                            {/* Usuário */}
                            <TableCell>
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">
                                {movement.user?.name ?? '-'}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Bottom spacer */}
                      {virtualItems.length > 0 && (
                        <tr>
                          <td
                            colSpan={TOTAL_COLS}
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
      </PageBody>
    </PageLayout>
  );
}
