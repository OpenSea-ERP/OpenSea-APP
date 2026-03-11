/**
 * OpenSea OS - Companies API Module
 *
 * Exporta todas as queries, mutations e utilitários relacionados
 * à API de empresas.
 *
 * @example
 * ```tsx
 * // Importação organizada
 * import {
 *   useListCompanies,
 *   useGetCompany,
 *   useCreateCompany,
 *   useUpdateCompany,
 *   useDeleteCompany,
 *   companyKeys,
 * } from './api';
 * ```
 */

/* ===========================================
   QUERY KEYS
   =========================================== */
export { companyKeys, type CompanyFilters, type CompanyQueryKey } from './keys';

/* ===========================================
   QUERIES
   =========================================== */
export {
  useListCompanies,
  prefetchCompanies,
  type ListCompaniesParams,
  type ListCompaniesResponse,
  type ListCompaniesOptions,
} from './list-companies.query';

export {
  useGetCompany,
  useCompanyAddresses,
  useCompanyCnaes,
  useCompanyStakeholders,
  useCompanyFiscalSettings,
  type GetCompanyResponse,
  type GetCompanyOptions,
} from './get-company.query';

/* ===========================================
   MUTATIONS
   =========================================== */
export {
  useCreateCompany,
  type CreateCompanyOptions,
  type CreateCompanyMutation,
} from './create-company.mutation';

export {
  useUpdateCompany,
  type UpdateCompanyVariables,
  type UpdateCompanyOptions,
} from './update-company.mutation';

export {
  useDeleteCompany,
  type DeleteCompanyVariables,
  type DeleteCompanyResult,
  type DeleteCompanyOptions,
} from './delete-company.mutation';

/* ===========================================
   LEGACY API (retrocompatibilidade)
   Mantido para não quebrar código existente
   =========================================== */
export { companiesApi } from './company.api';

/* ===========================================
   SUB-RESOURCES APIs (retrocompatibilidade)
   =========================================== */
export * from './addresses.api';
export * from './cnaes.api';
export * from './fiscal-settings.api';
export * from './stakeholders.api';
