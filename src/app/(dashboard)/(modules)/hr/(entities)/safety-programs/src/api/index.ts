/**
 * OpenSea OS - Safety Programs API Module
 */

// Query Keys
export { safetyProgramKeys, type SafetyProgramFilters } from './keys';

// Queries
export {
  useListSafetyPrograms,
  type ListSafetyProgramsResponse,
  type ListSafetyProgramsOptions,
} from './list-safety-programs.query';

// Mutations
export {
  useCreateSafetyProgram,
  useUpdateSafetyProgram,
  useDeleteSafetyProgram,
  useCreateWorkplaceRisk,
  useUpdateWorkplaceRisk,
  useDeleteWorkplaceRisk,
  type CreateSafetyProgramOptions,
  type UpdateSafetyProgramOptions,
  type DeleteSafetyProgramOptions,
} from './mutations';

// Legacy API
export * from './safety-programs.api';
