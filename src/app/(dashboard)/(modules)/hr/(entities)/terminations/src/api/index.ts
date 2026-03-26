/**
 * OpenSea OS - Terminations API Module
 */

// Query Keys
export { terminationKeys, type TerminationFilters } from './keys';

// Queries
export {
  useListTerminations,
  type ListTerminationsResponse,
  type ListTerminationsOptions,
} from './list-terminations.query';

// Mutations
export {
  useCreateTermination,
  useDeleteTermination,
  useCalculateTermination,
  useMarkTerminationAsPaid,
  type CreateTerminationOptions,
  type DeleteTerminationOptions,
  type CalculateTerminationOptions,
  type MarkAsPaidOptions,
} from './mutations';

// Legacy API
export * from './terminations.api';
