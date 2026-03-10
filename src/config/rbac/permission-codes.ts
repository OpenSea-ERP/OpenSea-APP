/**
 * OpenSea OS - Permission Codes
 *
 * Códigos de permissões centralizados do sistema.
 * Gerado com base na estrutura definida pelo backend.
 *
 * Formato: module.resource.action
 *
 * @version 1.0.0
 * @lastUpdated 2026-01-01
 */

// =============================================================================
// CORE - Funcionalidades centrais do sistema
// =============================================================================

export const CORE_PERMISSIONS = {
  USERS: {
    CREATE: 'core.users.create',
    READ: 'core.users.read',
    UPDATE: 'core.users.update',
    DELETE: 'core.users.delete',
    LIST: 'core.users.list',
    MANAGE: 'core.users.manage',
  },
  SESSIONS: {
    READ: 'core.sessions.read',
    DELETE: 'core.sessions.delete',
    LIST: 'core.sessions.list',
    REVOKE: 'core.sessions.revoke',
    REVOKE_ALL: 'core.sessions.revoke-all',
  },
  PROFILES: {
    READ: 'core.profiles.read',
    UPDATE: 'core.profiles.update',
  },
  LABEL_TEMPLATES: {
    CREATE: 'core.label-templates.create',
    READ: 'core.label-templates.read',
    UPDATE: 'core.label-templates.update',
    DELETE: 'core.label-templates.delete',
    LIST: 'core.label-templates.list',
    DUPLICATE: 'core.label-templates.duplicate',
    MANAGE: 'core.label-templates.manage',
  },
  TEAMS: {
    CREATE: 'core.teams.create',
    READ: 'core.teams.read',
    UPDATE: 'core.teams.update',
    DELETE: 'core.teams.delete',
    LIST: 'core.teams.list',
    MANAGE: 'core.teams.manage',
    MEMBERS: {
      ADD: 'core.teams.members.add',
      REMOVE: 'core.teams.members.remove',
      MANAGE: 'core.teams.members.manage',
    },
    EMAILS: {
      LINK: 'core.teams.emails.link',
      READ: 'core.teams.emails.read',
      MANAGE: 'core.teams.emails.manage',
      UNLINK: 'core.teams.emails.unlink',
    },
  },
} as const;

// =============================================================================
// STOCK - Gerenciamento de estoque e inventário
// =============================================================================

export const STOCK_PERMISSIONS = {
  PRODUCTS: {
    CREATE: 'stock.products.create',
    READ: 'stock.products.read',
    UPDATE: 'stock.products.update',
    DELETE: 'stock.products.delete',
    LIST: 'stock.products.list',
    REQUEST: 'stock.products.request',
    APPROVE: 'stock.products.approve',
    MANAGE: 'stock.products.manage',
  },
  VARIANTS: {
    CREATE: 'stock.variants.create',
    READ: 'stock.variants.read',
    UPDATE: 'stock.variants.update',
    DELETE: 'stock.variants.delete',
    LIST: 'stock.variants.list',
    REQUEST: 'stock.variants.request',
    APPROVE: 'stock.variants.approve',
    MANAGE: 'stock.variants.manage',
  },
  ITEMS: {
    CREATE: 'stock.items.create',
    READ: 'stock.items.read',
    UPDATE: 'stock.items.update',
    DELETE: 'stock.items.delete',
    LIST: 'stock.items.list',
    ENTRY: 'stock.items.entry',
    EXIT: 'stock.items.exit',
    TRANSFER: 'stock.items.transfer',
    REQUEST: 'stock.items.request',
    APPROVE: 'stock.items.approve',
    MANAGE: 'stock.items.manage',
  },
  MOVEMENTS: {
    CREATE: 'stock.movements.create',
    READ: 'stock.movements.read',
    LIST: 'stock.movements.list',
    APPROVE: 'stock.movements.approve',
  },
  SUPPLIERS: {
    CREATE: 'stock.suppliers.create',
    READ: 'stock.suppliers.read',
    UPDATE: 'stock.suppliers.update',
    DELETE: 'stock.suppliers.delete',
    LIST: 'stock.suppliers.list',
    MANAGE: 'stock.suppliers.manage',
  },
  MANUFACTURERS: {
    CREATE: 'stock.manufacturers.create',
    READ: 'stock.manufacturers.read',
    UPDATE: 'stock.manufacturers.update',
    DELETE: 'stock.manufacturers.delete',
    LIST: 'stock.manufacturers.list',
    MANAGE: 'stock.manufacturers.manage',
  },
  LOCATIONS: {
    CREATE: 'stock.locations.create',
    READ: 'stock.locations.read',
    UPDATE: 'stock.locations.update',
    DELETE: 'stock.locations.delete',
    LIST: 'stock.locations.list',
    MANAGE: 'stock.locations.manage',
  },
  CATEGORIES: {
    CREATE: 'stock.categories.create',
    READ: 'stock.categories.read',
    UPDATE: 'stock.categories.update',
    DELETE: 'stock.categories.delete',
    LIST: 'stock.categories.list',
    MANAGE: 'stock.categories.manage',
  },
  TAGS: {
    CREATE: 'stock.tags.create',
    READ: 'stock.tags.read',
    UPDATE: 'stock.tags.update',
    DELETE: 'stock.tags.delete',
    LIST: 'stock.tags.list',
    MANAGE: 'stock.tags.manage',
  },
  TEMPLATES: {
    CREATE: 'stock.templates.create',
    READ: 'stock.templates.read',
    UPDATE: 'stock.templates.update',
    DELETE: 'stock.templates.delete',
    LIST: 'stock.templates.list',
    MANAGE: 'stock.templates.manage',
  },
  PURCHASE_ORDERS: {
    CREATE: 'stock.purchase-orders.create',
    READ: 'stock.purchase-orders.read',
    UPDATE: 'stock.purchase-orders.update',
    DELETE: 'stock.purchase-orders.delete',
    LIST: 'stock.purchase-orders.list',
    APPROVE: 'stock.purchase-orders.approve',
    CANCEL: 'stock.purchase-orders.cancel',
    MANAGE: 'stock.purchase-orders.manage',
  },
  CARE: {
    READ: 'stock.care.read',
    LIST: 'stock.care.list',
    SET: 'stock.care.set',
  },
  BINS: {
    READ: 'stock.bins.read',
    UPDATE: 'stock.bins.update',
    LIST: 'stock.bins.list',
    SEARCH: 'stock.bins.search',
    MANAGE: 'stock.bins.manage',
  },
  ZONES: {
    CREATE: 'stock.zones.create',
    READ: 'stock.zones.read',
    UPDATE: 'stock.zones.update',
    DELETE: 'stock.zones.delete',
    LIST: 'stock.zones.list',
    CONFIGURE: 'stock.zones.configure',
    MANAGE: 'stock.zones.manage',
  },
  WAREHOUSES: {
    CREATE: 'stock.warehouses.create',
    READ: 'stock.warehouses.read',
    UPDATE: 'stock.warehouses.update',
    DELETE: 'stock.warehouses.delete',
    LIST: 'stock.warehouses.list',
    MANAGE: 'stock.warehouses.manage',
  },
  VOLUMES: {
    CREATE: 'stock.volumes.create',
    READ: 'stock.volumes.read',
    UPDATE: 'stock.volumes.update',
    DELETE: 'stock.volumes.delete',
    LIST: 'stock.volumes.list',
    MANAGE: 'stock.volumes.manage',
    CLOSE: 'stock.volumes.close',
    REOPEN: 'stock.volumes.reopen',
    DELIVER: 'stock.volumes.deliver',
    RETURN: 'stock.volumes.return',
    ADD_ITEM: 'stock.volumes.add-item',
    REMOVE_ITEM: 'stock.volumes.remove-item',
    ROMANEIO: 'stock.volumes.romaneio',
  },
} as const;

// =============================================================================
// SALES - Gerenciamento de vendas e clientes
// =============================================================================

export const SALES_PERMISSIONS = {
  CUSTOMERS: {
    CREATE: 'sales.customers.create',
    READ: 'sales.customers.read',
    UPDATE: 'sales.customers.update',
    DELETE: 'sales.customers.delete',
    LIST: 'sales.customers.list',
    MANAGE: 'sales.customers.manage',
  },
  ORDERS: {
    CREATE: 'sales.orders.create',
    READ: 'sales.orders.read',
    UPDATE: 'sales.orders.update',
    DELETE: 'sales.orders.delete',
    LIST: 'sales.orders.list',
    REQUEST: 'sales.orders.request',
    APPROVE: 'sales.orders.approve',
    CANCEL: 'sales.orders.cancel',
    MANAGE: 'sales.orders.manage',
  },
  PROMOTIONS: {
    CREATE: 'sales.promotions.create',
    READ: 'sales.promotions.read',
    UPDATE: 'sales.promotions.update',
    DELETE: 'sales.promotions.delete',
    LIST: 'sales.promotions.list',
    MANAGE: 'sales.promotions.manage',
  },
  RESERVATIONS: {
    CREATE: 'sales.reservations.create',
    READ: 'sales.reservations.read',
    UPDATE: 'sales.reservations.update',
    DELETE: 'sales.reservations.delete',
    LIST: 'sales.reservations.list',
    RELEASE: 'sales.reservations.release',
    MANAGE: 'sales.reservations.manage',
  },
  COMMENTS: {
    CREATE: 'sales.comments.create',
    READ: 'sales.comments.read',
    UPDATE: 'sales.comments.update',
    DELETE: 'sales.comments.delete',
    LIST: 'sales.comments.list',
    MANAGE: 'sales.comments.manage',
  },
  NOTIFICATIONS: {
    CREATE: 'sales.notifications.create',
    READ: 'sales.notifications.read',
    UPDATE: 'sales.notifications.update',
    DELETE: 'sales.notifications.delete',
    LIST: 'sales.notifications.list',
  },
} as const;

// =============================================================================
// REQUESTS - Sistema de requisições
// =============================================================================

export const REQUESTS_PERMISSIONS = {
  REQUESTS: {
    CREATE: 'requests.requests.create',
    READ: 'requests.requests.read',
    UPDATE: 'requests.requests.update',
    DELETE: 'requests.requests.delete',
    LIST: 'requests.requests.list',
    ASSIGN: 'requests.requests.assign',
    COMPLETE: 'requests.requests.complete',
    REJECT: 'requests.requests.reject',
    MANAGE: 'requests.requests.manage',
  },
  COMMENTS: {
    CREATE: 'requests.comments.create',
    READ: 'requests.comments.read',
    UPDATE: 'requests.comments.update',
    DELETE: 'requests.comments.delete',
    LIST: 'requests.comments.list',
  },
  ATTACHMENTS: {
    CREATE: 'requests.attachments.create',
    READ: 'requests.attachments.read',
    DELETE: 'requests.attachments.delete',
    LIST: 'requests.attachments.list',
  },
} as const;

// =============================================================================
// RBAC - Controle de Acesso Baseado em Funções
// =============================================================================

export const RBAC_PERMISSIONS = {
  PERMISSIONS: {
    CREATE: 'rbac.permissions.create',
    READ: 'rbac.permissions.read',
    UPDATE: 'rbac.permissions.update',
    DELETE: 'rbac.permissions.delete',
    LIST: 'rbac.permissions.list',
  },
  GROUPS: {
    CREATE: 'rbac.groups.create',
    READ: 'rbac.groups.read',
    UPDATE: 'rbac.groups.update',
    DELETE: 'rbac.groups.delete',
    LIST: 'rbac.groups.list',
    ASSIGN: 'rbac.groups.assign',
    MANAGE: 'rbac.groups.manage',
  },
  AUDIT: {
    READ: 'rbac.audit.read',
    LIST: 'rbac.audit.list',
  },
  ASSIGNMENTS: {
    CREATE: 'rbac.assignments.create',
    READ: 'rbac.assignments.read',
    UPDATE: 'rbac.assignments.update',
    DELETE: 'rbac.assignments.delete',
    LIST: 'rbac.assignments.list',
    MANAGE: 'rbac.assignments.manage',
  },
  ASSOCIATIONS: {
    CREATE: 'rbac.associations.create',
    READ: 'rbac.associations.read',
    UPDATE: 'rbac.associations.update',
    DELETE: 'rbac.associations.delete',
    LIST: 'rbac.associations.list',
    MANAGE: 'rbac.associations.manage',
  },
  USER_GROUPS: {
    CREATE: 'rbac.user-groups.create',
    READ: 'rbac.user-groups.read',
    UPDATE: 'rbac.user-groups.update',
    DELETE: 'rbac.user-groups.delete',
    LIST: 'rbac.user-groups.list',
    MANAGE: 'rbac.user-groups.manage',
  },
  USER_PERMISSIONS: {
    CREATE: 'rbac.user-permissions.create',
    READ: 'rbac.user-permissions.read',
    UPDATE: 'rbac.user-permissions.update',
    DELETE: 'rbac.user-permissions.delete',
    LIST: 'rbac.user-permissions.list',
    MANAGE: 'rbac.user-permissions.manage',
  },
} as const;

// =============================================================================
// AUDIT - Auditoria e histórico do sistema
// =============================================================================

export const AUDIT_PERMISSIONS = {
  LOGS: {
    VIEW: 'audit.logs.view',
    SEARCH: 'audit.logs.search',
  },
  HISTORY: {
    VIEW: 'audit.history.view',
  },
  ROLLBACK: {
    PREVIEW: 'audit.rollback.preview',
    EXECUTE: 'audit.rollback.execute',
  },
  COMPARE: {
    VIEW: 'audit.compare.view',
    SEARCH: 'audit.compare.search',
  },
} as const;

// =============================================================================
// HR - Recursos Humanos
// =============================================================================

export const HR_PERMISSIONS = {
  COMPANIES: {
    CREATE: 'hr.companies.create',
    READ: 'hr.companies.read',
    UPDATE: 'hr.companies.update',
    DELETE: 'hr.companies.delete',
    LIST: 'hr.companies.list',
    MANAGE: 'hr.companies.manage',
  },
  EMPLOYEES: {
    CREATE: 'hr.employees.create',
    READ: 'hr.employees.read',
    READ_ALL: 'hr.employees.read.all',
    READ_TEAM: 'hr.employees.read.team',
    UPDATE: 'hr.employees.update',
    UPDATE_ALL: 'hr.employees.update.all',
    UPDATE_TEAM: 'hr.employees.update.team',
    DELETE: 'hr.employees.delete',
    LIST: 'hr.employees.list',
    MANAGE: 'hr.employees.manage',
    TERMINATE: 'hr.employees.terminate',
  },
  DEPARTMENTS: {
    CREATE: 'hr.departments.create',
    READ: 'hr.departments.read',
    UPDATE: 'hr.departments.update',
    DELETE: 'hr.departments.delete',
    LIST: 'hr.departments.list',
    MANAGE: 'hr.departments.manage',
  },
  POSITIONS: {
    CREATE: 'hr.positions.create',
    READ: 'hr.positions.read',
    UPDATE: 'hr.positions.update',
    DELETE: 'hr.positions.delete',
    LIST: 'hr.positions.list',
    MANAGE: 'hr.positions.manage',
  },
  ABSENCES: {
    CREATE: 'hr.absences.create',
    READ: 'hr.absences.read',
    READ_ALL: 'hr.absences.read.all',
    READ_TEAM: 'hr.absences.read.team',
    UPDATE: 'hr.absences.update',
    UPDATE_ALL: 'hr.absences.update.all',
    UPDATE_TEAM: 'hr.absences.update.team',
    DELETE: 'hr.absences.delete',
    LIST: 'hr.absences.list',
    APPROVE: 'hr.absences.approve',
    APPROVE_ALL: 'hr.absences.approve.all',
    APPROVE_TEAM: 'hr.absences.approve.team',
    MANAGE: 'hr.absences.manage',
  },
  VACATIONS: {
    CREATE: 'hr.vacations.create',
    READ: 'hr.vacations.read',
    READ_ALL: 'hr.vacations.read.all',
    READ_TEAM: 'hr.vacations.read.team',
    UPDATE: 'hr.vacations.update',
    UPDATE_ALL: 'hr.vacations.update.all',
    UPDATE_TEAM: 'hr.vacations.update.team',
    DELETE: 'hr.vacations.delete',
    LIST: 'hr.vacations.list',
    APPROVE: 'hr.vacations.approve',
    APPROVE_ALL: 'hr.vacations.approve.all',
    APPROVE_TEAM: 'hr.vacations.approve.team',
    MANAGE: 'hr.vacations.manage',
  },
  TIME_ENTRIES: {
    CREATE: 'hr.time-entries.create',
    READ: 'hr.time-entries.read',
    READ_ALL: 'hr.time-entries.read.all',
    READ_TEAM: 'hr.time-entries.read.team',
    UPDATE: 'hr.time-entries.update',
    UPDATE_ALL: 'hr.time-entries.update.all',
    UPDATE_TEAM: 'hr.time-entries.update.team',
    DELETE: 'hr.time-entries.delete',
    LIST: 'hr.time-entries.list',
  },
  OVERTIME: {
    CREATE: 'hr.overtime.create',
    READ: 'hr.overtime.read',
    READ_ALL: 'hr.overtime.read.all',
    READ_TEAM: 'hr.overtime.read.team',
    UPDATE: 'hr.overtime.update',
    UPDATE_ALL: 'hr.overtime.update.all',
    UPDATE_TEAM: 'hr.overtime.update.team',
    DELETE: 'hr.overtime.delete',
    LIST: 'hr.overtime.list',
    APPROVE: 'hr.overtime.approve',
    APPROVE_ALL: 'hr.overtime.approve.all',
    APPROVE_TEAM: 'hr.overtime.approve.team',
  },
  TIME_BANK: {
    CREATE: 'hr.time-bank.create',
    READ: 'hr.time-bank.read',
    READ_ALL: 'hr.time-bank.read.all',
    READ_TEAM: 'hr.time-bank.read.team',
    UPDATE: 'hr.time-bank.update',
    UPDATE_ALL: 'hr.time-bank.update.all',
    UPDATE_TEAM: 'hr.time-bank.update.team',
    DELETE: 'hr.time-bank.delete',
    LIST: 'hr.time-bank.list',
    MANAGE: 'hr.time-bank.manage',
  },
  PAYROLL: {
    CREATE: 'hr.payroll.create',
    READ: 'hr.payroll.read',
    UPDATE: 'hr.payroll.update',
    DELETE: 'hr.payroll.delete',
    LIST: 'hr.payroll.list',
    PROCESS: 'hr.payroll.process',
    APPROVE: 'hr.payroll.approve',
    MANAGE: 'hr.payroll.manage',
  },
  WORK_SCHEDULES: {
    CREATE: 'hr.work-schedules.create',
    READ: 'hr.work-schedules.read',
    UPDATE: 'hr.work-schedules.update',
    DELETE: 'hr.work-schedules.delete',
    LIST: 'hr.work-schedules.list',
    MANAGE: 'hr.work-schedules.manage',
  },
  BONUSES: {
    CREATE: 'hr.bonuses.create',
    READ: 'hr.bonuses.read',
    UPDATE: 'hr.bonuses.update',
    DELETE: 'hr.bonuses.delete',
    LIST: 'hr.bonuses.list',
    MANAGE: 'hr.bonuses.manage',
  },
  DEDUCTIONS: {
    CREATE: 'hr.deductions.create',
    READ: 'hr.deductions.read',
    UPDATE: 'hr.deductions.update',
    DELETE: 'hr.deductions.delete',
    LIST: 'hr.deductions.list',
    MANAGE: 'hr.deductions.manage',
  },
} as const;

// =============================================================================
// FINANCE - Gestão Financeira
// =============================================================================

export const FINANCE_PERMISSIONS = {
  COMPANIES: {
    CREATE: 'finance.companies.create',
    READ: 'finance.companies.read',
    UPDATE: 'finance.companies.update',
    DELETE: 'finance.companies.delete',
    LIST: 'finance.companies.list',
    MANAGE: 'finance.companies.manage',
  },
  COST_CENTERS: {
    CREATE: 'finance.cost-centers.create',
    READ: 'finance.cost-centers.read',
    UPDATE: 'finance.cost-centers.update',
    DELETE: 'finance.cost-centers.delete',
    LIST: 'finance.cost-centers.list',
    MANAGE: 'finance.cost-centers.manage',
  },
  BANK_ACCOUNTS: {
    CREATE: 'finance.bank-accounts.create',
    READ: 'finance.bank-accounts.read',
    UPDATE: 'finance.bank-accounts.update',
    DELETE: 'finance.bank-accounts.delete',
    LIST: 'finance.bank-accounts.list',
    MANAGE: 'finance.bank-accounts.manage',
  },
  CATEGORIES: {
    CREATE: 'finance.categories.create',
    READ: 'finance.categories.read',
    UPDATE: 'finance.categories.update',
    DELETE: 'finance.categories.delete',
    LIST: 'finance.categories.list',
    MANAGE: 'finance.categories.manage',
  },
  ENTRIES: {
    CREATE: 'finance.entries.create',
    READ: 'finance.entries.read',
    UPDATE: 'finance.entries.update',
    DELETE: 'finance.entries.delete',
    LIST: 'finance.entries.list',
    PAY: 'finance.entries.pay',
    CANCEL: 'finance.entries.cancel',
    MANAGE: 'finance.entries.manage',
  },
  LOANS: {
    CREATE: 'finance.loans.create',
    READ: 'finance.loans.read',
    UPDATE: 'finance.loans.update',
    DELETE: 'finance.loans.delete',
    LIST: 'finance.loans.list',
    PAY: 'finance.loans.pay',
    MANAGE: 'finance.loans.manage',
  },
  CONSORTIA: {
    CREATE: 'finance.consortia.create',
    READ: 'finance.consortia.read',
    UPDATE: 'finance.consortia.update',
    DELETE: 'finance.consortia.delete',
    LIST: 'finance.consortia.list',
    PAY: 'finance.consortia.pay',
    MANAGE: 'finance.consortia.manage',
  },
  CONTRACTS: {
    CREATE: 'finance.contracts.create',
    READ: 'finance.contracts.read',
    UPDATE: 'finance.contracts.update',
    DELETE: 'finance.contracts.delete',
    LIST: 'finance.contracts.list',
    MANAGE: 'finance.contracts.manage',
  },
  DASHBOARD: {
    VIEW: 'finance.dashboard.view',
  },
  EXPORT: {
    GENERATE: 'finance.export.generate',
  },
} as const;

// =============================================================================
// SELF - Operações do próprio usuário
// =============================================================================

export const SELF_PERMISSIONS = {
  PROFILE: {
    READ: 'self.profile.read',
    UPDATE: 'self.profile.update',
    UPDATE_EMAIL: 'self.profile.update-email',
    UPDATE_PASSWORD: 'self.profile.update-password',
    UPDATE_USERNAME: 'self.profile.update-username',
    DELETE: 'self.profile.delete',
  },
  SESSIONS: {
    READ: 'self.sessions.read',
    LIST: 'self.sessions.list',
    REVOKE: 'self.sessions.revoke',
  },
  PERMISSIONS: {
    READ: 'self.permissions.read',
    LIST: 'self.permissions.list',
  },
  GROUPS: {
    READ: 'self.groups.read',
    LIST: 'self.groups.list',
  },
  AUDIT: {
    READ: 'self.audit.read',
    LIST: 'self.audit.list',
  },
} as const;

// =============================================================================
// NOTIFICATIONS - Sistema de notificações
// =============================================================================

export const NOTIFICATIONS_PERMISSIONS = {
  NOTIFICATIONS: {
    SEND: 'notifications.notifications.send',
    BROADCAST: 'notifications.notifications.broadcast',
    SCHEDULE: 'notifications.notifications.schedule',
    MANAGE: 'notifications.notifications.manage',
  },
} as const;

// =============================================================================
// SETTINGS - Configurações do sistema
// =============================================================================

export const SETTINGS_PERMISSIONS = {
  SYSTEM: {
    VIEW: 'settings.system.view',
    UPDATE: 'settings.system.update',
    MANAGE: 'settings.system.manage',
  },
  COMPANY: {
    VIEW: 'settings.company.view',
    UPDATE: 'settings.company.update',
    MANAGE: 'settings.company.manage',
  },
  INTEGRATIONS: {
    VIEW: 'settings.integrations.view',
    MANAGE: 'settings.integrations.manage',
    CONFIGURE: 'settings.integrations.configure',
  },
  NOTIFICATIONS: {
    VIEW: 'settings.notifications.view',
    MANAGE: 'settings.notifications.manage',
    CONFIGURE: 'settings.notifications.configure',
  },
  BACKUP: {
    VIEW: 'settings.backup.view',
    CREATE: 'settings.backup.create',
    RESTORE: 'settings.backup.restore',
    MANAGE: 'settings.backup.manage',
  },
} as const;

// =============================================================================
// REPORTS - Relatórios do sistema
// =============================================================================

export const REPORTS_PERMISSIONS = {
  STOCK: {
    VIEW: 'reports.stock.view',
    GENERATE: 'reports.stock.generate',
    INVENTORY: 'reports.stock.inventory',
    MOVEMENTS: 'reports.stock.movements',
    LOW_STOCK: 'reports.stock.low-stock',
    VALUATION: 'reports.stock.valuation',
    EXPIRATION: 'reports.stock.expiration',
  },
  SALES: {
    VIEW: 'reports.sales.view',
    GENERATE: 'reports.sales.generate',
    BY_PERIOD: 'reports.sales.by-period',
    BY_CUSTOMER: 'reports.sales.by-customer',
    BY_PRODUCT: 'reports.sales.by-product',
  },
  HR: {
    VIEW: 'reports.hr.view',
    GENERATE: 'reports.hr.generate',
    EMPLOYEES: 'reports.hr.employees',
    ABSENCES: 'reports.hr.absences',
    PAYROLL: 'reports.hr.payroll',
  },
  FINANCIAL: {
    VIEW: 'reports.financial.view',
    GENERATE: 'reports.financial.generate',
    SUMMARY: 'reports.financial.summary',
    DETAILED: 'reports.financial.detailed',
  },
  AUDIT: {
    VIEW: 'reports.audit.view',
    GENERATE: 'reports.audit.generate',
  },
} as const;

// =============================================================================
// DATA - Importação e exportação de dados
// =============================================================================

export const DATA_PERMISSIONS = {
  IMPORT: {
    PRODUCTS: 'data.import.products',
    VARIANTS: 'data.import.variants',
    CUSTOMERS: 'data.import.customers',
    SUPPLIERS: 'data.import.suppliers',
    EMPLOYEES: 'data.import.employees',
    CATEGORIES: 'data.import.categories',
    BULK: 'data.import.bulk',
  },
  EXPORT: {
    PRODUCTS: 'data.export.products',
    VARIANTS: 'data.export.variants',
    CUSTOMERS: 'data.export.customers',
    SUPPLIERS: 'data.export.suppliers',
    EMPLOYEES: 'data.export.employees',
    ORDERS: 'data.export.orders',
    MOVEMENTS: 'data.export.movements',
    REPORTS: 'data.export.reports',
    AUDIT: 'data.export.audit',
  },
  PRINT: {
    BARCODES: 'data.print.barcodes',
    RECEIPTS: 'data.print.receipts',
    INVOICES: 'data.print.invoices',
    CONTRACTS: 'data.print.contracts',
    PAYSLIPS: 'data.print.payslips',
    BADGES: 'data.print.badges',
  },
} as const;

// =============================================================================
// CALENDAR - Agenda Corporativa
// =============================================================================

export const CALENDAR_PERMISSIONS = {
  EVENTS: {
    CREATE: 'calendar.events.create',
    READ: 'calendar.events.read',
    UPDATE: 'calendar.events.update',
    DELETE: 'calendar.events.delete',
    LIST: 'calendar.events.list',
    MANAGE: 'calendar.events.manage',
    SHARE_USERS: 'calendar.events.share-users',
    SHARE_TEAMS: 'calendar.events.share-teams',
    EXPORT: 'calendar.events.export',
  },
  PARTICIPANTS: {
    INVITE: 'calendar.participants.invite',
    RESPOND: 'calendar.participants.respond',
    MANAGE: 'calendar.participants.manage',
  },
  REMINDERS: {
    CREATE: 'calendar.reminders.create',
    DELETE: 'calendar.reminders.delete',
  },
} as const;

// =============================================================================
// EMAIL - Gestão de E-mails
// =============================================================================

export const EMAIL_PERMISSIONS = {
  ACCOUNTS: {
    CREATE: 'email.accounts.create',
    READ: 'email.accounts.read',
    UPDATE: 'email.accounts.update',
    DELETE: 'email.accounts.delete',
    LIST: 'email.accounts.list',
    SHARE: 'email.accounts.share',
  },
  MESSAGES: {
    READ: 'email.messages.read',
    LIST: 'email.messages.list',
    SEND: 'email.messages.send',
    UPDATE: 'email.messages.update',
    DELETE: 'email.messages.delete',
  },
  SYNC: {
    EXECUTE: 'email.sync.execute',
  },
} as const;

// =============================================================================
// UI - Visibilidade de interface e menus
// =============================================================================

export const UI_PERMISSIONS = {
  MENU: {
    DASHBOARD: 'ui.menu.dashboard',
    STOCK: 'ui.menu.stock',
    SALES: 'ui.menu.sales',
    HR: 'ui.menu.hr',
    FINANCE: 'ui.menu.finance',
    RBAC: 'ui.menu.rbac',
    AUDIT: 'ui.menu.audit',
    REPORTS: 'ui.menu.reports',
    SETTINGS: 'ui.menu.settings',
    REQUESTS: 'ui.menu.requests',
    NOTIFICATIONS: 'ui.menu.notifications',
    CALENDAR: 'ui.menu.calendar',
    EMAIL: 'ui.menu.email',
    // Submenus
    STOCK_LOCATIONS: 'ui.menu.stock.locations',
    STOCK_PURCHASE_ORDERS: 'ui.menu.stock.purchase-orders',
    STOCK_ZONES: 'ui.menu.stock.zones',
    SALES_ORDERS: 'ui.menu.sales.orders',
    HR_TIME_CONTROL: 'ui.menu.hr.time-control',
  },
  DASHBOARD: {
    SALES_SUMMARY: 'ui.dashboard.sales-summary',
    STOCK_ALERTS: 'ui.dashboard.stock-alerts',
    HR_SUMMARY: 'ui.dashboard.hr-summary',
    FINANCIAL_SUMMARY: 'ui.dashboard.financial-summary',
    RECENT_ACTIVITY: 'ui.dashboard.recent-activity',
    PENDING_REQUESTS: 'ui.dashboard.pending-requests',
  },
  STOCK_SUBMENUS: {
    PRODUCTS: 'ui.menu.stock.products',
    VARIANTS: 'ui.menu.stock.variants',
    ITEMS: 'ui.menu.stock.items',
    MOVEMENTS: 'ui.menu.stock.movements',
    SUPPLIERS: 'ui.menu.stock.suppliers',
    MANUFACTURERS: 'ui.menu.stock.manufacturers',
    LOCATIONS: 'ui.menu.stock.locations',
    WAREHOUSES: 'ui.menu.stock.warehouses',
    ZONES: 'ui.menu.stock.zones',
    BINS: 'ui.menu.stock.bins',
    CATEGORIES: 'ui.menu.stock.categories',
    TAGS: 'ui.menu.stock.tags',
    TEMPLATES: 'ui.menu.stock.templates',
    PURCHASE_ORDERS: 'ui.menu.stock.purchase-orders',
  },
  SALES_SUBMENUS: {
    CUSTOMERS: 'ui.menu.sales.customers',
    ORDERS: 'ui.menu.sales.orders',
    PROMOTIONS: 'ui.menu.sales.promotions',
    RESERVATIONS: 'ui.menu.sales.reservations',
  },
  HR_SUBMENUS: {
    EMPLOYEES: 'ui.menu.hr.employees',
    DEPARTMENTS: 'ui.menu.hr.departments',
    POSITIONS: 'ui.menu.hr.positions',
    ABSENCES: 'ui.menu.hr.absences',
    VACATIONS: 'ui.menu.hr.vacations',
    OVERTIME: 'ui.menu.hr.overtime',
    PAYROLL: 'ui.menu.hr.payroll',
    TIME_BANK: 'ui.menu.hr.time-bank',
    COMPANIES: 'ui.menu.hr.companies',
    WORK_SCHEDULES: 'ui.menu.hr.work-schedules',
    BONUSES: 'ui.menu.hr.bonuses',
    DEDUCTIONS: 'ui.menu.hr.deductions',
    TIME_CONTROL: 'ui.menu.hr.time-control',
  },
  FINANCE_SUBMENUS: {
    OVERVIEW: 'ui.menu.finance.overview',
    PAYABLE: 'ui.menu.finance.payable',
    RECEIVABLE: 'ui.menu.finance.receivable',
    BANK_ACCOUNTS: 'ui.menu.finance.bank-accounts',
    COST_CENTERS: 'ui.menu.finance.cost-centers',
    CATEGORIES: 'ui.menu.finance.categories',
    COMPANIES: 'ui.menu.finance.companies',
    LOANS: 'ui.menu.finance.loans',
    CONSORTIA: 'ui.menu.finance.consortia',
    CASHFLOW: 'ui.menu.finance.cashflow',
    EXPORT: 'ui.menu.finance.export',
  },
} as const;

// =============================================================================
// WILDCARD - Permissões especiais
// =============================================================================

export const WILDCARD_PERMISSIONS = {
  /** Acesso total ao sistema (Super Admin) */
  FULL_ACCESS: '*.*.*',
} as const;

// =============================================================================
// EXPORTS AGREGADOS
// =============================================================================

/**
 * Objeto centralizado com todas as permissões do sistema
 */
export const PermissionCodes = {
  CORE: CORE_PERMISSIONS,
  STOCK: STOCK_PERMISSIONS,
  SALES: SALES_PERMISSIONS,
  REQUESTS: REQUESTS_PERMISSIONS,
  RBAC: RBAC_PERMISSIONS,
  AUDIT: AUDIT_PERMISSIONS,
  HR: HR_PERMISSIONS,
  FINANCE: FINANCE_PERMISSIONS,
  SELF: SELF_PERMISSIONS,
  NOTIFICATIONS: NOTIFICATIONS_PERMISSIONS,
  SETTINGS: SETTINGS_PERMISSIONS,
  REPORTS: REPORTS_PERMISSIONS,
  DATA: DATA_PERMISSIONS,
  CALENDAR: CALENDAR_PERMISSIONS,
  EMAIL: EMAIL_PERMISSIONS,
  UI: UI_PERMISSIONS,
  WILDCARD: WILDCARD_PERMISSIONS,
} as const;

// =============================================================================
// TYPES
// =============================================================================

export type PermissionCode = string;

export type CorePermission =
  | (typeof CORE_PERMISSIONS.USERS)[keyof typeof CORE_PERMISSIONS.USERS]
  | (typeof CORE_PERMISSIONS.SESSIONS)[keyof typeof CORE_PERMISSIONS.SESSIONS]
  | (typeof CORE_PERMISSIONS.PROFILES)[keyof typeof CORE_PERMISSIONS.PROFILES];

export type StockPermission =
  | (typeof STOCK_PERMISSIONS.PRODUCTS)[keyof typeof STOCK_PERMISSIONS.PRODUCTS]
  | (typeof STOCK_PERMISSIONS.VARIANTS)[keyof typeof STOCK_PERMISSIONS.VARIANTS]
  | (typeof STOCK_PERMISSIONS.ITEMS)[keyof typeof STOCK_PERMISSIONS.ITEMS]
  | (typeof STOCK_PERMISSIONS.MOVEMENTS)[keyof typeof STOCK_PERMISSIONS.MOVEMENTS]
  | (typeof STOCK_PERMISSIONS.SUPPLIERS)[keyof typeof STOCK_PERMISSIONS.SUPPLIERS]
  | (typeof STOCK_PERMISSIONS.MANUFACTURERS)[keyof typeof STOCK_PERMISSIONS.MANUFACTURERS]
  | (typeof STOCK_PERMISSIONS.LOCATIONS)[keyof typeof STOCK_PERMISSIONS.LOCATIONS]
  | (typeof STOCK_PERMISSIONS.CATEGORIES)[keyof typeof STOCK_PERMISSIONS.CATEGORIES]
  | (typeof STOCK_PERMISSIONS.TAGS)[keyof typeof STOCK_PERMISSIONS.TAGS]
  | (typeof STOCK_PERMISSIONS.TEMPLATES)[keyof typeof STOCK_PERMISSIONS.TEMPLATES]
  | (typeof STOCK_PERMISSIONS.PURCHASE_ORDERS)[keyof typeof STOCK_PERMISSIONS.PURCHASE_ORDERS]
  | (typeof STOCK_PERMISSIONS.CARE)[keyof typeof STOCK_PERMISSIONS.CARE]
  | (typeof STOCK_PERMISSIONS.BINS)[keyof typeof STOCK_PERMISSIONS.BINS]
  | (typeof STOCK_PERMISSIONS.ZONES)[keyof typeof STOCK_PERMISSIONS.ZONES]
  | (typeof STOCK_PERMISSIONS.WAREHOUSES)[keyof typeof STOCK_PERMISSIONS.WAREHOUSES]
  | (typeof STOCK_PERMISSIONS.VOLUMES)[keyof typeof STOCK_PERMISSIONS.VOLUMES];

export type HRPermission =
  | (typeof HR_PERMISSIONS.COMPANIES)[keyof typeof HR_PERMISSIONS.COMPANIES]
  | (typeof HR_PERMISSIONS.EMPLOYEES)[keyof typeof HR_PERMISSIONS.EMPLOYEES]
  | (typeof HR_PERMISSIONS.DEPARTMENTS)[keyof typeof HR_PERMISSIONS.DEPARTMENTS]
  | (typeof HR_PERMISSIONS.POSITIONS)[keyof typeof HR_PERMISSIONS.POSITIONS]
  | (typeof HR_PERMISSIONS.ABSENCES)[keyof typeof HR_PERMISSIONS.ABSENCES]
  | (typeof HR_PERMISSIONS.VACATIONS)[keyof typeof HR_PERMISSIONS.VACATIONS]
  | (typeof HR_PERMISSIONS.TIME_ENTRIES)[keyof typeof HR_PERMISSIONS.TIME_ENTRIES]
  | (typeof HR_PERMISSIONS.OVERTIME)[keyof typeof HR_PERMISSIONS.OVERTIME]
  | (typeof HR_PERMISSIONS.TIME_BANK)[keyof typeof HR_PERMISSIONS.TIME_BANK]
  | (typeof HR_PERMISSIONS.PAYROLL)[keyof typeof HR_PERMISSIONS.PAYROLL];

export type FinancePermission =
  | (typeof FINANCE_PERMISSIONS.COMPANIES)[keyof typeof FINANCE_PERMISSIONS.COMPANIES]
  | (typeof FINANCE_PERMISSIONS.COST_CENTERS)[keyof typeof FINANCE_PERMISSIONS.COST_CENTERS]
  | (typeof FINANCE_PERMISSIONS.BANK_ACCOUNTS)[keyof typeof FINANCE_PERMISSIONS.BANK_ACCOUNTS]
  | (typeof FINANCE_PERMISSIONS.CATEGORIES)[keyof typeof FINANCE_PERMISSIONS.CATEGORIES]
  | (typeof FINANCE_PERMISSIONS.ENTRIES)[keyof typeof FINANCE_PERMISSIONS.ENTRIES]
  | (typeof FINANCE_PERMISSIONS.LOANS)[keyof typeof FINANCE_PERMISSIONS.LOANS]
  | (typeof FINANCE_PERMISSIONS.CONSORTIA)[keyof typeof FINANCE_PERMISSIONS.CONSORTIA]
  | (typeof FINANCE_PERMISSIONS.CONTRACTS)[keyof typeof FINANCE_PERMISSIONS.CONTRACTS]
  | (typeof FINANCE_PERMISSIONS.DASHBOARD)[keyof typeof FINANCE_PERMISSIONS.DASHBOARD]
  | (typeof FINANCE_PERMISSIONS.EXPORT)[keyof typeof FINANCE_PERMISSIONS.EXPORT];

export type UIPermission =
  | (typeof UI_PERMISSIONS.MENU)[keyof typeof UI_PERMISSIONS.MENU]
  | (typeof UI_PERMISSIONS.DASHBOARD)[keyof typeof UI_PERMISSIONS.DASHBOARD]
  | (typeof UI_PERMISSIONS.STOCK_SUBMENUS)[keyof typeof UI_PERMISSIONS.STOCK_SUBMENUS]
  | (typeof UI_PERMISSIONS.SALES_SUBMENUS)[keyof typeof UI_PERMISSIONS.SALES_SUBMENUS]
  | (typeof UI_PERMISSIONS.HR_SUBMENUS)[keyof typeof UI_PERMISSIONS.HR_SUBMENUS]
  | (typeof UI_PERMISSIONS.FINANCE_SUBMENUS)[keyof typeof UI_PERMISSIONS.FINANCE_SUBMENUS];

export default PermissionCodes;
