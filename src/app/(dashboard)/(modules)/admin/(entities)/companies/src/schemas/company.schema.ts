/**
 * OpenSea OS - Company Validation Schemas
 *
 * Schemas de validação Zod para formulários de empresa.
 * Inclui validações de CNPJ, e-mail e campos obrigatórios.
 *
 * @example
 * ```tsx
 * import { createCompanySchema } from './schemas/company.schema';
 * import { zodResolver } from '@hookform/resolvers/zod';
 *
 * const form = useForm({
 *   resolver: zodResolver(createCompanySchema),
 *   defaultValues: {
 *     legalName: '',
 *     cnpj: '',
 *     status: 'ACTIVE',
 *   },
 * });
 * ```
 */

import { z } from 'zod';

/* ===========================================
   HELPER VALIDATORS
   =========================================== */

/**
 * Validador de CNPJ
 * Aceita tanto formatado (XX.XXX.XXX/XXXX-XX) quanto apenas números
 */
const cnpjValidator = z
  .string()
  .min(1, 'CNPJ é obrigatório')
  .refine(
    val => {
      // Remove formatação
      const cleaned = val.replace(/\D/g, '');
      // Deve ter exatamente 14 dígitos
      return cleaned.length === 14;
    },
    { message: 'CNPJ deve ter 14 dígitos' }
  )
  .refine(
    val => {
      // Validação do dígito verificador do CNPJ
      const cleaned = val.replace(/\D/g, '');

      // CNPJs inválidos conhecidos
      if (/^(\d)\1{13}$/.test(cleaned)) return false;

      // Cálculo do primeiro dígito verificador
      let sum = 0;
      let weight = 5;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned[i]) * weight;
        weight = weight === 2 ? 9 : weight - 1;
      }
      let digit = 11 - (sum % 11);
      if (digit > 9) digit = 0;
      if (parseInt(cleaned[12]) !== digit) return false;

      // Cálculo do segundo dígito verificador
      sum = 0;
      weight = 6;
      for (let i = 0; i < 13; i++) {
        sum += parseInt(cleaned[i]) * weight;
        weight = weight === 2 ? 9 : weight - 1;
      }
      digit = 11 - (sum % 11);
      if (digit > 9) digit = 0;
      if (parseInt(cleaned[13]) !== digit) return false;

      return true;
    },
    { message: 'CNPJ inválido' }
  );

/**
 * Validador de e-mail (opcional)
 */
const optionalEmailValidator = z
  .string()
  .email('E-mail inválido')
  .optional()
  .nullable()
  .or(z.literal(''));

/**
 * Validador de telefone (opcional)
 * Aceita formatos comuns brasileiros
 */
const optionalPhoneValidator = z
  .string()
  .optional()
  .nullable()
  .refine(
    val => {
      if (!val || val === '') return true;
      const cleaned = val.replace(/\D/g, '');
      // Telefone brasileiro: 10 ou 11 dígitos (com DDD)
      return cleaned.length >= 10 && cleaned.length <= 11;
    },
    { message: 'Telefone inválido' }
  );

/* ===========================================
   ENUM SCHEMAS
   =========================================== */

/**
 * Status da empresa
 */
export const companyStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], {
  message: 'Status inválido',
});

/**
 * Regime tributário
 */
export const taxRegimeSchema = z.enum(
  ['SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'IMUNE_ISENTA', 'OUTROS'],
  {
    message: 'Regime tributário inválido',
  }
);

/* ===========================================
   MAIN SCHEMAS
   =========================================== */

/**
 * Schema para criação de empresa
 */
export const createCompanySchema = z.object({
  // Identificação
  legalName: z
    .string()
    .min(3, 'Razão social deve ter no mínimo 3 caracteres')
    .max(255, 'Razão social muito longa'),

  tradeName: z
    .string()
    .max(255, 'Nome fantasia muito longo')
    .optional()
    .nullable()
    .or(z.literal('')),

  cnpj: cnpjValidator,

  // Registros
  stateRegistration: z
    .string()
    .max(50, 'Inscrição estadual muito longa')
    .optional()
    .nullable()
    .or(z.literal('')),

  municipalRegistration: z
    .string()
    .max(50, 'Inscrição municipal muito longa')
    .optional()
    .nullable()
    .or(z.literal('')),

  legalNature: z
    .string()
    .max(255, 'Natureza jurídica muito longa')
    .optional()
    .nullable()
    .or(z.literal('')),

  // Tributário
  taxRegime: taxRegimeSchema.optional(),

  taxRegimeDetail: z
    .string()
    .max(255, 'Detalhe do regime muito longo')
    .optional()
    .nullable()
    .or(z.literal('')),

  activityStartDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      val => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Data inválida' }
    ),

  // Status
  status: companyStatusSchema.default('ACTIVE'),

  // Contato
  email: optionalEmailValidator,
  phoneMain: optionalPhoneValidator,
  phoneAlt: optionalPhoneValidator,

  // Visual
  logoUrl: z
    .string()
    .url('URL inválida')
    .optional()
    .nullable()
    .or(z.literal('')),
});

/**
 * Schema para atualização de empresa
 * Todos os campos são opcionais
 */
export const updateCompanySchema = createCompanySchema.partial();

/* ===========================================
   SUB-RESOURCE SCHEMAS
   =========================================== */

/**
 * Tipo de endereço da empresa
 */
export const addressTypeSchema = z.enum(
  ['FISCAL', 'DELIVERY', 'BILLING', 'OTHER'],
  {
    message: 'Tipo de endereço inválido',
  }
);

/**
 * Schema para endereço de empresa
 */
export const companyAddressSchema = z.object({
  type: addressTypeSchema,

  zip: z
    .string()
    .min(1, 'CEP é obrigatório')
    .refine(
      val => {
        const cleaned = val.replace(/\D/g, '');
        return cleaned.length === 8;
      },
      { message: 'CEP deve ter 8 dígitos' }
    ),

  street: z.string().max(255, 'Logradouro muito longo').optional().nullable(),
  number: z.string().max(20, 'Número muito longo').optional().nullable(),
  complement: z
    .string()
    .max(100, 'Complemento muito longo')
    .optional()
    .nullable(),
  district: z.string().max(100, 'Bairro muito longo').optional().nullable(),
  city: z.string().max(100, 'Cidade muito longa').optional().nullable(),
  state: z
    .string()
    .max(2, 'Use a sigla do estado (2 letras)')
    .optional()
    .nullable(),
  ibgeCityCode: z
    .string()
    .max(10, 'Código IBGE inválido')
    .optional()
    .nullable(),
  countryCode: z
    .string()
    .max(3, 'Código de país inválido')
    .optional()
    .nullable(),
  isPrimary: z.boolean().default(false),
});

/**
 * Schema para CNAE de empresa
 */
export const companyCnaeSchema = z.object({
  code: z
    .string()
    .min(1, 'Código CNAE é obrigatório')
    .max(10, 'Código CNAE inválido'),

  description: z
    .string()
    .max(500, 'Descrição muito longa')
    .optional()
    .nullable(),

  isPrimary: z.boolean().default(false),

  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

/**
 * Schema para stakeholder (sócio) de empresa
 */
export const companyStakeholderSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(255, 'Nome muito longo'),

  role: z.string().max(100, 'Cargo muito longo').optional().nullable(),

  personDocumentMasked: z
    .string()
    .max(20, 'Documento muito longo')
    .optional()
    .nullable(),

  isLegalRepresentative: z.boolean().default(false),

  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),

  entryDate: z.string().optional().nullable(),
  exitDate: z.string().optional().nullable(),
  source: z.string().max(50, 'Fonte muito longa').optional().nullable(),
});

/* ===========================================
   TYPE EXPORTS
   =========================================== */

/**
 * Tipos inferidos dos schemas
 */
export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
export type CompanyAddressFormData = z.infer<typeof companyAddressSchema>;
export type CompanyCnaeFormData = z.infer<typeof companyCnaeSchema>;
export type CompanyStakeholderFormData = z.infer<
  typeof companyStakeholderSchema
>;
export type CompanyStatus = z.infer<typeof companyStatusSchema>;
export type TaxRegime = z.infer<typeof taxRegimeSchema>;
export type AddressType = z.infer<typeof addressTypeSchema>;

export default createCompanySchema;
