# OpenSea-APP — Frontend Instructions

## Commands

```bash
npm run dev                    # Start Next.js dev server (http://localhost:3000)
npm run build                  # Build for production
npm run lint                   # Check with ESLint
npm run test:e2e               # Run Playwright E2E tests
```

## Path Aliases

- `@/*` → `./src/*`
- `@core/*`, `@components/*`, `@hooks/*`

## Route Groups

| Route Group             | Layout                                           | Purpose                          |
| ----------------------- | ------------------------------------------------ | -------------------------------- |
| `(auth)`                | None (root)                                      | Login, register, select-tenant   |
| `(dashboard)`           | Navbar + NavigationMenu                          | Main app (tenant-scoped)         |
| `(dashboard)/(modules)` | Module pages                                     | stock, hr, finance, sales, admin |
| `(dashboard)/(tools)`   | Tool pages                                       | email, tasks, calendar, storage  |
| `(central)`             | CentralNavbar + CentralSidebar + SuperAdminGuard | Admin management                 |

## Types Architecture

Types are **modular** — organized by domain module in `src/types/{module}/` with barrel `index.ts` files. **Never create monolithic type files.** Each entity gets its own `*.types.ts` file.

### Rules

1. **Imports**: Always import from the module barrel: `import type { Product } from '@/types/stock'`
2. **Adding a type**: Add to the correct `*.types.ts` file; the barrel re-exports automatically
3. **New entity**: Create `new-entity.types.ts` + add `export * from './new-entity.types'` to barrel
4. **New module**: Create `src/types/{module}/` with files + barrel, add to root `src/types/index.ts`
5. **Type ↔ Backend sync**: Frontend types MUST match backend Zod schemas
6. **Dates**: Use `string` (JSON returns ISO strings)
7. **`any` policy**: ESLint `no-explicit-any` is `error`. Use `unknown` or `Record<string, unknown>`

## Key Files

| File                              | Purpose                               |
| --------------------------------- | ------------------------------------- |
| `src/app/`                        | Next.js app router pages              |
| `src/app/(central)/`              | Central management area (super admin) |
| `src/contexts/tenant-context.tsx` | Tenant selection context              |
| `src/contexts/auth-context.tsx`   | Auth context (includes isSuperAdmin)  |
| `src/components/ui/`              | shadcn/ui components                  |
| `src/lib/api-client.ts`           | Axios API client with token refresh   |
| `src/lib/api-client-auth.ts`      | TokenManager with proactive refresh   |

---

## Frontend Patterns (CRITICAL — follow on every page)

### 1. Pagination: ALWAYS Infinite Scroll

**NEVER use traditional pagination** (page numbers, buttons). Always use `useInfiniteQuery` with `getNextPageParam` based on `meta.page < meta.pages`.

### 2. React Query — NEVER Use Silent Fallbacks

```ts
// ✅ CORRECT — error propagates to React Query
listFn: async () => {
  const response = await productsService.listProducts();
  return response.products;
},

// ❌ NEVER — silently swallows errors
return response.manufacturers || [];
return Array.isArray(response) ? response : response.items || [];
```

**Why**: `|| []` turns API errors into "success with empty array", breaking retry/error handling. This caused a real production bug.

### 3. EntityGrid — Filters Inside

Filters go **inside** EntityGrid via `toolbarStart` prop, NOT as a separate `<div>` above it.

```tsx
<EntityGrid
  toolbarStart={<><FilterDropdown label="Status" ... /></>}
  ...
/>
```

### 4. Entity Page Structure

```tsx
<PageBody>
  <SearchBar ... />
  {isLoading ? <GridLoading /> : error ? <GridError /> : (
    <EntityGrid toolbarStart={/* filters */} ... />
  )}
  {hasSelection && <SelectionToolbar ... />}
  {/* Modals: Rename, Create, Delete, Duplicate — NO View/Edit modals */}
</PageBody>
```

**Important**: We no longer use View or Edit modals on listing pages. View navigates to `/entity/[id]`, Edit navigates to `/entity/[id]/edit`.

### 5. EntityContextMenu — Action Group Order

Three groups separated by `separator: 'before'`:

1. **Base** (built-in): Visualizar, Editar, Renomear, Duplicar
2. **Custom** (via `actions`): Exportar, Imprimir, etc.
3. **Destructive** (via `actions`, last): Excluir

Delete goes in `actions` array (NOT `onDelete` prop) to keep it at the bottom. First custom action and delete both need `separator: 'before'`.

### 6. Permission-Gating (CRITICAL)

All actions conditioned on RBAC permissions. If user lacks permission, element **does not render** (not disabled).

```tsx
const { hasPermission } = usePermissions();
const canView = hasPermission(PERMISSIONS.ENTITY.VIEW);
const canEdit = hasPermission(PERMISSIONS.ENTITY.UPDATE);
const canCreate = hasPermission(PERMISSIONS.ENTITY.CREATE);
const canDelete = hasPermission(PERMISSIONS.ENTITY.DELETE);

// Context menu
<EntityContextMenu
  onView={canView ? handleView : undefined}
  onEdit={canEdit ? handleEdit : undefined}
  onDuplicate={canCreate ? handleDuplicate : undefined}
  actions={getActions(item)} // built dynamically with canEdit/canDelete
/>;

// Page: create button only if canCreate
// SelectionToolbar: { view: canView, edit: canEdit, delete: canDelete }
```

### 7. Destructive Actions — PIN Confirmation (CRITICAL)

**ALL** destructive actions (delete, revoke, bulk) use `VerifyActionPinModal`. Never use a simple "Are you sure?" dialog.

```tsx
<VerifyActionPinModal
  isOpen={page.modals.isOpen('delete')}
  onClose={() => page.modals.close('delete')}
  onSuccess={() => page.handlers.handleDeleteConfirm()}
  title="Confirmar Exclusão"
  description={`Digite seu PIN de ação para excluir ${count} item(ns).`}
/>
```

### 8. Service Layer — No Extra Wrappers

Call services directly from page hooks. Do NOT create page-level API wrapper objects.

```ts
// ✅ Direct service call
listFn: async () => {
  const response = await templatesService.listTemplates();
  return response.templates;
};

// ❌ Unnecessary wrapper layer
const api = {
  list() {
    return templatesService.list();
  },
};
```

### 9. Detail/Edit Pages — Visual Patterns

- **Layout**: Always `PageLayout > PageHeader (PageActionBar) > PageBody`
- **Identity Card**: `<Card className="bg-white/5 p-5">` — icon + name + creation date (no chips/badges)
- **Form Card**: `<Card className="bg-white/5 py-2 overflow-hidden">` — reduced vertical padding
- **Action Bar**: Delete (destructive) + Save (default) buttons, `size="sm"`
- **Loading/Error**: Full layout with `PageActionBar` breadcrumbs + `GridLoading`/`GridError`
- **TabsList**: `className="grid w-full grid-cols-N h-12 mb-4"`
- **ModuleCard bg**: `bg-white dark:bg-slate-800/60 border border-border`
- **Attribute wrapper bg**: Same as ModuleCard (`bg-white dark:bg-slate-800/60 border border-border`)
- **Form sections**: Use `CollapsibleSection` with icon + title + subtitle + collapse toggle
- **Toggle chips**: Dual-theme (light: `bg-{color}-50 text-{color}-700`, dark: `bg-{color}-500/8 text-{color}-300`)

### 9.1 Color System

- **Destructive = Rose** (NOT Red) — warmer tone, better UI integration
- **Button default**: `shadow-sm` (not `shadow-lg`)
- **Button destructive**: flat (no shadow)
- **Button sm**: `h-9 px-2.5 rounded-lg text-sm` — compact for action bars
- **Tabs light**: `slate-100/0.6` bg (not heavy gray)

### 10. Labels & Text — Portuguese

All user-facing text (labels, placeholders, toasts, titles, errors, dialogs) in **formal Portuguese** with correct accents. Code and logs stay in English.

---

## UI Quality Bar (MANDATORY — applies to every new page or refactor)

**Rule:** before implementing UI, cite a reference product + specific behavior you're reproducing. Generic "make it better" is forbidden.

### Required pattern pairings

| Data / interaction | ❌ Never ship | ✅ Ship instead (reference) |
|---|---|---|
| Date input | `<input type="text">` | Calendar picker (Google Calendar, Airbnb) |
| Timeframe / cronograma | Plain date pair | Timeline / Gantt / calendar grid (Linear Cycles, Asana) |
| File upload | Raw `<input type="file">` | Dropzone + preview + per-file progress (Dropbox, Vercel, Notion) |
| Long form | Single scroll with 20 fields | `StepWizardDialog` OR `CollapsibleSection` groups (Stripe, Typeform) |
| Data table | Plain `<table>` | `EntityGrid` + filters + empty state + skeleton (Linear, Airtable) |
| Global search | Scattered search inputs | Command palette `⌘K` (Raycast, Linear, Notion) |
| Numeric entry (money, %, qty) | Plain text input | Masked input with currency/locale formatting |
| Status / category | Dropdown with text | Colored chip/badge with dual-theme (see §9) |
| Chart | Raw numbers | Visual chart with tooltip + legend (Stripe, Vercel Analytics) |

### Every listing page MUST have

- **Skeleton loading** — not just a spinner (`GridLoading`)
- **Empty state** — illustration or icon + explanatory text + primary CTA + link to docs/help
- **Error state** — useful message + retry button (`GridError`), never "Something went wrong"
- **Filter drawer/dropdowns** — inside toolbar (`toolbarStart`), not above the grid
- **Data-testid anchors** — on page root, search, filters, count, each row

### Every form MUST

- Use **correct input types**: `type="email"`, `type="tel"`, `type="number"`, `inputMode="decimal"` when applicable
- Have **inline validation** (on blur + on submit), never alert()
- Show **masked inputs** for CPF, CNPJ, phone, currency (use existing masked input primitives)
- Support **keyboard submit** (Enter in last field = submit)
- Have **labels tied to inputs** (`htmlFor` + `id`)
- Show **visible focus states** (keyboard navigation must work)
- Have **mobile-optimized layout** (stack at `sm`, reasonable input heights)

### Before implementing, ask yourself

1. Is there a world-class product that solves this same interaction? If yes, **cite it** — which flow, which screen, which micro-interaction.
2. What 3 specific behaviors from that reference are we reproducing? What 1 behavior are we deliberately NOT copying (and why)?
3. Does the current page already have skeleton/empty/error states? If not, add them.
4. Am I about to ship a plain `<input type="date">` or `<input type="file">`? Stop. Use a proper widget.

### When unsure

Ask the user before coding. A 30-second question saves a half-day rework. Never guess on UX that will be user-visible.

### Escalation

If a PR ships UI that violates these rules without justification, it's a **blocker** — fix before merge, don't patch after.
