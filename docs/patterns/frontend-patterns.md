---
name: frontend-patterns
description: Complete frontend coding rules, visual patterns, edit page structure, form sections, attribute editors, color system, and button conventions
type: feedback
---

# Frontend Patterns & Anti-Patterns

## 1. React Query / useEntityCrud — Response Handling

### The Rule

In `listFn`, `createFn`, `updateFn`, `getFn` passed to `useEntityCrud`: **ALWAYS access response fields directly, NEVER use fallback operators.**

### Why This Matters

When a token expires and the API returns an error object instead of the expected response shape, `|| []` turns the error into a silent "success with 0 items". React Query caches this empty result, never retries, and the user sees a blank page with no error message. Only a hard refresh fixes it.

### Correct Pattern

```ts
// CORRECT - error propagates, React Query shows error state + retries
listFn: async () => {
  const response = await productsService.listProducts();
  return response.products;
},
getFn: (id: string) => productsService.getProduct(id).then(r => r.product),
createFn: (data) => productsService.createProduct(data).then(r => r.product),
```

### Anti-Patterns (NEVER DO THIS)

```ts
// BAD: || [] silently swallows errors
return response.manufacturers || [];

// BAD: || response masks wrong response shape
return response.category || response;

// BAD: Array.isArray defensive check + fallback
let items = Array.isArray(response) ? response : response.manufacturers || [];
```

---

## 2. EntityGrid — Filter Placement

### The Rule

FilterDropdown components go **inside** EntityGrid via the `toolbarStart` prop, NOT as a separate `<div>` between SearchBar and the grid.

```tsx
<EntityGrid
  toolbarStart={<><FilterDropdown label="Filter A" ... /></>}
  ...
/>
```

---

## 3. Entity Listing Page Structure (Canonical Order)

Every entity listing page follows this structure inside `<PageBody>`:

```tsx
<PageBody>
  <SearchBar ... />
  {isLoading ? <GridLoading /> : error ? <GridError /> : (
    <EntityGrid toolbarStart={/* filters if any */} ... />
  )}
  {hasSelection && <SelectionToolbar ... />}
  {/* Modals: Rename, Create, Delete, Duplicate — NO View/Edit modals */}
</PageBody>
```

**Important**: We no longer use View or Edit modals on listing pages. View navigates to `/entity/[id]`, Edit navigates to `/entity/[id]/edit`.

### Item Count Format

Use `showItemCount={false}` + custom `toolbarStart` to show "Total de X items":

```tsx
<EntityGrid
  showItemCount={false}
  toolbarStart={
    <p className="text-sm text-muted-foreground whitespace-nowrap">
      Total de {items.length} {items.length === 1 ? 'template' : 'templates'}
    </p>
  }
/>
```

### Grid Card Pattern

- **Title**: Entity name
- **Subtitle**: Secondary identifier (e.g., CNPJ formatado, unit of measure)
- **Badges**: Colored chips with flag support — country with `CircleFlag`, code with `Hash`, status, features
- **Footer button**: Related entity navigation (e.g., "X produtos" → link to filtered list)
- **Sensitive data**: Do NOT show ratings/evaluations on listing cards — only inside detail page

### List Card Pattern

The `EntityCard` title prop accepts `ReactNode`, allowing composition of title + inline elements.

- **Line 1 (title)**: Name + secondary info as muted text (e.g., CNPJ, unit abbreviation)
- **Line 2 (metadata)**: Colored badge chips with flag/icon support
- **Right (children)**: Related entity action as emerald button — uses `children` prop which renders in the right zone of list layout. Must use `onClick={e => e.stopPropagation()}` to avoid triggering card click.

```tsx
// List card title with inline secondary info
title={
  <span className="flex items-center gap-2 min-w-0">
    <span className="font-semibold truncate">{item.name}</span>
    <span className="text-xs text-muted-foreground shrink-0">
      {item.cnpj ? formatCNPJ(item.cnpj) : 'Sem CNPJ'}
    </span>
  </span>
}
// Badges as metadata with flag support
metadata={
  <div className="flex items-center gap-1.5 mt-0.5">
    {badges.map((badge, i) => (
      <span key={i} className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0', badge.color)}>
        {badge.flag ? (
          <CircleFlag countryCode={badge.flag} height={12} width={12} />
        ) : badge.icon ? (
          <badge.icon className="w-3 h-3" />
        ) : null}
        {badge.label}
      </span>
    ))}
  </div>
}
// Related entity button as children (renders in right zone)
<EntityCard ...>
  <Link
    href={`/stock/products?template=${item.id}`}
    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors"
    onClick={e => e.stopPropagation()}
  >
    <Package className="h-3.5 w-3.5" />
    {count} produtos
    <ChevronRight className="h-3 w-3" />
  </Link>
</EntityCard>
```

### Badge Color Convention

- **Slate**: Codes, identifiers (e.g., manufacturer code with `Hash` icon)
- **Violet**: Country/origin (with `CircleFlag` when available)
- **Blue** (sky): Quantity/count info, features (website)
- **Purple**: Special modules, features
- **Amber**: Status warnings (inactive, out of line)
- **Emerald**: Related entity action buttons (list card right zone, grid card footer)
- All badges use dual-theme: `border-{color}-600/25 dark:border-{color}-500/20 bg-{color}-50 dark:bg-{color}-500/8 text-{color}-700 dark:text-{color}-300`

### Country Badge with Flag

Use `CircleFlag` from `react-circle-flags` + `COUNTRIES` from `@/components/ui/country-select` to resolve country name → ISO code:

```tsx
function getCountryCodeFromName(name: string): string | null {
  const match = COUNTRIES.find(
    c => c.name.toLowerCase() === name.toLowerCase().trim()
  );
  return match?.code ?? null;
}
// In badge: flag: cc && cc !== 'OTHER' ? cc.toLowerCase() : undefined
```

---

## 4. Service Layer — Single Layer of Indirection

Entity pages call central services directly (e.g., `productsService.listProducts()`). Do NOT create page-level API wrapper objects.

---

## 5. EntityContextMenu — Action Group Order

Three groups separated by `separator: 'before'`:

1. **Base** (built-in via props): Visualizar, Editar
2. **Custom** (via `actions` array): Renomear, Duplicar, etc.
3. **Destructive** (via `actions` array, last): Excluir

Delete and Duplicate go in `actions` array (NOT as default props) to keep proper ordering. Rename is hidden when multiple items selected (`hidden: ids => ids.length > 1`).

```tsx
<EntityContextMenu
  itemId={item.id}
  onView={handleContextView}    // navigates to /entity/[id]
  onEdit={handleContextEdit}    // navigates to /entity/[id]/edit
  actions={contextActions}      // Rename, Duplicate, Delete
>
```

---

## 6. Permission-Gating (CRITICAL)

All actions conditioned on RBAC permissions. If user lacks permission, element **does not render** (not disabled).

---

## 7. Destructive Actions — PIN Confirmation (CRITICAL)

**ALL** destructive actions use `VerifyActionPinModal` from `@/components/modals/verify-action-pin-modal`. Never use simple "Are you sure?" dialogs.

---

## 8. Detail/Edit Pages — Layout & Structure

### Page Layout

All detail and edit pages use `PageLayout > PageHeader > PageBody`:

```tsx
<PageLayout>
  <PageHeader>
    <PageActionBar breadcrumbItems={[...]} buttons={actionButtons} />
  </PageHeader>
  <PageBody>
    <Card>...</Card>  {/* Identity Card */}
    <Card>...</Card>  {/* Content/Form Card */}
  </PageBody>
</PageLayout>
```

### Loading & Error States

Both must use the full `PageLayout > PageHeader > PageBody` structure with `PageActionBar` breadcrumbs, `GridLoading`, and `GridError`.

### Action Bar — Smart Buttons

Action bars must have **intelligent buttons that help the workflow**, not just CRUD actions:

- **Detail page**: contextual navigation (e.g., icon-only "Produtos" with tooltip) + "Editar". **NO delete button** on detail pages — delete is only on edit pages.
- **Edit page**: "Cancelar" (ghost, no icon, navigates back) + "Excluir" (subdued destructive) + "Salvar alterações" (default)
- Contextual buttons only appear when relevant (e.g., "Produtos" hidden when count is 0)

### Detail Page — Conditional Sections

Sections that display optional data (Contatos, Endereço, Observações) should **only render when data exists**. Do NOT show empty sections with "Nenhum dado cadastrado" messages — just hide the entire section.

### Identity Card — Layout Rules

The Identity Card has a strict 3-zone layout:

| Zone       | Content                                                               |
| ---------- | --------------------------------------------------------------------- |
| **Left**   | Icon with gradient (h-14 w-14 rounded-xl)                             |
| **Center** | Title (h1 bold) + Active/Inactive badge inline + subtitle chips below |
| **Right**  | Metadata: creation date (Calendar sky) + update date (Clock amber)    |

**Active/Inactive badge**: Always inline with h1 title. Emerald for active, gray for inactive:

```tsx
<div className="flex items-center gap-2.5">
  <h1 className="truncate text-xl font-bold">{name}</h1>
  {isActive ? (
    <span className="... border-emerald-600/25 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300">
      Ativo
    </span>
  ) : (
    <span className="... border-gray-300 bg-gray-100 text-gray-600 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-gray-400">
      Inativo
    </span>
  )}
</div>
```

**Subtitle chips** (below the name): Only non-redundant contextual info as icon+text chips. Country chip should use `CircleFlag` for the flag icon when available.

**Chip style** (used in subtitle and section badges):

```tsx
<div className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] px-2 py-1 text-xs text-muted-foreground">
  <CircleFlag countryCode={code} height={14} width={14} />
  {countryName}
</div>
```

### Edit Page Identity Card

Same layout but:

- "Editando {entity}" above the title instead of subtitle chips
- **Right zone**: Switch Ativo/Inativo with `bg-white/5` background (replaces creation date metadata)
- Status toggle is ONLY here — NOT duplicated inside the form body

```tsx
<div className="flex-1 min-w-0">
  <p className="text-sm text-muted-foreground">Editando {entityName}</p>
  <h1 className="text-xl font-bold truncate">{name}</h1>
</div>;
{
  /* Right zone: Status Switch */
}
<div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
  <div className="text-right">
    <p className="text-xs font-semibold">Status</p>
    <p className="text-[11px] text-muted-foreground">
      {isActive ? 'Ativa' : 'Inativa'}
    </p>
  </div>
  <Switch checked={isActive} onCheckedChange={setIsActive} />
</div>;
```

### Form Card

Wraps the form component with reduced vertical padding:

```tsx
<Card className="bg-white/5 py-2 overflow-hidden">
  <EntityForm ref={formRef} ... />
</Card>
```

---

## 9. Form Component — Section Architecture

Forms are organized into **SectionHeader** + content wrapper sections:

### SectionHeader Component

Each section has: icon (left, no box, `h-5 w-5 text-foreground`), title + subtitle, separator line.

```tsx
function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}
```

### Section Content Wrapper

```tsx
<div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-white/5">
  {/* fields */}
</div>
```

### CountrySelect in Forms

Use `CountrySelect` combobox (with flags) instead of text input for country fields. Store as code internally, convert to name on save:

```tsx
// State: countryCode (ISO code, e.g., "BR")
// Load: setCountryCode(getCountryCodeFromName(manufacturer.country))
// Save: country: getCountryName(countryCode)
<CountrySelect value={countryCode} onValueChange={setCountryCode} />
```

### Star Rating Editor

Interactive 5-star rating with click-to-set and click-again-to-clear:

```tsx
<div className="flex items-center gap-1 h-9">
  {[1, 2, 3, 4, 5].map(star => (
    <button
      key={star}
      type="button"
      onClick={() => setRating(rating === star ? 0 : star)}
      className="p-0.5 rounded hover:scale-110 transition-transform"
    >
      <Star
        className={`h-5 w-5 ${
          star <= rating
            ? 'fill-amber-400 text-amber-400'
            : 'fill-none text-gray-300 dark:text-gray-600 hover:text-amber-300'
        }`}
      />
    </button>
  ))}
  {rating > 0 && (
    <span className="ml-2 text-xs text-muted-foreground">{rating}/5</span>
  )}
</div>
```

### Star Rating Viewer (Detail Page)

Uses InfoField layout. When rated: shows filled/empty stars (no text). When not rated: shows "Não avaliado" as text:

```tsx
{
  manufacturer.rating ? (
    <div>
      <p className="text-xs text-muted-foreground mb-1">Avaliação</p>
      <StarRating rating={manufacturer.rating} />
    </div>
  ) : (
    <InfoField label="Avaliação" value="Não avaliado" />
  );
}
```

### Standard Sections (manufacturer example)

1. **Identificação** (`Info` icon) — Row 1: Razão Social, Nome Fantasia, CNPJ. Row 2: Código, Website, Avaliação (stars)
2. **Contato** (`Phone` icon) — Email, Telefone
3. **Endereço** (`MapPinHouse` icon) — Address fields
4. **Observações** (`NotebookText` icon) — Notes textarea

### Information Card Pattern (Detail/Edit pages)

Cards in detail and edit pages use this structure:

```tsx
<Card className="bg-white dark:bg-white/5 border border-border overflow-hidden py-0">
  {/* Card Header */}
  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
    <Icon className="h-5 w-5 text-foreground" />
    <div className="flex-1">
      <h3 className="text-base font-semibold">Título</h3>
      <p className="text-sm text-muted-foreground">Subtítulo descritivo</p>
    </div>
    {/* Optional action buttons on the right */}
  </div>
  <div className="border-b border-border" />
  {/* Card Content */}
  <div className="p-4 sm:p-6">{/* fields */}</div>
</Card>
```

Key rules:

- **Card dark bg**: `dark:bg-white/5` (NOT `dark:bg-slate-800/60`)
- **Card py**: Always `py-0` to override Card component default `py-6`
- **Header padding**: `pt-4 pb-2` — no fractional values
- **No fractional spacing**: Never use `pt-2.5`, `pb-3.5`, etc. Only whole numbers.
- **Divider**: `border-b border-border` between header and content
- **Content padding**: `p-4 sm:p-6`

### ModuleCard Pattern

Feature toggle cards with dual-theme backgrounds:

```tsx
<div className="flex items-center justify-between w-full rounded-lg border border-border bg-white dark:bg-white/5 p-4">
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-purple-500/20 to-pink-500/20">
      <Icon className="h-4 w-4 text-purple-400" />
    </div>
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  </div>
  <Switch ... />
</div>
```

---

## 10. Attribute Display & Editor — Visual Design

### Attribute Viewer (Detail Page) — Card Layout

Each attribute is a **single card** (not a table row) with one main line:

- **Left**: Type icon (in a subtle box) + attribute label
- **Right**: Status badges (Obrigatório/Opcional, Etiqueta, Relatórios) — all inline, same row

Type icon map: `string`→`Type`, `number`→`Hash`, `boolean`→`ToggleLeft`, `date`→`CalendarCheck`, `select`→`List`

Below the main line (optional sections separated by `border-t`):

- "Opções de escolha" (only for `select` type) — NOT "Opções"
- Advanced details grid (unit, mask, placeholder, default value, description)

### Toggle Chips (dual-theme colors)

Toggle buttons for attribute properties use **pill-style chips** with proper light/dark theming:

**Active state** — subtle tinted background + darker text in light, transparent tint + lighter text in dark:

```
Obrigatório:  border-amber-600/25  dark:border-amber-500/20  bg-amber-50   dark:bg-amber-500/8   text-amber-700  dark:text-amber-300
Etiqueta:     border-sky-600/25    dark:border-sky-500/20    bg-sky-50     dark:bg-sky-500/8     text-sky-700    dark:text-sky-300
Relatórios:   border-teal-600/25   dark:border-teal-500/20   bg-teal-50    dark:bg-teal-500/8    text-teal-700   dark:text-teal-300
Avançadas:    border-purple-600/25 dark:border-purple-500/20 bg-purple-50  dark:bg-purple-500/8  text-purple-700 dark:text-purple-300
```

---

## 11. Color System & Button Conventions

### Destructive = Rose (NOT Red)

The entire design system uses **Rose** instead of Red for destructive actions. Rose is warmer and integrates better with the UI.

### Button Variants

- **default**: `shadow-sm` (not `shadow-lg`), solid bg
- **destructive**: flat (no shadow), solid bg — **only used in context menus and modals, NOT in action bars**
- **sm size**: `h-9 px-2.5 rounded-lg text-sm` — compact for action bars

### PageActionBar Buttons

Action bar renders buttons with `min-h-0` (no forced min-height). Buttons use `size="sm"` for compact appearance. `HeaderButton.icon` is optional — buttons without icon show only text.

**Icon-only buttons with tooltip**: When a `HeaderButton` has a `tooltip` field set, the button renders as icon-only (text hidden) wrapped in a Radix Tooltip. Use for secondary/contextual actions that don't need label clutter:

```tsx
{ id: 'view-products', title: 'X Produtos', tooltip: 'Listar produtos', icon: Package, variant: 'outline' }
```

**Outline button hover**: Use `hover:bg-slate-200 dark:hover:bg-slate-800` for consistent subtle hover on outline buttons in action bars.

**Destructive button — subdued style (action bars only)**: On edit pages, the delete button should NOT use the `destructive` variant (too attention-grabbing). Instead use `variant: 'default'` with custom className: slate bg that becomes solid rose on hover:

```tsx
{
  variant: 'default',
  className: 'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
}
```

**Why:** The solid rose `destructive` variant draws too much attention in action bars. The subdued slate approach keeps the button discreet until the user intentionally hovers, where it transitions to solid rose signaling danger. When `className` is set on a button, the icon inherits text color (no forced `text-white`).

### Breadcrumb Text — Title Case

`PageBreadcrumb` applies `toTitleCase()` to all labels (split by space, capitalize first letter of each word). This handles UPPERCASE entity names gracefully (e.g., "SEA TEXTIL" → "Sea Textil"). Uses `split(' ')` approach, NOT regex `\b\w` which breaks with accented characters (e.g., "Início").

### Tabs (Light Theme)

Light tabs use subtle slate tones, not heavy gray:

```css
--tabs-list-bg: rgb(var(--os-slate-100) / 0.6); /* NOT gray-100/0.8 */
--tabs-trigger-hover: rgb(var(--os-white) / 0.7);
```

---

## 12. React Query — QueryKey Isolation

When a listing page filters data client-side (e.g., `categories.filter(c => !c.parentId)`), use a **distinct queryKey** to avoid cache collisions with hooks that fetch the full unfiltered list.

```tsx
// Listing page (root categories only)
queryKey: ['categories', 'root'],
listFn: async () => {
  const response = await categoriesService.listCategories();
  return response.categories.filter(c => !c.parentId);
},

// Hook for ALL categories (used by detail page, parent selects, etc.)
queryKey: ['categories'],  // different key — no collision
```

**Why**: Same queryKey + different queryFn = React Query serves cached data from one to the other, causing intermittent empty states.

## 13. Form Data — null vs undefined

When submitting form data to the API, use `undefined` (not `null`) for empty optional fields. `undefined` is omitted from JSON.stringify, while `null` is sent as explicit `null` which Zod may reject.

```tsx
// CORRECT — omitted from body
iconUrl: iconUrl.trim() || undefined,

// WRONG — sent as null, Zod rejects "expected string, received null"
iconUrl: iconUrl.trim() || null,
```

## 14. Categories — Ordering by displayOrder

Categories use `displayOrder` for manual ordering:

- Backend: all `findMany` queries include `orderBy: { displayOrder: 'asc' }`
- Backend: auto-increment on create (counts siblings, assigns `siblings.length`)
- Frontend listing: `showSorting={false}` + `defaultSortField="custom"` + `customSortFn` by `displayOrder`
- Frontend SortableCategoryList: items pre-sorted before passing to component
- Subcategories in detail page: sorted by `displayOrder` in `useMemo`

## 15. Labels & Text — Portuguese

All user-facing text (labels, placeholders, toasts, titles, errors, dialogs) in **formal Portuguese** with correct accents. Code and logs stay in English.

## 15.1 Storybook — Catálogo de componentes

Componentes em `components/ui/`, `components/shared/` e `components/layout/` têm story co-localizada (`*.stories.tsx`). Convenções, mocks globais, MCP setup e estados obrigatórios por categoria estão em [storybook-pattern.md](./storybook-pattern.md). Hook pre-commit avisa quando componente novo é commitado sem story (warn-only).

## 16. Infinite Scroll with Server-Side Filters & Sorting

**Why:** Entity listing pages must use infinite scroll with server-side pagination, filtering, and sorting. Loading all items at once doesn't scale and breaks sorting/filtering correctness.

**How to apply:** Follow this exact pattern for every listing page. Reference implementation: `products/page.tsx`.

### Architecture Overview

```
[SearchBar] → useDebounce(300ms) → filters.search
[FilterDropdowns] → URL params → filters.templateId (comma-separated for multi-select)
[EntityGrid sorting] → onSortChange → filters.sortBy + sortOrder
         ↓
[useEntityInfinite(filters)] → useInfiniteQuery → GET /v1/entity?page=N&search=X&sortBy=Y...
         ↓
[EntityGrid items={flattenedProducts}]
         ↓ scroll near bottom
[IntersectionObserver sentinel] → fetchNextPage()
```

### Backend Requirements

The list endpoint MUST support:

- `page` (default: 1), `limit` (default: 20, max: 100)
- `search` (string, case-insensitive name contains)
- `sortBy` (enum: name, createdAt, updatedAt), `sortOrder` (enum: asc, desc)
- Filter params accept **comma-separated UUIDs** for multi-select (e.g., `templateId=id1,id2`)
- Response shape: `{ items: T[], meta: { total, page, limit, pages } }`

### Frontend Hook Pattern (`use-{entity}.ts`)

```tsx
export interface EntityFilters {
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  // entity-specific filters...
}

const PAGE_SIZE = 20;

export function useEntityInfinite(filters?: EntityFilters) {
  const result = useInfiniteQuery({
    queryKey: ['entities', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      return entityService.list({
        page: pageParam,
        limit: PAGE_SIZE,
        ...filters,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.meta.page < lastPage.meta.pages
        ? lastPage.meta.page + 1
        : undefined,
    staleTime: 30_000,
  });

  const items = result.data?.pages.flatMap(p => p.items) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return { ...result, items, total };
}
```

### Page Pattern (`page.tsx`)

Key rules:

- **NO `useEntityCrud` for listing** — use `useEntityInfinite` directly
- **NO client-side filtering** — all filters are server-side via query params
- **Search**: `useState` + `useDebounce(300ms)` → passed as `filters.search`
- **Sorting**: `useState` for sortBy/sortOrder → passed as filters. EntityGrid uses `onSortChange` prop (NOT internal client-side sort)
- **Multi-select filters**: values stored in URL params, joined with commas before sending to backend
- **Filter dropdowns**: populated from **dedicated hooks** (e.g., `useTemplates()`, `useManufacturers()`) — NOT derived from loaded items
- **IntersectionObserver sentinel**: `<div ref={sentinelRef} />` after EntityGrid, rootMargin 300px
- **Loading more indicator**: `{isFetchingNextPage && <Loader2 />}` after sentinel
- **Item count**: shows `total` from server + `(X carregados)` when partial
- **Double-click to navigate**: `onItemDoubleClick` navigates to detail. Do NOT use `onItemClick` for navigation (single click is selection)
- **Mutations**: use direct mutation hooks (useCreateEntity, useUpdateEntity, useDeleteEntity) — invalidate `['entities']` queryKey prefix to refresh all queries

### EntityGrid Props for Infinite Scroll

```tsx
<EntityGrid
  items={products}
  showSorting={true}
  defaultSortField="createdAt"
  defaultSortDirection="desc"
  onSortChange={(field, direction) => {
    // Delegates to server-side sorting — EntityGrid skips internal sort
    setSortBy(field);
    setSortOrder(direction);
  }}
  onItemDoubleClick={item => router.push(`/entity/${item.id}`)}
  // Do NOT pass onItemClick for navigation
/>;
{
  /* Sentinel + loading indicator OUTSIDE EntityGrid */
}
<div ref={sentinelRef} className="h-1" />;
{
  isFetchingNextPage && (
    <div className="flex justify-center py-4">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
```

### Checklist for New Infinite Scroll Pages

1. Backend: add `search`, `sortBy`, `sortOrder` to list endpoint querystring
2. Backend: accept comma-separated UUIDs for filter params
3. Backend: response uses `{ items, meta: { total, page, limit, pages } }`
4. Frontend type: response interface matches backend shape (use `meta`, NOT `pagination`)
5. Frontend hook: `useEntityInfinite(filters)` with `useInfiniteQuery`
6. Frontend page: `useDebounce` for search, `useState` for sort, URL params for filters
7. Frontend page: `onSortChange` on EntityGrid (NOT client-side sorting)
8. Frontend page: IntersectionObserver sentinel after grid
9. Frontend page: `onItemDoubleClick` for navigation, NO `onItemClick`
10. Frontend mutations: invalidate `['entities']` prefix on success

## 17. Modal Wizard — Padrão Obrigatório para Criação/Edição

**Why:** Todos os modais de criação e edição de entidades DEVEM usar um dos dois componentes wizard padronizados. Modais com `Dialog` direto + formulário simples NÃO são permitidos.

**How to apply:** Escolha o componente correto conforme o caso de uso:

### Quando usar cada um

| Cenário                                   | Componente               | Exemplo                                      |
| ----------------------------------------- | ------------------------ | -------------------------------------------- |
| Fluxo linear sequencial (1→2→3→fim)       | `StepWizardDialog`       | Criar produto, criar conta de email          |
| Formulário complexo com seções navegáveis | `NavigationWizardDialog` | Editar variante, criar lançamento financeiro |

### StepWizardDialog (Linear)

**Arquivo:** `src/components/ui/step-wizard-dialog.tsx`
**Layout:** Coluna esquerda (200px, ícone) + coluna direita (header + body + footer)
**Tamanho:** 800×490px

```tsx
interface WizardStep {
  title: ReactNode;
  description?: string;
  icon: ReactNode;
  content: ReactNode;
  isValid?: boolean;        // Controla botão "Avançar"
  footer?: ReactNode;       // Footer customizado (substitui back/next padrão)
  onBack?: () => void;      // Habilita seta de voltar no header
}

// Uso:
const steps: WizardStep[] = [
  {
    title: 'Selecione o Template',
    description: 'O template define a categoria e atributos.',
    icon: <LayoutTemplate className="h-16 w-16 text-purple-400" strokeWidth={1.2} />,
    content: <StepSelectTemplate ... />,
    isValid: !!selectedTemplate,
  },
  {
    title: 'Dados do Produto',
    icon: <Package className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />,
    onBack: () => setCurrentStep(1),
    content: <StepProductData ... />,
    isValid: !!productName.trim(),
    footer: <Button onClick={handleSubmit}>Criar Produto</Button>,
  },
];

<StepWizardDialog
  open={open}
  onOpenChange={onOpenChange}
  steps={steps}
  currentStep={currentStep}
  onStepChange={setCurrentStep}
  onClose={handleClose}
/>
```

### NavigationWizardDialog (Seções)

**Arquivo:** `src/components/ui/navigation-wizard-dialog.tsx`
**Layout:** Sidebar esquerda (210–270px, seções) + coluna direita (header + body + footer)
**Tamanho:** 1000×600px

```tsx
interface NavigationSection {
  id: string;
  label: string;
  icon: ReactNode;
  description?: string;
  hidden?: boolean;         // Seção condicional
}

// Uso:
const sections: NavigationSection[] = [
  { id: 'basic', label: 'Informações', icon: <FileText className="w-4 h-4" />, description: 'Nome, SKU, referência' },
  { id: 'pricing', label: 'Preços', icon: <DollarSign className="w-4 h-4" />, description: 'Custo, margem, venda' },
  { id: 'attributes', label: 'Atributos', icon: <SlidersHorizontal className="w-4 h-4" />, hidden: !hasAttributes },
];

<NavigationWizardDialog
  open={open} onOpenChange={handleClose}
  title="Nova Variante" subtitle="Produto X"
  sections={sections}
  activeSection={activeSection}
  onSectionChange={setActiveSection}
  sectionErrors={sectionErrors}    // Record<string, boolean> — marca seções com erro
  isPending={isPending}
  footer={<><Button variant="outline" onClick={handleClose}>Cancelar</Button><Button onClick={handleSubmit}>Salvar</Button></>}
>
  {activeSection === 'basic' && <BasicSection ... />}
  {activeSection === 'pricing' && <PricingSection ... />}
</NavigationWizardDialog>
```

### Regras de uso

1. **Nunca use `Dialog` direto** para criação/edição — sempre use um dos dois wizards
2. **Ícones do step**: `h-16 w-16` com `strokeWidth={1.2}`, cor contextual (purple, emerald, sky, etc.)
3. **Validação**: Use `isValid` (StepWizard) ou `sectionErrors` (NavigationWizard) para guiar o usuário
4. **Último step**: Sempre tenha footer customizado com botão de ação final ("Criar X", "Salvar")
5. **Labels em português**: Todos os títulos, descrições e botões em português formal

## 18. Navigation Menu — No Submenus

**Why:** Submenus were removed from the project design — modules open directly to their home page, where the user navigates internally via tabs/sidebar.

**How to apply:** Menu items in `src/config/menu/*/index.tsx` must NOT have a `submenu` property. Each module is a single button that navigates to its root route (e.g., `/stock`, `/hr`, `/finance`). Only add submenus if the user explicitly requests it.
