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
  CONTACTS: perm(
    'sales',
    'contacts',
    'access',
    'register',
    'modify',
    'remove',
    'admin',
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
  PIPELINES: perm(
    'sales',
    'pipelines',
    'access',
    'admin'
  ),
  PRICE_TABLES: perm(
    'sales',
    'price-tables',
    'access',
    'register',
    'modify',
    'remove'
  ),
  CUSTOMER_PRICES: perm(
    'sales',
    'customer-prices',
    'access',
    'register',
    'modify',
    'remove'
  ),
  CAMPAIGNS: perm(
    'sales',
    'campaigns',
    'access',
    'register',
    'modify',
    'remove'
  ),
  COUPONS: perm(
    'sales',
    'coupons',
    'access',
    'register',
    'remove'
  ),
  COMBOS: perm(
    'sales',
    'combos',
    'access',
    'register',
    'remove'
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
  ANALYTICS_GOALS: perm(
    'sales',
    'analytics-goals',
    'access',
    'register',
    'modify',
    'remove'
  ),
  ANALYTICS_REPORTS: perm(
    'sales',
    'analytics-reports',
    'access',
    'register',
    'modify',
    'remove'
  ),
  ANALYTICS_DASHBOARDS: perm(
    'sales',
    'analytics-dashboards',
    'access',
    'register',
    'modify',
    'remove'
  ),
  ANALYTICS_RANKINGS: perm(
    'sales',
    'analytics-rankings',
    'access'
  ),
  CUSTOMER_PORTAL: perm(
    'sales',
    'customer-portal',
    'access',
    'register',
    'remove'
  ),
  BIDS: perm(
    'sales',
    'bids',
    'access',
    'register',
    'modify',
    'remove',
    'admin'
  ),
  BID_DOCUMENTS: perm(
    'sales',
    'bid-documents',
    'access',
    'register',
    'modify',
    'remove'
  ),
  BID_CONTRACTS: perm(
    'sales',
    'bid-contracts',
    'access',
    'register',
    'modify',
    'remove'
  ),
  BID_EMPENHOS: perm(
    'sales',
    'bid-empenhos',
    'access',
    'register',
    'modify'
  ),
  MARKETPLACE_CONNECTIONS: perm(
    'sales',
    'marketplace-connections',
    'access',
    'register',
    'modify',
    'remove'
  ),
  MARKETPLACE_LISTINGS: perm(
    'sales',
    'marketplace-listings',
    'access',
    'register',
    'modify',
    'remove'
  ),
  MARKETPLACE_ORDERS: perm(
    'sales',
    'marketplace-orders',
    'access',
    'modify'
  ),
  MARKETPLACE_PAYMENTS: perm(
    'sales',
    'marketplace-payments',
    'access'
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
  SIGNATURE: {
    ENVELOPES: perm(
      'tools',
      'signature.envelopes',
      'access',
      'register',
      'modify',
      'remove',
      'admin'
    ),
    CERTIFICATES: perm(
      'tools',
      'signature.certificates',
      'access',
      'register',
      'remove',
      'admin'
    ),
    TEMPLATES: perm(
      'tools',
      'signature.templates',
      'access',
      'register',
      'modify',
      'remove'
    ),
  },
  AI: {
    CHAT: perm('tools', 'ai.chat', 'access'),
    INSIGHTS: perm('tools', 'ai.insights', 'access'),
    CONFIG: perm('tools', 'ai.config', 'access', 'modify'),
    FAVORITES: perm('tools', 'ai.favorites', 'access', 'register', 'remove'),
    ACTIONS: perm('tools', 'ai.actions', 'access'),
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
