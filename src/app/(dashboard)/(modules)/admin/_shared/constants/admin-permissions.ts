/**
 * OpenSea OS - Admin Permissions Constants
 *
 * Constantes de permissões para o módulo admin.
 * Proxy de conveniência sobre os códigos centrais em permission-codes.ts.
 *
 * Todas as ações seguem o padrão novo:
 *   ACCESS, REGISTER, MODIFY, REMOVE, ADMIN
 */

import { ADMIN_PERMISSIONS as ADMIN_CODES } from '@/config/rbac/permission-codes';

export const ADMIN_PERMISSIONS = {
  /**
   * Permissões de Usuários
   */
  USERS: {
    /** Listar / visualizar usuários */
    LIST: ADMIN_CODES.USERS.ACCESS,
    VIEW: ADMIN_CODES.USERS.ACCESS,
    /** Criar novo usuário */
    CREATE: ADMIN_CODES.USERS.REGISTER,
    /** Atualizar usuário existente */
    UPDATE: ADMIN_CODES.USERS.MODIFY,
    /** Excluir usuário */
    DELETE: ADMIN_CODES.USERS.REMOVE,
    /** Gerenciamento completo */
    MANAGE: ADMIN_CODES.USERS.ADMIN,
    /** Gerenciar grupos do usuário */
    MANAGE_GROUPS: ADMIN_CODES.PERMISSION_GROUPS.ADMIN,
    /** Forçar reset de senha */
    FORCE_PASSWORD_RESET: ADMIN_CODES.USERS.ADMIN,
  },

  /**
   * Permissões de Grupos de Permissões
   */
  PERMISSION_GROUPS: {
    /** Listar grupos */
    LIST: ADMIN_CODES.PERMISSION_GROUPS.ACCESS,
    /** Visualizar detalhes de grupo */
    VIEW: ADMIN_CODES.PERMISSION_GROUPS.ACCESS,
    /** Criar novo grupo */
    CREATE: ADMIN_CODES.PERMISSION_GROUPS.REGISTER,
    /** Atualizar grupo existente */
    UPDATE: ADMIN_CODES.PERMISSION_GROUPS.MODIFY,
    /** Excluir grupo */
    DELETE: ADMIN_CODES.PERMISSION_GROUPS.REMOVE,
    /** Gerenciar permissões do grupo */
    MANAGE_PERMISSIONS: ADMIN_CODES.PERMISSION_GROUPS.ADMIN,
    /** Atribuir usuários ao grupo */
    ASSIGN_USERS: ADMIN_CODES.PERMISSION_GROUPS.ADMIN,
    /** Gerenciamento completo */
    MANAGE: ADMIN_CODES.PERMISSION_GROUPS.ADMIN,
  },

  /**
   * Permissões de Permissões (individual permissions — maps to permission-groups)
   */
  PERMISSIONS: {
    /** Listar permissões */
    LIST: ADMIN_CODES.PERMISSION_GROUPS.ACCESS,
    /** Visualizar detalhes de permissão */
    VIEW: ADMIN_CODES.PERMISSION_GROUPS.ACCESS,
    /** Criar nova permissão */
    CREATE: ADMIN_CODES.PERMISSION_GROUPS.REGISTER,
    /** Atualizar permissão existente */
    UPDATE: ADMIN_CODES.PERMISSION_GROUPS.MODIFY,
    /** Excluir permissão */
    DELETE: ADMIN_CODES.PERMISSION_GROUPS.REMOVE,
  },

  /**
   * Permissões de Logs de Auditoria
   */
  AUDIT_LOGS: {
    /** Listar logs */
    LIST: ADMIN_CODES.AUDIT.ACCESS,
    /** Visualizar detalhes de log */
    VIEW: ADMIN_CODES.AUDIT.ACCESS,
    /** Pesquisar logs */
    SEARCH: ADMIN_CODES.AUDIT.ACCESS,
    /** Ver histórico */
    HISTORY: ADMIN_CODES.AUDIT.ACCESS,
    /** Preview de rollback */
    ROLLBACK_PREVIEW: ADMIN_CODES.AUDIT.ADMIN,
    /** Executar rollback */
    ROLLBACK_EXECUTE: ADMIN_CODES.AUDIT.ADMIN,
  },

  /**
   * Permissões de Sessões
   */
  SESSIONS: {
    /** Listar sessões */
    LIST: ADMIN_CODES.SESSIONS.ACCESS,
    /** Visualizar sessão */
    VIEW: ADMIN_CODES.SESSIONS.ACCESS,
    /** Revogar sessão específica */
    REVOKE: ADMIN_CODES.SESSIONS.ADMIN,
    /** Revogar todas as sessões */
    REVOKE_ALL: ADMIN_CODES.SESSIONS.ADMIN,
  },

  /**
   * Permissões de Equipes — mapped to admin.users.admin
   */
  TEAMS: {
    /** Listar equipes */
    LIST: ADMIN_CODES.USERS.ADMIN,
    /** Visualizar detalhes de equipe */
    VIEW: ADMIN_CODES.USERS.ADMIN,
    /** Criar nova equipe */
    CREATE: ADMIN_CODES.USERS.ADMIN,
    /** Atualizar equipe existente */
    UPDATE: ADMIN_CODES.USERS.ADMIN,
    /** Excluir equipe */
    DELETE: ADMIN_CODES.USERS.ADMIN,
    /** Gerenciamento completo */
    MANAGE: ADMIN_CODES.USERS.ADMIN,
    /** Adicionar membros */
    ADD_MEMBERS: ADMIN_CODES.USERS.ADMIN,
    /** Remover membros */
    REMOVE_MEMBERS: ADMIN_CODES.USERS.ADMIN,
    /** Gerenciar membros */
    MANAGE_MEMBERS: ADMIN_CODES.USERS.ADMIN,
  },

  /**
   * Permissões de Empresas
   */
  COMPANIES: {
    /** Listar / visualizar empresas */
    LIST: ADMIN_CODES.COMPANIES.ACCESS,
    VIEW: ADMIN_CODES.COMPANIES.ACCESS,
    /** Criar nova empresa */
    CREATE: ADMIN_CODES.COMPANIES.REGISTER,
    /** Atualizar empresa existente */
    UPDATE: ADMIN_CODES.COMPANIES.MODIFY,
    /** Excluir empresa */
    DELETE: ADMIN_CODES.COMPANIES.REMOVE,
    /** Gerenciamento completo */
    MANAGE: ADMIN_CODES.COMPANIES.ADMIN,
  },
} as const;

// Type exports
export type AdminUsersPermission =
  (typeof ADMIN_PERMISSIONS.USERS)[keyof typeof ADMIN_PERMISSIONS.USERS];

export type AdminPermissionGroupsPermission =
  (typeof ADMIN_PERMISSIONS.PERMISSION_GROUPS)[keyof typeof ADMIN_PERMISSIONS.PERMISSION_GROUPS];

export type AdminPermissionsPermission =
  (typeof ADMIN_PERMISSIONS.PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS.PERMISSIONS];

export type AdminAuditLogsPermission =
  (typeof ADMIN_PERMISSIONS.AUDIT_LOGS)[keyof typeof ADMIN_PERMISSIONS.AUDIT_LOGS];

export type AdminSessionsPermission =
  (typeof ADMIN_PERMISSIONS.SESSIONS)[keyof typeof ADMIN_PERMISSIONS.SESSIONS];

export type AdminTeamsPermission =
  (typeof ADMIN_PERMISSIONS.TEAMS)[keyof typeof ADMIN_PERMISSIONS.TEAMS];

export type AdminCompaniesPermission =
  (typeof ADMIN_PERMISSIONS.COMPANIES)[keyof typeof ADMIN_PERMISSIONS.COMPANIES];

export type AdminPermission =
  | AdminUsersPermission
  | AdminPermissionGroupsPermission
  | AdminPermissionsPermission
  | AdminAuditLogsPermission
  | AdminSessionsPermission
  | AdminTeamsPermission
  | AdminCompaniesPermission;

export default ADMIN_PERMISSIONS;
