# Stock Overview List — Redesign Spec

**Date:** 2026-04-01
**Focus:** Visual modernization of `/stock/overview/list` with operational UX (warehouse operator)
**Current state:** Raw HTML table with client-side filtering, no cards, no badges, no context menu

---

## 1. Goals

- Replace raw table with `EntityGrid` (grid/list toggle)
- Server-side search across ALL items (Omni search)
- Server-side filtering and sorting with URL-synced state
- Infinite scroll with pagination (20 items per page)
- Modern visual with badges, color indicators, context menus
- Performance: handle 1000+ items via server-side pagination

## 2. Page Structure

```
PageLayout
  PageHeader
    PageActionBar
      breadcrumbs: Início > Estoque > Estoque Geral
      buttons: [Imprimir, Atualizar] (permission-gated)
    Header
      title: "Listagem de Estoque"
      description: "Visão consolidada de todos os itens com localização, quantidades e atributos."
  PageBody
    SearchBar (server-side, debounce 300ms, placeholder: "Buscar por código, produto, fabricante, lote...")
    EntityGrid
      toolbarStart: FilterDropdowns (Status, Fabricante, Zona, Localização) + "Ocultar saídas" toggle
      showSorting: true
      renderGridItem: Grid card (equilibrado)
      renderListItem: Mini-card inbox style
    <div ref={sentinelRef} /> (infinite scroll sentinel, rootMargin 300px)
    {isFetchingNextPage && <Loader2 />}
```

## 3. Grid View — Card Equilibrado

Each card shows:

- **Top row:** Color square (36px, rounded, variant color hex) + Item name + Code (monospace)
- **Badges row:** Status badge + Batch badge (if batchNumber exists)
- **Metadata row:** Location icon + bin address | Manufacturer icon + manufacturer name
- **Footer (border-top):** Zone name (left) | Quantity bold (right)

Uses `EntityCard variant="grid"` with:

- `icon`: Palette (fallback when no color)
- `iconBgStyle`: `background: linear-gradient(135deg, variantColorHex, variantColorHexdd)`
- `badges`: status + batch (conditional)
- `metadata`: location + manufacturer
- `footer.type`: 'single' with quantity display

## 4. List View — Mini-Card Inbox

Each item is a horizontal band:

- **Left edge:** 5px color bar (variant color hex)
- **Left:** 40px color square (rounded)
- **Center:** Name + Status badge (first line) | Code · Manufacturer · Location icon + address · Zone (second line, dot-separated)
- **Right:** Quantity (18px, bold)

Uses `EntityCard variant="list"` with children for the right-side quantity.

Hover: subtle shadow + border color change.

## 5. Filters (Server-Side, URL-Synced)

| Filter      | Query Param    | Color   | Icon      | Options Source                                            |
| ----------- | -------------- | ------- | --------- | --------------------------------------------------------- |
| Status      | `status`       | violet  | CircleDot | Static: AVAILABLE, RESERVED, IN_TRANSIT, DAMAGED, EXPIRED |
| Fabricante  | `manufacturer` | cyan    | Factory   | Dynamic: from manufacturers endpoint                      |
| Zona        | `zone`         | emerald | Grid3X3   | Dynamic: from warehouses/zones                            |
| Localização | `bin`          | blue    | MapPin    | Dynamic: from bins                                        |

Additional: "Ocultar saídas" switch → `hideEmpty=true` query param

**URL sync pattern:**

```
/stock/overview/list?status=AVAILABLE,RESERVED&manufacturer=uuid1&zone=uuid2&hideEmpty=true
```

Filters are read from URL on mount via `useSearchParams`, and written to URL on change via `router.push`.

## 6. Sorting (Server-Side)

Options for `EntityGrid.onSortChange`:

- `name` — Item name (default)
- `fullCode` — Item code
- `currentQuantity` — Quantity
- `entryDate` — Entry date
- `manufacturerName` — Manufacturer
- `binAddress` — Location

Query params: `sortBy=name&sortOrder=asc`

## 7. Search (Server-Side)

`SearchBar` sends `search` query param to API with 300ms debounce.

Backend searches across: product name, variant name, template name, fullCode, uniqueCode, variantSku, manufacturerName, batchNumber, bin address.

Query param: `search=texto`

## 8. Status Badges (Dual-Theme)

| Status     | Label       | Light                                                  | Dark                                                      |
| ---------- | ----------- | ------------------------------------------------------ | --------------------------------------------------------- |
| AVAILABLE  | Disponível  | `bg-emerald-50 text-emerald-700 border-emerald-600/25` | `bg-emerald-500/8 text-emerald-300 border-emerald-500/20` |
| RESERVED   | Reservado   | `bg-amber-50 text-amber-700 border-amber-600/25`       | `bg-amber-500/8 text-amber-300 border-amber-500/20`       |
| IN_TRANSIT | Em Trânsito | `bg-sky-50 text-sky-700 border-sky-600/25`             | `bg-sky-500/8 text-sky-300 border-sky-500/20`             |
| DAMAGED    | Danificado  | `bg-rose-50 text-rose-700 border-rose-600/25`          | `bg-rose-500/8 text-rose-300 border-rose-500/20`          |
| EXPIRED    | Vencido     | `bg-slate-50 text-slate-700 border-slate-600/25`       | `bg-slate-500/8 text-slate-300 border-slate-500/20`       |
| DISPOSED   | Descartado  | `bg-slate-50 text-slate-700 border-slate-600/25`       | `bg-slate-500/8 text-slate-300 border-slate-500/20`       |

## 9. Context Menu

| Group       | Action          | Icon           | Permission         | Handler                              |
| ----------- | --------------- | -------------- | ------------------ | ------------------------------------ |
| Base        | Ver detalhes    | Eye            | stock.items.access | Navigate to `/stock/items/{id}`      |
| Base        | Editar          | Pencil         | stock.items.modify | Navigate to `/stock/items/{id}/edit` |
| Custom      | Transferir      | ArrowRightLeft | stock.items.modify | Open transfer modal                  |
| Custom      | Registrar saída | PackageMinus   | stock.items.modify | Open exit modal                      |
| Custom      | Ver histórico   | History        | stock.items.access | Open ItemHistoryModal                |
| Destructive | Excluir         | Trash2         | stock.items.remove | VerifyActionPinModal → DELETE        |

Separator before "Transferir" (first custom) and before "Excluir" (destructive).

## 10. Backend Changes (OpenSea-API)

### 10.1 Enhance `GET /v1/items` endpoint

Current query params: `page`, `limit`, `variantId`, `binId`, `productId`, `status`

**Add:**

- `search: z.string().optional()` — full-text search
- `manufacturerId: z.string().uuid().optional()` — filter by manufacturer
- `zoneId: z.string().uuid().optional()` — filter by zone
- `hideEmpty: z.coerce.boolean().optional()` — hide qty=0 items
- `sortBy: z.enum(['name', 'fullCode', 'currentQuantity', 'entryDate', 'manufacturerName', 'binAddress']).optional()`
- `sortOrder: z.enum(['asc', 'desc']).optional()`

### 10.2 Repository changes

Update `findAllWithRelationsPaginated` to support:

- WHERE clause for search (ILIKE across multiple fields)
- WHERE clause for manufacturerId (join through variant→product→manufacturer)
- WHERE clause for zoneId (join through bin→zone)
- WHERE clause for hideEmpty (`currentQuantity > 0`)
- ORDER BY dynamic column + direction

### 10.3 Presenter changes

Ensure the item presenter includes `status` field in the response (verify it's already there).

## 11. Frontend Changes (OpenSea-APP)

### 11.1 New hook: `useItemsInfinite`

Create `src/hooks/stock/use-items-infinite.ts`:

- Uses `useInfiniteQuery` from React Query
- Accepts filter params object
- Returns `{ items, total, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage }`
- `getNextPageParam`: based on `meta.page < meta.pages`

### 11.2 Update items service

Add query params support to `listItems()`: search, status, manufacturerId, zoneId, binId, hideEmpty, sortBy, sortOrder, page, limit.

### 11.3 Rewrite page component

Replace the entire `page.tsx` (~1036 lines) with the new implementation using:

- `EntityGrid` with `renderGridItem` and `renderListItem`
- `FilterDropdown` components in `toolbarStart`
- `EntityContextMenu` on each card
- URL-synced filter state
- Infinite scroll with sentinel
- Permission gating via `usePermissions`

### 11.4 Helpers

- `getItemStatusConfig(status)` — returns `{ label, color, icon }` for each status
- `formatItemQuantity(qty, unit)` — formatted quantity with unit abbreviation

## 12. What's NOT in Scope

- Item detail page redesign
- Item edit page redesign
- Transfer modal redesign (reuse existing)
- Exit modal redesign (reuse existing)
- Batch operations (select multiple → bulk transfer/exit)
- KPI cards at top (gerencial view)
- Template-based dynamic columns (removed for simplicity — can add later)

## 13. Migration Notes

- The current page's print functionality should be preserved (print button in PageActionBar)
- The `ItemHistoryModal` component is reused as-is
- The "Ocultar saídas" toggle is preserved as a filter
- Template dynamic columns are dropped for now — the card format replaces them with a richer visual
