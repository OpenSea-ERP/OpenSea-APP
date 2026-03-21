/**
 * OpenSea OS - Permission Codes
 *
 * Códigos de permissões centralizados do sistema.
 * Espelha exatamente a estrutura definida pelo backend.
 *
 * Formato: {module}.{resource-kebab}.{action}
 * - Resource keys: UPPER_SNAKE (e.g., PURCHASE_ORDERS)
 * - Code strings: kebab-case (e.g., stock.purchase-orders.access)
 *
 * 7 Modules: stock, finance, hr, sales, admin, tools, system
 * 10 Possible Actions: access, register, modify, remove, import, export, print, admin, onlyself, share
 *
 * @version 2.0.0
 * @lastUpdated 2026-03-20
 */

// =============================================================================
// Helper — builds a resource permission block
// =============================================================================

type Actions =
  | 'access'
  | 'register'
  | 'modify'
  | 'remove'
  | 'import'
  | 'export'
  | 'print'
  | 'admin'
  | 'onlyself'
  | 'share';

type PermBlock<A extends Actions> = { [K in Uppercase<A>]: string };

function perm<A extends Actions>(
  module: string,
  resource: string,
  ...actions: A[]
): PermBlock<A> {
  const result = {} as Record<string, string>;
  for (const action of actions) {
    result[action.toUpperCase()] = `${module}.${resource}.${action}`;
  }
  return result as PermBlock<A>;
}

// =============================================================================
// STOCK - Gerenciamento de estoque e inventário
// =============================================================================

export const STOCK_PERMISSIONS = {
  PRODUCTS: perm(
    'stock',
    'products',
    'access',
    'register',
    'modify',
    'remove',
    'import',
    'export',
    'print',
    'admin',
    'onlyself'
  ),
  VARIANTS: perm(
    'stock',
    'variants',
    'access',
    'register',
    'modify',
    'remove',
    'import',
    'export',
    'print',
    'admin',
    'onlyself'
  ),
  TEMPLATES: perm('stock', 'templates', 'access', 'register', 'modify', 'remove', 'import'),
  CATEGORIES: perm(
    'stock',
    'categories',
    'access',
    'register',
    'modify',
    'remove',
    'import',
    'export'
  ),
  MANUFACTURERS: perm(
    'stock',
    'manufacturers',
    'access',
    'register',
    'modify',
    'remove',
    'import',
    'export'
  ),
  ITEMS: perm('stock', 'items', 'access', 'export', 'print', 'admin', 'import'),
  PURCHASE_ORDERS: perm(
    'stock',
    'purchase-orders',
    'access',
    'register',
    'modify',
    'remove',
    'export',
    'print',
    'admin',
    'onlyself'
  ),
  VOLUMES: perm(
    'stock',
    'volumes',
    'access',
    'register',
    'modify',
    'remove',
    'export',
    'print',
    'admin',
    'onlyself'
  ),
  WAREHOUSES: perm(
    'stock',
    'warehouses',
    'access',
    'register',
    'modify',
    'remove',
    'admin'
  ),
} as const;

// =============================================================================
// FINANCE - Gestão Financeira
// =============================================================================

export const FINANCE_PERMISSIONS = {
  CATEGORIES: perm(
    'finance',
    'categories',
    'access',
    'register',
    'modify',
    'remove'
  ),
  COST_CENTERS: perm(
    'finance',
    'cost-centers',
    'access',
    'register',
    'modify',
    'remove'
  ),
  BANK_ACCOUNTS: perm(
    'finance',
    'bank-accounts',
    'access',
    'register',
    'modify',
    'remove'
  ),
  SUPPLIERS: perm(
    'finance',
    'suppliers',
    'access',
    'register',
    'modify',
    'remove',
    'import',
    'export'
  ),
  CONTRACTS: perm(
    'finance',
    'contracts',
    'access',
    'register',
    'modify',
    'remove',
    'export',
    'print'
  ),
  ENTRIES: perm(
    'finance',
    'entries',
    'access',
    'register',
    'modify',
    'remove',
    'import',
    'export',
    'print',
    'admin',
    'onlyself'
  ),
  CONSORTIA: perm(
    'finance',
    'consortia',
    'access',
    'register',
    'modify',
    'remove',
    'export',
    'admin',
    'onlyself'
  ),
  LOANS: perm(
    'finance',
    'loans',
    'access',
    'register',
    'modify',
    'remove',
    'export',
    'admin',
    'onlyself'
  ),
  RECURRING: perm(
    'finance',
    'recurring',
    'access',
    'register',
    'modify',
    'admin',
    'onlyself'
  ),
} as const;

// =============================================================================
// HR - Recursos Humanos
// =============================================================================

export const HR_PERMISSIONS = {
  POSITIONS: perm('hr', 'positions', 'access', 'register', 'modify', 'remove', 'import'),
  DEPARTMENTS: perm(
    'hr',
    'departments',
    'access',
    'register',
    'modify',
    'remove',
    'import'
  ),
  WORK_SCHEDULES: perm(
    'hr',
    'work-schedules',
    'access',
    'register',
    'modify',
    'remove'
  ),
  EMPLOYEES: perm(
    'hr',
    'employees',
    'access',
    'register',
    'modify',
    'remove',
    'import',
    'export',
    'print',
    'admin',
    'onlyself'
  ),
  VACATIONS: perm(
    'hr',
    'vacations',
    'access',
    'register',
    'modify',
    'admin',
    'onlyself'
  ),
  ABSENCES: perm(
    'hr',
    'absences',
    'access',
    'register',
    'modify',
    'remove',
    'admin',
    'onlyself'
  ),
  PAYROLL: perm(
    'hr',
    'payroll',
    'access',
    'register',
    'export',
    'print',
    'admin'
  ),
  TIME_CONTROL: perm('hr', 'time-control', 'access', 'register', 'export', 'print'),
} as const;

// =============================================================================
// SALES - Gerenciamento de vendas e clientes
// =============================================================================

export const SALES_PERMISSIONS = {
  CUSTOMERS: perm(
    'sales',
    'customers',
    'access',
    'register',
    'modify',
    'remove',
    'import',
    'export',
    'onlyself'
  ),
  PROMOTIONS: perm(
    'sales',
    'promotions',
    'access',
    'register',
    'modify',
    'remove'
  ),
  ORDERS: perm(
    'sales',
    'orders',
    'access',
    'register',
    'modify',
    'remove',
    'export',
    'print',
    'admin',
    'onlyself'
  ),
  CATALOGS: perm(
    'sales',
    'catalogs',
    'access',
    'register',
    'modify',
    'remove'
  ),
  BRAND: perm(
    'sales',
    'brand',
    'access',
    'modify'
  ),
  CONTENT: perm(
    'sales',
    'content',
    'access',
    'register',
    'remove',
    'admin'
  ),
} as const;

// =============================================================================
// ADMIN - Administração do tenant
// =============================================================================

export const ADMIN_PERMISSIONS = {
  USERS: perm(
    'admin',
    'users',
    'access',
    'register',
    'modify',
    'remove',
    'admin',
    'import'
  ),
  PERMISSION_GROUPS: perm(
    'admin',
    'permission-groups',
    'access',
    'register',
    'modify',
    'remove',
    'admin'
  ),
  COMPANIES: perm(
    'admin',
    'companies',
    'access',
    'register',
    'modify',
    'remove',
    'admin',
    'import'
  ),
  SESSIONS: perm('admin', 'sessions', 'access', 'admin'),
  AUDIT: perm('admin', 'audit', 'access', 'export', 'admin'),
} as const;

// =============================================================================
// TOOLS - Ferramentas de produtividade
// =============================================================================

export const TOOLS_PERMISSIONS = {
  EMAIL: {
    ACCOUNTS: perm(
      'tools',
      'email.accounts',
      'access',
      'register',
      'modify',
      'remove',
      'admin',
      'share'
    ),
    MESSAGES: perm(
      'tools',
      'email.messages',
      'access',
      'register',
      'modify',
      'remove',
      'onlyself'
    ),
  },
  TASKS: {
    BOARDS: perm(
      'tools',
      'tasks.boards',
      'access',
      'register',
      'modify',
      'remove',
      'share'
    ),
    CARDS: perm(
      'tools',
      'tasks.cards',
      'access',
      'register',
      'modify',
      'remove',
      'admin',
      'share',
      'onlyself'
    ),
  },
  CALENDAR: perm(
    'tools',
    'calendar',
    'access',
    'register',
    'modify',
    'remove',
    'export',
    'admin',
    'share',
    'onlyself'
  ),
  STORAGE: {
    FOLDERS: perm(
      'tools',
      'storage.folders',
      'access',
      'register',
      'modify',
      'remove',
      'admin',
      'share'
    ),
    FILES: perm(
      'tools',
      'storage.files',
      'access',
      'register',
      'modify',
      'remove',
      'admin',
      'share',
      'onlyself'
    ),
  },
} as const;

// =============================================================================
// SYSTEM - Permissões de sistema / cross-module
// =============================================================================

export const SYSTEM_PERMISSIONS = {
  LABEL_TEMPLATES: perm(
    'system',
    'label-templates',
    'access',
    'register',
    'modify',
    'remove'
  ),
  NOTIFICATIONS: perm('system', 'notifications', 'admin'),
  SELF: perm('system', 'self', 'access', 'modify', 'admin'),
} as const;

// =============================================================================
// WILDCARD - Permissão especial (Super Admin)
// =============================================================================

export const WILDCARD_PERMISSIONS = {
  /** Acesso total ao sistema (Super Admin) */
  FULL_ACCESS: '*.*.*',
} as const;

// =============================================================================
// AGGREGATED EXPORT
// =============================================================================

/**
 * Objeto centralizado com todas as permissões do sistema
 */
export const PermissionCodes = {
  STOCK: STOCK_PERMISSIONS,
  FINANCE: FINANCE_PERMISSIONS,
  HR: HR_PERMISSIONS,
  SALES: SALES_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  TOOLS: TOOLS_PERMISSIONS,
  SYSTEM: SYSTEM_PERMISSIONS,
  WILDCARD: WILDCARD_PERMISSIONS,
} as const;

// =============================================================================
// TYPES
// =============================================================================

export type PermissionCode = string;

/** Helper: extract all string values from a nested const object */
type DeepValues<T> = T extends string
  ? T
  : T extends Record<string, infer V>
    ? DeepValues<V>
    : never;

export type StockPermission = DeepValues<typeof STOCK_PERMISSIONS>;
export type FinancePermission = DeepValues<typeof FINANCE_PERMISSIONS>;
export type HRPermission = DeepValues<typeof HR_PERMISSIONS>;
export type SalesPermission = DeepValues<typeof SALES_PERMISSIONS>;
export type AdminPermission = DeepValues<typeof ADMIN_PERMISSIONS>;
export type ToolsPermission = DeepValues<typeof TOOLS_PERMISSIONS>;
export type SystemPermission = DeepValues<typeof SYSTEM_PERMISSIONS>;

export type AnyPermission =
  | StockPermission
  | FinancePermission
  | HRPermission
  | SalesPermission
  | AdminPermission
  | ToolsPermission
  | SystemPermission
  | typeof WILDCARD_PERMISSIONS.FULL_ACCESS;

export default PermissionCodes;
