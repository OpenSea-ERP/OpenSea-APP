# Import System Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the import system to use a single sheets page per entity, a standard dashboard, dedicated `.import` permissions, and AI-ready hooks.

**Architecture:** Delete ~45 orphan files (old routes, catalog wizard, config pages, method selectors). Relocate sheets pages from `/sheets/page.tsx` to `/page.tsx`. Rewrite the import hub as a standard dashboard. Add `.import` permission codes to both backend and frontend.

**Tech Stack:** Next.js 16 (App Router), React 19, Fastify, Prisma, Vitest (E2E), TypeScript

**Spec:** `docs/superpowers/specs/2026-03-21-import-system-refactor-design.md`

**Important paths:**
- All frontend import routes: `OpenSea-APP/src/app/(dashboard)/(actions)/import/`
- Backend permissions: `OpenSea-API/src/constants/rbac/permission-codes.ts`
- Frontend permissions: `OpenSea-APP/src/config/rbac/permission-codes.ts`
- Backend bulk controllers: `OpenSea-API/src/http/controllers/stock/products/`, `stock/variants/`
- Backend seed: `OpenSea-API/prisma/seed.ts`

---

### Task 1: Add `.import` permission codes to backend

**Files:**
- Modify: `OpenSea-API/src/constants/rbac/permission-codes.ts`

- [ ] **Step 1: Add IMPORT to STOCK.TEMPLATES**

In `OpenSea-API/src/constants/rbac/permission-codes.ts`, find the TEMPLATES block (lines 38-43) and add IMPORT:

```typescript
TEMPLATES: {
  ACCESS: 'stock.templates.access' as const,
  REGISTER: 'stock.templates.register' as const,
  MODIFY: 'stock.templates.modify' as const,
  REMOVE: 'stock.templates.remove' as const,
  IMPORT: 'stock.templates.import' as const,
},
```

- [ ] **Step 2: Add IMPORT to STOCK.ITEMS**

Find the ITEMS block (lines 60-65) and add IMPORT:

```typescript
ITEMS: {
  ACCESS: 'stock.items.access' as const,
  EXPORT: 'stock.items.export' as const,
  PRINT: 'stock.items.print' as const,
  ADMIN: 'stock.items.admin' as const,
  IMPORT: 'stock.items.import' as const,
},
```

- [ ] **Step 3: Add IMPORT to HR.POSITIONS**

Find POSITIONS block (lines 175-180) and add IMPORT:

```typescript
POSITIONS: {
  ACCESS: 'hr.positions.access' as const,
  REGISTER: 'hr.positions.register' as const,
  MODIFY: 'hr.positions.modify' as const,
  REMOVE: 'hr.positions.remove' as const,
  IMPORT: 'hr.positions.import' as const,
},
```

- [ ] **Step 4: Add IMPORT to HR.DEPARTMENTS**

Find DEPARTMENTS block (lines 181-186) and add IMPORT:

```typescript
DEPARTMENTS: {
  ACCESS: 'hr.departments.access' as const,
  REGISTER: 'hr.departments.register' as const,
  MODIFY: 'hr.departments.modify' as const,
  REMOVE: 'hr.departments.remove' as const,
  IMPORT: 'hr.departments.import' as const,
},
```

- [ ] **Step 5: Add IMPORT to ADMIN.USERS**

Find USERS block (lines 269-275) and add IMPORT:

```typescript
USERS: {
  ACCESS: 'admin.users.access' as const,
  REGISTER: 'admin.users.register' as const,
  MODIFY: 'admin.users.modify' as const,
  REMOVE: 'admin.users.remove' as const,
  ADMIN: 'admin.users.admin' as const,
  IMPORT: 'admin.users.import' as const,
},
```

- [ ] **Step 6: Add IMPORT to ADMIN.COMPANIES**

Find COMPANIES block (lines 283-289) and add IMPORT:

```typescript
COMPANIES: {
  ACCESS: 'admin.companies.access' as const,
  REGISTER: 'admin.companies.register' as const,
  MODIFY: 'admin.companies.modify' as const,
  REMOVE: 'admin.companies.remove' as const,
  ADMIN: 'admin.companies.admin' as const,
  IMPORT: 'admin.companies.import' as const,
},
```

- [ ] **Step 7: Verify build**

Run: `cd OpenSea-API && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
cd OpenSea-API
git add src/constants/rbac/permission-codes.ts
git commit -m "feat(rbac): add .import permission codes for templates, items, positions, departments, users, companies"
```

---

### Task 2: Update bulk controllers to use `.import` permission

**Files:**
- Modify: `OpenSea-API/src/http/controllers/stock/products/v1-bulk-create-products.controller.ts`
- Modify: `OpenSea-API/src/http/controllers/stock/variants/v1-bulk-create-variants.controller.ts`

- [ ] **Step 1: Update products bulk controller**

In `v1-bulk-create-products.controller.ts`, find the `createPermissionMiddleware` call and change:

```typescript
// FROM:
createPermissionMiddleware({
  permissionCode: PermissionCodes.STOCK.PRODUCTS.REGISTER,
  resource: 'products',
}),

// TO:
createPermissionMiddleware({
  permissionCode: PermissionCodes.STOCK.PRODUCTS.IMPORT,
  resource: 'products',
}),
```

- [ ] **Step 2: Update variants bulk controller**

In `v1-bulk-create-variants.controller.ts`, same change:

```typescript
// FROM:
createPermissionMiddleware({
  permissionCode: PermissionCodes.STOCK.VARIANTS.REGISTER,
  resource: 'variants',
}),

// TO:
createPermissionMiddleware({
  permissionCode: PermissionCodes.STOCK.VARIANTS.IMPORT,
  resource: 'variants',
}),
```

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API
git add src/http/controllers/stock/products/v1-bulk-create-products.controller.ts src/http/controllers/stock/variants/v1-bulk-create-variants.controller.ts
git commit -m "feat(rbac): switch bulk controllers from .register to .import permission"
```

---

### Task 3: Write E2E tests for bulk import permissions

**Files:**
- Modify: `OpenSea-API/src/http/controllers/stock/products/v1-bulk-create-products.e2e.spec.ts`
- Modify: `OpenSea-API/src/http/controllers/stock/variants/v1-bulk-create-variants.e2e.spec.ts`

- [ ] **Step 1: Add permission-specific test to products bulk E2E**

Add these test cases to the existing `v1-bulk-create-products.e2e.spec.ts`:

```typescript
it('should return 403 when user has register but not import permission', async () => {
  const { token } = await createAndAuthenticateUser(app, {
    tenantId,
    permissions: ['stock.products.register'],
  });

  const template = await prisma.template.create({
    data: {
      tenantId,
      name: `Template PermTest ${Date.now()}`,
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    },
  });

  const response = await request(app.server)
    .post('/v1/products/bulk')
    .set('Authorization', `Bearer ${token}`)
    .send({
      products: [{ name: `Perm Test ${Date.now()}`, templateId: template.id }],
    });

  expect(response.status).toBe(403);
});

it('should return 201 when user has import permission', async () => {
  const { token } = await createAndAuthenticateUser(app, {
    tenantId,
    permissions: ['stock.products.import'],
  });

  const template = await prisma.template.create({
    data: {
      tenantId,
      name: `Template ImportPerm ${Date.now()}`,
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    },
  });

  const response = await request(app.server)
    .post('/v1/products/bulk')
    .set('Authorization', `Bearer ${token}`)
    .send({
      products: [{ name: `Import Perm Test ${Date.now()}`, templateId: template.id }],
    });

  expect(response.status).toBe(201);
  expect(response.body.created).toHaveLength(1);
});
```

- [ ] **Step 2: Add same tests to variants bulk E2E**

Add equivalent tests to `v1-bulk-create-variants.e2e.spec.ts`:

```typescript
it('should return 403 when user has register but not import permission', async () => {
  const { token } = await createAndAuthenticateUser(app, {
    tenantId,
    permissions: ['stock.variants.register'],
  });

  // Need a product first
  const { token: adminToken } = await createAndAuthenticateUser(app, { tenantId });
  const template = await prisma.template.create({
    data: {
      tenantId,
      name: `Template VarPerm ${Date.now()}`,
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    },
  });
  const productRes = await request(app.server)
    .post('/v1/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Product VarPerm ${Date.now()}`, templateId: template.id });

  const response = await request(app.server)
    .post('/v1/variants/bulk')
    .set('Authorization', `Bearer ${token}`)
    .send({
      variants: [{
        name: `Variant Perm ${Date.now()}`,
        productId: productRes.body.id,
      }],
    });

  expect(response.status).toBe(403);
});

it('should return 201 when user has import permission', async () => {
  const { token: adminToken } = await createAndAuthenticateUser(app, { tenantId });
  const template = await prisma.template.create({
    data: {
      tenantId,
      name: `Template VarImport ${Date.now()}`,
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    },
  });
  const productRes = await request(app.server)
    .post('/v1/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Product VarImport ${Date.now()}`, templateId: template.id });

  const { token } = await createAndAuthenticateUser(app, {
    tenantId,
    permissions: ['stock.variants.import'],
  });

  const response = await request(app.server)
    .post('/v1/variants/bulk')
    .set('Authorization', `Bearer ${token}`)
    .send({
      variants: [{
        name: `Variant Import ${Date.now()}`,
        productId: productRes.body.id,
      }],
    });

  expect(response.status).toBe(201);
  expect(response.body.created).toHaveLength(1);
});
```

- [ ] **Step 3: Run E2E tests**

Run: `cd OpenSea-API && npx vitest run src/http/controllers/stock/products/v1-bulk-create-products.e2e.spec.ts src/http/controllers/stock/variants/v1-bulk-create-variants.e2e.spec.ts`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API
git add src/http/controllers/stock/products/v1-bulk-create-products.e2e.spec.ts src/http/controllers/stock/variants/v1-bulk-create-variants.e2e.spec.ts
git commit -m "test(e2e): add import permission tests for bulk create products and variants"
```

---

### Task 4: Add `.import` permission codes to frontend

**Files:**
- Modify: `OpenSea-APP/src/config/rbac/permission-codes.ts`

- [ ] **Step 1: Add IMPORT to STOCK_PERMISSIONS.TEMPLATES**

Add `'import'` to the `perm()` call:

```typescript
// FROM:
TEMPLATES: perm('stock', 'templates', 'access', 'register', 'modify', 'remove'),
// TO:
TEMPLATES: perm('stock', 'templates', 'access', 'register', 'modify', 'remove', 'import'),
```

- [ ] **Step 2: Add IMPORT to STOCK_PERMISSIONS.ITEMS**

```typescript
// FROM:
ITEMS: perm('stock', 'items', 'access', 'export', 'print', 'admin'),
// TO:
ITEMS: perm('stock', 'items', 'access', 'export', 'print', 'admin', 'import'),
```

- [ ] **Step 3: Add IMPORT to HR_PERMISSIONS.POSITIONS**

```typescript
// FROM:
POSITIONS: perm('hr', 'positions', 'access', 'register', 'modify', 'remove'),
// TO:
POSITIONS: perm('hr', 'positions', 'access', 'register', 'modify', 'remove', 'import'),
```

- [ ] **Step 4: Add IMPORT to HR_PERMISSIONS.DEPARTMENTS**

```typescript
// FROM:
DEPARTMENTS: perm('hr', 'departments', 'access', 'register', 'modify', 'remove'),
// TO:
DEPARTMENTS: perm('hr', 'departments', 'access', 'register', 'modify', 'remove', 'import'),
```

- [ ] **Step 5: Add IMPORT to ADMIN_PERMISSIONS.USERS**

```typescript
// FROM:
USERS: perm('admin', 'users', 'access', 'register', 'modify', 'remove', 'admin'),
// TO:
USERS: perm('admin', 'users', 'access', 'register', 'modify', 'remove', 'admin', 'import'),
```

- [ ] **Step 6: Add IMPORT to ADMIN_PERMISSIONS.COMPANIES**

```typescript
// FROM:
COMPANIES: perm('admin', 'companies', 'access', 'register', 'modify', 'remove', 'admin'),
// TO:
COMPANIES: perm('admin', 'companies', 'access', 'register', 'modify', 'remove', 'admin', 'import'),
```

- [ ] **Step 7: Verify build**

Run: `cd OpenSea-APP && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
cd OpenSea-APP
git add src/config/rbac/permission-codes.ts
git commit -m "feat(rbac): add .import permission codes for templates, items, positions, departments, users, companies"
```

---

### Task 5: Delete old orphan route directories

**Files:**
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/products/` (entire directory)
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/variants/` (entire directory)
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/categories/` (entire directory)
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/suppliers/` (entire directory)
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/users/` (entire directory)
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/templates/` (entire directory)

- [ ] **Step 1: Delete all old route directories**

```bash
cd OpenSea-APP
rm -rf src/app/\(dashboard\)/\(actions\)/import/products/
rm -rf src/app/\(dashboard\)/\(actions\)/import/variants/
rm -rf src/app/\(dashboard\)/\(actions\)/import/categories/
rm -rf src/app/\(dashboard\)/\(actions\)/import/suppliers/
rm -rf src/app/\(dashboard\)/\(actions\)/import/users/
rm -rf src/app/\(dashboard\)/\(actions\)/import/templates/
```

- [ ] **Step 2: Verify no imports break**

Run: `cd OpenSea-APP && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors referencing deleted files (these were standalone pages)

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP
git add -A src/app/\(dashboard\)/\(actions\)/import/products/ src/app/\(dashboard\)/\(actions\)/import/variants/ src/app/\(dashboard\)/\(actions\)/import/categories/ src/app/\(dashboard\)/\(actions\)/import/suppliers/ src/app/\(dashboard\)/\(actions\)/import/users/ src/app/\(dashboard\)/\(actions\)/import/templates/
git commit -m "refactor(import): delete old route directories without module prefix"
```

---

### Task 6: Delete catalog wizard

**Files:**
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/catalog/` (entire directory)

- [ ] **Step 1: Delete catalog directory**

```bash
cd OpenSea-APP
rm -rf src/app/\(dashboard\)/\(actions\)/import/catalog/
```

- [ ] **Step 2: Commit**

```bash
cd OpenSea-APP
git add -A src/app/\(dashboard\)/\(actions\)/import/catalog/
git commit -m "refactor(import): delete catalog wizard (replaced by per-entity sheets pages)"
```

---

### Task 7: Delete config pages and special routes

**Files:**
- Delete: All `config/page.tsx` files under import routes
- Delete: `/import/stock/products/home/`
- Delete: `/import/stock/variants/by-product/`
- Delete: `/import/hr/companies/` (moved to admin)

- [ ] **Step 1: Delete config directories**

```bash
cd OpenSea-APP
rm -rf src/app/\(dashboard\)/\(actions\)/import/stock/products/config/
rm -rf src/app/\(dashboard\)/\(actions\)/import/stock/variants/config/
rm -rf src/app/\(dashboard\)/\(actions\)/import/stock/items/config/
rm -rf src/app/\(dashboard\)/\(actions\)/import/stock/product-categories/config/
rm -rf src/app/\(dashboard\)/\(actions\)/import/admin/users/config/
rm -rf src/app/\(dashboard\)/\(actions\)/import/hr/departments/config/
rm -rf src/app/\(dashboard\)/\(actions\)/import/hr/employees/config/
rm -rf src/app/\(dashboard\)/\(actions\)/import/hr/positions/config/
```

- [ ] **Step 2: Delete special routes**

```bash
cd OpenSea-APP
rm -rf src/app/\(dashboard\)/\(actions\)/import/stock/products/home/
rm -rf src/app/\(dashboard\)/\(actions\)/import/stock/variants/by-product/
rm -rf src/app/\(dashboard\)/\(actions\)/import/hr/companies/
```

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP
git add -A
git commit -m "refactor(import): delete config pages, home route, by-product route, hr/companies route"
```

---

### Task 8: Delete unused shared components and update barrels

**Files:**
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/components/entity-import-page.tsx`
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/components/entity-config-page.tsx`
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/components/import-method-selector.tsx`
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/components/entity-sheets-page.tsx`
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/hooks/use-import-config.ts`
- Modify: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/components/index.ts`
- Modify: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/hooks/index.ts`

- [ ] **Step 1: Delete unused components**

```bash
cd OpenSea-APP
rm -f src/app/\(dashboard\)/\(actions\)/import/_shared/components/entity-import-page.tsx
rm -f src/app/\(dashboard\)/\(actions\)/import/_shared/components/entity-config-page.tsx
rm -f src/app/\(dashboard\)/\(actions\)/import/_shared/components/import-method-selector.tsx
rm -f src/app/\(dashboard\)/\(actions\)/import/_shared/components/entity-sheets-page.tsx
rm -f src/app/\(dashboard\)/\(actions\)/import/_shared/hooks/use-import-config.ts
```

- [ ] **Step 2: Update components barrel**

Update `_shared/components/index.ts` to:

```typescript
export { ImportSpreadsheet } from './import-spreadsheet';
export { FieldConfigList } from './field-config-list';
export { ImportProgressDialog } from './import-progress-dialog';
export { CSVUpload } from './csv-upload';
```

- [ ] **Step 3: Update hooks barrel**

Update `_shared/hooks/index.ts` — remove `useImportConfig` export:

```typescript
export { useImportSpreadsheet } from './use-import-spreadsheet';
export { useImportProcess } from './use-import-process';
export {
  useReferenceData,
  useAllReferenceData,
  useTemplates,
  useSuppliers,
  useManufacturers,
  useCategories,
  useProducts,
  useVariants,
  useLocations,
} from './use-reference-data';
```

- [ ] **Step 4: Verify build**

Run: `cd OpenSea-APP && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors (some remaining intermediate pages may still import deleted components — we fix those in next tasks)

- [ ] **Step 5: Commit**

```bash
cd OpenSea-APP
git add -A
git commit -m "refactor(import): delete unused shared components (entity-import-page, entity-config-page, import-method-selector, entity-sheets-page, use-import-config)"
```

---

### Task 9: Relocate sheets pages — move content from `/sheets/page.tsx` to `/page.tsx`

For each entity, the sheets page content replaces the intermediate method selector page.

**Files:**
- For products: Move `import/stock/products/sheets/page.tsx` → `import/stock/products/page.tsx`
- For variants: Move `import/stock/variants/sheets/page.tsx` → `import/stock/variants/page.tsx`
- Same for: items, product-categories, admin/users, hr/departments, hr/employees, hr/positions
- Delete: All now-empty `/sheets/` directories
- Create: `/import/stock/manufacturers/page.tsx` (currently has no sheets page — create based on EntitySheetsPage pattern)

- [ ] **Step 1: Products — move sheets up**

```bash
cd OpenSea-APP
cp src/app/\(dashboard\)/\(actions\)/import/stock/products/sheets/page.tsx src/app/\(dashboard\)/\(actions\)/import/stock/products/page.tsx
rm -rf src/app/\(dashboard\)/\(actions\)/import/stock/products/sheets/
```

Then update relative import paths in the new `page.tsx`. All `../../../_shared/` become `../../_shared/` (one level less since we moved up from `/sheets/`).

- [ ] **Step 2: Variants — move sheets up**

```bash
cd OpenSea-APP
cp src/app/\(dashboard\)/\(actions\)/import/stock/variants/sheets/page.tsx src/app/\(dashboard\)/\(actions\)/import/stock/variants/page.tsx
rm -rf src/app/\(dashboard\)/\(actions\)/import/stock/variants/sheets/
```

Update relative imports: `../../../_shared/` → `../../_shared/`

- [ ] **Step 3: Items — move sheets up**

```bash
cd OpenSea-APP
cp src/app/\(dashboard\)/\(actions\)/import/stock/items/sheets/page.tsx src/app/\(dashboard\)/\(actions\)/import/stock/items/page.tsx
rm -rf src/app/\(dashboard\)/\(actions\)/import/stock/items/sheets/
```

Update relative imports.

- [ ] **Step 4: Product Categories — move sheets up**

```bash
cd OpenSea-APP
cp src/app/\(dashboard\)/\(actions\)/import/stock/product-categories/sheets/page.tsx src/app/\(dashboard\)/\(actions\)/import/stock/product-categories/page.tsx
rm -rf src/app/\(dashboard\)/\(actions\)/import/stock/product-categories/sheets/
```

Update relative imports. Note: this was an EntitySheetsPage wrapper — it needs to be converted to a standalone page since EntitySheetsPage was deleted. Use the same pattern as the products sheets page but with `product-categories` entity type.

- [ ] **Step 5: Admin Users — move sheets up**

```bash
cd OpenSea-APP
cp src/app/\(dashboard\)/\(actions\)/import/admin/users/sheets/page.tsx src/app/\(dashboard\)/\(actions\)/import/admin/users/page.tsx
rm -rf src/app/\(dashboard\)/\(actions\)/import/admin/users/sheets/
```

Same EntitySheetsPage wrapper conversion needed.

- [ ] **Step 6: HR Departments, Employees, Positions — move sheets up**

```bash
cd OpenSea-APP
cp src/app/\(dashboard\)/\(actions\)/import/hr/departments/sheets/page.tsx src/app/\(dashboard\)/\(actions\)/import/hr/departments/page.tsx
rm -rf src/app/\(dashboard\)/\(actions\)/import/hr/departments/sheets/

cp src/app/\(dashboard\)/\(actions\)/import/hr/employees/sheets/page.tsx src/app/\(dashboard\)/\(actions\)/import/hr/employees/page.tsx
rm -rf src/app/\(dashboard\)/\(actions\)/import/hr/employees/sheets/

cp src/app/\(dashboard\)/\(actions\)/import/hr/positions/sheets/page.tsx src/app/\(dashboard\)/\(actions\)/import/hr/positions/page.tsx
rm -rf src/app/\(dashboard\)/\(actions\)/import/hr/positions/sheets/
```

Same EntitySheetsPage wrapper conversion for all three.

- [ ] **Step 7: Create manufacturers page**

`/import/stock/manufacturers/page.tsx` currently has only a method selector page (no sheets). Create a new standalone import page for manufacturers. Use the simple entity pattern — manufacturers only have `tradeName` and `cnpj` fields with CNPJ lookup.

- [ ] **Step 8: Convert EntitySheetsPage wrappers to standalone pages**

All pages that were thin wrappers around `<EntitySheetsPage entityType="..." />` need to be rewritten as standalone pages. They should:
1. Import and use the shared hooks directly (`useImportSpreadsheet`, `useImportProcess`, `useReferenceData`)
2. Import `ImportSpreadsheet` and `ImportProgressDialog` from `_shared/components`
3. Use `PageActionBar` with breadcrumbs
4. Follow the same layout as the products/variants reference pages

The entity field definitions come from `ENTITY_DEFINITIONS[entityType]` in `entity-definitions.ts`.

- [ ] **Step 9: Fix all relative import paths**

After moving files, run: `cd OpenSea-APP && npx tsc --noEmit 2>&1 | grep "Cannot find module"`

Fix any broken relative imports. The key change is `../../../_shared/` → `../../_shared/` for pages that moved up one directory level.

- [ ] **Step 10: Verify build**

Run: `cd OpenSea-APP && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 11: Commit**

```bash
cd OpenSea-APP
git add -A
git commit -m "refactor(import): relocate sheets pages to direct routes, delete /sheets/ subdirectories"
```

---

### Task 10: Update entity definitions

**Files:**
- Modify: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/config/entity-definitions.ts`
- Modify: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/types/index.ts`

- [ ] **Step 1: Add `permission` field to `EntityImportDefinition` type**

In `_shared/types/index.ts`, add `permission: string` to the `EntityImportDefinition` interface and make `module` required:

```typescript
export interface EntityImportDefinition {
  entityType: string;
  label: string;
  labelPlural: string;
  description: string;
  icon: string;
  color: string;
  fields: EntityFieldDefinition[];
  apiEndpoint: string;
  batchEndpoint: string;
  basePath?: string;
  module: 'stock' | 'admin' | 'hr';
  permission: string;
}
```

- [ ] **Step 2: Remove `categories` backward-compat entry and add permissions to all definitions**

In `entity-definitions.ts`:

1. Delete the `categories` entry (lines ~889-902) — the duplicate for backward compat
2. Add `permission` field to every entity definition:

```typescript
products: {
  // ... existing fields ...
  permission: 'stock.products.import',
},
variants: {
  // ... existing fields ...
  permission: 'stock.variants.import',
},
items: {
  // ... existing fields ...
  permission: 'stock.items.import',
},
suppliers: {
  // ... existing fields ...
  permission: 'finance.suppliers.import', // NOTE: finance module, not stock
},
'product-categories': {
  // ... existing fields ...
  permission: 'stock.categories.import',
},
manufacturers: {
  // ... existing fields ...
  permission: 'stock.manufacturers.import',
},
templates: {
  // ... existing fields ...
  permission: 'stock.templates.import',
},
users: {
  // ... existing fields ...
  permission: 'admin.users.import',
},
companies: {
  // ... existing fields ...
  permission: 'admin.companies.import',
},
departments: {
  // ... existing fields ...
  permission: 'hr.departments.import',
},
positions: {
  // ... existing fields ...
  permission: 'hr.positions.import',
},
employees: {
  // ... existing fields ...
  permission: 'hr.employees.import',
},
```

- [ ] **Step 3: Verify build**

Run: `cd OpenSea-APP && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP
git add src/app/\(dashboard\)/\(actions\)/import/_shared/config/entity-definitions.ts src/app/\(dashboard\)/\(actions\)/import/_shared/types/index.ts
git commit -m "feat(import): add permission field to entity definitions, remove categories backward-compat"
```

---

### Task 11: Rewrite import dashboard page

**Files:**
- Modify: `OpenSea-APP/src/app/(dashboard)/(actions)/import/page.tsx`

- [ ] **Step 1: Rewrite `/import/page.tsx` with standard dashboard pattern**

Replace the entire file content with a dashboard using `PageActionBar`, `PageHeroBanner`, and `PageDashboardSections`:

```typescript
'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageDashboardSections } from '@/components/layout/page-dashboard-sections';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import {
  ADMIN_PERMISSIONS,
  FINANCE_PERMISSIONS,
  HR_PERMISSIONS,
  STOCK_PERMISSIONS,
} from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import {
  BadgeCheck,
  Box,
  Building2,
  Factory,
  FolderTree,
  Layers,
  LayoutTemplate,
  Network,
  Package,
  Truck,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';

import type { DashboardSection } from '@/components/layout/page-dashboard-sections';

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

export default function ImportDashboardPage() {
  const { hasPermission } = usePermissions();

  return (
    <div className="space-y-8">
      <PageActionBar
        breadcrumbItems={[{ label: 'Importação', href: '/import' }]}
        actionButtons={[]}
        hasPermission={hasPermission}
      />

      <PageHeroBanner
        title="Importação de Dados"
        description="Importe dados em massa para o sistema via planilhas interativas. Selecione a entidade que deseja importar."
        icon={Upload}
        iconGradient="from-amber-500 to-amber-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      <PageDashboardSections
        sections={sections}
        counts={{}}
        countsLoading={false}
        hasPermission={hasPermission}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Run: `cd OpenSea-APP && npm run build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP
git add src/app/\(dashboard\)/\(actions\)/import/page.tsx
git commit -m "feat(import): rewrite import hub as standard dashboard with PageDashboardSections"
```

---

### Task 12: Update listing page import buttons

**Files:**
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/products/page.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/templates/page.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/hr/(entities)/employees/page.tsx`

- [ ] **Step 1: Fix products import button URL**

In products `page.tsx`, find the import button handler (likely `handleImport`) and change the navigation target:

```typescript
// FROM: router.push('/import/stock/products/home')
// TO:   router.push('/import/stock/products')
```

- [ ] **Step 2: Fix templates import button URL**

In templates `page.tsx`:

```typescript
// FROM: router.push('/import/templates')
// TO:   router.push('/import/stock/templates')
```

- [ ] **Step 3: Verify employees import button URL**

In employees `page.tsx`, verify it already points to `/import/hr/employees`. If not, update it.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP
git add -A
git commit -m "fix(import): update listing page import button URLs to new routes"
```

---

### Task 13: Add AI bridge types and hook

**Files:**
- Modify: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/types/index.ts`
- Create: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/hooks/use-import-ai.ts`

- [ ] **Step 1: Add AI types to `_shared/types/index.ts`**

Add these types at the end of the file:

```typescript
// ============================================
// AI INTEGRATION TYPES
// ============================================

export interface ImportRow {
  [fieldKey: string]: string | number | boolean | null;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transform?: 'none' | 'date' | 'number' | 'boolean' | 'reference-lookup';
}

export interface ImportAIBridge {
  fillFromAI(rows: ImportRow[]): void;
  exportForAI(): {
    entityType: string;
    columns: ImportFieldConfig[];
    rows: ImportRow[];
    referenceData: Record<string, { id: string; label: string }[]>;
  };
  applySuggestedMapping(mapping: ColumnMapping[]): void;
  getEntityDefinition(): EntityImportDefinition;
}
```

- [ ] **Step 2: Create `use-import-ai.ts` hook**

Create `_shared/hooks/use-import-ai.ts`:

```typescript
import { useCallback, useMemo } from 'react';

import type {
  ColumnMapping,
  EntityImportDefinition,
  ImportAIBridge,
  ImportFieldConfig,
  ImportRow,
} from '../types';

interface UseImportAIOptions {
  entityDefinition: EntityImportDefinition;
  columns: ImportFieldConfig[];
  onFillData: (rows: ImportRow[]) => void;
  onApplyMapping: (mapping: ColumnMapping[]) => void;
  getRows: () => ImportRow[];
  getReferenceData: () => Record<string, { id: string; label: string }[]>;
}

export function useImportAI(options: UseImportAIOptions): ImportAIBridge {
  const {
    entityDefinition,
    columns,
    onFillData,
    onApplyMapping,
    getRows,
    getReferenceData,
  } = options;

  const fillFromAI = useCallback(
    (rows: ImportRow[]) => {
      onFillData(rows);
    },
    [onFillData]
  );

  const exportForAI = useCallback(() => {
    return {
      entityType: entityDefinition.entityType,
      columns,
      rows: getRows(),
      referenceData: getReferenceData(),
    };
  }, [entityDefinition, columns, getRows, getReferenceData]);

  const applySuggestedMapping = useCallback(
    (mapping: ColumnMapping[]) => {
      onApplyMapping(mapping);
    },
    [onApplyMapping]
  );

  const getEntityDef = useCallback(
    () => entityDefinition,
    [entityDefinition]
  );

  return useMemo(
    () => ({
      fillFromAI,
      exportForAI,
      applySuggestedMapping,
      getEntityDefinition: getEntityDef,
    }),
    [fillFromAI, exportForAI, applySuggestedMapping, getEntityDef]
  );
}
```

- [ ] **Step 3: Update hooks barrel**

Add to `_shared/hooks/index.ts`:

```typescript
export { useImportAI } from './use-import-ai';
```

- [ ] **Step 4: Verify build**

Run: `cd OpenSea-APP && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
cd OpenSea-APP
git add src/app/\(dashboard\)/\(actions\)/import/_shared/types/index.ts src/app/\(dashboard\)/\(actions\)/import/_shared/hooks/use-import-ai.ts src/app/\(dashboard\)/\(actions\)/import/_shared/hooks/index.ts
git commit -m "feat(import): add AI bridge types and useImportAI hook for future AI integration"
```

---

### Task 14: Run backend permission seed and verify

**Files:**
- No file changes — run seed to sync new permissions

- [ ] **Step 1: Run permission seed**

The seed file auto-syncs permissions from `PermissionCodes`. Run:

```bash
cd OpenSea-API
npx prisma db seed
```

Expected: Seed completes without errors, new import permissions are created in the database.

- [ ] **Step 2: Run full E2E test suite for bulk operations**

```bash
cd OpenSea-API
npx vitest run src/http/controllers/stock/products/v1-bulk-create-products.e2e.spec.ts
npx vitest run src/http/controllers/stock/variants/v1-bulk-create-variants.e2e.spec.ts
```

Expected: All tests pass, including the new permission-specific tests from Task 3.

---

### Task 15: Final verification and cleanup

- [ ] **Step 1: Verify all import routes work**

```bash
cd OpenSea-APP && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify no orphan imports remain**

```bash
cd OpenSea-APP
grep -r "import-method-selector\|entity-import-page\|entity-config-page\|entity-sheets-page\|use-import-config" src/ --include="*.tsx" --include="*.ts" -l
```

Expected: No files reference deleted components.

- [ ] **Step 3: Verify no old routes remain**

```bash
cd OpenSea-APP
ls src/app/\(dashboard\)/\(actions\)/import/products/ 2>/dev/null && echo "OLD ROUTE EXISTS" || echo "OK"
ls src/app/\(dashboard\)/\(actions\)/import/variants/ 2>/dev/null && echo "OLD ROUTE EXISTS" || echo "OK"
ls src/app/\(dashboard\)/\(actions\)/import/catalog/ 2>/dev/null && echo "OLD ROUTE EXISTS" || echo "OK"
```

Expected: All "OK"

- [ ] **Step 4: Run backend E2E tests one more time**

```bash
cd OpenSea-API
npx vitest run --reporter=verbose 2>&1 | tail -30
```

- [ ] **Step 5: Final commit if any remaining fixes**

```bash
cd OpenSea-APP
git add -A
git commit -m "chore(import): final cleanup and verification"
```
