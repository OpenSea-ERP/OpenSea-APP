/**
 * OpenSea OS - Company Schemas
 *
 * Exporta todos os schemas de validação do módulo Companies.
 */

export {
  // Main schemas
  createCompanySchema,
  updateCompanySchema,

  // Sub-resource schemas
  companyAddressSchema,
  companyCnaeSchema,
  companyStakeholderSchema,

  // Enum schemas
  companyStatusSchema,
  taxRegimeSchema,
  addressTypeSchema,

  // Types
  type CreateCompanyFormData,
  type UpdateCompanyFormData,
  type CompanyAddressFormData,
  type CompanyCnaeFormData,
  type CompanyStakeholderFormData,
  type CompanyStatus,
  type TaxRegime,
  type AddressType,
} from './company.schema';
