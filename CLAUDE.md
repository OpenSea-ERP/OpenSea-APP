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
  {/* Modals: Create, Edit, View, Delete */}
</PageBody>
```

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

- All `<Card>` inside detail pages: `className="bg-white/5 p-5"`
- Row items: `className="bg-linear-to-r from-slate-200/80 dark:from-slate-800 to-transparent"`
- TabsList: always `className="grid w-full grid-cols-N h-10 mb-4"`
- Title card: Icon with gradient + title + subtitle + date badges (Calendar blue, Clock amber)

### 10. Labels & Text — Portuguese

All user-facing text (labels, placeholders, toasts, titles, errors, dialogs) in **formal Portuguese** with correct accents. Code and logs stay in English.
