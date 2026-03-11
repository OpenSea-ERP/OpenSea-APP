/**
 * OpenSea OS - HR Permissions Constants
 *
 * Constantes de permissões para o módulo de Recursos Humanos.
 * Todas as permissões seguem o padrão: {module}.{resource}.{action}
 *
 * @example
 * ```tsx
 * import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants';
 *
 * // Uso com hook
 * const { hasPermission } = usePermissions();
 * if (hasPermission(HR_PERMISSIONS.COMPANIES.VIEW)) {
 *   // Pode visualizar empresas
 * }
 *
 * // Uso com componente
 * <PermissionGate permission={HR_PERMISSIONS.EMPLOYEES.DELETE}>
 *   <DeleteButton />
 * </PermissionGate>
 * ```
 */

import {
  DATA_PERMISSIONS,
  HR_PERMISSIONS as HR_CODES,
} from '@/config/rbac/permission-codes';

/* ===========================================
   PERMISSION CONSTANTS
   =========================================== */

export const HR_PERMISSIONS = {
  /**
   * Permissões de Empresas (Companies)
   * Somente leitura — CRUD completo foi movido para ADMIN_PERMISSIONS
   */
  COMPANIES: {
    /** Visualizar empresas (somente leitura) */
    VIEW: HR_CODES.COMPANIES.READ,
  },

  /**
   * Permissões de Departamentos (Departments)
   */
  DEPARTMENTS: {
    /** Listar departamentos */
    LIST: HR_CODES.DEPARTMENTS.LIST,
    /** Visualizar detalhes de departamento */
    VIEW: HR_CODES.DEPARTMENTS.READ,
    /** Criar novo departamento */
    CREATE: HR_CODES.DEPARTMENTS.CREATE,
    /** Atualizar departamento existente */
    UPDATE: HR_CODES.DEPARTMENTS.UPDATE,
    /** Excluir departamento */
    DELETE: HR_CODES.DEPARTMENTS.DELETE,
    /** Gerenciamento completo */
    MANAGE: HR_CODES.DEPARTMENTS.MANAGE,
  },

  /**
   * Permissões de Cargos (Positions)
   */
  POSITIONS: {
    /** Listar cargos */
    LIST: HR_CODES.POSITIONS.LIST,
    /** Visualizar detalhes de cargo */
    VIEW: HR_CODES.POSITIONS.READ,
    /** Criar novo cargo */
    CREATE: HR_CODES.POSITIONS.CREATE,
    /** Atualizar cargo existente */
    UPDATE: HR_CODES.POSITIONS.UPDATE,
    /** Excluir cargo */
    DELETE: HR_CODES.POSITIONS.DELETE,
    /** Gerenciamento completo */
    MANAGE: HR_CODES.POSITIONS.MANAGE,
  },

  /**
   * Permissões de Funcionários (Employees)
   * Inclui permissões com escopo (all/team)
   */
  EMPLOYEES: {
    /** Listar funcionários */
    LIST: HR_CODES.EMPLOYEES.LIST,
    /** Visualizar detalhes de funcionário */
    VIEW: HR_CODES.EMPLOYEES.READ,
    /** Visualizar todos os funcionários */
    VIEW_ALL: HR_CODES.EMPLOYEES.READ_ALL,
    /** Visualizar funcionários do time */
    VIEW_TEAM: HR_CODES.EMPLOYEES.READ_TEAM,
    /** Criar novo funcionário */
    CREATE: HR_CODES.EMPLOYEES.CREATE,
    /** Atualizar funcionário existente */
    UPDATE: HR_CODES.EMPLOYEES.UPDATE,
    /** Atualizar qualquer funcionário */
    UPDATE_ALL: HR_CODES.EMPLOYEES.UPDATE_ALL,
    /** Atualizar funcionários do time */
    UPDATE_TEAM: HR_CODES.EMPLOYEES.UPDATE_TEAM,
    /** Excluir funcionário */
    DELETE: HR_CODES.EMPLOYEES.DELETE,
    /** Demitir/desligar funcionário */
    TERMINATE: HR_CODES.EMPLOYEES.TERMINATE,
    /** Gerenciamento completo */
    MANAGE: HR_CODES.EMPLOYEES.MANAGE,
    /** Exportar dados de funcionários */
    EXPORT: DATA_PERMISSIONS.EXPORT.EMPLOYEES,
    /** Importar dados de funcionários */
    IMPORT: DATA_PERMISSIONS.IMPORT.EMPLOYEES,
  },

  /**
   * Permissões de Ausências (Absences)
   */
  ABSENCES: {
    /** Listar ausências */
    LIST: HR_CODES.ABSENCES.LIST,
    /** Visualizar detalhes de ausência */
    VIEW: HR_CODES.ABSENCES.READ,
    /** Visualizar todas as ausências */
    VIEW_ALL: HR_CODES.ABSENCES.READ_ALL,
    /** Visualizar ausências do time */
    VIEW_TEAM: HR_CODES.ABSENCES.READ_TEAM,
    /** Criar nova ausência */
    CREATE: HR_CODES.ABSENCES.CREATE,
    /** Atualizar ausência existente */
    UPDATE: HR_CODES.ABSENCES.UPDATE,
    /** Atualizar qualquer ausência */
    UPDATE_ALL: HR_CODES.ABSENCES.UPDATE_ALL,
    /** Atualizar ausências do time */
    UPDATE_TEAM: HR_CODES.ABSENCES.UPDATE_TEAM,
    /** Excluir ausência */
    DELETE: HR_CODES.ABSENCES.DELETE,
    /** Aprovar ausência */
    APPROVE: HR_CODES.ABSENCES.APPROVE,
    /** Aprovar qualquer ausência */
    APPROVE_ALL: HR_CODES.ABSENCES.APPROVE_ALL,
    /** Aprovar ausências do time */
    APPROVE_TEAM: HR_CODES.ABSENCES.APPROVE_TEAM,
    /** Gerenciamento completo */
    MANAGE: HR_CODES.ABSENCES.MANAGE,
  },

  /**
   * Permissões de Férias (Vacations)
   */
  VACATIONS: {
    /** Listar férias */
    LIST: HR_CODES.VACATIONS.LIST,
    /** Visualizar detalhes de férias */
    VIEW: HR_CODES.VACATIONS.READ,
    /** Visualizar todas as férias */
    VIEW_ALL: HR_CODES.VACATIONS.READ_ALL,
    /** Visualizar férias do time */
    VIEW_TEAM: HR_CODES.VACATIONS.READ_TEAM,
    /** Criar solicitação de férias */
    CREATE: HR_CODES.VACATIONS.CREATE,
    /** Atualizar férias existente */
    UPDATE: HR_CODES.VACATIONS.UPDATE,
    /** Atualizar qualquer férias */
    UPDATE_ALL: HR_CODES.VACATIONS.UPDATE_ALL,
    /** Atualizar férias do time */
    UPDATE_TEAM: HR_CODES.VACATIONS.UPDATE_TEAM,
    /** Excluir férias */
    DELETE: HR_CODES.VACATIONS.DELETE,
    /** Aprovar férias */
    APPROVE: HR_CODES.VACATIONS.APPROVE,
    /** Aprovar qualquer férias */
    APPROVE_ALL: HR_CODES.VACATIONS.APPROVE_ALL,
    /** Aprovar férias do time */
    APPROVE_TEAM: HR_CODES.VACATIONS.APPROVE_TEAM,
    /** Gerenciamento completo */
    MANAGE: HR_CODES.VACATIONS.MANAGE,
  },

  /**
   * Permissões de Registro de Ponto (Time Entries)
   */
  TIME_ENTRIES: {
    /** Listar registros de ponto */
    LIST: HR_CODES.TIME_ENTRIES.LIST,
    /** Visualizar detalhes de registro */
    VIEW: HR_CODES.TIME_ENTRIES.READ,
    /** Visualizar todos os registros */
    VIEW_ALL: HR_CODES.TIME_ENTRIES.READ_ALL,
    /** Visualizar registros do time */
    VIEW_TEAM: HR_CODES.TIME_ENTRIES.READ_TEAM,
    /** Criar registro de ponto */
    CREATE: HR_CODES.TIME_ENTRIES.CREATE,
    /** Atualizar registro existente */
    UPDATE: HR_CODES.TIME_ENTRIES.UPDATE,
    /** Atualizar qualquer registro */
    UPDATE_ALL: HR_CODES.TIME_ENTRIES.UPDATE_ALL,
    /** Atualizar registros do time */
    UPDATE_TEAM: HR_CODES.TIME_ENTRIES.UPDATE_TEAM,
    /** Excluir registro */
    DELETE: HR_CODES.TIME_ENTRIES.DELETE,
  },

  /**
   * Permissões de Horas Extras (Overtime)
   */
  OVERTIME: {
    /** Listar horas extras */
    LIST: HR_CODES.OVERTIME.LIST,
    /** Visualizar detalhes de hora extra */
    VIEW: HR_CODES.OVERTIME.READ,
    /** Visualizar todas as horas extras */
    VIEW_ALL: HR_CODES.OVERTIME.READ_ALL,
    /** Visualizar horas extras do time */
    VIEW_TEAM: HR_CODES.OVERTIME.READ_TEAM,
    /** Criar registro de hora extra */
    CREATE: HR_CODES.OVERTIME.CREATE,
    /** Atualizar hora extra existente */
    UPDATE: HR_CODES.OVERTIME.UPDATE,
    /** Atualizar qualquer hora extra */
    UPDATE_ALL: HR_CODES.OVERTIME.UPDATE_ALL,
    /** Atualizar horas extras do time */
    UPDATE_TEAM: HR_CODES.OVERTIME.UPDATE_TEAM,
    /** Excluir hora extra */
    DELETE: HR_CODES.OVERTIME.DELETE,
    /** Aprovar hora extra */
    APPROVE: HR_CODES.OVERTIME.APPROVE,
    /** Aprovar qualquer hora extra */
    APPROVE_ALL: HR_CODES.OVERTIME.APPROVE_ALL,
    /** Aprovar horas extras do time */
    APPROVE_TEAM: HR_CODES.OVERTIME.APPROVE_TEAM,
  },

  /**
   * Permissões de Banco de Horas (Time Bank)
   */
  TIME_BANK: {
    /** Listar banco de horas */
    LIST: HR_CODES.TIME_BANK.LIST,
    /** Visualizar detalhes do banco */
    VIEW: HR_CODES.TIME_BANK.READ,
    /** Visualizar todos os bancos */
    VIEW_ALL: HR_CODES.TIME_BANK.READ_ALL,
    /** Visualizar bancos do time */
    VIEW_TEAM: HR_CODES.TIME_BANK.READ_TEAM,
    /** Criar movimentação */
    CREATE: HR_CODES.TIME_BANK.CREATE,
    /** Atualizar banco existente */
    UPDATE: HR_CODES.TIME_BANK.UPDATE,
    /** Atualizar qualquer banco */
    UPDATE_ALL: HR_CODES.TIME_BANK.UPDATE_ALL,
    /** Atualizar bancos do time */
    UPDATE_TEAM: HR_CODES.TIME_BANK.UPDATE_TEAM,
    /** Excluir movimentação */
    DELETE: HR_CODES.TIME_BANK.DELETE,
    /** Gerenciamento completo */
    MANAGE: HR_CODES.TIME_BANK.MANAGE,
  },

  /**
   * Permissões de Folha de Pagamento (Payroll)
   */
  PAYROLL: {
    /** Listar folhas de pagamento */
    LIST: HR_CODES.PAYROLL.LIST,
    /** Visualizar detalhes da folha */
    VIEW: HR_CODES.PAYROLL.READ,
    /** Criar folha de pagamento */
    CREATE: HR_CODES.PAYROLL.CREATE,
    /** Atualizar folha existente */
    UPDATE: HR_CODES.PAYROLL.UPDATE,
    /** Excluir folha */
    DELETE: HR_CODES.PAYROLL.DELETE,
    /** Processar folha de pagamento */
    PROCESS: HR_CODES.PAYROLL.PROCESS,
    /** Aprovar folha de pagamento */
    APPROVE: HR_CODES.PAYROLL.APPROVE,
    /** Gerenciamento completo */
    MANAGE: HR_CODES.PAYROLL.MANAGE,
    /** Imprimir holerites */
    PRINT_PAYSLIPS: DATA_PERMISSIONS.PRINT.PAYSLIPS,
  },
  /**
   * Permissões de Escalas de Trabalho (Work Schedules)
   */
  WORK_SCHEDULES: {
    /** Listar escalas */
    LIST: HR_CODES.WORK_SCHEDULES.LIST,
    /** Visualizar detalhes de escala */
    VIEW: HR_CODES.WORK_SCHEDULES.READ,
    /** Criar nova escala */
    CREATE: HR_CODES.WORK_SCHEDULES.CREATE,
    /** Atualizar escala existente */
    UPDATE: HR_CODES.WORK_SCHEDULES.UPDATE,
    /** Excluir escala */
    DELETE: HR_CODES.WORK_SCHEDULES.DELETE,
    /** Gerenciamento completo */
    MANAGE: HR_CODES.WORK_SCHEDULES.MANAGE,
  },

  /**
   * Permissões de Bonificações (Bonuses)
   */
  BONUSES: {
    /** Listar bonificações */
    LIST: HR_CODES.BONUSES.LIST,
    /** Visualizar detalhes de bonificação */
    VIEW: HR_CODES.BONUSES.READ,
    /** Criar nova bonificação */
    CREATE: HR_CODES.BONUSES.CREATE,
    /** Atualizar bonificação existente */
    UPDATE: HR_CODES.BONUSES.UPDATE,
    /** Excluir bonificação */
    DELETE: HR_CODES.BONUSES.DELETE,
    /** Gerenciamento completo */
    MANAGE: HR_CODES.BONUSES.MANAGE,
  },

  /**
   * Permissões de Deduções (Deductions)
   */
  DEDUCTIONS: {
    /** Listar deduções */
    LIST: HR_CODES.DEDUCTIONS.LIST,
    /** Visualizar detalhes de dedução */
    VIEW: HR_CODES.DEDUCTIONS.READ,
    /** Criar nova dedução */
    CREATE: HR_CODES.DEDUCTIONS.CREATE,
    /** Atualizar dedução existente */
    UPDATE: HR_CODES.DEDUCTIONS.UPDATE,
    /** Excluir dedução */
    DELETE: HR_CODES.DEDUCTIONS.DELETE,
    /** Gerenciamento completo */
    MANAGE: HR_CODES.DEDUCTIONS.MANAGE,
  },
} as const;

/* ===========================================
   TYPE EXPORTS
   =========================================== */

export type WorkSchedulePermission =
  (typeof HR_PERMISSIONS.WORK_SCHEDULES)[keyof typeof HR_PERMISSIONS.WORK_SCHEDULES];

export type BonusPermission =
  (typeof HR_PERMISSIONS.BONUSES)[keyof typeof HR_PERMISSIONS.BONUSES];

export type DeductionPermission =
  (typeof HR_PERMISSIONS.DEDUCTIONS)[keyof typeof HR_PERMISSIONS.DEDUCTIONS];

export type CompanyPermission =
  (typeof HR_PERMISSIONS.COMPANIES)[keyof typeof HR_PERMISSIONS.COMPANIES];

export type DepartmentPermission =
  (typeof HR_PERMISSIONS.DEPARTMENTS)[keyof typeof HR_PERMISSIONS.DEPARTMENTS];

export type PositionPermission =
  (typeof HR_PERMISSIONS.POSITIONS)[keyof typeof HR_PERMISSIONS.POSITIONS];

export type EmployeePermission =
  (typeof HR_PERMISSIONS.EMPLOYEES)[keyof typeof HR_PERMISSIONS.EMPLOYEES];

export type AbsencePermission =
  (typeof HR_PERMISSIONS.ABSENCES)[keyof typeof HR_PERMISSIONS.ABSENCES];

export type VacationPermission =
  (typeof HR_PERMISSIONS.VACATIONS)[keyof typeof HR_PERMISSIONS.VACATIONS];

export type TimeEntryPermission =
  (typeof HR_PERMISSIONS.TIME_ENTRIES)[keyof typeof HR_PERMISSIONS.TIME_ENTRIES];

export type OvertimePermission =
  (typeof HR_PERMISSIONS.OVERTIME)[keyof typeof HR_PERMISSIONS.OVERTIME];

export type TimeBankPermission =
  (typeof HR_PERMISSIONS.TIME_BANK)[keyof typeof HR_PERMISSIONS.TIME_BANK];

export type PayrollPermission =
  (typeof HR_PERMISSIONS.PAYROLL)[keyof typeof HR_PERMISSIONS.PAYROLL];

export type HRPermission =
  | CompanyPermission
  | DepartmentPermission
  | PositionPermission
  | EmployeePermission
  | AbsencePermission
  | VacationPermission
  | TimeEntryPermission
  | OvertimePermission
  | TimeBankPermission
  | PayrollPermission
  | WorkSchedulePermission
  | BonusPermission
  | DeductionPermission;

/* ===========================================
   HELPER FUNCTIONS
   =========================================== */

/**
 * Obtém todas as permissões de uma entidade
 *
 * @example
 * ```tsx
 * const companyPermissions = getEntityPermissions('COMPANIES');
 * // ['hr.companies.list', 'hr.companies.read', ...]
 * ```
 */
export function getEntityPermissions(
  entity: keyof typeof HR_PERMISSIONS
): string[] {
  return Object.values(HR_PERMISSIONS[entity]);
}

/**
 * Obtém todas as permissões do módulo HR
 */
export function getAllHRPermissions(): string[] {
  return Object.values(HR_PERMISSIONS).flatMap(entity => Object.values(entity));
}

/**
 * Verifica se o usuário tem alguma permissão no módulo HR
 *
 * @example
 * ```tsx
 * const { hasPermission } = usePermissions();
 * const canAccessHR = hasAnyHRPermission(hasPermission);
 *
 * if (!canAccessHR) {
 *   return <AccessDenied />;
 * }
 * ```
 */
export function hasAnyHRPermission(
  hasPermission: (code: string) => boolean
): boolean {
  return getAllHRPermissions().some(permission => hasPermission(permission));
}

/**
 * Verifica se o usuário tem todas as permissões básicas (CRUD) de uma entidade
 *
 * @example
 * ```tsx
 * const { hasPermission } = usePermissions();
 * const hasFullCompanyAccess = hasEntityCrudPermissions(
 *   hasPermission,
 *   'COMPANIES'
 * );
 * ```
 */
export function hasEntityCrudPermissions(
  hasPermission: (code: string) => boolean,
  entity: keyof typeof HR_PERMISSIONS
): boolean {
  const permissions = HR_PERMISSIONS[entity] as Record<string, string>;
  const requiredKeys = ['LIST', 'VIEW', 'CREATE', 'UPDATE', 'DELETE'];
  return requiredKeys.every(
    key => !(key in permissions) || hasPermission(permissions[key])
  );
}

/**
 * Obtém o mapa de permissões para uso com useMultiplePermissions
 *
 * @example
 * ```tsx
 * const permissionMap = getPermissionMap('COMPANIES');
 * const permissions = useMultiplePermissions(permissionMap);
 *
 * if (permissions.canCreate) {
 *   // Pode criar
 * }
 * ```
 */
export function getPermissionMap(entity: keyof typeof HR_PERMISSIONS): {
  canList?: string;
  canView: string;
  canCreate?: string;
  canUpdate?: string;
  canDelete?: string;
} {
  const permissions = HR_PERMISSIONS[entity] as Record<string, string>;
  return {
    canList: permissions.LIST,
    canView: permissions.VIEW,
    canCreate: permissions.CREATE,
    canUpdate: permissions.UPDATE,
    canDelete: permissions.DELETE,
  };
}

/**
 * Verifica se o usuário tem permissão de escopo para uma entidade
 *
 * @example
 * ```tsx
 * const { hasPermission } = usePermissions();
 * const scope = getEffectiveScope(hasPermission, 'EMPLOYEES');
 * // 'all' | 'team' | 'none'
 * ```
 */
export function getEffectiveScope(
  hasPermission: (code: string) => boolean,
  entity:
    | 'EMPLOYEES'
    | 'ABSENCES'
    | 'VACATIONS'
    | 'TIME_ENTRIES'
    | 'OVERTIME'
    | 'TIME_BANK'
): 'all' | 'team' | 'none' {
  const permissions = HR_PERMISSIONS[entity];

  // Verifica se tem permissão "all" primeiro
  if ('VIEW_ALL' in permissions && hasPermission(permissions.VIEW_ALL)) {
    return 'all';
  }

  // Verifica se tem permissão "team"
  if ('VIEW_TEAM' in permissions && hasPermission(permissions.VIEW_TEAM)) {
    return 'team';
  }

  return 'none';
}

export default HR_PERMISSIONS;
