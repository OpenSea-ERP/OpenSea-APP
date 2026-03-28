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
  TEMPLATES: perm(
    'stock',
    'templates',
    'access',
    'register',
    'modify',
    'remove',
    'import'
  ),
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
  INVENTORY: perm(
    'stock',
    'inventory',
    'access',
    'register',
    'modify',
    'remove',
    'admin',
    'export',
    'print'
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
    'remove',
    'admin',
    'import'
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
  FISCAL: perm(
    'finance',
    'fiscal',
    'access',
    'register',
    'modify',
    'remove',
    'export',
    'admin'
  ),
} as const;

// =============================================================================
// HR - Recursos Humanos
// =============================================================================

export const HR_PERMISSIONS = {
  POSITIONS: perm(
    'hr',
    'positions',
    'access',
    'register',
    'modify',
    'remove',
    'import'
  ),
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
  EMPLOYEE_REQUESTS: perm(
    'hr',
    'employee-requests',
    'access',
    'register',
    'admin'
  ),
  ONBOARDING: perm(
    'hr',
    'onboarding',
    'access',
    'register',
    'modify',
    'remove',
    'admin'
  ),
  TIME_CONTROL: perm(
    'hr',
    'time-control',
    'access',
    'register',
    'export',
    'print'
  ),
} as const;

// =============================================================================
// SALES - Gerenciamento de vendas e clientes
// =============================================================================

// Extra actions used by Sales beyond the 10 standard ones
type SalesActions =
  | Actions
  | 'confirm'
  | 'approve'
  | 'cancel'
  | 'reassign'
  | 'reply'
  | 'execute'
  | 'activate'
  | 'send'
  | 'convert'
  | 'sell'
  | 'open'
  | 'close'
  | 'withdraw'
  | 'supply'
  | 'receive'
  | 'verify'
  | 'override'
  | 'publish'
  | 'generate'
  | 'query'
  | 'sync';

type SalesPermBlock<A extends SalesActions> = { [K in Uppercase<A>]: string };

function salesPerm<A extends SalesActions>(
  resource: string,
  ...actions: A[]
): SalesPermBlock<A> {
  const result = {} as Record<string, string>;
  for (const action of actions) {
    result[action.toUpperCase()] = `sales.${resource}.${action}`;
  }
  return result as SalesPermBlock<A>;
}

export const SALES_PERMISSIONS = {
  // --- CRM ---
  CUSTOMERS: salesPerm(
    'customers',
    'access',
    'register',
    'modify',
    'remove',
    'import',
    'export',
    'onlyself',
    'admin'
  ),
  CONTACTS: salesPerm(
    'contacts',
    'access',
    'register',
    'modify',
    'remove',
    'admin',
    'onlyself'
  ),
  DEALS: salesPerm(
    'deals',
    'access',
    'register',
    'modify',
    'remove',
    'reassign',
    'admin',
    'onlyself'
  ),
  PIPELINES: salesPerm('pipelines', 'access', 'admin'),
  ACTIVITIES: salesPerm('activities', 'access', 'register'),
  CONVERSATIONS: salesPerm(
    'conversations',
    'access',
    'reply',
    'reassign',
    'admin'
  ),
  WORKFLOWS: salesPerm('workflows', 'access', 'admin', 'execute'),
  FORMS: salesPerm('forms', 'access', 'admin'),
  PROPOSALS: salesPerm('proposals', 'access', 'register', 'send', 'admin'),
  MSG_TEMPLATES: salesPerm('msg-templates', 'access', 'admin'),
  BLUEPRINTS: salesPerm('blueprints', 'access', 'admin'),
  LANDING_PAGES: salesPerm('landing-pages', 'access', 'admin'),
  CHATBOT: salesPerm('chatbot', 'access', 'admin'),

  // --- Preços ---
  PRICE_TABLES: salesPerm(
    'price-tables',
    'access',
    'register',
    'modify',
    'remove',
    'admin'
  ),
  DISCOUNTS: salesPerm('discounts', 'access', 'admin'),
  COUPONS: salesPerm('coupons', 'access', 'register', 'remove', 'admin'),
  CAMPAIGNS: salesPerm(
    'campaigns',
    'access',
    'register',
    'modify',
    'remove',
    'admin',
    'activate'
  ),
  COMBOS: salesPerm('combos', 'access', 'register', 'remove', 'admin'),
  PAYMENT_CONDITIONS: salesPerm(
    'payment-conditions',
    'access',
    'register',
    'modify',
    'remove',
    'admin'
  ),
  STORE_CREDITS: salesPerm(
    'store-credits',
    'access',
    'register',
    'remove',
    'admin'
  ),

  // --- Promoções (existente) ---
  PROMOTIONS: perm(
    'sales',
    'promotions',
    'access',
    'register',
    'modify',
    'remove'
  ),

  // --- Pedidos (existente, expandido) ---
  ORDERS: salesPerm(
    'orders',
    'access',
    'register',
    'modify',
    'remove',
    'export',
    'print',
    'admin',
    'onlyself',
    'confirm',
    'approve',
    'cancel'
  ),

  // --- Orçamentos ---
  QUOTES: salesPerm(
    'quotes',
    'access',
    'register',
    'modify',
    'remove',
    'convert',
    'send',
    'print',
    'onlyself'
  ),

  // --- Devoluções ---
  RETURNS: salesPerm('returns', 'access', 'register', 'approve', 'admin'),

  // --- Comissões ---
  COMMISSIONS: salesPerm('commissions', 'access', 'admin', 'onlyself'),

  // --- PDV ---
  POS: {
    ACCESS: 'sales.pos.access',
    SELL: 'sales.pos.sell',
    CANCEL: 'sales.pos.cancel',
    OVERRIDE: 'sales.pos.override',
    ADMIN: 'sales.pos.admin',
    ONLYSELF: 'sales.pos.onlyself',
    TERMINALS: {
      ACCESS: 'sales.pos.terminals.access',
      REGISTER: 'sales.pos.terminals.register',
      MODIFY: 'sales.pos.terminals.modify',
      REMOVE: 'sales.pos.terminals.remove',
    },
    SESSIONS: {
      ACCESS: 'sales.pos.sessions.access',
      OPEN: 'sales.pos.sessions.open',
      CLOSE: 'sales.pos.sessions.close',
    },
    TRANSACTIONS: {
      ACCESS: 'sales.pos.transactions.access',
      REGISTER: 'sales.pos.transactions.register',
      CANCEL: 'sales.pos.transactions.cancel',
    },
    CASH: {
      ACCESS: 'sales.pos.cash.access',
      WITHDRAWAL: 'sales.pos.cash.withdrawal',
      SUPPLY: 'sales.pos.cash.supply',
    },
    RECEIVE: 'sales.pos.receive',
  },

  // --- Caixa ---
  CASHIER: salesPerm(
    'cashier',
    'access',
    'open',
    'close',
    'withdraw',
    'supply',
    'receive',
    'verify',
    'override',
    'admin'
  ),

  // --- Preços (extras) ---
  CUSTOMER_PRICES: perm(
    'sales',
    'customer-prices',
    'access',
    'register',
    'modify',
    'remove'
  ),

  // --- Licitações ---
  BIDS: salesPerm('bids', 'access', 'register', 'modify', 'remove', 'admin'),
  BID_PROPOSALS: salesPerm('bid-proposals', 'access', 'admin', 'send'),
  BID_BOT: salesPerm('bid-bot', 'access', 'admin', 'activate'),
  BID_CONTRACTS: salesPerm(
    'bid-contracts',
    'access',
    'admin',
    'register',
    'modify',
    'remove'
  ),
  BID_DOCUMENTS: salesPerm(
    'bid-documents',
    'access',
    'admin',
    'register',
    'modify',
    'remove'
  ),
  BID_EMPENHOS: perm('sales', 'bid-empenhos', 'access', 'register', 'modify'),

  // --- Catálogos e Conteúdo ---
  CATALOGS: salesPerm(
    'catalogs',
    'access',
    'register',
    'modify',
    'remove',
    'admin',
    'publish'
  ),
  BRAND: perm('sales', 'brand', 'access', 'modify'),
  CONTENT: salesPerm(
    'content',
    'access',
    'register',
    'remove',
    'generate',
    'publish',
    'approve',
    'admin'
  ),
  CUSTOMER_PORTAL: perm(
    'sales',
    'customer-portal',
    'access',
    'register',
    'remove'
  ),

  // --- Marketplaces ---
  MARKETPLACES: salesPerm('marketplaces', 'access', 'admin', 'sync'),
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
    'register',
    'modify',
    'remove'
  ),
  MARKETPLACE_PAYMENTS: perm(
    'sales',
    'marketplace-payments',
    'access',
    'register',
    'modify',
    'remove'
  ),

  // --- Analytics ---
  ANALYTICS: salesPerm('analytics', 'access', 'admin', 'export', 'onlyself'),
  ANALYTICS_GOALS: perm(
    'sales',
    'analytics-goals',
    'access',
    'register',
    'modify',
    'remove'
  ),
  ANALYTICS_REPORTS: salesPerm(
    'analytics-reports',
    'access',
    'register',
    'modify',
    'remove',
    'generate'
  ),
  ANALYTICS_DASHBOARDS: perm(
    'sales',
    'analytics-dashboards',
    'access',
    'register',
    'modify',
    'remove'
  ),
  ANALYTICS_RANKINGS: perm('sales', 'analytics-rankings', 'access'),

  // --- Cadências ---
  CADENCES: salesPerm(
    'cadences',
    'access',
    'register',
    'modify',
    'remove',
    'admin'
  ),

  // --- Lead Scoring ---
  LEAD_SCORING: salesPerm(
    'lead-scoring',
    'access',
    'register',
    'modify',
    'remove',
    'admin'
  ),

  // --- Lead Routing ---
  LEAD_ROUTING: salesPerm(
    'lead-routing',
    'access',
    'register',
    'modify',
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
    COMMENTS: perm(
      'tools',
      'tasks.comments',
      'access',
      'register',
      'modify',
      'remove'
    ),
    ATTACHMENTS: perm(
      'tools',
      'tasks.attachments',
      'access',
      'register',
      'remove'
    ),
    LABELS: perm(
      'tools',
      'tasks.labels',
      'access',
      'register',
      'modify',
      'remove'
    ),
    CHECKLISTS: perm(
      'tools',
      'tasks.checklists',
      'access',
      'register',
      'modify',
      'remove'
    ),
    CUSTOM_FIELDS: perm(
      'tools',
      'tasks.customfields',
      'access',
      'register',
      'modify',
      'remove'
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
