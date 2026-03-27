/**
 * OpenSea OS - Benefits API Module
 */

// Query Keys
export {
  benefitKeys,
  type BenefitPlanFilters,
  type EnrollmentFilters,
} from './keys';

// Queries
export {
  useListBenefitPlans,
  type ListBenefitPlansParams,
  type ListBenefitPlansResponse,
  type ListBenefitPlansOptions,
} from './list-plans.query';

// Mutations
export {
  useCreateBenefitPlan,
  useUpdateBenefitPlan,
  useDeleteBenefitPlan,
  useEnrollEmployee,
  useCancelEnrollment,
  type CreateBenefitPlanOptions,
  type UpdateBenefitPlanVariables,
  type UpdateBenefitPlanOptions,
  type DeleteBenefitPlanOptions,
  type EnrollEmployeeOptions,
  type CancelEnrollmentOptions,
} from './mutations';

// API
export * from './benefits.api';
