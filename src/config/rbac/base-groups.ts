/**
 * OpenSea OS - Base Permission Groups
 * Definição dos grupos de permissões base do sistema
 *
 * Filosofia de Grupos:
 * - Super Administrador: Acesso total (*)
 * - Administrador: Acesso administrativo sem algumas ações críticas
 * - Usuário: Acesso apenas às permissões self.*
 *
 * Os demais grupos são criados pelo administrador conforme necessidade.
 */

import type { CreatePermissionGroupDTO } from '@/types/rbac';
import {
  ADMIN_PERMISSIONS,
  AUDIT_PERMISSIONS,
  CORE_PERMISSIONS,
  HR_PERMISSIONS,
  RBAC_PERMISSIONS,
  REPORTS_PERMISSIONS,
  SALES_PERMISSIONS,
  SELF_PERMISSIONS,
  SETTINGS_PERMISSIONS,
  STOCK_PERMISSIONS,
  UI_PERMISSIONS,
  WILDCARD_PERMISSIONS,
} from './permission-codes';

// =============================================================================
// GROUP DEFINITIONS
// =============================================================================

/**
 * Grupos de permissões base do sistema
 */
export const baseGroups: Array<
  CreatePermissionGroupDTO & {
    permissions: Array<{
      code: string;
      effect: 'allow' | 'deny';
    }>;
  }
> = [
  // =========================
  // SUPER ADMIN
  // =========================
  {
    name: 'Super Administrador',
    description:
      'Acesso total ao sistema. Pode fazer qualquer operação sem restrições.',
    color: '#EF4444',
    priority: 1000,
    permissions: [
      {
        code: WILDCARD_PERMISSIONS.FULL_ACCESS,
        effect: 'allow',
      },
    ],
  },

  // =========================
  // ADMINISTRADOR
  // =========================
  {
    name: 'Administrador',
    description:
      'Administrador do sistema com acesso à maioria das funcionalidades.',
    color: '#F97316',
    priority: 900,
    permissions: [
      // RBAC - necessário para ler próprias permissões
      { code: RBAC_PERMISSIONS.ASSOCIATIONS.READ, effect: 'allow' },

      // UI - Menus principais
      { code: UI_PERMISSIONS.MENU.DASHBOARD, effect: 'allow' },
      { code: UI_PERMISSIONS.MENU.STOCK, effect: 'allow' },
      { code: UI_PERMISSIONS.MENU.SALES, effect: 'allow' },
      { code: UI_PERMISSIONS.MENU.HR, effect: 'allow' },
      { code: UI_PERMISSIONS.MENU.RBAC, effect: 'allow' },
      { code: UI_PERMISSIONS.MENU.AUDIT, effect: 'allow' },
      { code: UI_PERMISSIONS.MENU.SETTINGS, effect: 'allow' },
      { code: UI_PERMISSIONS.MENU.REPORTS, effect: 'allow' },

      // UI - Stock Submenus
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.PRODUCTS, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.VARIANTS, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.ITEMS, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.MOVEMENTS, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.SUPPLIERS, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.MANUFACTURERS, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.LOCATIONS, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.WAREHOUSES, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.ZONES, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.BINS, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.CATEGORIES, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.TAGS, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.TEMPLATES, effect: 'allow' },
      { code: UI_PERMISSIONS.STOCK_SUBMENUS.PURCHASE_ORDERS, effect: 'allow' },

      // UI - Sales Submenus
      { code: UI_PERMISSIONS.SALES_SUBMENUS.CUSTOMERS, effect: 'allow' },
      { code: UI_PERMISSIONS.SALES_SUBMENUS.ORDERS, effect: 'allow' },
      { code: UI_PERMISSIONS.SALES_SUBMENUS.PROMOTIONS, effect: 'allow' },
      { code: UI_PERMISSIONS.SALES_SUBMENUS.RESERVATIONS, effect: 'allow' },

      // UI - HR Submenus
      { code: UI_PERMISSIONS.HR_SUBMENUS.EMPLOYEES, effect: 'allow' },
      { code: UI_PERMISSIONS.HR_SUBMENUS.DEPARTMENTS, effect: 'allow' },
      { code: UI_PERMISSIONS.HR_SUBMENUS.POSITIONS, effect: 'allow' },
      { code: UI_PERMISSIONS.HR_SUBMENUS.ABSENCES, effect: 'allow' },
      { code: UI_PERMISSIONS.HR_SUBMENUS.VACATIONS, effect: 'allow' },
      { code: UI_PERMISSIONS.HR_SUBMENUS.OVERTIME, effect: 'allow' },
      { code: UI_PERMISSIONS.HR_SUBMENUS.PAYROLL, effect: 'allow' },
      { code: UI_PERMISSIONS.HR_SUBMENUS.TIME_BANK, effect: 'allow' },
      { code: UI_PERMISSIONS.HR_SUBMENUS.COMPANIES, effect: 'allow' },

      // Core - Usuários
      { code: CORE_PERMISSIONS.USERS.CREATE, effect: 'allow' },
      { code: CORE_PERMISSIONS.USERS.READ, effect: 'allow' },
      { code: CORE_PERMISSIONS.USERS.UPDATE, effect: 'allow' },
      { code: CORE_PERMISSIONS.USERS.DELETE, effect: 'allow' },
      { code: CORE_PERMISSIONS.USERS.LIST, effect: 'allow' },
      { code: CORE_PERMISSIONS.USERS.MANAGE, effect: 'allow' },

      // Core - Sessões
      { code: CORE_PERMISSIONS.SESSIONS.READ, effect: 'allow' },
      { code: CORE_PERMISSIONS.SESSIONS.LIST, effect: 'allow' },
      { code: CORE_PERMISSIONS.SESSIONS.REVOKE, effect: 'allow' },

      // RBAC - Grupos e Permissões
      { code: RBAC_PERMISSIONS.GROUPS.CREATE, effect: 'allow' },
      { code: RBAC_PERMISSIONS.GROUPS.READ, effect: 'allow' },
      { code: RBAC_PERMISSIONS.GROUPS.UPDATE, effect: 'allow' },
      { code: RBAC_PERMISSIONS.GROUPS.DELETE, effect: 'allow' },
      { code: RBAC_PERMISSIONS.GROUPS.LIST, effect: 'allow' },
      { code: RBAC_PERMISSIONS.GROUPS.ASSIGN, effect: 'allow' },
      { code: RBAC_PERMISSIONS.GROUPS.MANAGE, effect: 'allow' },

      { code: RBAC_PERMISSIONS.PERMISSIONS.READ, effect: 'allow' },
      { code: RBAC_PERMISSIONS.PERMISSIONS.LIST, effect: 'allow' },

      // Audit
      { code: AUDIT_PERMISSIONS.LOGS.VIEW, effect: 'allow' },
      { code: AUDIT_PERMISSIONS.LOGS.SEARCH, effect: 'allow' },
      { code: AUDIT_PERMISSIONS.HISTORY.VIEW, effect: 'allow' },

      // Settings
      { code: SETTINGS_PERMISSIONS.SYSTEM.VIEW, effect: 'allow' },
      { code: SETTINGS_PERMISSIONS.SYSTEM.UPDATE, effect: 'allow' },
      { code: SETTINGS_PERMISSIONS.COMPANY.VIEW, effect: 'allow' },
      { code: SETTINGS_PERMISSIONS.COMPANY.UPDATE, effect: 'allow' },

      // Stock - acesso total
      { code: STOCK_PERMISSIONS.PRODUCTS.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.LOCATIONS.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.WAREHOUSES.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ZONES.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.BINS.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.SUPPLIERS.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TAGS.MANAGE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PURCHASE_ORDERS.MANAGE, effect: 'allow' },

      // Sales - acesso total
      { code: SALES_PERMISSIONS.CUSTOMERS.MANAGE, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.MANAGE, effect: 'allow' },
      { code: SALES_PERMISSIONS.PROMOTIONS.MANAGE, effect: 'allow' },
      { code: SALES_PERMISSIONS.RESERVATIONS.MANAGE, effect: 'allow' },

      // Admin - Companies
      { code: ADMIN_PERMISSIONS.COMPANIES.MANAGE, effect: 'allow' },

      // HR - acesso total
      { code: HR_PERMISSIONS.DEPARTMENTS.MANAGE, effect: 'allow' },
      { code: HR_PERMISSIONS.POSITIONS.MANAGE, effect: 'allow' },
      { code: HR_PERMISSIONS.EMPLOYEES.MANAGE, effect: 'allow' },
      { code: HR_PERMISSIONS.ABSENCES.MANAGE, effect: 'allow' },
      { code: HR_PERMISSIONS.VACATIONS.MANAGE, effect: 'allow' },
      { code: HR_PERMISSIONS.PAYROLL.MANAGE, effect: 'allow' },

      // Reports
      { code: REPORTS_PERMISSIONS.STOCK.VIEW, effect: 'allow' },
      { code: REPORTS_PERMISSIONS.STOCK.GENERATE, effect: 'allow' },
      { code: REPORTS_PERMISSIONS.SALES.VIEW, effect: 'allow' },
      { code: REPORTS_PERMISSIONS.SALES.GENERATE, effect: 'allow' },
      { code: REPORTS_PERMISSIONS.HR.VIEW, effect: 'allow' },
      { code: REPORTS_PERMISSIONS.HR.GENERATE, effect: 'allow' },
      { code: REPORTS_PERMISSIONS.AUDIT.VIEW, effect: 'allow' },
      { code: REPORTS_PERMISSIONS.AUDIT.GENERATE, effect: 'allow' },
    ],
  },

  // =========================
  // GERENTE DE ESTOQUE
  // =========================
  {
    name: 'Gerente de Estoque',
    description:
      'Gerencia produtos, variantes, itens e localizações do estoque.',
    color: '#3B82F6',
    priority: 500,
    permissions: [
      // RBAC - necessário para ler próprias permissões
      { code: RBAC_PERMISSIONS.ASSOCIATIONS.READ, effect: 'allow' },

      // UI - Menu Stock
      { code: UI_PERMISSIONS.MENU.STOCK, effect: 'allow' },
      { code: UI_PERMISSIONS.MENU.REPORTS, effect: 'allow' },

      // Stock - CRUD completo
      { code: STOCK_PERMISSIONS.PRODUCTS.CREATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.UPDATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.DELETE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.LIST, effect: 'allow' },

      { code: STOCK_PERMISSIONS.VARIANTS.CREATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.UPDATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.DELETE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.LIST, effect: 'allow' },

      { code: STOCK_PERMISSIONS.ITEMS.CREATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.UPDATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.DELETE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.ENTRY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.EXIT, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.TRANSFER, effect: 'allow' },

      { code: STOCK_PERMISSIONS.TEMPLATES.CREATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.UPDATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.DELETE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.LIST, effect: 'allow' },

      { code: STOCK_PERMISSIONS.LOCATIONS.CREATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.LOCATIONS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.LOCATIONS.UPDATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.LOCATIONS.DELETE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.LOCATIONS.LIST, effect: 'allow' },

      { code: STOCK_PERMISSIONS.CATEGORIES.CREATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.UPDATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.LIST, effect: 'allow' },

      { code: STOCK_PERMISSIONS.SUPPLIERS.CREATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.SUPPLIERS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.SUPPLIERS.UPDATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.SUPPLIERS.LIST, effect: 'allow' },

      { code: STOCK_PERMISSIONS.MANUFACTURERS.CREATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.UPDATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.LIST, effect: 'allow' },

      { code: STOCK_PERMISSIONS.TAGS.CREATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TAGS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TAGS.UPDATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TAGS.LIST, effect: 'allow' },

      // Reports
      { code: REPORTS_PERMISSIONS.STOCK.VIEW, effect: 'allow' },
      { code: REPORTS_PERMISSIONS.STOCK.GENERATE, effect: 'allow' },
      { code: REPORTS_PERMISSIONS.STOCK.INVENTORY, effect: 'allow' },
      { code: REPORTS_PERMISSIONS.STOCK.MOVEMENTS, effect: 'allow' },
      { code: REPORTS_PERMISSIONS.STOCK.LOW_STOCK, effect: 'allow' },
    ],
  },

  // =========================
  // OPERADOR DE ESTOQUE
  // =========================
  {
    name: 'Operador de Estoque',
    description:
      'Visualiza estoque e pode criar/atualizar itens e localizações.',
    color: '#10B981',
    priority: 300,
    permissions: [
      // RBAC - necessário para ler próprias permissões
      { code: RBAC_PERMISSIONS.ASSOCIATIONS.READ, effect: 'allow' },

      // UI - Menu Stock
      { code: UI_PERMISSIONS.MENU.STOCK, effect: 'allow' },

      // Visualização geral
      { code: STOCK_PERMISSIONS.PRODUCTS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.SUPPLIERS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.SUPPLIERS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TAGS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TAGS.LIST, effect: 'allow' },

      // Itens - pode gerenciar
      { code: STOCK_PERMISSIONS.ITEMS.CREATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.UPDATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.ENTRY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.EXIT, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.TRANSFER, effect: 'allow' },

      // Localizações - pode gerenciar
      { code: STOCK_PERMISSIONS.LOCATIONS.CREATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.LOCATIONS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.LOCATIONS.UPDATE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.LOCATIONS.LIST, effect: 'allow' },

      // NÃO pode deletar produtos/variantes
      { code: STOCK_PERMISSIONS.PRODUCTS.DELETE, effect: 'deny' },
      { code: STOCK_PERMISSIONS.VARIANTS.DELETE, effect: 'deny' },
    ],
  },

  // =========================
  // VENDEDOR
  // =========================
  {
    name: 'Vendedor',
    description: 'Visualiza produtos e cria pedidos de venda.',
    color: '#8B5CF6',
    priority: 200,
    permissions: [
      // RBAC - necessário para ler próprias permissões
      { code: RBAC_PERMISSIONS.ASSOCIATIONS.READ, effect: 'allow' },

      // UI - Menus
      { code: UI_PERMISSIONS.MENU.SALES, effect: 'allow' },
      { code: UI_PERMISSIONS.MENU.STOCK, effect: 'allow' },

      // Visualizar estoque
      { code: STOCK_PERMISSIONS.PRODUCTS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.LIST, effect: 'allow' },

      // Pedidos
      { code: SALES_PERMISSIONS.ORDERS.CREATE, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.READ, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.UPDATE, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.LIST, effect: 'allow' },

      // NÃO pode deletar pedidos
      { code: SALES_PERMISSIONS.ORDERS.DELETE, effect: 'deny' },

      // Clientes
      { code: SALES_PERMISSIONS.CUSTOMERS.CREATE, effect: 'allow' },
      { code: SALES_PERMISSIONS.CUSTOMERS.READ, effect: 'allow' },
      { code: SALES_PERMISSIONS.CUSTOMERS.UPDATE, effect: 'allow' },
      { code: SALES_PERMISSIONS.CUSTOMERS.LIST, effect: 'allow' },
    ],
  },

  // =========================
  // VISUALIZADOR
  // =========================
  {
    name: 'Visualizador',
    description: 'Acesso somente leitura a todos os módulos.',
    color: '#6B7280',
    priority: 100,
    permissions: [
      // RBAC - necessário para ler próprias permissões
      { code: RBAC_PERMISSIONS.ASSOCIATIONS.READ, effect: 'allow' },

      // UI - Menus (somente visualização)
      { code: UI_PERMISSIONS.MENU.DASHBOARD, effect: 'allow' },
      { code: UI_PERMISSIONS.MENU.STOCK, effect: 'allow' },
      { code: UI_PERMISSIONS.MENU.SALES, effect: 'allow' },

      // Apenas visualização - Stock
      { code: STOCK_PERMISSIONS.PRODUCTS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.LOCATIONS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.LOCATIONS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.SUPPLIERS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.SUPPLIERS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TAGS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TAGS.LIST, effect: 'allow' },

      // Apenas visualização - Sales
      { code: SALES_PERMISSIONS.ORDERS.READ, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.LIST, effect: 'allow' },
      { code: SALES_PERMISSIONS.CUSTOMERS.READ, effect: 'allow' },
      { code: SALES_PERMISSIONS.CUSTOMERS.LIST, effect: 'allow' },
    ],
  },

  // =========================
  // USUÁRIO BÁSICO
  // =========================
  {
    name: 'Usuário Básico',
    description:
      'Acesso básico ao sistema. Pode gerenciar seu próprio perfil e dados.',
    color: '#64748B',
    priority: 50,
    permissions: [
      // RBAC - necessário para ler próprias permissões
      { code: RBAC_PERMISSIONS.ASSOCIATIONS.READ, effect: 'allow' },

      // Self - Perfil
      { code: SELF_PERMISSIONS.PROFILE.READ, effect: 'allow' },
      { code: SELF_PERMISSIONS.PROFILE.UPDATE, effect: 'allow' },
      { code: SELF_PERMISSIONS.PROFILE.UPDATE_EMAIL, effect: 'allow' },
      { code: SELF_PERMISSIONS.PROFILE.UPDATE_PASSWORD, effect: 'allow' },
      { code: SELF_PERMISSIONS.PROFILE.UPDATE_USERNAME, effect: 'allow' },

      // Self - Sessões
      { code: SELF_PERMISSIONS.SESSIONS.READ, effect: 'allow' },
      { code: SELF_PERMISSIONS.SESSIONS.LIST, effect: 'allow' },
      { code: SELF_PERMISSIONS.SESSIONS.REVOKE, effect: 'allow' },

      // Self - Permissões e Grupos (visualização)
      { code: SELF_PERMISSIONS.PERMISSIONS.READ, effect: 'allow' },
      { code: SELF_PERMISSIONS.PERMISSIONS.LIST, effect: 'allow' },
      { code: SELF_PERMISSIONS.GROUPS.READ, effect: 'allow' },
      { code: SELF_PERMISSIONS.GROUPS.LIST, effect: 'allow' },

      // Self - Auditoria pessoal
      { code: SELF_PERMISSIONS.AUDIT.READ, effect: 'allow' },
      { code: SELF_PERMISSIONS.AUDIT.LIST, effect: 'allow' },

      // UI - Menu básico
      { code: UI_PERMISSIONS.MENU.DASHBOARD, effect: 'allow' },

      // Visualização básica de templates e produtos
      { code: STOCK_PERMISSIONS.TEMPLATES.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.LIST, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.READ, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.LIST, effect: 'allow' },
    ],
  },
];

// =============================================================================
// EXPORTS
// =============================================================================

export default baseGroups;

/**
 * Slugs dos grupos base do sistema
 */
export const PermissionGroupSlugs = {
  SUPER_ADMIN: 'super-administrador',
  ADMIN: 'administrador',
  STOCK_MANAGER: 'gerente-de-estoque',
  STOCK_OPERATOR: 'operador-de-estoque',
  SELLER: 'vendedor',
  VIEWER: 'visualizador',
  BASIC_USER: 'usuario-basico',
} as const;

export type PermissionGroupSlug =
  (typeof PermissionGroupSlugs)[keyof typeof PermissionGroupSlugs];

/**
 * Cores dos grupos base
 */
export const PermissionGroupColors = {
  [PermissionGroupSlugs.SUPER_ADMIN]: '#EF4444',
  [PermissionGroupSlugs.ADMIN]: '#F97316',
  [PermissionGroupSlugs.STOCK_MANAGER]: '#3B82F6',
  [PermissionGroupSlugs.STOCK_OPERATOR]: '#10B981',
  [PermissionGroupSlugs.SELLER]: '#8B5CF6',
  [PermissionGroupSlugs.VIEWER]: '#6B7280',
  [PermissionGroupSlugs.BASIC_USER]: '#64748B',
} as const;

/**
 * Prioridades dos grupos base
 */
export const PermissionGroupPriorities = {
  [PermissionGroupSlugs.SUPER_ADMIN]: 1000,
  [PermissionGroupSlugs.ADMIN]: 900,
  [PermissionGroupSlugs.STOCK_MANAGER]: 500,
  [PermissionGroupSlugs.STOCK_OPERATOR]: 300,
  [PermissionGroupSlugs.SELLER]: 200,
  [PermissionGroupSlugs.VIEWER]: 100,
  [PermissionGroupSlugs.BASIC_USER]: 50,
} as const;

/**
 * Permissões padrão do grupo USER (Usuário Básico)
 * Apenas acesso aos próprios dados
 */
export const DEFAULT_USER_PERMISSIONS = [
  // Profile
  SELF_PERMISSIONS.PROFILE.READ,
  SELF_PERMISSIONS.PROFILE.UPDATE,
  SELF_PERMISSIONS.PROFILE.UPDATE_EMAIL,
  SELF_PERMISSIONS.PROFILE.UPDATE_PASSWORD,
  SELF_PERMISSIONS.PROFILE.UPDATE_USERNAME,

  // Sessions
  SELF_PERMISSIONS.SESSIONS.READ,
  SELF_PERMISSIONS.SESSIONS.LIST,
  SELF_PERMISSIONS.SESSIONS.REVOKE,

  // Permissions & Groups (view only)
  SELF_PERMISSIONS.PERMISSIONS.READ,
  SELF_PERMISSIONS.PERMISSIONS.LIST,
  SELF_PERMISSIONS.GROUPS.READ,
  SELF_PERMISSIONS.GROUPS.LIST,

  // Audit (own logs)
  SELF_PERMISSIONS.AUDIT.READ,
  SELF_PERMISSIONS.AUDIT.LIST,
] as const;
