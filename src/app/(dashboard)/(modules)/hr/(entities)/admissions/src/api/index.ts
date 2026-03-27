/**
 * OpenSea OS - Admissions API Module
 */

// Query Keys
export { admissionKeys, type AdmissionFilters } from './keys';

// Queries
export {
  useListAdmissions,
  type ListAdmissionsResponse,
  type ListAdmissionsOptions,
} from './list-admissions.query';

// Mutations
export {
  useCreateAdmission,
  useUpdateAdmission,
  useCancelAdmission,
  useApproveAdmission,
  useRejectAdmission,
  useResendAdmission,
  type CreateAdmissionOptions,
  type UpdateAdmissionOptions,
  type CancelAdmissionOptions,
  type ApproveAdmissionOptions,
  type RejectAdmissionOptions,
  type ResendAdmissionOptions,
} from './mutations';

// Legacy API
export * from './admissions.api';
