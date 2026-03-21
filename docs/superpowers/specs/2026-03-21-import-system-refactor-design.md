# Import System Refactor — Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Scope:** OpenSea-APP (frontend) + OpenSea-API (backend permissions)

## Problem

The import system has accumulated significant technical debt:

- ~30 duplicate/orphan pages (old routes without module prefix, intermediate method selector pages, config pages)
- Catalog wizard adds complexity with low usage value
- No dashboard following the standard `PageHeroBanner + PageDashboardSections` pattern
- Import not accessible from module listing pages
- Permissions use `.register` instead of dedicated `.import` codes
- No hooks for future AI integration

## Goals

1. Simplify route structure: one page per entity (the sheets page)
2. Dashboard following existing module dashboard pattern
3. Dual access: from central hub AND from within each module
4. Dedicated `.import` RBAC permissions
5. AI-ready hooks for future integration
6. Eliminate ~30 orphan files

## Non-Goals

- Building the AI processing endpoint (hooks/interfaces only)
- Adding new importable entities
- Changing the spreadsheet editor internals
- Backend bulk create logic changes (only permission middleware changes)

---

## 1. Route Structure

> All import routes live under `src/app/(dashboard)/(actions)/import/`. The `(actions)` route group is invisible in URLs.

### Final Routes

```
/import                           → Dashboard (central hub)
/import/stock/products            → Products sheets page
/import/stock/variants            → Variants sheets page
/import/stock/items               → Items sheets page
/import/stock/suppliers           → Suppliers sheets page
/import/stock/product-categories  → Categories sheets page
/import/stock/manufacturers       → Manufacturers sheets page
/import/stock/templates           → Templates sheets page
/import/hr/employees              → Employees sheets page
/import/hr/departments            → Departments sheets page
/import/hr/positions              → Positions sheets page
/import/admin/companies           → Companies sheets page
/import/admin/users               → Users sheets page
```

Note: Companies uses `admin` module (matches existing `ADMIN_PERMISSIONS.COMPANIES` and `entity-definitions.ts`).
Suppliers uses `stock` module for routing but `finance.suppliers.import` for permission (see Section 5).

### Access Patterns

- **From central hub:** `/import` → click card → `/import/{module}/{entity}`
- **From module:** button "Importar" on listing page → navigates to `/import/{module}/{entity}`

### Routes to Eliminate

All of these directories and their contents:

**Old routes without module prefix:**
- `/import/products/` (page.tsx, config/page.tsx, sheets/page.tsx)
- `/import/variants/` (page.tsx, config/page.tsx, sheets/page.tsx)
- `/import/categories/` (page.tsx, config/page.tsx, sheets/page.tsx)
- `/import/suppliers/` (page.tsx, config/page.tsx, sheets/page.tsx)
- `/import/users/` (page.tsx, config/page.tsx, sheets/page.tsx)
- `/import/templates/` (page.tsx, sheets/page.tsx)

**Catalog wizard:**
- `/import/catalog/` — entire directory (page.tsx + 7 components + 4 hooks = 12 files)

**Intermediate method selector pages (replaced by direct sheets):**
- `/import/stock/products/page.tsx` (replaced by sheets content)
- `/import/stock/variants/page.tsx`
- `/import/stock/items/page.tsx`
- `/import/stock/manufacturers/page.tsx`
- `/import/stock/product-categories/page.tsx`

**Config pages (configuration is now inline in sheets):**
- `/import/stock/products/config/page.tsx`
- `/import/stock/variants/config/page.tsx`
- `/import/stock/items/config/page.tsx`
- `/import/stock/product-categories/config/page.tsx`
- `/import/admin/users/config/page.tsx`
- `/import/hr/departments/config/page.tsx`
- `/import/hr/employees/config/page.tsx`
- `/import/hr/positions/config/page.tsx`

**Special routes:**
- `/import/stock/variants/by-product/[productId]/page.tsx`
- `/import/stock/products/home/page.tsx`

**HR companies route (moved to admin):**
- `/import/hr/companies/page.tsx`

**Shared components to remove:**
- `_shared/components/entity-import-page.tsx` (method selector wrapper)
- `_shared/components/entity-config-page.tsx` (standalone config page)
- `_shared/components/import-method-selector.tsx` (method cards)
- `_shared/components/entity-sheets-page.tsx` (generic sheets wrapper — replaced by per-entity sheets pages based on products/variants pattern)
- `_shared/hooks/use-import-config.ts` (used only by entity-config-page and entity-sheets-page)

**Barrel file update:**
- `_shared/components/index.ts` — remove exports for deleted components, keep: `ImportSpreadsheet`, `FieldConfigList`, `ImportProgressDialog`, `CSVUpload`

---

## 2. Dashboard Page (`/import/page.tsx`)

Follows the established dashboard pattern used by `/stock`, `/hr`, `/finance`.

### Components Used

- `PageActionBar` — breadcrumb: `[{ label: 'Importação', href: '/import' }]`
- `PageHeroBanner` — icon: `Upload`, title: "Importação de Dados", description, iconGradient: `"from-amber-500 to-amber-600"`, buttons: `[]` (no hero buttons needed)
- `PageDashboardSections` — cards grouped by module, with `counts: {}`, `countsLoading: false` (no count badges for import)

### Card Shape (matches `DashboardCard` interface)

Each card must include all required fields from `PageDashboardSections`:

```typescript
interface DashboardCard {
  id: string;
  title: string;
  description: string;   // REQUIRED — short entity description
  icon: React.ElementType;
  href: string;
  gradient: string;       // REQUIRED — e.g., 'from-blue-500 to-blue-600'
  hoverBg: string;        // REQUIRED — e.g., 'hover:bg-blue-50 dark:hover:bg-blue-500/10'
  permission?: string;    // import permission code
}
```

### Sections

```typescript
const sections: DashboardSection[] = [
  {
    title: 'Estoque',
    cards: [
      {
        id: 'products',
        title: 'Produtos',
        description: 'Importar produtos com templates e categorias',
        icon: Package,
        href: '/import/stock/products',
        gradient: 'from-blue-500 to-blue-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: STOCK_PERMISSIONS.PRODUCTS.IMPORT,
      },
      {
        id: 'variants',
        title: 'Variantes',
        description: 'Importar variantes de produtos',
        icon: Layers,
        href: '/import/stock/variants',
        gradient: 'from-purple-500 to-purple-600',
        hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
        permission: STOCK_PERMISSIONS.VARIANTS.IMPORT,
      },
      {
        id: 'items',
        title: 'Itens',
        description: 'Importar itens de estoque',
        icon: Box,
        href: '/import/stock/items',
        gradient: 'from-green-500 to-green-600',
        hoverBg: 'hover:bg-green-50 dark:hover:bg-green-500/10',
        permission: STOCK_PERMISSIONS.ITEMS.IMPORT,
      },
      {
        id: 'suppliers',
        title: 'Fornecedores',
        description: 'Importar fornecedores e contatos',
        icon: Truck,
        href: '/import/stock/suppliers',
        gradient: 'from-orange-500 to-orange-600',
        hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-500/10',
        permission: FINANCE_PERMISSIONS.SUPPLIERS.IMPORT,
      },
      {
        id: 'categories',
        title: 'Categorias',
        description: 'Importar categorias de produtos',
        icon: FolderTree,
        href: '/import/stock/product-categories',
        gradient: 'from-yellow-500 to-yellow-600',
        hoverBg: 'hover:bg-yellow-50 dark:hover:bg-yellow-500/10',
        permission: STOCK_PERMISSIONS.CATEGORIES.IMPORT,
      },
      {
        id: 'manufacturers',
        title: 'Fabricantes',
        description: 'Importar fabricantes via CNPJ',
        icon: Factory,
        href: '/import/stock/manufacturers',
        gradient: 'from-indigo-500 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        permission: STOCK_PERMISSIONS.MANUFACTURERS.IMPORT,
      },
      {
        id: 'templates',
        title: 'Templates',
        description: 'Importar templates de produtos',
        icon: LayoutTemplate,
        href: '/import/stock/templates',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: STOCK_PERMISSIONS.TEMPLATES.IMPORT,
      },
    ],
  },
  {
    title: 'Recursos Humanos',
    cards: [
      {
        id: 'employees',
        title: 'Funcionários',
        description: 'Importar funcionários e colaboradores',
        icon: UserCheck,
        href: '/import/hr/employees',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.IMPORT,
      },
      {
        id: 'departments',
        title: 'Departamentos',
        description: 'Importar departamentos organizacionais',
        icon: Network,
        href: '/import/hr/departments',
        gradient: 'from-cyan-500 to-cyan-600',
        hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10',
        permission: HR_PERMISSIONS.DEPARTMENTS.IMPORT,
      },
      {
        id: 'positions',
        title: 'Cargos',
        description: 'Importar cargos e funções',
        icon: BadgeCheck,
        href: '/import/hr/positions',
        gradient: 'from-amber-500 to-amber-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        permission: HR_PERMISSIONS.POSITIONS.IMPORT,
      },
    ],
  },
  {
    title: 'Administração',
    cards: [
      {
        id: 'companies',
        title: 'Empresas',
        description: 'Importar empresas via CNPJ',
        icon: Building2,
        href: '/import/admin/companies',
        gradient: 'from-emerald-500 to-emerald-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: ADMIN_PERMISSIONS.COMPANIES.IMPORT,
      },
      {
        id: 'users',
        title: 'Usuários',
        description: 'Importar usuários do sistema',
        icon: Users,
        href: '/import/admin/users',
        gradient: 'from-pink-500 to-pink-600',
        hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-500/10',
        permission: ADMIN_PERMISSIONS.USERS.IMPORT,
      },
    ],
  },
];
```

### Filtering

- Cards filtered by `hasPermission(card.permission)`
- Entire section hidden if no visible cards within it (handled by `PageDashboardSections` component)

### Layout File

Keep `/import/layout.tsx` as-is (metadata only).

---

## 3. Sheets Page Pattern

The existing `/import/stock/products/sheets/page.tsx` and `/import/stock/variants/sheets/page.tsx` are the reference implementations. These are standalone pages (NOT using `EntitySheetsPage` wrapper).

### File Relocation

For entities that already have a `/sheets/page.tsx`:
- Move content from `/sheets/page.tsx` → `/page.tsx` (one level up)
- Delete the `/sheets/` subdirectory

For entities that only had `EntitySheetsPage` wrapper pages:
- Create new standalone sheets pages based on the products/variants pattern

### Standard Features (all entities)

- **PageActionBar** with breadcrumbs: Import Hub → Module → Entity
- **Upload zone** — drag CSV/Excel to populate the spreadsheet
- **Download template** — entity-specific Excel template
- **Spreadsheet editor** — inline editing with validation
- **Column configuration** — toggle visibility, reorder via DnD
- **Reference autocomplete** — for reference-type fields
- **Validation** — real-time per-cell + pre-import batch validation
- **Import button** — triggers batch processing with progress dialog
- **Back navigation** — returns to entity listing page or import hub

### Shared Infrastructure (kept)

Components:
- `_shared/components/import-spreadsheet.tsx`
- `_shared/components/import-progress-dialog.tsx`
- `_shared/components/csv-upload.tsx`
- `_shared/components/field-config-list.tsx`

Hooks:
- `_shared/hooks/use-import-process.ts`
- `_shared/hooks/use-import-spreadsheet.ts`
- `_shared/hooks/use-reference-data.ts`
- `_shared/hooks/use-cnpj-import-process.ts`
- `_shared/hooks/use-code-generator.ts`

Config:
- `_shared/config/entity-definitions.ts` (updated)
- `_shared/config/code-patterns.ts`

Utils:
- `_shared/utils/excel-parser.ts`
- `_shared/utils/excel-parser.worker.ts`
- `_shared/utils/excel-utils.ts`
- `_shared/utils/code-generator.ts`

Types:
- `_shared/types/index.ts` (updated with AI types)

---

## 4. AI Integration Hooks

### Frontend Interface

```typescript
// Exposed by the sheets page via a ref or context
interface ImportAIBridge {
  // Populate spreadsheet from AI-processed data
  fillFromAI(rows: ImportRow[]): void;

  // Export current spreadsheet state for AI processing
  exportForAI(): {
    entityType: string;
    columns: ColumnConfig[];
    rows: ImportRow[];
    referenceData: Record<string, { id: string; label: string }[]>;
  };

  // Apply column mapping suggested by AI
  applySuggestedMapping(mapping: ColumnMapping[]): void;

  // Get entity definition (fields, validation rules)
  getEntityDefinition(): EntityImportDefinition;
}

interface ImportRow {
  [fieldKey: string]: string | number | boolean | null;
}

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transform?: 'none' | 'date' | 'number' | 'boolean' | 'reference-lookup';
}
```

### Backend Interface (Future — interface only for now)

```typescript
// POST /v1/import/ai/process (NOT implemented now, just the type contract)
interface AIImportProcessRequest {
  entityType: string;
  rawData: string[][];
  headers?: string[];
  context?: {
    referenceEntities?: string[];
  };
}

interface AIImportProcessResponse {
  mappedData: ImportRow[];
  mapping: ColumnMapping[];
  confidence: number;
  warnings: string[];
  unresolvedReferences: {
    field: string;
    values: string[];
  }[];
}
```

### Implementation Approach

- Create `_shared/hooks/use-import-ai.ts` implementing `ImportAIBridge`
- Sheets page initializes the hook and exposes it via React ref
- The hook is dormant until AI features are enabled — zero runtime cost
- Types exported from `_shared/types/index.ts` for reuse

---

## 5. RBAC Permissions

### Permission Audit — Current State vs Required

| Permission Code | Frontend Constant | Status | Action |
|---|---|---|---|
| `stock.products.import` | `STOCK_PERMISSIONS.PRODUCTS.IMPORT` | EXISTS | No change |
| `stock.variants.import` | `STOCK_PERMISSIONS.VARIANTS.IMPORT` | EXISTS | No change |
| `stock.items.import` | `STOCK_PERMISSIONS.ITEMS.IMPORT` | **MISSING** | Add `'import'` to `ITEMS` perm() |
| `finance.suppliers.import` | `FINANCE_PERMISSIONS.SUPPLIERS.IMPORT` | EXISTS | No change |
| `stock.categories.import` | `STOCK_PERMISSIONS.CATEGORIES.IMPORT` | EXISTS | No change |
| `stock.manufacturers.import` | `STOCK_PERMISSIONS.MANUFACTURERS.IMPORT` | EXISTS | No change |
| `stock.templates.import` | `STOCK_PERMISSIONS.TEMPLATES.IMPORT` | **MISSING** | Add `'import'` to `TEMPLATES` perm() |
| `hr.employees.import` | `HR_PERMISSIONS.EMPLOYEES.IMPORT` | EXISTS | No change |
| `hr.departments.import` | `HR_PERMISSIONS.DEPARTMENTS.IMPORT` | **MISSING** | Add `'import'` to `DEPARTMENTS` perm() |
| `hr.positions.import` | `HR_PERMISSIONS.POSITIONS.IMPORT` | **MISSING** | Add `'import'` to `POSITIONS` perm() |
| `admin.companies.import` | `ADMIN_PERMISSIONS.COMPANIES.IMPORT` | **MISSING** | Add `'import'` to `COMPANIES` perm() |
| `admin.users.import` | `ADMIN_PERMISSIONS.USERS.IMPORT` | **MISSING** | Add `'import'` to `USERS` perm() |

**Important module/permission mapping:**
- Suppliers route is `/import/stock/suppliers` but permission is `finance.suppliers.import` (suppliers belong to finance module in RBAC)
- Companies route is `/import/admin/companies` and permission is `admin.companies.import` (NOT hr)

### Frontend Changes

Add `'import'` action to these `perm()` calls in `src/config/rbac/permission-codes.ts`:

```typescript
// STOCK_PERMISSIONS
ITEMS: perm('stock', 'items', 'access', 'export', 'print', 'admin', 'import'),
TEMPLATES: perm('stock', 'templates', 'access', 'register', 'modify', 'remove', 'import'),

// HR_PERMISSIONS
DEPARTMENTS: perm('hr', 'departments', 'access', 'register', 'modify', 'remove', 'import'),
POSITIONS: perm('hr', 'positions', 'access', 'register', 'modify', 'remove', 'import'),

// ADMIN_PERMISSIONS
COMPANIES: perm('admin', 'companies', 'access', 'register', 'modify', 'remove', 'admin', 'import'),
USERS: perm('admin', 'users', 'access', 'register', 'modify', 'remove', 'admin', 'import'),
```

No separate `IMPORT_PERMISSIONS` constant needed — use the existing `perm()` pattern directly (e.g., `STOCK_PERMISSIONS.ITEMS.IMPORT`).

### Backend Changes

- Mirror the same permission additions in `OpenSea-API/src/constants/rbac/permission-codes.ts`
- Add new permissions to seed file at `OpenSea-API/prisma/seed.ts`
- Bulk create controllers: change middleware from `verifyPermission(ENTITY.REGISTER)` to `verifyPermission(ENTITY.IMPORT)`

---

## 6. Entity Definitions Update

Update `_shared/config/entity-definitions.ts`:

- Remove `categories` backward-compat duplicate entry
- Add `permission` field to `EntityImportDefinition` type (required string)
- Make `module` field required: `'stock' | 'admin' | 'hr'`
- Keep `basePath` for now (used by sheets pages for navigation) but derive if absent
- Fix companies module from `'admin'` (already correct in entity-definitions)

Update `_shared/types/index.ts`:

- Add `permission: string` to `EntityImportDefinition` interface
- Make `module` required
- Add AI bridge types (`ImportAIBridge`, `ImportRow`, `ColumnMapping`, `AIImportProcessRequest`, `AIImportProcessResponse`)

Update `_shared/components/index.ts`:

- Remove exports: `ImportMethodSelector`, `EntityImportPage`, `EntityConfigPage`, `EntitySheetsPage`
- Keep exports: `ImportSpreadsheet`, `FieldConfigList`, `ImportProgressDialog`, `CSVUpload`

---

## 7. Navigation Integration

### Import Hub Access

Already exists in Stock dashboard (`actionButtons` array with `href: '/import'`). No change needed.

### Module Listing Pages

Add "Importar" button to entity listing pages that have import support:

- `/stock/products` → button navigates to `/import/stock/products`
- `/stock/templates` → button navigates to `/import/stock/templates`
- `/stock/manufacturers` → button navigates to `/import/stock/manufacturers`
- `/hr/employees` → button navigates to `/import/hr/employees`
- etc.

Button only renders if user has the entity's `.import` permission.

---

## 8. Files Summary

### Delete (~45 files)

**Old route directories (entire contents):**
- `/import/products/` (3 files)
- `/import/variants/` (3 files)
- `/import/categories/` (3 files)
- `/import/suppliers/` (3 files)
- `/import/users/` (3 files)
- `/import/templates/` (2 files)
- `/import/catalog/` (12 files: page + 7 components + 4 hooks)

**Special routes:**
- `/import/stock/products/home/page.tsx`
- `/import/stock/variants/by-product/[productId]/page.tsx`
- `/import/hr/companies/page.tsx` (moved to admin)

**Sheets subdirectories (after content moves up to page.tsx):**
- `/import/stock/products/sheets/` (content moved to `/import/stock/products/page.tsx`)
- `/import/stock/variants/sheets/` (content moved to `/import/stock/variants/page.tsx`)
- `/import/stock/items/sheets/` (if exists)
- `/import/stock/product-categories/sheets/` (if exists)
- `/import/admin/users/sheets/` (if exists)
- `/import/hr/departments/sheets/` (if exists)
- `/import/hr/employees/sheets/` (if exists)
- `/import/hr/positions/sheets/` (if exists)

**Config directories:**
- `/import/stock/products/config/page.tsx`
- `/import/stock/variants/config/page.tsx`
- `/import/stock/items/config/page.tsx`
- `/import/stock/product-categories/config/page.tsx`
- `/import/admin/users/config/page.tsx`
- `/import/hr/departments/config/page.tsx`
- `/import/hr/employees/config/page.tsx`
- `/import/hr/positions/config/page.tsx`

**Shared components/hooks:**
- `_shared/components/entity-import-page.tsx`
- `_shared/components/entity-config-page.tsx`
- `_shared/components/import-method-selector.tsx`
- `_shared/components/entity-sheets-page.tsx`
- `_shared/hooks/use-import-config.ts`

### Modify

- `/import/page.tsx` — rewrite as dashboard
- `/import/stock/products/page.tsx` — replace with sheets content (from `/sheets/`)
- `/import/stock/variants/page.tsx` — replace with sheets content (from `/sheets/`)
- Same pattern for all other entities that have sheets pages
- `_shared/config/entity-definitions.ts` — add permission field, remove categories duplicate
- `_shared/types/index.ts` — add permission field, AI bridge types
- `_shared/components/index.ts` — remove deleted component exports
- `_shared/hooks/index.ts` — remove deleted hook exports (if barrel exists)
- `_shared/index.ts` — update root barrel (if exists)
- `/import/admin/companies/page.tsx` — keep and verify it's a sheets page (or rewrite)
- `/import/admin/users/page.tsx` — rewrite as sheets page (replace method selector)
- Frontend `permission-codes.ts` — add `'import'` to 6 perm() calls
- Backend `permission-codes.ts` — mirror frontend changes
- Backend seed — add new import permissions
- Backend bulk controllers — switch to `.import` permission

### Create

- `_shared/hooks/use-import-ai.ts` — AI bridge hook (dormant)

---

## 9. Implementation Order

1. **Backend permissions** — add `'import'` to 6 perm() calls in API, update seed, update bulk controllers
2. **Frontend permissions** — add `'import'` to 6 perm() calls in APP permission-codes.ts
3. **Delete orphan files** — remove old routes, catalog wizard, config pages, method selectors, shared wrappers
4. **Update barrel/types** — update index.ts, entity-definitions.ts, types
5. **Relocate sheets pages** — move from `/sheets/page.tsx` up to `/page.tsx`
6. **Rewrite dashboard** — new `/import/page.tsx` with standard dashboard pattern
7. **Add "Importar" buttons** — to module listing pages
8. **AI hooks** — create `useImportAI` hook and types
9. **Test** — verify all routes, permissions, navigation
