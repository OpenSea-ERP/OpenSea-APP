/**
 * OpenSea OS - Base Permission Groups
 * Definição dos grupos de permissões base do sistema
 *
 * Filosofia de Grupos:
 * - Super Administrador: Acesso total (wildcard)
 * - Administrador: Acesso administrativo amplo (admin de cada módulo)
 * - Gerente de Estoque: Gerencia stock completo
 * - Operador de Estoque: Leitura + operações de itens
 * - Vendedor: Visualiza estoque + gerencia vendas
 * - Visualizador: Somente leitura
 * - Usuário Básico: Apenas self + leitura básica
 */

import type { CreatePermissionGroupDTO } from '@/types/rbac';
import {
  ADMIN_PERMISSIONS,
  FINANCE_PERMISSIONS,
  HR_PERMISSIONS,
  SALES_PERMISSIONS,
  STOCK_PERMISSIONS,
  SYSTEM_PERMISSIONS,
  TOOLS_PERMISSIONS,
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
      // Admin — acesso total
      { code: ADMIN_PERMISSIONS.USERS.ACCESS, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.USERS.REGISTER, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.USERS.MODIFY, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.USERS.REMOVE, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.USERS.ADMIN, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.PERMISSION_GROUPS.ACCESS, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.PERMISSION_GROUPS.REGISTER, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.PERMISSION_GROUPS.MODIFY, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.PERMISSION_GROUPS.REMOVE, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.PERMISSION_GROUPS.ADMIN, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.COMPANIES.ACCESS, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.COMPANIES.REGISTER, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.COMPANIES.MODIFY, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.COMPANIES.REMOVE, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.COMPANIES.ADMIN, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.SESSIONS.ACCESS, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.SESSIONS.ADMIN, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.AUDIT.ACCESS, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.AUDIT.EXPORT, effect: 'allow' },
      { code: ADMIN_PERMISSIONS.AUDIT.ADMIN, effect: 'allow' },

      // Stock — admin access
      { code: STOCK_PERMISSIONS.PRODUCTS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.ADMIN, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.ADMIN, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.ADMIN, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PURCHASE_ORDERS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PURCHASE_ORDERS.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PURCHASE_ORDERS.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PURCHASE_ORDERS.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PURCHASE_ORDERS.ADMIN, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VOLUMES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VOLUMES.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VOLUMES.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VOLUMES.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VOLUMES.ADMIN, effect: 'allow' },
      { code: STOCK_PERMISSIONS.WAREHOUSES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.WAREHOUSES.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.WAREHOUSES.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.WAREHOUSES.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.WAREHOUSES.ADMIN, effect: 'allow' },

      // Sales — admin access
      { code: SALES_PERMISSIONS.CUSTOMERS.ACCESS, effect: 'allow' },
      { code: SALES_PERMISSIONS.CUSTOMERS.REGISTER, effect: 'allow' },
      { code: SALES_PERMISSIONS.CUSTOMERS.MODIFY, effect: 'allow' },
      { code: SALES_PERMISSIONS.CUSTOMERS.REMOVE, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.ACCESS, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.REGISTER, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.MODIFY, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.REMOVE, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.ADMIN, effect: 'allow' },
      { code: SALES_PERMISSIONS.PROMOTIONS.ACCESS, effect: 'allow' },
      { code: SALES_PERMISSIONS.PROMOTIONS.REGISTER, effect: 'allow' },
      { code: SALES_PERMISSIONS.PROMOTIONS.MODIFY, effect: 'allow' },
      { code: SALES_PERMISSIONS.PROMOTIONS.REMOVE, effect: 'allow' },

      // HR — admin access
      { code: HR_PERMISSIONS.DEPARTMENTS.ACCESS, effect: 'allow' },
      { code: HR_PERMISSIONS.DEPARTMENTS.REGISTER, effect: 'allow' },
      { code: HR_PERMISSIONS.DEPARTMENTS.MODIFY, effect: 'allow' },
      { code: HR_PERMISSIONS.DEPARTMENTS.REMOVE, effect: 'allow' },
      { code: HR_PERMISSIONS.POSITIONS.ACCESS, effect: 'allow' },
      { code: HR_PERMISSIONS.POSITIONS.REGISTER, effect: 'allow' },
      { code: HR_PERMISSIONS.POSITIONS.MODIFY, effect: 'allow' },
      { code: HR_PERMISSIONS.POSITIONS.REMOVE, effect: 'allow' },
      { code: HR_PERMISSIONS.EMPLOYEES.ACCESS, effect: 'allow' },
      { code: HR_PERMISSIONS.EMPLOYEES.REGISTER, effect: 'allow' },
      { code: HR_PERMISSIONS.EMPLOYEES.MODIFY, effect: 'allow' },
      { code: HR_PERMISSIONS.EMPLOYEES.REMOVE, effect: 'allow' },
      { code: HR_PERMISSIONS.EMPLOYEES.ADMIN, effect: 'allow' },
      { code: HR_PERMISSIONS.ABSENCES.ACCESS, effect: 'allow' },
      { code: HR_PERMISSIONS.ABSENCES.REGISTER, effect: 'allow' },
      { code: HR_PERMISSIONS.ABSENCES.MODIFY, effect: 'allow' },
      { code: HR_PERMISSIONS.ABSENCES.REMOVE, effect: 'allow' },
      { code: HR_PERMISSIONS.ABSENCES.ADMIN, effect: 'allow' },
      { code: HR_PERMISSIONS.VACATIONS.ACCESS, effect: 'allow' },
      { code: HR_PERMISSIONS.VACATIONS.REGISTER, effect: 'allow' },
      { code: HR_PERMISSIONS.VACATIONS.MODIFY, effect: 'allow' },
      { code: HR_PERMISSIONS.VACATIONS.ADMIN, effect: 'allow' },
      { code: HR_PERMISSIONS.PAYROLL.ACCESS, effect: 'allow' },
      { code: HR_PERMISSIONS.PAYROLL.REGISTER, effect: 'allow' },
      { code: HR_PERMISSIONS.PAYROLL.ADMIN, effect: 'allow' },
      { code: HR_PERMISSIONS.WORK_SCHEDULES.ACCESS, effect: 'allow' },
      { code: HR_PERMISSIONS.WORK_SCHEDULES.REGISTER, effect: 'allow' },
      { code: HR_PERMISSIONS.WORK_SCHEDULES.MODIFY, effect: 'allow' },
      { code: HR_PERMISSIONS.WORK_SCHEDULES.REMOVE, effect: 'allow' },

      // Finance — admin access
      { code: FINANCE_PERMISSIONS.CATEGORIES.ACCESS, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CATEGORIES.REGISTER, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CATEGORIES.MODIFY, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CATEGORIES.REMOVE, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.COST_CENTERS.ACCESS, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.COST_CENTERS.REGISTER, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.COST_CENTERS.MODIFY, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.COST_CENTERS.REMOVE, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.BANK_ACCOUNTS.ACCESS, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.BANK_ACCOUNTS.REGISTER, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.BANK_ACCOUNTS.MODIFY, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.BANK_ACCOUNTS.REMOVE, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.ENTRIES.ACCESS, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.ENTRIES.REGISTER, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.ENTRIES.MODIFY, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.ENTRIES.REMOVE, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.ENTRIES.ADMIN, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.LOANS.ACCESS, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.LOANS.REGISTER, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.LOANS.MODIFY, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.LOANS.REMOVE, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.LOANS.ADMIN, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CONSORTIA.ACCESS, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CONSORTIA.REGISTER, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CONSORTIA.MODIFY, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CONSORTIA.REMOVE, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CONSORTIA.ADMIN, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CONTRACTS.ACCESS, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CONTRACTS.REGISTER, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CONTRACTS.MODIFY, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.CONTRACTS.REMOVE, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.SUPPLIERS.ACCESS, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.SUPPLIERS.REGISTER, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.SUPPLIERS.MODIFY, effect: 'allow' },
      { code: FINANCE_PERMISSIONS.SUPPLIERS.REMOVE, effect: 'allow' },

      // Tools — admin access
      { code: TOOLS_PERMISSIONS.EMAIL.ACCOUNTS.ACCESS, effect: 'allow' },
      { code: TOOLS_PERMISSIONS.EMAIL.ACCOUNTS.ADMIN, effect: 'allow' },
      { code: TOOLS_PERMISSIONS.EMAIL.MESSAGES.ACCESS, effect: 'allow' },
      { code: TOOLS_PERMISSIONS.TASKS.BOARDS.ACCESS, effect: 'allow' },
      { code: TOOLS_PERMISSIONS.TASKS.CARDS.ACCESS, effect: 'allow' },
      { code: TOOLS_PERMISSIONS.TASKS.CARDS.ADMIN, effect: 'allow' },
      { code: TOOLS_PERMISSIONS.CALENDAR.ACCESS, effect: 'allow' },
      { code: TOOLS_PERMISSIONS.CALENDAR.ADMIN, effect: 'allow' },
      { code: TOOLS_PERMISSIONS.STORAGE.FOLDERS.ACCESS, effect: 'allow' },
      { code: TOOLS_PERMISSIONS.STORAGE.FOLDERS.ADMIN, effect: 'allow' },
      { code: TOOLS_PERMISSIONS.STORAGE.FILES.ACCESS, effect: 'allow' },
      { code: TOOLS_PERMISSIONS.STORAGE.FILES.ADMIN, effect: 'allow' },

      // System
      { code: SYSTEM_PERMISSIONS.LABEL_TEMPLATES.ACCESS, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.LABEL_TEMPLATES.REGISTER, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.LABEL_TEMPLATES.MODIFY, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.LABEL_TEMPLATES.REMOVE, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.NOTIFICATIONS.ADMIN, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.SELF.ACCESS, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.SELF.MODIFY, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.SELF.ADMIN, effect: 'allow' },
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
      // Stock — full CRUD + admin
      { code: STOCK_PERMISSIONS.PRODUCTS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.IMPORT, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.EXPORT, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.PRINT, effect: 'allow' },

      { code: STOCK_PERMISSIONS.VARIANTS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.IMPORT, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.EXPORT, effect: 'allow' },

      { code: STOCK_PERMISSIONS.ITEMS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.EXPORT, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.PRINT, effect: 'allow' },

      { code: STOCK_PERMISSIONS.TEMPLATES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.REMOVE, effect: 'allow' },

      { code: STOCK_PERMISSIONS.CATEGORIES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.MODIFY, effect: 'allow' },

      { code: STOCK_PERMISSIONS.MANUFACTURERS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.MODIFY, effect: 'allow' },

      { code: STOCK_PERMISSIONS.WAREHOUSES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.WAREHOUSES.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.WAREHOUSES.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.WAREHOUSES.REMOVE, effect: 'allow' },

      { code: STOCK_PERMISSIONS.PURCHASE_ORDERS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PURCHASE_ORDERS.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PURCHASE_ORDERS.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PURCHASE_ORDERS.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PURCHASE_ORDERS.EXPORT, effect: 'allow' },

      { code: STOCK_PERMISSIONS.VOLUMES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VOLUMES.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VOLUMES.MODIFY, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VOLUMES.REMOVE, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VOLUMES.EXPORT, effect: 'allow' },

      // Self (basic)
      { code: SYSTEM_PERMISSIONS.SELF.ACCESS, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.SELF.MODIFY, effect: 'allow' },
    ],
  },

  // =========================
  // OPERADOR DE ESTOQUE
  // =========================
  {
    name: 'Operador de Estoque',
    description: 'Visualiza estoque e pode operar itens e volumes.',
    color: '#10B981',
    priority: 300,
    permissions: [
      // Stock — read access to most resources
      { code: STOCK_PERMISSIONS.PRODUCTS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.WAREHOUSES.ACCESS, effect: 'allow' },

      // Items — operational
      { code: STOCK_PERMISSIONS.ITEMS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.EXPORT, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.PRINT, effect: 'allow' },

      // Volumes — operational
      { code: STOCK_PERMISSIONS.VOLUMES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VOLUMES.REGISTER, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VOLUMES.MODIFY, effect: 'allow' },

      // Self (basic)
      { code: SYSTEM_PERMISSIONS.SELF.ACCESS, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.SELF.MODIFY, effect: 'allow' },
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
      // Stock — read only
      { code: STOCK_PERMISSIONS.PRODUCTS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.ACCESS, effect: 'allow' },

      // Sales — CRUD
      { code: SALES_PERMISSIONS.ORDERS.ACCESS, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.REGISTER, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.MODIFY, effect: 'allow' },
      { code: SALES_PERMISSIONS.ORDERS.ONLYSELF, effect: 'allow' },

      // Customers — CRUD
      { code: SALES_PERMISSIONS.CUSTOMERS.ACCESS, effect: 'allow' },
      { code: SALES_PERMISSIONS.CUSTOMERS.REGISTER, effect: 'allow' },
      { code: SALES_PERMISSIONS.CUSTOMERS.MODIFY, effect: 'allow' },

      // NÃO pode deletar pedidos
      { code: SALES_PERMISSIONS.ORDERS.REMOVE, effect: 'deny' },

      // Self (basic)
      { code: SYSTEM_PERMISSIONS.SELF.ACCESS, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.SELF.MODIFY, effect: 'allow' },
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
      // Stock — read only
      { code: STOCK_PERMISSIONS.PRODUCTS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.ITEMS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.TEMPLATES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.CATEGORIES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.MANUFACTURERS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.WAREHOUSES.ACCESS, effect: 'allow' },

      // Sales — read only
      { code: SALES_PERMISSIONS.ORDERS.ACCESS, effect: 'allow' },
      { code: SALES_PERMISSIONS.CUSTOMERS.ACCESS, effect: 'allow' },

      // Self (basic)
      { code: SYSTEM_PERMISSIONS.SELF.ACCESS, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.SELF.MODIFY, effect: 'allow' },
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
      // Self — full self management
      { code: SYSTEM_PERMISSIONS.SELF.ACCESS, effect: 'allow' },
      { code: SYSTEM_PERMISSIONS.SELF.MODIFY, effect: 'allow' },

      // Basic read access
      { code: STOCK_PERMISSIONS.TEMPLATES.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.PRODUCTS.ACCESS, effect: 'allow' },
      { code: STOCK_PERMISSIONS.VARIANTS.ACCESS, effect: 'allow' },
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
 * Permissões padrão para qualquer usuário autenticado
 * Apenas acesso aos próprios dados (self)
 */
export const DEFAULT_USER_PERMISSIONS = [
  SYSTEM_PERMISSIONS.SELF.ACCESS,
  SYSTEM_PERMISSIONS.SELF.MODIFY,
] as const;
