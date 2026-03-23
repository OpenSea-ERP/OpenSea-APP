# Permission System Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all ~721 legacy permission codes with ~238 new humanized codes aligned with the frontend UI structure, update seed, backend controllers, and frontend permission checks.

**Architecture:** New codes follow `{ui-tab}.{resource}.{action}` pattern with 10 standardized actions (access, register, modify, remove, import, export, print, admin, share, onlyself). Backend `permission-codes.ts` is rewritten from scratch. Seed deletes old codes and creates new ones. Controllers are remapped. Frontend permission constants are rebuilt to mirror backend. A migration mapping enables the seed to reassign existing group permissions.

**Tech Stack:** TypeScript, Fastify, Prisma, PostgreSQL (backend); Next.js, React (frontend)

---

## File Structure

### Backend (OpenSea-API)

| Action  | File                                             | Responsibility                                                                        |
| ------- | ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Rewrite | `src/constants/rbac/permission-codes.ts`         | New 238 permission codes, DEFAULT_USER_PERMISSIONS, isValidPermissionCode             |
| Modify  | `src/constants/rbac/permission-groups.ts`        | No changes needed (ADMIN/USER slugs stay)                                             |
| Modify  | `prisma/seed.ts`                                 | Seed uses new codes; cleanup deletes old; groups reassigned                           |
| Create  | `src/constants/rbac/permission-migration-map.ts` | Maps old controller permission references → new codes (used during controller update) |
| Modify  | ~80 controller route files                       | Remap `createPermissionMiddleware` calls to new codes                                 |

### Frontend (OpenSea-APP)

| Action  | File                                  | Responsibility                              |
| ------- | ------------------------------------- | ------------------------------------------- |
| Rewrite | `src/config/rbac/permission-codes.ts` | New permission constants matching backend   |
| Modify  | `src/config/rbac/base-groups.ts`      | Update group definitions with new codes     |
| Modify  | `src/config/rbac/base-permissions.ts` | Update seed permission data                 |
| Modify  | ~30 page files                        | Update `hasPermission()` calls to new codes |

---

## Task 1: Rewrite Backend Permission Codes

**Files:**

- Rewrite: `OpenSea-API/src/constants/rbac/permission-codes.ts`

The entire file (~1247 lines) is replaced with the new 238 codes organized by the 7 UI modules.

- [ ] **Step 1: Write the new permission codes file**

Structure:

```ts
export const PermissionCodes = {
  STOCK: {
    PRODUCTS: {
      ACCESS: 'stock.products.access' as const,
      REGISTER: 'stock.products.register' as const,
      MODIFY: 'stock.products.modify' as const,
      REMOVE: 'stock.products.remove' as const,
      IMPORT: 'stock.products.import' as const,
      EXPORT: 'stock.products.export' as const,
      PRINT: 'stock.products.print' as const,
      ADMIN: 'stock.products.admin' as const,
      ONLYSELF: 'stock.products.onlyself' as const,
    },
    // ... all stock resources
  },
  FINANCE: {
    /* ... */
  },
  HR: {
    /* ... */
  },
  SALES: {
    /* ... */
  },
  ADMIN: {
    USERS: { ACCESS, REGISTER, MODIFY, REMOVE, ADMIN },
    PERMISSION_GROUPS: { ACCESS, REGISTER, MODIFY, REMOVE, ADMIN },
    COMPANIES: { ACCESS, REGISTER, MODIFY, REMOVE, ADMIN },
    SESSIONS: { ACCESS, ADMIN },
    AUDIT: { ACCESS, EXPORT, ADMIN },
  },
  TOOLS: {
    EMAIL_ACCOUNTS: { ACCESS, REGISTER, MODIFY, REMOVE, ADMIN, SHARE },
    EMAIL_MESSAGES: { ACCESS, REGISTER, MODIFY, REMOVE, ONLYSELF },
    TASK_BOARDS: { ACCESS, REGISTER, MODIFY, REMOVE, SHARE },
    TASK_CARDS: { ACCESS, REGISTER, MODIFY, REMOVE, ADMIN, SHARE, ONLYSELF },
    CALENDAR: {
      ACCESS,
      REGISTER,
      MODIFY,
      REMOVE,
      EXPORT,
      ADMIN,
      SHARE,
      ONLYSELF,
    },
    STORAGE_FOLDERS: { ACCESS, REGISTER, MODIFY, REMOVE, ADMIN, SHARE },
    STORAGE_FILES: { ACCESS, REGISTER, MODIFY, REMOVE, ADMIN, SHARE },
  },
  SYSTEM: {
    LABEL_TEMPLATES: { ACCESS, REGISTER, MODIFY, REMOVE },
    NOTIFICATIONS: { ADMIN },
    SELF: { ACCESS, MODIFY, ADMIN },
  },
} as const;

export const DEFAULT_USER_PERMISSIONS: string[] = [
  // system.self
  PermissionCodes.SYSTEM.SELF.ACCESS,
  PermissionCodes.SYSTEM.SELF.MODIFY,
  PermissionCodes.SYSTEM.SELF.ADMIN,
  // system.label-templates
  PermissionCodes.SYSTEM.LABEL_TEMPLATES.ACCESS,
  // tools - email
  PermissionCodes.TOOLS.EMAIL_ACCOUNTS.ACCESS,
  PermissionCodes.TOOLS.EMAIL_MESSAGES.ACCESS,
  PermissionCodes.TOOLS.EMAIL_MESSAGES.REGISTER,
  PermissionCodes.TOOLS.EMAIL_MESSAGES.MODIFY,
  PermissionCodes.TOOLS.EMAIL_MESSAGES.REMOVE,
  PermissionCodes.TOOLS.EMAIL_MESSAGES.ONLYSELF,
  // tools - tasks
  PermissionCodes.TOOLS.TASK_BOARDS.ACCESS,
  PermissionCodes.TOOLS.TASK_CARDS.ACCESS,
  PermissionCodes.TOOLS.TASK_CARDS.REGISTER,
  PermissionCodes.TOOLS.TASK_CARDS.MODIFY,
  PermissionCodes.TOOLS.TASK_CARDS.REMOVE,
  PermissionCodes.TOOLS.TASK_CARDS.ONLYSELF,
  // tools - calendar
  PermissionCodes.TOOLS.CALENDAR.ACCESS,
  PermissionCodes.TOOLS.CALENDAR.REGISTER,
  PermissionCodes.TOOLS.CALENDAR.MODIFY,
  PermissionCodes.TOOLS.CALENDAR.REMOVE,
  PermissionCodes.TOOLS.CALENDAR.ONLYSELF,
  // tools - storage
  PermissionCodes.TOOLS.STORAGE_FOLDERS.ACCESS,
  PermissionCodes.TOOLS.STORAGE_FILES.ACCESS,
  PermissionCodes.TOOLS.STORAGE_FILES.REGISTER,
  PermissionCodes.TOOLS.STORAGE_FILES.MODIFY,
  PermissionCodes.TOOLS.STORAGE_FILES.REMOVE,
  PermissionCodes.TOOLS.STORAGE_FILES.ONLYSELF,
];

export function isValidPermissionCode(code: string): boolean {
  const parts = code.split('.');
  return parts.length === 3;
}
```

Complete list of all 238 codes — see frontend config at:
`OpenSea-APP/src/app/(dashboard)/(modules)/admin/(entities)/permission-groups/src/config/permission-matrix-config.ts`

Each resource in MATRIX_TABS generates codes: `{tab.id}.{backendResources[0].split('.')[1]}.{action}` for each action in `availableActions`.

- [ ] **Step 2: Verify it compiles**

Run: `cd OpenSea-API && npx tsc --noEmit 2>&1 | head -30`
Expected: Errors in controller files (they reference old codes) — that's OK, we fix those in Task 4.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add src/constants/rbac/permission-codes.ts
git commit -m "feat(rbac): rewrite permission codes — 238 new humanized codes replacing 721 legacy"
```

---

## Task 2: Create Migration Map

**Files:**

- Create: `OpenSea-API/src/constants/rbac/permission-migration-map.ts`

A `Record<string, string>` mapping old permission code → new permission code. Used by controllers update task and optionally by seed to migrate existing group permissions.

- [ ] **Step 1: Create the migration map**

Key mappings:

```ts
export const PERMISSION_MIGRATION_MAP: Record<string, string> = {
  // STOCK
  'stock.products.create': 'stock.products.register',
  'stock.products.read': 'stock.products.access',
  'stock.products.list': 'stock.products.access',
  'stock.products.update': 'stock.products.modify',
  'stock.products.delete': 'stock.products.remove',
  'stock.products.manage': 'stock.products.admin',
  // ... all old → new mappings
  // ADMIN (was core/rbac/audit)
  'core.users.create': 'admin.users.register',
  'core.users.read': 'admin.users.access',
  'core.users.list': 'admin.users.access',
  'core.users.update': 'admin.users.modify',
  'core.users.delete': 'admin.users.remove',
  'core.users.manage': 'admin.users.admin',
  'rbac.groups.create': 'admin.permission-groups.register',
  // ... etc
  // TOOLS (was calendar/email/storage/tasks)
  'calendar.events.create': 'tools.calendar.register',
  'email.accounts.create': 'tools.email-accounts.register',
  'tasks.boards.create': 'tools.task-boards.register',
  'storage.files.create': 'tools.storage-files.register',
  // ... etc
  // SYSTEM (was core.label-templates, self.*, notifications)
  'core.label-templates.create': 'system.label-templates.register',
  'notifications._root.manage': 'system.notifications.admin',
  // self.* → system.self.*
  // (self codes map to system.self.access/modify/admin)
};
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/rbac/permission-migration-map.ts
git commit -m "feat(rbac): add old→new permission migration map for controller remapping"
```

---

## Task 3: Update Seed

**Files:**

- Modify: `OpenSea-API/prisma/seed.ts`

The seed already handles creating/deleting permissions and assigning them to groups. The key changes:

1. `extractAllCodes(PermissionCodes)` still works (recursive leaf extraction)
2. `buildPermissionData(code)` still works (splits by `.` for module/resource/action)
3. `cleanupStalePermissions()` will delete all 721 old codes
4. Admin group gets ALL new codes (wildcard behavior unchanged)
5. User group gets `DEFAULT_USER_PERMISSIONS` (28 codes)

- [ ] **Step 1: Verify seed compiles with new codes**

The seed imports `PermissionCodes` and `DEFAULT_USER_PERMISSIONS` — both are updated in Task 1. The seed logic should work unchanged since it's generic.

Run: `cd OpenSea-API && npx tsc --noEmit 2>&1 | grep seed`

- [ ] **Step 2: Run seed locally to validate**

Run: `cd OpenSea-API && npx prisma db seed`
Expected: Creates 238 permissions, deletes 721 old ones, assigns all to Admin group, assigns 28 to User group.

- [ ] **Step 3: Commit if any seed changes were needed**

---

## Task 4: Remap Backend Controllers

**Files:**

- Modify: ~80 controller route files across all modules

This is the largest task. Every `createPermissionMiddleware({ permissionCode: PermissionCodes.XXX })` call needs to reference the new code.

**Strategy:** Use the migration map as a reference. For each controller module:

1. **stock/** controllers → `PermissionCodes.STOCK.*`
   - Products, Variants, Templates, Categories, Manufacturers, Items, Purchase Orders, Volumes, Warehouses
   - Consolidate: zones/bins/locations controllers → `STOCK.WAREHOUSES.ADMIN`
   - Consolidate: product-attachments/care-instructions → `STOCK.PRODUCTS.ADMIN`
   - Consolidate: variant-attachments → `STOCK.VARIANTS.ADMIN`
   - Consolidate: movements → `STOCK.ITEMS.ACCESS`
   - Consolidate: tags → `STOCK.PRODUCTS.ADMIN` (or remove)

2. **finance/** controllers → `PermissionCodes.FINANCE.*`
   - Entries, Categories, Bank Accounts, Cost Centers, Contracts, Loans, Consortia, Recurring
   - Consolidate: attachments → `FINANCE.ENTRIES.ADMIN`
   - Consolidate: dashboard → `FINANCE.ENTRIES.ACCESS`
   - Consolidate: export → `FINANCE.ENTRIES.EXPORT`
   - Consolidate: companies → `FINANCE.ENTRIES.ACCESS`

3. **hr/** controllers → `PermissionCodes.HR.*`
   - Employees, Departments, Positions, Work Schedules, Vacations, Absences
   - Consolidate: payrolls/bonuses/deductions/fiscal-settings/stakeholders → `HR.PAYROLL.*`
   - Consolidate: time-entries/time-control/time-bank/overtime → `HR.TIME_CONTROL.*`
   - Consolidate: vacation-periods → `HR.VACATIONS.*`

4. **sales/** controllers → `PermissionCodes.SALES.*`
   - Customers, Orders, Promotions
   - Consolidate: reservations/comments → `SALES.ORDERS.*`

5. **core/users/** → `PermissionCodes.ADMIN.USERS.*`
6. **core/sessions/** → `PermissionCodes.ADMIN.SESSIONS.*`
7. **core/teams/** → `PermissionCodes.ADMIN.USERS.ADMIN`
8. **core/label-templates/** → `PermissionCodes.SYSTEM.LABEL_TEMPLATES.*`
9. **rbac/** → `PermissionCodes.ADMIN.PERMISSION_GROUPS.*`
10. **audit/** → `PermissionCodes.ADMIN.AUDIT.*`
11. **calendar/** → `PermissionCodes.TOOLS.CALENDAR.*`
12. **email/** (if exists) → `PermissionCodes.TOOLS.EMAIL_ACCOUNTS.*` / `TOOLS.EMAIL_MESSAGES.*`
13. **storage/** → `PermissionCodes.TOOLS.STORAGE_FILES.*` / `TOOLS.STORAGE_FOLDERS.*`
14. **tasks/** → `PermissionCodes.TOOLS.TASK_BOARDS.*` / `TOOLS.TASK_CARDS.*`
15. **notifications/** → `PermissionCodes.SYSTEM.NOTIFICATIONS.ADMIN`
16. **requests/** → Remove or remap

- [ ] **Step 1-15: Update each module's controllers** (one commit per module)

For each controller file:

- Find `createPermissionMiddleware({ permissionCode: PermissionCodes.OLD.PATH })`
- Replace with `createPermissionMiddleware({ permissionCode: PermissionCodes.NEW.PATH })`
- Action mapping: `create→register`, `read/list→access`, `update→modify`, `delete→remove`, `manage→admin`

- [ ] **Step 16: Verify all controllers compile**

Run: `cd OpenSea-API && npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 17: Run tests**

Run: `cd OpenSea-API && npm test 2>&1 | tail -20`

- [ ] **Step 18: Commit**

```bash
git add src/http/controllers/
git commit -m "feat(rbac): remap all controller permissions to new codes"
```

---

## Task 5: Update Frontend Permission Codes

**Files:**

- Rewrite: `OpenSea-APP/src/config/rbac/permission-codes.ts`
- Modify: `OpenSea-APP/src/config/rbac/base-groups.ts`
- Modify: `OpenSea-APP/src/config/rbac/base-permissions.ts`

- [ ] **Step 1: Rewrite permission-codes.ts**

Replace all module exports with new structure:

```ts
export const STOCK_PERMISSIONS = {
  PRODUCTS: {
    ACCESS: 'stock.products.access',
    REGISTER: 'stock.products.register',
    MODIFY: 'stock.products.modify',
    REMOVE: 'stock.products.remove',
    IMPORT: 'stock.products.import',
    EXPORT: 'stock.products.export',
    PRINT: 'stock.products.print',
    ADMIN: 'stock.products.admin',
    ONLYSELF: 'stock.products.onlyself',
  },
  // ...
};

export const ADMIN_PERMISSIONS = {
  USERS: { ACCESS, REGISTER, MODIFY, REMOVE, ADMIN },
  PERMISSION_GROUPS: { ACCESS, REGISTER, MODIFY, REMOVE, ADMIN },
  // ...
};

export const TOOLS_PERMISSIONS = { ... };
export const SYSTEM_PERMISSIONS = { ... };
// etc.
```

- [ ] **Step 2: Update base-groups.ts with new codes**
- [ ] **Step 3: Update base-permissions.ts with new codes**
- [ ] **Step 4: Compile check**

Run: `cd OpenSea-APP && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 5: Commit**

```bash
git add src/config/rbac/
git commit -m "feat(rbac): rewrite frontend permission constants to match new backend codes"
```

---

## Task 6: Update Frontend Permission Checks

**Files:**

- Modify: ~30 page/component files that call `hasPermission()`

- [ ] **Step 1: Find all permission check usages**

```bash
grep -r "hasPermission\|PERMISSIONS\." src/app/ src/components/ --include="*.tsx" -l
```

- [ ] **Step 2-N: Update each file**

For each file:

- Find `hasPermission(STOCK_PERMISSIONS.PRODUCTS.CREATE)` → `hasPermission(STOCK_PERMISSIONS.PRODUCTS.REGISTER)`
- Find `hasPermission(RBAC_PERMISSIONS.GROUPS.LIST)` → `hasPermission(ADMIN_PERMISSIONS.PERMISSION_GROUPS.ACCESS)`
- etc.

Also update the per-module `admin-permissions.ts` constant files (e.g., `admin/_shared/constants/admin-permissions.ts`).

- [ ] **Step 3: Compile check**

Run: `cd OpenSea-APP && npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/ src/components/
git commit -m "feat(rbac): update all frontend permission checks to new codes"
```

---

## Task 7: Integration Verification

- [ ] **Step 1: Run backend seed**

```bash
cd OpenSea-API && npx prisma db seed
```

Verify: 238 permissions created, old ones cleaned up.

- [ ] **Step 2: Run backend tests**

```bash
cd OpenSea-API && npm test
```

- [ ] **Step 3: Start both servers and verify**

1. Login as admin → should have full access
2. Login as user → should only have tools + system.self access
3. Open permission matrix modal → verify all 238 permissions show correctly in 7 tabs
4. Toggle permissions → save → verify they persist
5. Check that module pages respect permissions (navigate to /stock → access denied if no stock permissions)

- [ ] **Step 4: Final commit if any fixes needed**

---

## Summary

| Task | Description                           | Scope              |
| ---- | ------------------------------------- | ------------------ |
| 1    | Rewrite backend permission-codes.ts   | 1 file, ~300 lines |
| 2    | Create migration map                  | 1 new file         |
| 3    | Update/verify seed                    | Minimal changes    |
| 4    | Remap ~80 backend controllers         | Largest task       |
| 5    | Rewrite frontend permission constants | 3 files            |
| 6    | Update ~30 frontend permission checks | Medium task        |
| 7    | Integration verification              | Testing            |

Total new permissions: **238** (down from 721, reduction of 67%)
