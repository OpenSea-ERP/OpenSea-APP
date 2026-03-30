/**
 * OpenSea OS - Overtime API Module
 */

// Query Keys
export {
  overtimeKeys,
  type OvertimeFilters,
  type OvertimeQueryKey,
} from './keys';

// Queries
export {
  useListOvertime,
  type ListOvertimeParams,
  type ListOvertimeResponse,
} from './list-overtime.query';

// Mutations
export {
  useCreateOvertime,
  useApproveOvertime,
  useUpdateOvertime,
  useDeleteOvertime,
  type CreateOvertimeOptions,
  type ApproveOvertimeOptions,
  type UpdateOvertimeOptions,
  type DeleteOvertimeOptions,
} from './mutations';

// Legacy API
export * from './overtime.api';
