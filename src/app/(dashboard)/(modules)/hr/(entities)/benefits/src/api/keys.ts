/**
 * OpenSea OS - Benefits Query Keys
 */

export interface BenefitPlanFilters {
  page?: number;
  perPage?: number;
  search?: string;
  type?: string;
  isActive?: boolean;
}

export interface EnrollmentFilters {
  page?: number;
  perPage?: number;
  benefitPlanId?: string;
  employeeId?: string;
  status?: string;
}

export const benefitKeys = {
  all: ['benefit-plans'] as const,
  lists: () => [...benefitKeys.all, 'list'] as const,
  list: (filters?: BenefitPlanFilters) =>
    [...benefitKeys.lists(), filters ?? {}] as const,
  details: () => [...benefitKeys.all, 'detail'] as const,
  detail: (id: string) => [...benefitKeys.details(), id] as const,

  // Enrollments
  enrollments: () => ['benefit-enrollments'] as const,
  enrollmentList: (filters?: EnrollmentFilters) =>
    [...benefitKeys.enrollments(), 'list', filters ?? {}] as const,
  enrollmentsByPlan: (planId: string) =>
    [...benefitKeys.enrollments(), 'by-plan', planId] as const,

  // Flex
  flex: () => ['flex-benefits'] as const,
  myAllocation: () => [...benefitKeys.flex(), 'my-allocation'] as const,
  flexHistory: () => [...benefitKeys.flex(), 'history'] as const,

  // Deductions
  deductions: () => ['benefit-deductions'] as const,
} as const;

export default benefitKeys;
