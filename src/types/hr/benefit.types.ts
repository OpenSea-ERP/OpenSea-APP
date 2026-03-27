// Benefit Types — Gestão de Benefícios

import type { Employee } from './employee.types';

/**
 * BenefitType — Tipos de benefícios disponíveis
 */
export type BenefitType =
  | 'VT'
  | 'VR'
  | 'VA'
  | 'HEALTH'
  | 'DENTAL'
  | 'LIFE_INSURANCE'
  | 'DAYCARE'
  | 'PLR'
  | 'LOAN'
  | 'EDUCATION'
  | 'HOME_OFFICE'
  | 'FLEX';

/**
 * BenefitEnrollmentStatus — Status da inscrição
 */
export type BenefitEnrollmentStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

/**
 * FlexAllocationStatus — Status da alocação flex
 */
export type FlexAllocationStatus = 'DRAFT' | 'CONFIRMED' | 'LOCKED';

/**
 * BenefitDeductionType — Tipo de dedução
 */
export type BenefitDeductionType =
  | 'EMPLOYEE_SHARE'
  | 'COPARTICIPATION'
  | 'INSTALLMENT';

/**
 * BenefitPlan — Plano de benefício
 */
export interface BenefitPlan {
  id: string;
  tenantId: string;
  name: string;
  type: BenefitType;
  provider?: string | null;
  policyNumber?: string | null;
  description?: string | null;
  isActive: boolean;
  rules: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // Dados enriquecidos
  _count?: {
    enrollments?: number;
  };
  enrollments?: BenefitEnrollment[];
}

/**
 * BenefitEnrollment — Inscrição de funcionário em plano
 */
export interface BenefitEnrollment {
  id: string;
  tenantId: string;
  employeeId: string;
  benefitPlanId: string;
  startDate: string;
  endDate?: string | null;
  status: BenefitEnrollmentStatus;
  employeeContribution: number;
  employerContribution: number;
  dependantIds: string[];
  createdAt: string;
  updatedAt: string;
  // Relacionamentos
  employee?: Employee | null;
  benefitPlan?: BenefitPlan | null;
}

/**
 * FlexBenefitAllocation — Alocação de benefício flexível
 */
export interface FlexBenefitAllocation {
  id: string;
  tenantId: string;
  employeeId: string;
  month: number;
  year: number;
  totalBudget: number;
  allocations: Record<string, number>;
  status: FlexAllocationStatus;
  confirmedAt?: string | null;
  createdAt: string;
  // Relacionamentos
  employee?: Employee | null;
}

/**
 * BenefitDeduction — Dedução de benefício na folha
 */
export interface BenefitDeduction {
  id: string;
  tenantId: string;
  employeeId: string;
  benefitPlanId: string;
  payrollId?: string | null;
  amount: number;
  type: BenefitDeductionType;
  referenceMonth: number;
  referenceYear: number;
  // Relacionamentos
  employee?: Employee | null;
  benefitPlan?: BenefitPlan | null;
}

/**
 * CreateBenefitPlanData
 */
export interface CreateBenefitPlanData {
  name: string;
  type: BenefitType;
  provider?: string;
  policyNumber?: string;
  description?: string;
  isActive?: boolean;
  rules?: Record<string, unknown>;
}

/**
 * UpdateBenefitPlanData
 */
export interface UpdateBenefitPlanData {
  name?: string;
  type?: BenefitType;
  provider?: string;
  policyNumber?: string;
  description?: string;
  isActive?: boolean;
  rules?: Record<string, unknown>;
}

/**
 * EnrollEmployeeData
 */
export interface EnrollEmployeeData {
  employeeId: string;
  benefitPlanId: string;
  startDate: string;
  employeeContribution?: number;
  employerContribution?: number;
  dependantIds?: string[];
}

/**
 * BulkEnrollData
 */
export interface BulkEnrollData {
  employeeIds: string[];
  benefitPlanId: string;
  startDate: string;
  employeeContribution?: number;
  employerContribution?: number;
}

/**
 * UpdateEnrollmentData
 */
export interface UpdateEnrollmentData {
  status?: BenefitEnrollmentStatus;
  endDate?: string;
  employeeContribution?: number;
  employerContribution?: number;
  dependantIds?: string[];
}

/**
 * AllocateFlexData
 */
export interface AllocateFlexData {
  allocations: Record<string, number>;
}
