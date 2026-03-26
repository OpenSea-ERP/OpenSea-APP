/**
 * OpenSea OS - CIPA API Module
 */

// Query Keys
export { cipaKeys, type CipaMandateFilters } from './keys';

// Queries
export {
  useListCipaMandates,
  type ListCipaMandatesResponse,
  type ListCipaMandatesOptions,
} from './list-mandates.query';

// Mutations
export {
  useCreateCipaMandate,
  useDeleteCipaMandate,
  useAddCipaMember,
  useUpdateCipaMember,
  useRemoveCipaMember,
  type CreateCipaMandateOptions,
  type DeleteCipaMandateOptions,
} from './mutations';

// Legacy API
export * from './cipa.api';
