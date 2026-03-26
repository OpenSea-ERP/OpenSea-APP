/**
 * OpenSea OS - HR Permissions Constants
 *
 * Proxy de conveniência sobre os códigos centrais em permission-codes.ts.
 * Mantém a API antiga (LIST, VIEW, CREATE, UPDATE, DELETE, MANAGE)
 * mapeando para as novas ações (ACCESS, REGISTER, MODIFY, REMOVE, ADMIN).
 */

import {
  HR_PERMISSIONS as HR_CODES,
  ADMIN_PERMISSIONS as ADMIN_CODES,
} from '@/config/rbac/permission-codes';

/* ===========================================
   PERMISSION CONSTANTS
   =========================================== */

export const HR_PERMISSIONS = {
  /**
   * Permissões de Empresas (Companies)
   * Companies moved to ADMIN module — readonly proxy here
   */
  COMPANIES: {
    VIEW: ADMIN_CODES.COMPANIES.ACCESS,
  },

  /**
   * Permissões de Departamentos (Departments)
   */
  DEPARTMENTS: {
    LIST: HR_CODES.DEPARTMENTS.ACCESS,
    VIEW: HR_CODES.DEPARTMENTS.ACCESS,
    CREATE: HR_CODES.DEPARTMENTS.REGISTER,
    UPDATE: HR_CODES.DEPARTMENTS.MODIFY,
    DELETE: HR_CODES.DEPARTMENTS.REMOVE,
    MANAGE: HR_CODES.DEPARTMENTS.REMOVE,
  },

  /**
   * Permissões de Cargos (Positions)
   */
  POSITIONS: {
    LIST: HR_CODES.POSITIONS.ACCESS,
    VIEW: HR_CODES.POSITIONS.ACCESS,
    CREATE: HR_CODES.POSITIONS.REGISTER,
    UPDATE: HR_CODES.POSITIONS.MODIFY,
    DELETE: HR_CODES.POSITIONS.REMOVE,
    MANAGE: HR_CODES.POSITIONS.REMOVE,
  },

  /**
   * Permissões de Funcionários (Employees)
   */
  EMPLOYEES: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    VIEW_ALL: HR_CODES.EMPLOYEES.ACCESS,
    VIEW_TEAM: HR_CODES.EMPLOYEES.ONLYSELF,
    CREATE: HR_CODES.EMPLOYEES.REGISTER,
    UPDATE: HR_CODES.EMPLOYEES.MODIFY,
    UPDATE_ALL: HR_CODES.EMPLOYEES.MODIFY,
    UPDATE_TEAM: HR_CODES.EMPLOYEES.ONLYSELF,
    DELETE: HR_CODES.EMPLOYEES.REMOVE,
    TERMINATE: HR_CODES.EMPLOYEES.ADMIN,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
    EXPORT: HR_CODES.EMPLOYEES.EXPORT,
    IMPORT: HR_CODES.EMPLOYEES.IMPORT,
  },

  /**
   * Permissões de Ausências (Absences)
   */
  ABSENCES: {
    LIST: HR_CODES.ABSENCES.ACCESS,
    VIEW: HR_CODES.ABSENCES.ACCESS,
    VIEW_ALL: HR_CODES.ABSENCES.ACCESS,
    VIEW_TEAM: HR_CODES.ABSENCES.ONLYSELF,
    CREATE: HR_CODES.ABSENCES.REGISTER,
    UPDATE: HR_CODES.ABSENCES.MODIFY,
    UPDATE_ALL: HR_CODES.ABSENCES.MODIFY,
    UPDATE_TEAM: HR_CODES.ABSENCES.ONLYSELF,
    DELETE: HR_CODES.ABSENCES.REMOVE,
    APPROVE: HR_CODES.ABSENCES.ADMIN,
    APPROVE_ALL: HR_CODES.ABSENCES.ADMIN,
    APPROVE_TEAM: HR_CODES.ABSENCES.ONLYSELF,
    MANAGE: HR_CODES.ABSENCES.ADMIN,
  },

  /**
   * Permissões de Férias (Vacations)
   */
  VACATIONS: {
    LIST: HR_CODES.VACATIONS.ACCESS,
    VIEW: HR_CODES.VACATIONS.ACCESS,
    VIEW_ALL: HR_CODES.VACATIONS.ACCESS,
    VIEW_TEAM: HR_CODES.VACATIONS.ONLYSELF,
    CREATE: HR_CODES.VACATIONS.REGISTER,
    UPDATE: HR_CODES.VACATIONS.MODIFY,
    UPDATE_ALL: HR_CODES.VACATIONS.MODIFY,
    UPDATE_TEAM: HR_CODES.VACATIONS.ONLYSELF,
    DELETE: HR_CODES.VACATIONS.MODIFY,
    APPROVE: HR_CODES.VACATIONS.ADMIN,
    APPROVE_ALL: HR_CODES.VACATIONS.ADMIN,
    APPROVE_TEAM: HR_CODES.VACATIONS.ONLYSELF,
    MANAGE: HR_CODES.VACATIONS.ADMIN,
  },

  /**
   * Permissões de Registro de Ponto (Time Control)
   */
  TIME_ENTRIES: {
    LIST: HR_CODES.TIME_CONTROL.ACCESS,
    VIEW: HR_CODES.TIME_CONTROL.ACCESS,
    VIEW_ALL: HR_CODES.TIME_CONTROL.ACCESS,
    VIEW_TEAM: HR_CODES.TIME_CONTROL.ACCESS,
    CREATE: HR_CODES.TIME_CONTROL.REGISTER,
    UPDATE: HR_CODES.TIME_CONTROL.REGISTER,
    UPDATE_ALL: HR_CODES.TIME_CONTROL.REGISTER,
    UPDATE_TEAM: HR_CODES.TIME_CONTROL.REGISTER,
    DELETE: HR_CODES.TIME_CONTROL.REGISTER,
  },

  /**
   * Permissões de Horas Extras (Overtime)
   * Mapped to employees since no dedicated resource
   */
  OVERTIME: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    VIEW_ALL: HR_CODES.EMPLOYEES.ACCESS,
    VIEW_TEAM: HR_CODES.EMPLOYEES.ONLYSELF,
    CREATE: HR_CODES.EMPLOYEES.REGISTER,
    UPDATE: HR_CODES.EMPLOYEES.MODIFY,
    UPDATE_ALL: HR_CODES.EMPLOYEES.MODIFY,
    UPDATE_TEAM: HR_CODES.EMPLOYEES.ONLYSELF,
    DELETE: HR_CODES.EMPLOYEES.REMOVE,
    APPROVE: HR_CODES.EMPLOYEES.ADMIN,
    APPROVE_ALL: HR_CODES.EMPLOYEES.ADMIN,
    APPROVE_TEAM: HR_CODES.EMPLOYEES.ONLYSELF,
  },

  /**
   * Permissões de Banco de Horas (Time Bank)
   * Mapped to employees since no dedicated resource
   */
  TIME_BANK: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    VIEW_ALL: HR_CODES.EMPLOYEES.ACCESS,
    VIEW_TEAM: HR_CODES.EMPLOYEES.ONLYSELF,
    CREATE: HR_CODES.EMPLOYEES.REGISTER,
    UPDATE: HR_CODES.EMPLOYEES.MODIFY,
    UPDATE_ALL: HR_CODES.EMPLOYEES.MODIFY,
    UPDATE_TEAM: HR_CODES.EMPLOYEES.ONLYSELF,
    DELETE: HR_CODES.EMPLOYEES.REMOVE,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
  },

  /**
   * Permissões de Folha de Pagamento (Payroll)
   */
  PAYROLL: {
    LIST: HR_CODES.PAYROLL.ACCESS,
    VIEW: HR_CODES.PAYROLL.ACCESS,
    CREATE: HR_CODES.PAYROLL.REGISTER,
    UPDATE: HR_CODES.PAYROLL.REGISTER,
    DELETE: HR_CODES.PAYROLL.ADMIN,
    PROCESS: HR_CODES.PAYROLL.ADMIN,
    APPROVE: HR_CODES.PAYROLL.ADMIN,
    MANAGE: HR_CODES.PAYROLL.ADMIN,
    PRINT_PAYSLIPS: HR_CODES.PAYROLL.PRINT,
    EXPORT: HR_CODES.PAYROLL.EXPORT,
  },

  /**
   * Permissões de Escalas de Trabalho (Work Schedules)
   */
  WORK_SCHEDULES: {
    LIST: HR_CODES.WORK_SCHEDULES.ACCESS,
    VIEW: HR_CODES.WORK_SCHEDULES.ACCESS,
    CREATE: HR_CODES.WORK_SCHEDULES.REGISTER,
    UPDATE: HR_CODES.WORK_SCHEDULES.MODIFY,
    DELETE: HR_CODES.WORK_SCHEDULES.REMOVE,
    MANAGE: HR_CODES.WORK_SCHEDULES.REMOVE,
  },

  /**
   * Permissões de Bonificações (Bonuses)
   * Mapped to employees since no dedicated resource in new codes
   */
  BONUSES: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    CREATE: HR_CODES.EMPLOYEES.REGISTER,
    UPDATE: HR_CODES.EMPLOYEES.MODIFY,
    DELETE: HR_CODES.EMPLOYEES.REMOVE,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
  },

  /**
   * Permissões de Deduções (Deductions)
   * Mapped to employees since no dedicated resource in new codes
   */
  DEDUCTIONS: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    CREATE: HR_CODES.EMPLOYEES.REGISTER,
    UPDATE: HR_CODES.EMPLOYEES.MODIFY,
    DELETE: HR_CODES.EMPLOYEES.REMOVE,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
  },

  /**
   * Permissões de Dependentes (Dependants)
   * Mapped to employees since nested under employee
   */
  DEPENDANTS: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    CREATE: HR_CODES.EMPLOYEES.REGISTER,
    UPDATE: HR_CODES.EMPLOYEES.MODIFY,
    DELETE: HR_CODES.EMPLOYEES.REMOVE,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
  },

  /**
   * Permissões de Exames Médicos (Medical Exams)
   * Mapped to employees since no dedicated resource in new codes
   */
  MEDICAL_EXAMS: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    CREATE: HR_CODES.EMPLOYEES.REGISTER,
    UPDATE: HR_CODES.EMPLOYEES.MODIFY,
    DELETE: HR_CODES.EMPLOYEES.REMOVE,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
  },

  /**
   * Permissões de Rescisões (Terminations)
   * Mapped to employees since no dedicated resource in new codes
   */
  TERMINATIONS: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    CREATE: HR_CODES.EMPLOYEES.REGISTER,
    UPDATE: HR_CODES.EMPLOYEES.MODIFY,
    DELETE: HR_CODES.EMPLOYEES.REMOVE,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
  },

  /**
   * Permissões de Programas de Segurança (Safety Programs)
   * Mapped to employees since no dedicated resource in new codes
   */
  SAFETY_PROGRAMS: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    CREATE: HR_CODES.EMPLOYEES.REGISTER,
    UPDATE: HR_CODES.EMPLOYEES.MODIFY,
    DELETE: HR_CODES.EMPLOYEES.REMOVE,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
  },

  /**
   * Permissões de Riscos Ocupacionais (Workplace Risks)
   * Mapped to safety programs since nested under safety program
   */
  WORKPLACE_RISKS: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    CREATE: HR_CODES.EMPLOYEES.REGISTER,
    UPDATE: HR_CODES.EMPLOYEES.MODIFY,
    DELETE: HR_CODES.EMPLOYEES.REMOVE,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
  },

  /**
   * Permissões de CIPA
   * Mapped to employees since no dedicated resource in new codes
   */
  CIPA: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    CREATE: HR_CODES.EMPLOYEES.REGISTER,
    UPDATE: HR_CODES.EMPLOYEES.MODIFY,
    DELETE: HR_CODES.EMPLOYEES.REMOVE,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
  },

  /**
   * Permissões de Zonas de Geofencing (Geofence Zones)
   * Mapped to time_control since it's part of time tracking
   */
  GEOFENCE_ZONES: {
    LIST: HR_CODES.TIME_CONTROL.ACCESS,
    VIEW: HR_CODES.TIME_CONTROL.ACCESS,
    CREATE: HR_CODES.TIME_CONTROL.REGISTER,
    UPDATE: HR_CODES.TIME_CONTROL.REGISTER,
    DELETE: HR_CODES.TIME_CONTROL.REGISTER,
    MANAGE: HR_CODES.TIME_CONTROL.REGISTER,
  },

  /**
   * Permissões de Configurações do RH
   */
  CONFIG: {
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    UPDATE: HR_CODES.EMPLOYEES.ADMIN,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
  },

  /**
   * Permissões do eSocial
   * Mapped to employees admin since it requires elevated access
   */
  ESOCIAL: {
    LIST: HR_CODES.EMPLOYEES.ACCESS,
    VIEW: HR_CODES.EMPLOYEES.ACCESS,
    APPROVE: HR_CODES.EMPLOYEES.ADMIN,
    TRANSMIT: HR_CODES.EMPLOYEES.ADMIN,
    MANAGE: HR_CODES.EMPLOYEES.ADMIN,
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

export type DependantPermission =
  (typeof HR_PERMISSIONS.DEPENDANTS)[keyof typeof HR_PERMISSIONS.DEPENDANTS];

export type MedicalExamPermission =
  (typeof HR_PERMISSIONS.MEDICAL_EXAMS)[keyof typeof HR_PERMISSIONS.MEDICAL_EXAMS];

export type TerminationPermission =
  (typeof HR_PERMISSIONS.TERMINATIONS)[keyof typeof HR_PERMISSIONS.TERMINATIONS];

export type SafetyProgramPermission =
  (typeof HR_PERMISSIONS.SAFETY_PROGRAMS)[keyof typeof HR_PERMISSIONS.SAFETY_PROGRAMS];

export type WorkplaceRiskPermission =
  (typeof HR_PERMISSIONS.WORKPLACE_RISKS)[keyof typeof HR_PERMISSIONS.WORKPLACE_RISKS];

export type CipaPermission =
  (typeof HR_PERMISSIONS.CIPA)[keyof typeof HR_PERMISSIONS.CIPA];

export type GeofenceZonePermission =
  (typeof HR_PERMISSIONS.GEOFENCE_ZONES)[keyof typeof HR_PERMISSIONS.GEOFENCE_ZONES];

export type HrConfigPermission =
  (typeof HR_PERMISSIONS.CONFIG)[keyof typeof HR_PERMISSIONS.CONFIG];

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
  | DeductionPermission
  | DependantPermission
  | MedicalExamPermission
  | TerminationPermission
  | SafetyProgramPermission
  | WorkplaceRiskPermission
  | CipaPermission
  | GeofenceZonePermission
  | HrConfigPermission;

/* ===========================================
   HELPER FUNCTIONS
   =========================================== */

export function getEntityPermissions(
  entity: keyof typeof HR_PERMISSIONS
): string[] {
  return Object.values(HR_PERMISSIONS[entity]);
}

export function getAllHRPermissions(): string[] {
  return Object.values(HR_PERMISSIONS).flatMap(entity => Object.values(entity));
}

export function hasAnyHRPermission(
  hasPermission: (code: string) => boolean
): boolean {
  return getAllHRPermissions().some(permission => hasPermission(permission));
}

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

  if ('VIEW_ALL' in permissions && hasPermission(permissions.VIEW_ALL)) {
    return 'all';
  }

  if ('VIEW_TEAM' in permissions && hasPermission(permissions.VIEW_TEAM)) {
    return 'team';
  }

  return 'none';
}

export default HR_PERMISSIONS;
