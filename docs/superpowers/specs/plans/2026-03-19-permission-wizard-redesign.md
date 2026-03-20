# Permission Wizard Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the permission management UI from a tree-based modal to a matrix-style modal with vertical module tabs, and restructure all ~721 permissions down to ~234 across 7 tabs.

**Architecture:** Replace the existing `ManagePermissionsModal` (tree/collapsible UI) with a new `ManagePermissionsMatrix` component using a tabbed sidebar + checkbox grid. Backend permission codes are restructured into 7 modules (`stock`, `finance`, `hr`, `sales`, `admin`, `tools`, `system`) with 8 standardized actions. A migration script maps old codes to new codes for existing group assignments.

**Tech Stack:** TypeScript, Fastify (backend), Next.js 16 / React 19 (frontend), Prisma, TailwindCSS 4, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-19-permission-wizard-redesign.md`

---

## Phase 1: Backend — New Permission Codes

### Task 1.1: Create new permission-codes structure

**Files:**

- Modify: `OpenSea-API/src/constants/rbac/permission-codes.ts`

This is the central file. We rewrite the entire `PermissionCodes` object with the new 7-module structure while keeping the old one temporarily for backward compatibility.

- [ ] **Step 1: Read current file thoroughly**

Read `OpenSea-API/src/constants/rbac/permission-codes.ts` (1247 lines). Understand the nested object structure, `extractAllCodes()`, `DEFAULT_USER_PERMISSIONS`, type exports.

- [ ] **Step 2: Create the new `NewPermissionCodes` object**

Add a new export `NewPermissionCodes` below the existing `PermissionCodes`. Structure it with 7 top-level keys matching the spec:

```typescript
export const NewPermissionCodes = {
  STOCK: {
    WAREHOUSES: {
      CREATE: 'stock.warehouses.create',
      UPDATE: 'stock.warehouses.update',
      DELETE: 'stock.warehouses.delete',
      LIST: 'stock.warehouses.list',
      READ: 'stock.warehouses.read',
      MANAGE: 'stock.warehouses.manage',
    },
    CATEGORIES: {
      CREATE: 'stock.categories.create',
      UPDATE: 'stock.categories.update',
      DELETE: 'stock.categories.delete',
      EXPORT: 'stock.categories.export',
      IMPORT: 'stock.categories.import',
      LIST: 'stock.categories.list',
      READ: 'stock.categories.read',
    },
    MANUFACTURERS: {
      CREATE: 'stock.manufacturers.create',
      UPDATE: 'stock.manufacturers.update',
      DELETE: 'stock.manufacturers.delete',
      EXPORT: 'stock.manufacturers.export',
      IMPORT: 'stock.manufacturers.import',
      LIST: 'stock.manufacturers.list',
      READ: 'stock.manufacturers.read',
    },
    ITEMS: {
      EXPORT: 'stock.items.export',
      LIST: 'stock.items.list',
      READ: 'stock.items.read',
      MANAGE: 'stock.items.manage',
    },
    PURCHASE_ORDERS: {
      CREATE: 'stock.purchase-orders.create',
      UPDATE: 'stock.purchase-orders.update',
      DELETE: 'stock.purchase-orders.delete',
      EXPORT: 'stock.purchase-orders.export',
      MANAGE: 'stock.purchase-orders.manage',
      LIST: 'stock.purchase-orders.list',
      READ: 'stock.purchase-orders.read',
    },
    PRODUCTS: {
      CREATE: 'stock.products.create',
      UPDATE: 'stock.products.update',
      DELETE: 'stock.products.delete',
      EXPORT: 'stock.products.export',
      MANAGE: 'stock.products.manage',
      IMPORT: 'stock.products.import',
      LIST: 'stock.products.list',
      READ: 'stock.products.read',
    },
    TEMPLATES: {
      CREATE: 'stock.templates.create',
      UPDATE: 'stock.templates.update',
      DELETE: 'stock.templates.delete',
      LIST: 'stock.templates.list',
      READ: 'stock.templates.read',
    },
    VARIANTS: {
      CREATE: 'stock.variants.create',
      UPDATE: 'stock.variants.update',
      DELETE: 'stock.variants.delete',
      EXPORT: 'stock.variants.export',
      MANAGE: 'stock.variants.manage',
      IMPORT: 'stock.variants.import',
      LIST: 'stock.variants.list',
      READ: 'stock.variants.read',
    },
    VOLUMES: {
      CREATE: 'stock.volumes.create',
      UPDATE: 'stock.volumes.update',
      DELETE: 'stock.volumes.delete',
      EXPORT: 'stock.volumes.export',
      MANAGE: 'stock.volumes.manage',
      LIST: 'stock.volumes.list',
      READ: 'stock.volumes.read',
    },
  },
  FINANCE: {
    CATEGORIES: {
      CREATE: 'finance.categories.create',
      UPDATE: 'finance.categories.update',
      DELETE: 'finance.categories.delete',
      LIST: 'finance.categories.list',
      READ: 'finance.categories.read',
    },
    COST_CENTERS: {
      CREATE: 'finance.cost-centers.create',
      UPDATE: 'finance.cost-centers.update',
      DELETE: 'finance.cost-centers.delete',
      LIST: 'finance.cost-centers.list',
      READ: 'finance.cost-centers.read',
    },
    CONSORTIA: {
      CREATE: 'finance.consortia.create',
      UPDATE: 'finance.consortia.update',
      DELETE: 'finance.consortia.delete',
      EXPORT: 'finance.consortia.export',
      MANAGE: 'finance.consortia.manage',
      LIST: 'finance.consortia.list',
      READ: 'finance.consortia.read',
    },
    BANK_ACCOUNTS: {
      CREATE: 'finance.bank-accounts.create',
      UPDATE: 'finance.bank-accounts.update',
      DELETE: 'finance.bank-accounts.delete',
      LIST: 'finance.bank-accounts.list',
      READ: 'finance.bank-accounts.read',
    },
    CONTRACTS: {
      CREATE: 'finance.contracts.create',
      UPDATE: 'finance.contracts.update',
      DELETE: 'finance.contracts.delete',
      EXPORT: 'finance.contracts.export',
      LIST: 'finance.contracts.list',
      READ: 'finance.contracts.read',
    },
    LOANS: {
      CREATE: 'finance.loans.create',
      UPDATE: 'finance.loans.update',
      DELETE: 'finance.loans.delete',
      EXPORT: 'finance.loans.export',
      MANAGE: 'finance.loans.manage',
      LIST: 'finance.loans.list',
      READ: 'finance.loans.read',
    },
    SUPPLIERS: {
      CREATE: 'finance.suppliers.create',
      UPDATE: 'finance.suppliers.update',
      DELETE: 'finance.suppliers.delete',
      EXPORT: 'finance.suppliers.export',
      IMPORT: 'finance.suppliers.import',
      LIST: 'finance.suppliers.list',
      READ: 'finance.suppliers.read',
    },
    ENTRIES: {
      CREATE: 'finance.entries.create',
      UPDATE: 'finance.entries.update',
      DELETE: 'finance.entries.delete',
      EXPORT: 'finance.entries.export',
      MANAGE: 'finance.entries.manage',
      IMPORT: 'finance.entries.import',
      LIST: 'finance.entries.list',
      READ: 'finance.entries.read',
    },
    RECURRING: {
      CREATE: 'finance.recurring.create',
      UPDATE: 'finance.recurring.update',
      MANAGE: 'finance.recurring.manage',
      LIST: 'finance.recurring.list',
      READ: 'finance.recurring.read',
    },
  },
  HR: {
    ABSENCES: {
      CREATE: 'hr.absences.create',
      UPDATE: 'hr.absences.update',
      DELETE: 'hr.absences.delete',
      MANAGE: 'hr.absences.manage',
      LIST: 'hr.absences.list',
      READ: 'hr.absences.read',
    },
    POSITIONS: {
      CREATE: 'hr.positions.create',
      UPDATE: 'hr.positions.update',
      DELETE: 'hr.positions.delete',
      LIST: 'hr.positions.list',
      READ: 'hr.positions.read',
    },
    EMPLOYEES: {
      CREATE: 'hr.employees.create',
      UPDATE: 'hr.employees.update',
      DELETE: 'hr.employees.delete',
      EXPORT: 'hr.employees.export',
      MANAGE: 'hr.employees.manage',
      IMPORT: 'hr.employees.import',
      LIST: 'hr.employees.list',
      READ: 'hr.employees.read',
    },
    DEPARTMENTS: {
      CREATE: 'hr.departments.create',
      UPDATE: 'hr.departments.update',
      DELETE: 'hr.departments.delete',
      LIST: 'hr.departments.list',
      READ: 'hr.departments.read',
    },
    WORK_SCHEDULES: {
      CREATE: 'hr.work-schedules.create',
      UPDATE: 'hr.work-schedules.update',
      DELETE: 'hr.work-schedules.delete',
      LIST: 'hr.work-schedules.list',
      READ: 'hr.work-schedules.read',
    },
    VACATIONS: {
      CREATE: 'hr.vacations.create',
      UPDATE: 'hr.vacations.update',
      MANAGE: 'hr.vacations.manage',
      LIST: 'hr.vacations.list',
      READ: 'hr.vacations.read',
    },
    PAYROLL: {
      CREATE: 'hr.payroll.create',
      EXPORT: 'hr.payroll.export',
      MANAGE: 'hr.payroll.manage',
      LIST: 'hr.payroll.list',
      READ: 'hr.payroll.read',
    },
    TIME_CONTROL: {
      CREATE: 'hr.time-control.create',
      EXPORT: 'hr.time-control.export',
      LIST: 'hr.time-control.list',
      READ: 'hr.time-control.read',
    },
  },
  SALES: {
    CUSTOMERS: {
      CREATE: 'sales.customers.create',
      UPDATE: 'sales.customers.update',
      DELETE: 'sales.customers.delete',
      EXPORT: 'sales.customers.export',
      IMPORT: 'sales.customers.import',
      LIST: 'sales.customers.list',
      READ: 'sales.customers.read',
    },
    ORDERS: {
      CREATE: 'sales.orders.create',
      UPDATE: 'sales.orders.update',
      DELETE: 'sales.orders.delete',
      EXPORT: 'sales.orders.export',
      MANAGE: 'sales.orders.manage',
      LIST: 'sales.orders.list',
      READ: 'sales.orders.read',
    },
    PROMOTIONS: {
      CREATE: 'sales.promotions.create',
      UPDATE: 'sales.promotions.update',
      DELETE: 'sales.promotions.delete',
      LIST: 'sales.promotions.list',
      READ: 'sales.promotions.read',
    },
  },
  ADMIN: {
    AUDIT_LOGS: {
      LIST: 'admin.audit-logs.list',
      READ: 'admin.audit-logs.read',
      MANAGE: 'admin.audit-logs.manage',
    },
    COMPANIES: {
      CREATE: 'admin.companies.create',
      UPDATE: 'admin.companies.update',
      DELETE: 'admin.companies.delete',
      MANAGE: 'admin.companies.manage',
      LIST: 'admin.companies.list',
      READ: 'admin.companies.read',
    },
    PERMISSION_GROUPS: {
      CREATE: 'admin.permission-groups.create',
      UPDATE: 'admin.permission-groups.update',
      DELETE: 'admin.permission-groups.delete',
      MANAGE: 'admin.permission-groups.manage',
      LIST: 'admin.permission-groups.list',
      READ: 'admin.permission-groups.read',
    },
    SESSIONS: {
      LIST: 'admin.sessions.list',
      READ: 'admin.sessions.read',
      MANAGE: 'admin.sessions.manage',
    },
    USERS: {
      CREATE: 'admin.users.create',
      UPDATE: 'admin.users.update',
      DELETE: 'admin.users.delete',
      MANAGE: 'admin.users.manage',
      LIST: 'admin.users.list',
      READ: 'admin.users.read',
    },
  },
  TOOLS: {
    CALENDAR_EVENTS: {
      CREATE: 'tools.calendar-events.create',
      UPDATE: 'tools.calendar-events.update',
      DELETE: 'tools.calendar-events.delete',
      EXPORT: 'tools.calendar-events.export',
      MANAGE: 'tools.calendar-events.manage',
      LIST: 'tools.calendar-events.list',
      READ: 'tools.calendar-events.read',
    },
    STORAGE_FILES: {
      CREATE: 'tools.storage-files.create',
      UPDATE: 'tools.storage-files.update',
      DELETE: 'tools.storage-files.delete',
      MANAGE: 'tools.storage-files.manage',
      LIST: 'tools.storage-files.list',
      READ: 'tools.storage-files.read',
    },
    STORAGE_FOLDERS: {
      CREATE: 'tools.storage-folders.create',
      UPDATE: 'tools.storage-folders.update',
      DELETE: 'tools.storage-folders.delete',
      MANAGE: 'tools.storage-folders.manage',
      LIST: 'tools.storage-folders.list',
      READ: 'tools.storage-folders.read',
    },
    EMAIL_ACCOUNTS: {
      CREATE: 'tools.email-accounts.create',
      UPDATE: 'tools.email-accounts.update',
      DELETE: 'tools.email-accounts.delete',
      MANAGE: 'tools.email-accounts.manage',
      LIST: 'tools.email-accounts.list',
      READ: 'tools.email-accounts.read',
    },
    EMAIL_MESSAGES: {
      CREATE: 'tools.email-messages.create',
      UPDATE: 'tools.email-messages.update',
      DELETE: 'tools.email-messages.delete',
      LIST: 'tools.email-messages.list',
      READ: 'tools.email-messages.read',
    },
    TASK_CARDS: {
      CREATE: 'tools.task-cards.create',
      UPDATE: 'tools.task-cards.update',
      DELETE: 'tools.task-cards.delete',
      MANAGE: 'tools.task-cards.manage',
      LIST: 'tools.task-cards.list',
      READ: 'tools.task-cards.read',
    },
    TASK_BOARDS: {
      CREATE: 'tools.task-boards.create',
      UPDATE: 'tools.task-boards.update',
      DELETE: 'tools.task-boards.delete',
      LIST: 'tools.task-boards.list',
      READ: 'tools.task-boards.read',
    },
  },
  SYSTEM: {
    LABEL_TEMPLATES: {
      CREATE: 'system.label-templates.create',
      UPDATE: 'system.label-templates.update',
      DELETE: 'system.label-templates.delete',
      LIST: 'system.label-templates.list',
      READ: 'system.label-templates.read',
    },
    NOTIFICATIONS: {
      MANAGE: 'system.notifications.manage',
    },
    SELF: {
      READ: 'system.self.read',
      UPDATE: 'system.self.update',
      MANAGE: 'system.self.manage',
    },
  },
} as const;
```

Follow the exact permission codes listed in the spec for each module. Use the column→code mapping: Criar=create, Editar=update, Excluir=delete, Exportar=export, Gerenciar=manage, Importar=import, Listar=list, Ver=read.

- [ ] **Step 3: Create the old→new migration map**

Add an exported constant `PERMISSION_MIGRATION_MAP` that maps every old code to its new equivalent:

```typescript
export const PERMISSION_MIGRATION_MAP: Record<string, string> = {
  // Stock consolidations
  'stock.zones.create': 'stock.warehouses.manage',
  'stock.zones.read': 'stock.warehouses.manage',
  'stock.zones.update': 'stock.warehouses.manage',
  'stock.zones.delete': 'stock.warehouses.manage',
  'stock.zones.list': 'stock.warehouses.manage',
  'stock.zones.configure': 'stock.warehouses.manage',
  'stock.zones.manage': 'stock.warehouses.manage',
  'stock.bins.read': 'stock.warehouses.manage',
  'stock.bins.update': 'stock.warehouses.manage',
  'stock.bins.list': 'stock.warehouses.manage',
  'stock.bins.search': 'stock.warehouses.manage',
  'stock.bins.manage': 'stock.warehouses.manage',
  'stock.locations.create': 'stock.warehouses.manage',
  'stock.locations.read': 'stock.warehouses.manage',
  'stock.locations.update': 'stock.warehouses.manage',
  'stock.locations.delete': 'stock.warehouses.manage',
  'stock.locations.list': 'stock.warehouses.manage',
  'stock.locations.manage': 'stock.warehouses.manage',
  'stock.product-attachments.create': 'stock.products.manage',
  'stock.product-attachments.read': 'stock.products.manage',
  'stock.product-attachments.delete': 'stock.products.manage',
  'stock.variant-attachments.create': 'stock.variants.manage',
  'stock.variant-attachments.read': 'stock.variants.manage',
  'stock.variant-attachments.delete': 'stock.variants.manage',
  'stock.product-care-instructions.create': 'stock.products.manage',
  'stock.product-care-instructions.read': 'stock.products.read',
  'stock.product-care-instructions.delete': 'stock.products.manage',
  'stock.movements.create': 'stock.items.manage',
  'stock.movements.read': 'stock.items.list',
  'stock.movements.list': 'stock.items.list',
  'stock.movements.approve': 'stock.items.manage',
  'stock.items.entry': 'stock.items.manage',
  'stock.items.exit': 'stock.items.manage',
  'stock.items.transfer': 'stock.items.manage',
  'stock.care.read': 'stock.products.read',
  'stock.care.list': 'stock.products.read',
  'stock.care.set': 'stock.products.manage',
  'stock.tags.create': null, // removed
  'stock.tags.read': null,
  'stock.tags.update': null,
  'stock.tags.delete': null,
  'stock.tags.list': null,
  'stock.tags.manage': null,
  'stock.suppliers.create': 'finance.suppliers.create',
  'stock.suppliers.read': 'finance.suppliers.read',
  'stock.suppliers.update': 'finance.suppliers.update',
  'stock.suppliers.delete': 'finance.suppliers.delete',
  'stock.suppliers.list': 'finance.suppliers.list',
  'stock.suppliers.manage': null, // finance.suppliers has no manage action
  // Stock direct renames (same action, same resource)
  'stock.products.create': 'stock.products.create',
  'stock.products.read': 'stock.products.read',
  'stock.products.update': 'stock.products.update',
  'stock.products.delete': 'stock.products.delete',
  'stock.products.list': 'stock.products.list',
  'stock.products.request': 'stock.products.manage',
  'stock.products.approve': 'stock.products.manage',
  'stock.products.manage': 'stock.products.manage',
  // Finance renames (direct)
  'finance.entries.create': 'finance.entries.create',
  'finance.entries.read': 'finance.entries.read',
  'finance.entries.update': 'finance.entries.update',
  'finance.entries.delete': 'finance.entries.delete',
  'finance.entries.list': 'finance.entries.list',
  'finance.entries.pay': 'finance.entries.manage',
  'finance.entries.cancel': 'finance.entries.manage',
  'finance.entries.manage': 'finance.entries.manage',
  'finance.attachments.create': 'finance.entries.manage',
  'finance.attachments.read': 'finance.entries.read',
  'finance.attachments.delete': 'finance.entries.manage',
  'finance.attachments.list': 'finance.entries.list',
  'finance.categories.create': 'finance.categories.create',
  'finance.categories.read': 'finance.categories.read',
  'finance.categories.update': 'finance.categories.update',
  'finance.categories.delete': 'finance.categories.delete',
  'finance.categories.list': 'finance.categories.list',
  'finance.categories.manage': null,
  'finance.cost-centers.create': 'finance.cost-centers.create',
  'finance.cost-centers.read': 'finance.cost-centers.read',
  'finance.cost-centers.update': 'finance.cost-centers.update',
  'finance.cost-centers.delete': 'finance.cost-centers.delete',
  'finance.cost-centers.list': 'finance.cost-centers.list',
  'finance.cost-centers.manage': null,
  'finance.bank-accounts.create': 'finance.bank-accounts.create',
  'finance.bank-accounts.read': 'finance.bank-accounts.read',
  'finance.bank-accounts.update': 'finance.bank-accounts.update',
  'finance.bank-accounts.delete': 'finance.bank-accounts.delete',
  'finance.bank-accounts.list': 'finance.bank-accounts.list',
  'finance.bank-accounts.manage': null,
  'finance.loans.create': 'finance.loans.create',
  'finance.loans.read': 'finance.loans.read',
  'finance.loans.update': 'finance.loans.update',
  'finance.loans.delete': 'finance.loans.delete',
  'finance.loans.list': 'finance.loans.list',
  'finance.loans.pay': 'finance.loans.manage',
  'finance.loans.manage': 'finance.loans.manage',
  'finance.consortia.create': 'finance.consortia.create',
  'finance.consortia.read': 'finance.consortia.read',
  'finance.consortia.update': 'finance.consortia.update',
  'finance.consortia.delete': 'finance.consortia.delete',
  'finance.consortia.list': 'finance.consortia.list',
  'finance.consortia.pay': 'finance.consortia.manage',
  'finance.consortia.manage': 'finance.consortia.manage',
  'finance.contracts.create': 'finance.contracts.create',
  'finance.contracts.read': 'finance.contracts.read',
  'finance.contracts.update': 'finance.contracts.update',
  'finance.contracts.delete': 'finance.contracts.delete',
  'finance.contracts.list': 'finance.contracts.list',
  'finance.contracts.manage': null,
  'finance.recurring.create': 'finance.recurring.create',
  'finance.recurring.read': 'finance.recurring.read',
  'finance.recurring.update': 'finance.recurring.update',
  'finance.recurring.delete': null,
  'finance.recurring.list': 'finance.recurring.list',
  'finance.recurring.manage': 'finance.recurring.manage',
  'finance.dashboard.view': 'finance.entries.read',
  'finance.export.generate': 'finance.entries.export',
  'finance.companies.read': 'finance.entries.read',
  // HR renames
  'hr.employees.create': 'hr.employees.create',
  'hr.employees.read': 'hr.employees.read',
  'hr.employees.read.all': 'hr.employees.read',
  'hr.employees.read.team': 'hr.employees.read',
  'hr.employees.update': 'hr.employees.update',
  'hr.employees.update.all': 'hr.employees.update',
  'hr.employees.update.team': 'hr.employees.update',
  'hr.employees.delete': 'hr.employees.delete',
  'hr.employees.list': 'hr.employees.list',
  'hr.employees.list.all': 'hr.employees.list',
  'hr.employees.list.team': 'hr.employees.list',
  'hr.employees.terminate': 'hr.employees.manage',
  'hr.employees.manage': 'hr.employees.manage',
  'hr.departments.create': 'hr.departments.create',
  'hr.departments.read': 'hr.departments.read',
  'hr.departments.update': 'hr.departments.update',
  'hr.departments.delete': 'hr.departments.delete',
  'hr.departments.list': 'hr.departments.list',
  'hr.departments.manage': null,
  'hr.positions.create': 'hr.positions.create',
  'hr.positions.read': 'hr.positions.read',
  'hr.positions.update': 'hr.positions.update',
  'hr.positions.delete': 'hr.positions.delete',
  'hr.positions.list': 'hr.positions.list',
  'hr.positions.manage': null,
  'hr.time-entries.create': 'hr.time-control.create',
  'hr.time-entries.read': 'hr.time-control.read',
  'hr.time-entries.read.all': 'hr.time-control.read',
  'hr.time-entries.read.team': 'hr.time-control.read',
  'hr.time-entries.update': 'hr.time-control.create',
  'hr.time-entries.update.all': 'hr.time-control.create',
  'hr.time-entries.update.team': 'hr.time-control.create',
  'hr.time-entries.delete': null,
  'hr.time-entries.list': 'hr.time-control.list',
  'hr.time-entries.list.all': 'hr.time-control.list',
  'hr.time-entries.list.team': 'hr.time-control.list',
  'hr.time-entries.approve': 'hr.time-control.create',
  'hr.time-entries.approve.all': 'hr.time-control.create',
  'hr.time-entries.approve.team': 'hr.time-control.create',
  'hr.time-entries.manage': 'hr.time-control.create',
  'hr.vacations.create': 'hr.vacations.create',
  'hr.vacations.read': 'hr.vacations.read',
  'hr.vacations.read.all': 'hr.vacations.read',
  'hr.vacations.read.team': 'hr.vacations.read',
  'hr.vacations.update': 'hr.vacations.update',
  'hr.vacations.delete': null,
  'hr.vacations.list': 'hr.vacations.list',
  'hr.vacations.list.all': 'hr.vacations.list',
  'hr.vacations.list.team': 'hr.vacations.list',
  'hr.vacations.approve': 'hr.vacations.manage',
  'hr.vacations.approve.all': 'hr.vacations.manage',
  'hr.vacations.approve.team': 'hr.vacations.manage',
  'hr.vacations.manage': 'hr.vacations.manage',
  'hr.absences.create': 'hr.absences.create',
  'hr.absences.read': 'hr.absences.read',
  'hr.absences.read.all': 'hr.absences.read',
  'hr.absences.read.team': 'hr.absences.read',
  'hr.absences.update': 'hr.absences.update',
  'hr.absences.delete': 'hr.absences.delete',
  'hr.absences.list': 'hr.absences.list',
  'hr.absences.list.all': 'hr.absences.list',
  'hr.absences.list.team': 'hr.absences.list',
  'hr.absences.approve': 'hr.absences.manage',
  'hr.absences.approve.all': 'hr.absences.manage',
  'hr.absences.approve.team': 'hr.absences.manage',
  'hr.absences.manage': 'hr.absences.manage',
  'hr.overtime.create': 'hr.time-control.create',
  'hr.overtime.read': 'hr.time-control.read',
  'hr.overtime.read.all': 'hr.time-control.read',
  'hr.overtime.read.team': 'hr.time-control.read',
  'hr.overtime.update': 'hr.time-control.create',
  'hr.overtime.delete': null,
  'hr.overtime.list': 'hr.time-control.list',
  'hr.overtime.list.all': 'hr.time-control.list',
  'hr.overtime.list.team': 'hr.time-control.list',
  'hr.overtime.approve': 'hr.time-control.create',
  'hr.overtime.approve.all': 'hr.time-control.create',
  'hr.overtime.approve.team': 'hr.time-control.create',
  'hr.overtime.manage': 'hr.time-control.create',
  'hr.payroll.create': 'hr.payroll.create',
  'hr.payroll.read': 'hr.payroll.read',
  'hr.payroll.update': 'hr.payroll.manage',
  'hr.payroll.delete': null,
  'hr.payroll.list': 'hr.payroll.list',
  'hr.payroll.manage': 'hr.payroll.manage',
  'hr.bonuses.create': 'hr.payroll.manage',
  'hr.bonuses.read': 'hr.payroll.read',
  'hr.bonuses.update': 'hr.payroll.manage',
  'hr.bonuses.delete': 'hr.payroll.manage',
  'hr.bonuses.list': 'hr.payroll.list',
  'hr.bonuses.manage': 'hr.payroll.manage',
  'hr.deductions.create': 'hr.payroll.manage',
  'hr.deductions.read': 'hr.payroll.read',
  'hr.deductions.update': 'hr.payroll.manage',
  'hr.deductions.delete': 'hr.payroll.manage',
  'hr.deductions.list': 'hr.payroll.list',
  'hr.deductions.manage': 'hr.payroll.manage',
  'hr.time-bank.create': 'hr.time-control.create',
  'hr.time-bank.read': 'hr.time-control.read',
  'hr.time-bank.read.all': 'hr.time-control.read',
  'hr.time-bank.read.team': 'hr.time-control.read',
  'hr.time-bank.update': 'hr.time-control.create',
  'hr.time-bank.delete': null,
  'hr.time-bank.list': 'hr.time-control.list',
  'hr.time-bank.list.all': 'hr.time-control.list',
  'hr.time-bank.list.team': 'hr.time-control.list',
  'hr.time-bank.manage': 'hr.time-control.create',
  'hr.work-schedules.create': 'hr.work-schedules.create',
  'hr.work-schedules.read': 'hr.work-schedules.read',
  'hr.work-schedules.update': 'hr.work-schedules.update',
  'hr.work-schedules.delete': 'hr.work-schedules.delete',
  'hr.work-schedules.list': 'hr.work-schedules.list',
  'hr.work-schedules.manage': null,
  'hr.fiscal-settings.create': 'hr.payroll.manage',
  'hr.fiscal-settings.read': 'hr.payroll.read',
  'hr.fiscal-settings.update': 'hr.payroll.manage',
  'hr.fiscal-settings.delete': 'hr.payroll.manage',
  'hr.fiscal-settings.manage': 'hr.payroll.manage',
  'hr.stakeholders.create': 'hr.payroll.manage',
  'hr.stakeholders.read': 'hr.payroll.read',
  'hr.stakeholders.update': 'hr.payroll.manage',
  'hr.stakeholders.delete': 'hr.payroll.manage',
  'hr.stakeholders.list': 'hr.payroll.list',
  'hr.stakeholders.manage': 'hr.payroll.manage',
  'hr.payrolls.create': 'hr.payroll.create',
  'hr.payrolls.read': 'hr.payroll.read',
  'hr.payrolls.update': 'hr.payroll.manage',
  'hr.payrolls.delete': null,
  'hr.payrolls.list': 'hr.payroll.list',
  'hr.payrolls.manage': 'hr.payroll.manage',
  'hr.time-control.create': 'hr.time-control.create',
  'hr.time-control.read': 'hr.time-control.read',
  'hr.time-control.update': 'hr.time-control.create',
  'hr.time-control.delete': null,
  'hr.time-control.list': 'hr.time-control.list',
  'hr.time-control.manage': 'hr.time-control.create',
  'hr.vacation-periods.create': 'hr.vacations.create',
  'hr.vacation-periods.read': 'hr.vacations.read',
  'hr.vacation-periods.update': 'hr.vacations.update',
  'hr.vacation-periods.delete': null,
  'hr.vacation-periods.list': 'hr.vacations.list',
  'hr.vacation-periods.manage': 'hr.vacations.manage',
  'hr.companies.read': 'hr.employees.read',
  // Sales renames
  'sales.customers.create': 'sales.customers.create',
  'sales.customers.read': 'sales.customers.read',
  'sales.customers.update': 'sales.customers.update',
  'sales.customers.delete': 'sales.customers.delete',
  'sales.customers.list': 'sales.customers.list',
  'sales.customers.manage': null,
  'sales.orders.create': 'sales.orders.create',
  'sales.orders.read': 'sales.orders.read',
  'sales.orders.update': 'sales.orders.update',
  'sales.orders.delete': 'sales.orders.delete',
  'sales.orders.list': 'sales.orders.list',
  'sales.orders.cancel': 'sales.orders.manage',
  'sales.orders.approve': 'sales.orders.manage',
  'sales.orders.manage': 'sales.orders.manage',
  'sales.promotions.create': 'sales.promotions.create',
  'sales.promotions.read': 'sales.promotions.read',
  'sales.promotions.update': 'sales.promotions.update',
  'sales.promotions.delete': 'sales.promotions.delete',
  'sales.promotions.list': 'sales.promotions.list',
  'sales.promotions.manage': null,
  'sales.reservations.create': 'sales.orders.manage',
  'sales.reservations.read': 'sales.orders.read',
  'sales.reservations.update': 'sales.orders.manage',
  'sales.reservations.delete': 'sales.orders.manage',
  'sales.reservations.list': 'sales.orders.list',
  'sales.reservations.release': 'sales.orders.manage',
  'sales.reservations.manage': 'sales.orders.manage',
  'sales.comments.create': 'sales.orders.update',
  'sales.comments.read': 'sales.orders.read',
  'sales.comments.update': 'sales.orders.update',
  'sales.comments.delete': 'sales.orders.update',
  'sales.comments.list': 'sales.orders.read',
  // Self → System
  // All self.profile.* → system.self.update
  // All self.sessions.* → system.self.read
  // All self.permissions/groups/audit.* → system.self.read
  // All self.employee/time-entries/schedule/time-bank.* → system.self.read or system.self.manage
  // All self.vacations/absences/payslips/overtime/requests.* → system.self.manage
  // RBAC → Admin
  'rbac.permissions.create': 'admin.permission-groups.manage',
  'rbac.permissions.read': 'admin.permission-groups.read',
  'rbac.permissions.update': 'admin.permission-groups.manage',
  'rbac.permissions.delete': 'admin.permission-groups.manage',
  'rbac.permissions.list': 'admin.permission-groups.list',
  'rbac.permissions.manage': 'admin.permission-groups.manage',
  'rbac.groups.create': 'admin.permission-groups.create',
  'rbac.groups.read': 'admin.permission-groups.read',
  'rbac.groups.update': 'admin.permission-groups.update',
  'rbac.groups.delete': 'admin.permission-groups.delete',
  'rbac.groups.list': 'admin.permission-groups.list',
  'rbac.groups.manage': 'admin.permission-groups.manage',
  // Core → Admin/System
  'core.users.create': 'admin.users.create',
  'core.users.read': 'admin.users.read',
  'core.users.update': 'admin.users.update',
  'core.users.delete': 'admin.users.delete',
  'core.users.list': 'admin.users.list',
  'core.users.manage': 'admin.users.manage',
  'core.sessions.read': 'admin.sessions.read',
  'core.sessions.list': 'admin.sessions.list',
  'core.sessions.revoke': 'admin.sessions.manage',
  'core.sessions.revoke-all': 'admin.sessions.manage',
  'core.label-templates.create': 'system.label-templates.create',
  'core.label-templates.read': 'system.label-templates.read',
  'core.label-templates.update': 'system.label-templates.update',
  'core.label-templates.delete': 'system.label-templates.delete',
  'core.label-templates.list': 'system.label-templates.list',
  'core.label-templates.duplicate': 'system.label-templates.manage',
  'core.label-templates.manage': 'system.label-templates.manage',
  'core.teams.create': 'admin.users.manage',
  'core.teams.read': 'admin.users.manage',
  'core.teams.update': 'admin.users.manage',
  'core.teams.delete': 'admin.users.manage',
  'core.teams.list': 'admin.users.manage',
  'core.teams.manage': 'admin.users.manage',
  // Audit → Admin
  'audit.logs.read': 'admin.audit-logs.read',
  'audit.logs.view': 'admin.audit-logs.read',
  'audit.logs.list': 'admin.audit-logs.list',
  'audit.logs.search': 'admin.audit-logs.list',
  'audit.history.view': 'admin.audit-logs.manage',
  'audit.rollback.preview': 'admin.audit-logs.manage',
  'audit.rollback.execute': 'admin.audit-logs.manage',
  'audit.compare.view': 'admin.audit-logs.manage',
  // Calendar → Tools
  'calendar.events.create': 'tools.calendar-events.create',
  'calendar.events.read': 'tools.calendar-events.read',
  'calendar.events.update': 'tools.calendar-events.update',
  'calendar.events.delete': 'tools.calendar-events.delete',
  'calendar.events.list': 'tools.calendar-events.list',
  'calendar.events.manage': 'tools.calendar-events.manage',
  'calendar.events.share-users': 'tools.calendar-events.manage',
  'calendar.events.share-teams': 'tools.calendar-events.manage',
  'calendar.events.export': 'tools.calendar-events.export',
  'calendar.participants.invite': 'tools.calendar-events.manage',
  'calendar.participants.respond': 'tools.calendar-events.manage',
  'calendar.participants.manage': 'tools.calendar-events.manage',
  'calendar.reminders.create': 'tools.calendar-events.manage',
  'calendar.reminders.delete': 'tools.calendar-events.manage',
  // Email → Tools
  'email.accounts.create': 'tools.email-accounts.create',
  'email.accounts.read': 'tools.email-accounts.read',
  'email.accounts.update': 'tools.email-accounts.update',
  'email.accounts.delete': 'tools.email-accounts.delete',
  'email.accounts.list': 'tools.email-accounts.list',
  'email.accounts.share': 'tools.email-accounts.manage',
  'email.messages.read': 'tools.email-messages.read',
  'email.messages.list': 'tools.email-messages.list',
  'email.messages.send': 'tools.email-messages.create',
  'email.messages.update': 'tools.email-messages.update',
  'email.messages.delete': 'tools.email-messages.delete',
  'email.sync.execute': 'tools.email-accounts.manage',
  // Storage → Tools
  'storage.files.create': 'tools.storage-files.create',
  'storage.files.read': 'tools.storage-files.read',
  'storage.files.update': 'tools.storage-files.update',
  'storage.files.delete': 'tools.storage-files.delete',
  'storage.files.list': 'tools.storage-files.list',
  'storage.files.download': 'tools.storage-files.manage',
  'storage.files.share-user': 'tools.storage-files.manage',
  'storage.files.share-group': 'tools.storage-files.manage',
  'storage.versions.read': 'tools.storage-files.manage',
  'storage.versions.create': 'tools.storage-files.manage',
  'storage.versions.restore': 'tools.storage-files.manage',
  'storage.user-folders.create': 'tools.storage-folders.create',
  'storage.user-folders.read': 'tools.storage-folders.read',
  'storage.user-folders.update': 'tools.storage-folders.update',
  'storage.user-folders.delete': 'tools.storage-folders.delete',
  'storage.user-folders.list': 'tools.storage-folders.list',
  'storage.user-folders.share-user': 'tools.storage-folders.manage',
  'storage.user-folders.share-group': 'tools.storage-folders.manage',
  'storage.user-folders.download': 'tools.storage-folders.manage',
  'storage.interface.view': 'tools.storage-files.read',
  'storage.stats.view': 'tools.storage-files.read',
  'storage.security.manage': 'tools.storage-files.manage',
  // Tasks → Tools
  'tasks.boards.create': 'tools.task-boards.create',
  'tasks.boards.read': 'tools.task-boards.read',
  'tasks.boards.update': 'tools.task-boards.update',
  'tasks.boards.delete': 'tools.task-boards.delete',
  'tasks.boards.list': 'tools.task-boards.list',
  'tasks.boards.manage': 'tools.task-cards.manage', // boards has no manage, remap to cards.manage
  'tasks.cards.create': 'tools.task-cards.create',
  'tasks.cards.read': 'tools.task-cards.read',
  'tasks.cards.update': 'tools.task-cards.update',
  'tasks.cards.delete': 'tools.task-cards.delete',
  'tasks.cards.list': 'tools.task-cards.list',
  'tasks.cards.move': 'tools.task-cards.manage',
  'tasks.cards.assign': 'tools.task-cards.manage',
  'tasks.comments.create': 'tools.task-cards.manage',
  'tasks.comments.read': 'tools.task-cards.read',
  'tasks.comments.update': 'tools.task-cards.manage',
  'tasks.comments.delete': 'tools.task-cards.manage',
  'tasks.labels.create': 'tools.task-cards.manage',
  'tasks.labels.update': 'tools.task-cards.manage',
  'tasks.labels.delete': 'tools.task-cards.manage',
  'tasks.custom-fields.create': 'tools.task-cards.manage',
  'tasks.custom-fields.update': 'tools.task-cards.manage',
  'tasks.custom-fields.delete': 'tools.task-cards.manage',
  'tasks.attachments.upload': 'tools.task-cards.manage',
  'tasks.attachments.delete': 'tools.task-cards.manage',
  'tasks.watchers.create': 'tools.task-cards.manage',
  'tasks.watchers.read': 'tools.task-cards.read',
  'tasks.watchers.delete': 'tools.task-cards.manage',
  // Notifications → System
  'notifications.send': 'system.notifications.manage',
  'notifications.broadcast': 'system.notifications.manage',
  'notifications.schedule': 'system.notifications.manage',
  'notifications.manage': 'system.notifications.manage',
  // Self → System
  // ... all self.* map to system.self.read/update/manage based on action
};
```

The complete map must cover ALL old codes from the current `PermissionCodes` object. Use `null` for codes being removed entirely.

- [ ] **Step 4: Update `DEFAULT_USER_PERMISSIONS`**

Create `NEW_DEFAULT_USER_PERMISSIONS` using new codes:

```typescript
export const NEW_DEFAULT_USER_PERMISSIONS = [
  'system.self.read',
  'system.self.update',
  'system.self.manage',
];
```

- [ ] **Step 5: Run existing tests to confirm nothing is broken yet**

Run: `cd OpenSea-API && npx vitest run --reporter=verbose 2>&1 | tail -20`
Expected: All tests pass (old codes still in place)

- [ ] **Step 6: Commit**

```bash
cd OpenSea-API && git add src/constants/rbac/permission-codes.ts
git commit -m "feat(rbac): add new permission codes structure and migration map"
```

### Task 1.2: Update seed to support new permission codes

**Files:**

- Modify: `OpenSea-API/prisma/seed.ts`

- [ ] **Step 1: Read seed.ts thoroughly**

Understand `extractAllCodes()`, `seedPermissions()`, `cleanupStalePermissions()`, `seedGroups()`, label maps.

- [ ] **Step 2: Update `extractAllCodes` to use `NewPermissionCodes`**

Change the function to extract from `NewPermissionCodes` instead of `PermissionCodes`. Update the module/action label maps to match new codes.

- [ ] **Step 3: Add migration function**

Add `migrateExistingPermissions()` that:

1. Reads all existing `PermissionGroupPermission` records
2. For each, looks up the old code in `PERMISSION_MIGRATION_MAP`
3. If mapped to a new code: create new association (if not exists), delete old
4. If mapped to `null`: delete old association
5. Same for `UserDirectPermission` records

- [ ] **Step 4: Update `seedGroups` to use new default permissions**

Replace `DEFAULT_USER_PERMISSIONS` with `NEW_DEFAULT_USER_PERMISSIONS` in the User group seeding.

- [ ] **Step 5: Test seed locally**

Run: `cd OpenSea-API && npx prisma db seed`
Expected: Seed completes. New permissions created, old ones cleaned up.

- [ ] **Step 6: Commit**

```bash
cd OpenSea-API && git add prisma/seed.ts
git commit -m "feat(rbac): update seed to use new permission codes with migration"
```

---

## Phase 2: Backend — Update Controllers (per module)

Each task in this phase updates all controllers within one module to use `NewPermissionCodes` instead of `PermissionCodes`. The approach is mechanical: grep for `PermissionCodes.{MODULE}`, replace with the new code from the migration map.

### Task 2.1: Update Stock controllers

**Files:**

- Modify: All files in `OpenSea-API/src/http/controllers/stock/` (~113 controllers)

- [ ] **Step 1: Search all current stock permission usages**

Run: `grep -r "PermissionCodes.STOCK" OpenSea-API/src/http/controllers/stock/ --include="*.ts" -l | wc -l`

- [ ] **Step 2: Replace all permission codes**

For each controller, change the import from `PermissionCodes` to `NewPermissionCodes` and update the code reference. Key mappings:

- `PermissionCodes.STOCK.PRODUCTS.CREATE` → `NewPermissionCodes.STOCK.PRODUCTS.CREATE`
- `PermissionCodes.STOCK.ZONES.CREATE` → `NewPermissionCodes.STOCK.WAREHOUSES.MANAGE`
- `PermissionCodes.STOCK.BINS.READ` → `NewPermissionCodes.STOCK.WAREHOUSES.MANAGE`
- `PermissionCodes.STOCK.PRODUCT_ATTACHMENTS.CREATE` → `NewPermissionCodes.STOCK.PRODUCTS.MANAGE`
- `PermissionCodes.STOCK.ITEMS.ENTRY` → `NewPermissionCodes.STOCK.ITEMS.MANAGE`
- `PermissionCodes.STOCK.ITEMS.EXIT` → `NewPermissionCodes.STOCK.ITEMS.MANAGE`
- `PermissionCodes.STOCK.ITEMS.TRANSFER` → `NewPermissionCodes.STOCK.ITEMS.MANAGE`
- `PermissionCodes.STOCK.MOVEMENTS.LIST` → `NewPermissionCodes.STOCK.ITEMS.LIST`
- `PermissionCodes.STOCK.CARE.READ` → `NewPermissionCodes.STOCK.PRODUCTS.READ`
- (follow the full migration map from Task 1.1)

- [ ] **Step 3: Run stock E2E tests**

Run: `cd OpenSea-API && npx vitest run src/http/controllers/stock --reporter=verbose 2>&1 | tail -30`

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/http/controllers/stock/
git commit -m "refactor(rbac): update stock controllers to new permission codes"
```

### Task 2.2: Update Finance controllers

Same pattern as Task 2.1 but for `OpenSea-API/src/http/controllers/finance/`. Key mappings:

- `PermissionCodes.FINANCE.ATTACHMENTS.*` → `NewPermissionCodes.FINANCE.ENTRIES.MANAGE`
- `PermissionCodes.FINANCE.DASHBOARD.VIEW` → `NewPermissionCodes.FINANCE.ENTRIES.READ`
- `PermissionCodes.FINANCE.EXPORT.GENERATE` → `NewPermissionCodes.FINANCE.ENTRIES.EXPORT`
- Direct renames for ENTRIES, CATEGORIES, COST_CENTERS, BANK_ACCOUNTS, LOANS, CONSORTIA, CONTRACTS, RECURRING

### Task 2.3: Update HR controllers

Same pattern for `OpenSea-API/src/http/controllers/hr/`. Key mappings:

- `PermissionCodes.HR.BONUSES.*` → `NewPermissionCodes.HR.PAYROLL.MANAGE`
- `PermissionCodes.HR.DEDUCTIONS.*` → `NewPermissionCodes.HR.PAYROLL.MANAGE`
- `PermissionCodes.HR.VACATION_PERIODS.*` → `NewPermissionCodes.HR.VACATIONS.*`
- `PermissionCodes.HR.EMPLOYEES.READ_ALL` → `NewPermissionCodes.HR.EMPLOYEES.READ`
- Remove `.all`/`.team` scope suffixes

### Task 2.4: Update Sales controllers

Same pattern for `OpenSea-API/src/http/controllers/sales/`. Key mappings:

- `PermissionCodes.SALES.RESERVATIONS.*` → `NewPermissionCodes.SALES.ORDERS.MANAGE`
- `PermissionCodes.SALES.COMMENTS.*` → `NewPermissionCodes.SALES.ORDERS.UPDATE`

### Task 2.5: Update RBAC, Audit, Core controllers → Admin codes

Update controllers in `rbac/`, `audit/`, `core/` (users, sessions, teams). Key mappings:

- `PermissionCodes.RBAC.GROUPS.*` → `NewPermissionCodes.ADMIN.PERMISSION_GROUPS.*`
- `PermissionCodes.RBAC.PERMISSIONS.*` → `NewPermissionCodes.ADMIN.PERMISSION_GROUPS.MANAGE`
- `PermissionCodes.AUDIT.*` → `NewPermissionCodes.ADMIN.AUDIT_LOGS.*`
- `PermissionCodes.CORE.USERS.*` → `NewPermissionCodes.ADMIN.USERS.*`
- `PermissionCodes.CORE.SESSIONS.*` → `NewPermissionCodes.ADMIN.SESSIONS.*`
- `PermissionCodes.CORE.TEAMS.*` → `NewPermissionCodes.ADMIN.USERS.MANAGE`

### Task 2.6: Update Calendar, Email, Storage, Tasks controllers → Tools codes

Update controllers in `calendar/`, `email/`, `storage/`, `tasks/`. Key mappings:

- `PermissionCodes.CALENDAR.*` → `NewPermissionCodes.TOOLS.CALENDAR_EVENTS.*`
- `PermissionCodes.EMAIL.*` → `NewPermissionCodes.TOOLS.EMAIL_ACCOUNTS/EMAIL_MESSAGES.*`
- `PermissionCodes.STORAGE.*` → `NewPermissionCodes.TOOLS.STORAGE_FILES/STORAGE_FOLDERS.*`
- `PermissionCodes.TASKS.*` → `NewPermissionCodes.TOOLS.TASK_BOARDS/TASK_CARDS.*`

### Task 2.7: Update remaining controllers (label-templates, notifications, admin/companies)

- `PermissionCodes.CORE.LABEL_TEMPLATES.*` → `NewPermissionCodes.SYSTEM.LABEL_TEMPLATES.*`
- `PermissionCodes.NOTIFICATIONS.*` → `NewPermissionCodes.SYSTEM.NOTIFICATIONS.MANAGE`
- `PermissionCodes.ADMIN.COMPANIES.*` → `NewPermissionCodes.ADMIN.COMPANIES.*`
- `PermissionCodes.ADMIN.COMPANY_*.*` → `NewPermissionCodes.ADMIN.COMPANIES.MANAGE`

### Task 2.8: Remove old PermissionCodes and finalize

- [ ] **Step 1: Replace `PermissionCodes` with `NewPermissionCodes`**

Rename `NewPermissionCodes` to `PermissionCodes` (overwrite old). Remove migration map export if no longer needed at runtime. Update all imports across the codebase that used the old structure.

- [ ] **Step 2: Run full test suite**

Run: `cd OpenSea-API && npx vitest run --reporter=verbose 2>&1 | tail -30`
Fix any remaining references to old codes.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add -A
git commit -m "refactor(rbac): finalize new permission codes, remove old structure"
```

---

## Phase 3: Frontend — Update Permission Constants

### Task 3.1: Rewrite frontend permission codes

**Files:**

- Modify: `OpenSea-APP/src/config/rbac/permission-codes.ts` (1007 lines)

- [ ] **Step 1: Read current file**

Understand the structure: separate exports per module (STOCK_PERMISSIONS, HR_PERMISSIONS, etc.)

- [ ] **Step 2: Rewrite with new structure**

Mirror the backend `NewPermissionCodes` exactly. Export as:

- `STOCK_PERMISSIONS`
- `FINANCE_PERMISSIONS`
- `HR_PERMISSIONS`
- `SALES_PERMISSIONS`
- `ADMIN_PERMISSIONS` (replaces RBAC_PERMISSIONS, AUDIT_PERMISSIONS, old ADMIN_PERMISSIONS, CORE users/sessions)
- `TOOLS_PERMISSIONS` (replaces CALENDAR_PERMISSIONS, EMAIL_PERMISSIONS, STORAGE_PERMISSIONS, TASKS_PERMISSIONS)
- `SYSTEM_PERMISSIONS` (replaces SELF_PERMISSIONS, NOTIFICATIONS_PERMISSIONS, core label-templates)

Remove old exports: `UI_PERMISSIONS`, `REPORTS_PERMISSIONS`, `DATA_PERMISSIONS`, `SETTINGS_PERMISSIONS`, `WILDCARD_PERMISSIONS`.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP && git add src/config/rbac/permission-codes.ts
git commit -m "refactor(rbac): rewrite frontend permission codes to match new structure"
```

### Task 3.2: Update module-specific permission constants

**Files:**

- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/admin/_shared/constants/admin-permissions.ts`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/_shared/constants/stock-permissions.ts`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions.ts`
- Create or modify similar files for finance, sales if they exist

- [ ] **Step 1: Update each module constant file**

Re-export from the new centralized permission codes. Example for admin:

```typescript
export { ADMIN_PERMISSIONS as PERMISSIONS } from '@/config/rbac/permission-codes';
```

- [ ] **Step 2: Commit**

```bash
cd OpenSea-APP && git add -A
git commit -m "refactor(rbac): update module permission constant re-exports"
```

### Task 3.3: Update base-groups.ts

**Files:**

- Modify: `OpenSea-APP/src/config/rbac/base-groups.ts` (539 lines)

- [ ] **Step 1: Update all permission code references in base group definitions**

The 7 base groups (Super Admin, Admin, Stock Manager, etc.) reference old permission codes in their `permissions` arrays. Update each to use new codes.

- [ ] **Step 2: Update `DEFAULT_USER_PERMISSIONS`**

Replace with the 3 new system.self permissions.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP && git add src/config/rbac/base-groups.ts
git commit -m "refactor(rbac): update base groups to use new permission codes"
```

### Task 3.4: Update all `hasPermission()` calls across frontend pages

**Files:**

- Modify: ~68 files that use `hasPermission()`

- [ ] **Step 1: Find all files**

Run: `grep -r "hasPermission\|PERMISSIONS\." OpenSea-APP/src/app/ --include="*.tsx" --include="*.ts" -l`

- [ ] **Step 2: Update each file**

Replace old permission references with new ones. This is mechanical — search and replace per module. Example:

- `PERMISSIONS.PRODUCTS.CREATE` → `PERMISSIONS.PRODUCTS.CREATE` (same for stock)
- `PERMISSIONS.ZONES.CREATE` → `PERMISSIONS.WAREHOUSES.MANAGE`
- `PERMISSIONS.AUDIT_LOGS.VIEW` → `PERMISSIONS.AUDIT_LOGS.READ`

Work module by module to keep changes organized.

- [ ] **Step 3: Build frontend to verify**

Run: `cd OpenSea-APP && npm run build 2>&1 | tail -20`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add -A
git commit -m "refactor(rbac): update all hasPermission calls to new codes"
```

---

## Phase 4: Frontend — Build Permission Matrix UI

### Task 4.1: Create PermissionMatrix component

**Files:**

- Create: `OpenSea-APP/src/app/(dashboard)/(modules)/admin/(entities)/permission-groups/src/components/permission-matrix.tsx`

- [ ] **Step 1: Define the module/resource/action configuration**

Create a configuration object that defines all 7 tabs, their resources, and available actions. This drives the entire matrix UI:

```typescript
interface PermissionResource {
  key: string; // e.g., 'warehouses'
  label: string; // e.g., 'Armazéns'
  subtitle?: string; // e.g., 'zonas, bins, endereços, etiquetas'
  codePrefix: string; // e.g., 'stock.warehouses'
  actions: string[]; // e.g., ['create','update','delete','manage','list','read']
}

interface PermissionModule {
  key: string; // e.g., 'stock'
  label: string; // e.g., 'Estoque'
  icon: string; // e.g., '📦'
  resources: PermissionResource[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: 'stock',
    label: 'Estoque',
    icon: '📦',
    resources: [
      {
        key: 'warehouses',
        label: 'Armazéns',
        subtitle: 'zonas, bins, endereços, etiquetas',
        codePrefix: 'stock.warehouses',
        actions: ['create', 'update', 'delete', 'manage', 'list', 'read'],
      },
      {
        key: 'categories',
        label: 'Categorias',
        codePrefix: 'stock.categories',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'import',
          'list',
          'read',
        ],
      },
      {
        key: 'manufacturers',
        label: 'Fabricantes',
        codePrefix: 'stock.manufacturers',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'import',
          'list',
          'read',
        ],
      },
      {
        key: 'items',
        label: 'Itens',
        subtitle: 'movimentações, localização',
        codePrefix: 'stock.items',
        actions: ['export', 'manage', 'list', 'read'],
      },
      {
        key: 'purchase-orders',
        label: 'Ordens de Compra',
        subtitle: 'gerenciar: aprovar, cancelar',
        codePrefix: 'stock.purchase-orders',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
      {
        key: 'products',
        label: 'Produtos',
        subtitle: 'attachments, instruções de cuidado',
        codePrefix: 'stock.products',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'import',
          'list',
          'read',
        ],
      },
      {
        key: 'templates',
        label: 'Templates',
        codePrefix: 'stock.templates',
        actions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        key: 'variants',
        label: 'Variantes',
        subtitle: 'attachments',
        codePrefix: 'stock.variants',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'import',
          'list',
          'read',
        ],
      },
      {
        key: 'volumes',
        label: 'Volumes',
        subtitle: 'gerenciar: fechar, entregar, romaneio',
        codePrefix: 'stock.volumes',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
    ],
  },
  {
    key: 'finance',
    label: 'Financeiro',
    icon: '💰',
    resources: [
      {
        key: 'categories',
        label: 'Categorias',
        codePrefix: 'finance.categories',
        actions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        key: 'cost-centers',
        label: 'Centros de Custo',
        codePrefix: 'finance.cost-centers',
        actions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        key: 'consortia',
        label: 'Consórcios',
        subtitle: 'gerenciar: pagar, contemplar',
        codePrefix: 'finance.consortia',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
      {
        key: 'bank-accounts',
        label: 'Contas Bancárias',
        codePrefix: 'finance.bank-accounts',
        actions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        key: 'contracts',
        label: 'Contratos',
        codePrefix: 'finance.contracts',
        actions: ['create', 'update', 'delete', 'export', 'list', 'read'],
      },
      {
        key: 'loans',
        label: 'Empréstimos',
        subtitle: 'gerenciar: pagar parcela',
        codePrefix: 'finance.loans',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
      {
        key: 'suppliers',
        label: 'Fornecedores',
        subtitle: 'vindo do módulo de estoque',
        codePrefix: 'finance.suppliers',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'import',
          'list',
          'read',
        ],
      },
      {
        key: 'entries',
        label: 'Lançamentos',
        subtitle: 'gerenciar: pagar, cancelar, attachments',
        codePrefix: 'finance.entries',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'import',
          'list',
          'read',
        ],
      },
      {
        key: 'recurring',
        label: 'Recorrências',
        subtitle: 'gerenciar: pausar, retomar, cancelar',
        codePrefix: 'finance.recurring',
        actions: ['create', 'update', 'manage', 'list', 'read'],
      },
    ],
  },
  {
    key: 'hr',
    label: 'Recursos Humanos',
    icon: '👥',
    resources: [
      {
        key: 'absences',
        label: 'Ausências',
        subtitle: 'gerenciar: aprovar, cancelar',
        codePrefix: 'hr.absences',
        actions: ['create', 'update', 'delete', 'manage', 'list', 'read'],
      },
      {
        key: 'positions',
        label: 'Cargos',
        codePrefix: 'hr.positions',
        actions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        key: 'employees',
        label: 'Colaboradores',
        subtitle: 'gerenciar: suspender, reativar, licença',
        codePrefix: 'hr.employees',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'import',
          'list',
          'read',
        ],
      },
      {
        key: 'departments',
        label: 'Departamentos',
        codePrefix: 'hr.departments',
        actions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        key: 'work-schedules',
        label: 'Escalas de Trabalho',
        codePrefix: 'hr.work-schedules',
        actions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        key: 'vacations',
        label: 'Férias',
        subtitle: 'gerenciar: aprovar',
        codePrefix: 'hr.vacations',
        actions: ['create', 'update', 'manage', 'list', 'read'],
      },
      {
        key: 'payroll',
        label: 'Folha de Pagamento',
        subtitle: 'gerenciar: bônus, descontos, processar',
        codePrefix: 'hr.payroll',
        actions: ['create', 'export', 'manage', 'list', 'read'],
      },
      {
        key: 'time-control',
        label: 'Ponto',
        subtitle: 'controle de ponto, banco de horas',
        codePrefix: 'hr.time-control',
        actions: ['create', 'export', 'list', 'read'],
      },
    ],
  },
  {
    key: 'sales',
    label: 'Vendas',
    icon: '🛒',
    resources: [
      {
        key: 'customers',
        label: 'Clientes',
        codePrefix: 'sales.customers',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'import',
          'list',
          'read',
        ],
      },
      {
        key: 'orders',
        label: 'Pedidos',
        subtitle: 'gerenciar: alterar status, cancelar',
        codePrefix: 'sales.orders',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
      {
        key: 'promotions',
        label: 'Promoções',
        codePrefix: 'sales.promotions',
        actions: ['create', 'update', 'delete', 'list', 'read'],
      },
    ],
  },
  {
    key: 'admin',
    label: 'Administração',
    icon: '🏢',
    resources: [
      {
        key: 'audit-logs',
        label: 'Auditoria: Logs',
        subtitle: 'gerenciar: comparar, histórico, rollback',
        codePrefix: 'admin.audit-logs',
        actions: ['manage', 'list', 'read'],
      },
      {
        key: 'companies',
        label: 'Empresas',
        subtitle: 'endereços, CNAEs, fiscal, sócios, docs',
        codePrefix: 'admin.companies',
        actions: ['create', 'update', 'delete', 'manage', 'list', 'read'],
      },
      {
        key: 'permission-groups',
        label: 'Grupos de Permissão',
        subtitle: 'gerenciar: atribuir permissões',
        codePrefix: 'admin.permission-groups',
        actions: ['create', 'update', 'delete', 'manage', 'list', 'read'],
      },
      {
        key: 'sessions',
        label: 'Sessões',
        subtitle: 'gerenciar: revogar sessões',
        codePrefix: 'admin.sessions',
        actions: ['manage', 'list', 'read'],
      },
      {
        key: 'users',
        label: 'Usuários',
        subtitle: 'gerenciar: atribuir grupos, permissões diretas',
        codePrefix: 'admin.users',
        actions: ['create', 'update', 'delete', 'manage', 'list', 'read'],
      },
    ],
  },
  {
    key: 'tools',
    label: 'Ferramentas',
    icon: '🔧',
    resources: [
      {
        key: 'calendar-events',
        label: 'Agenda: Eventos',
        subtitle: 'gerenciar: compartilhar, participantes, lembretes',
        codePrefix: 'tools.calendar-events',
        actions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
      {
        key: 'storage-files',
        label: 'Armazenamento: Arquivos',
        subtitle: 'gerenciar: versões, compartilhar, download',
        codePrefix: 'tools.storage-files',
        actions: ['create', 'update', 'delete', 'manage', 'list', 'read'],
      },
      {
        key: 'storage-folders',
        label: 'Armazenamento: Pastas',
        subtitle: 'gerenciar: compartilhar com usuário/grupo',
        codePrefix: 'tools.storage-folders',
        actions: ['create', 'update', 'delete', 'manage', 'list', 'read'],
      },
      {
        key: 'email-accounts',
        label: 'Email: Contas',
        subtitle: 'gerenciar: compartilhar, sincronizar',
        codePrefix: 'tools.email-accounts',
        actions: ['create', 'update', 'delete', 'manage', 'list', 'read'],
      },
      {
        key: 'email-messages',
        label: 'Email: Mensagens',
        codePrefix: 'tools.email-messages',
        actions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        key: 'task-cards',
        label: 'Tarefas: Cartões',
        subtitle: 'gerenciar: mover, atribuir, anexos, comentários',
        codePrefix: 'tools.task-cards',
        actions: ['create', 'update', 'delete', 'manage', 'list', 'read'],
      },
      {
        key: 'task-boards',
        label: 'Tarefas: Quadros',
        codePrefix: 'tools.task-boards',
        actions: ['create', 'update', 'delete', 'list', 'read'],
      },
    ],
  },
  {
    key: 'system',
    label: 'Sistema',
    icon: '⚙️',
    resources: [
      {
        key: 'label-templates',
        label: 'Modelos de Etiqueta',
        codePrefix: 'system.label-templates',
        actions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        key: 'notifications',
        label: 'Notificações',
        subtitle: 'gerenciar: enviar, agendar',
        codePrefix: 'system.notifications',
        actions: ['manage'],
      },
      {
        key: 'self',
        label: 'Permissões Pessoais',
        subtitle: 'perfil, sessões, férias, ponto',
        codePrefix: 'system.self',
        actions: ['read', 'update', 'manage'],
      },
    ],
  },
];

export const ACTION_COLUMNS = [
  { key: 'create', label: 'Criar' },
  { key: 'update', label: 'Editar' },
  { key: 'delete', label: 'Excluir' },
  { key: 'export', label: 'Exportar' },
  { key: 'manage', label: 'Gerenciar' },
  { key: 'import', label: 'Importar' },
  { key: 'list', label: 'Listar' },
  { key: 'read', label: 'Ver' },
];
```

- [ ] **Step 2: Build the matrix table component**

Create `PermissionMatrix` that receives `moduleKey`, `selectedPermissions: Set<string>`, and `onToggle(code: string)`. Renders:

- Sticky header with column names + ⬇ select-all-column buttons
- Rows for each resource with → select-all-row button + checkboxes
- N/A state for actions not in the resource's `actions` array
- Amber checkbox for `manage` action

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP && git add src/app/\(dashboard\)/\(modules\)/admin/\(entities\)/permission-groups/src/components/
git commit -m "feat(rbac): create PermissionMatrix component with config"
```

### Task 4.2: Create ModuleTabList component

**Files:**

- Create: `OpenSea-APP/src/app/(dashboard)/(modules)/admin/(entities)/permission-groups/src/components/module-tab-list.tsx`

- [ ] **Step 1: Build the vertical tab sidebar**

Create `ModuleTabList` that receives `modules`, `activeModule`, `onModuleChange`, and `permissionCounts: Record<string, { selected: number, total: number }>`. Renders:

- Vertical list of module tabs with icon + label + count badge
- Active state: `bg-blue-500/15 border border-blue-500/30`
- Inactive: `opacity-50`

- [ ] **Step 2: Commit**

```bash
cd OpenSea-APP && git add src/app/\(dashboard\)/\(modules\)/admin/\(entities\)/permission-groups/src/components/
git commit -m "feat(rbac): create ModuleTabList component"
```

### Task 4.3: Create ManagePermissionsMatrix modal

**Files:**

- Create: `OpenSea-APP/src/app/(dashboard)/(modules)/admin/(entities)/permission-groups/src/modals/manage-permissions-matrix.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/admin/(entities)/permission-groups/page.tsx`

- [ ] **Step 1: Build the modal wrapper**

Create `ManagePermissionsMatrix` that combines ModuleTabList + PermissionMatrix inside a Dialog (`max-w-6xl h-[85vh]`):

- Header: "Gerenciar Permissões — {Group Name}" + count
- Left sidebar: ModuleTabList (~160px)
- Right area: PermissionMatrix for active module
- Footer: hint text + Cancel/Save buttons

State management:

- `selectedPermissions: Set<string>` — initialized from `rbacService.listGroupPermissions()`
- `activeModule: string` — which tab is active
- On save: compute diff (added/removed), call bulk API

- [ ] **Step 2: Wire up API calls**

Load permissions on open:

```typescript
const { data: groupPermissions } = useQuery({
  queryKey: ['group-permissions', groupId],
  queryFn: () => rbacService.listGroupPermissions(groupId),
});
```

Save: compute diff between initial and current `selectedPermissions`, call remove + add bulk.

- [ ] **Step 3: Replace old modal usage in page.tsx**

In the permission groups page, replace `ManagePermissionsModal` with `ManagePermissionsMatrix`.

- [ ] **Step 4: Test manually**

Open the app, navigate to Admin > Grupos de Permissão, click "Gerenciar Permissões" on a group. Verify:

- 7 tabs render with correct icons/labels
- Matrix shows checkboxes for each resource/action
- Select-all row/column works
- Save persists changes

- [ ] **Step 5: Commit**

```bash
cd OpenSea-APP && git add -A
git commit -m "feat(rbac): replace ManagePermissionsModal with matrix UI"
```

### Task 4.4: Remove old ManagePermissionsModal

**Files:**

- Delete: `OpenSea-APP/src/app/(dashboard)/(modules)/admin/(entities)/permission-groups/src/modals/manage-permissions-modal.tsx`

- [ ] **Step 1: Verify no other imports reference the old modal**

Run: `grep -r "ManagePermissionsModal\|manage-permissions-modal" OpenSea-APP/src/ --include="*.ts" --include="*.tsx" -l`

- [ ] **Step 2: Delete the file and remove any barrel exports**

- [ ] **Step 3: Build to verify**

Run: `cd OpenSea-APP && npm run build 2>&1 | tail -20`

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add -A
git commit -m "refactor(rbac): remove old ManagePermissionsModal"
```

---

## Phase 5: Cleanup and Verification

### Task 5.1: Run full backend test suite

- [ ] **Step 1: Run all tests**

Run: `cd OpenSea-API && npx vitest run --reporter=verbose 2>&1 | tail -50`

- [ ] **Step 2: Fix any failures**

Most failures will be permission code mismatches in test factories or E2E specs. Update each to use new codes.

- [ ] **Step 3: Commit fixes**

```bash
cd OpenSea-API && git add -A
git commit -m "fix(rbac): update test fixtures to use new permission codes"
```

### Task 5.2: Run full frontend build

- [ ] **Step 1: Build**

Run: `cd OpenSea-APP && npm run build 2>&1 | tail -30`

- [ ] **Step 2: Fix any TypeScript errors**

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP && git add -A
git commit -m "fix(rbac): resolve remaining TypeScript errors from permission migration"
```

### Task 5.3: Run seed on clean database

- [ ] **Step 1: Reset and seed**

Run: `cd OpenSea-API && npx prisma db push --force-reset && npx prisma db seed`

- [ ] **Step 2: Verify permission counts**

Check that the database has ~234 permissions (not ~721).

- [ ] **Step 3: Verify admin group has all permissions**

- [ ] **Step 4: Verify user group has only system.self permissions**

---

## Execution Notes

### Parallelization

- Tasks 2.1–2.7 (controller updates) are independent and can be parallelized with subagents
- Tasks 3.1–3.4 (frontend updates) must be sequential (each depends on the previous)
- Phase 4 (UI) depends on Phase 3 being complete

### Risk Areas

- **958 controller permission references** — most mechanical but error-prone. Use grep + replace carefully.
- **68 frontend files with hasPermission** — same mechanical risk.
- **Seed migration** — must handle existing group assignments correctly. Test on a copy of production data if possible.

### Rollback

- Old `PermissionCodes` is kept alongside `NewPermissionCodes` until Phase 2.8
- If issues arise, revert to old codes by removing the rename step
