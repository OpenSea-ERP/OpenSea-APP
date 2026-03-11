import type { Company, CreateCompanyData, UpdateCompanyData } from '@/types/hr';

const WEIGHTS_DIGIT_ONE = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const WEIGHTS_DIGIT_TWO = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Converte string vazia para null
 * Mantém null, undefined e strings não vazias como estão
 */
const emptyToNull = <T>(value: T): T | null => {
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  return value;
};

/**
 * Lista de campos opcionais que devem ter strings vazias convertidas para null
 */
const NULLABLE_FIELDS: (keyof UpdateCompanyData)[] = [
  'tradeName',
  'stateRegistration',
  'municipalRegistration',
  'legalNature',
  'taxRegime',
  'taxRegimeDetail',
  'activityStartDate',
  'email',
  'phoneMain',
  'phoneAlt',
  'logoUrl',
];

/**
 * Normaliza os dados do formulário de empresa para envio à API
 * - Converte strings vazias para null em campos opcionais
 * - Remove formatação do CNPJ
 * - Remove campos undefined
 */
export const normalizeCompanyData = (
  data: Partial<Company>
): UpdateCompanyData => {
  const normalized: Record<string, unknown> = {};

  // Campos obrigatórios
  if (data.legalName !== undefined) {
    normalized.legalName = data.legalName;
  }

  if (data.cnpj !== undefined) {
    normalized.cnpj = sanitizeCnpj(String(data.cnpj));
  }

  if (data.status !== undefined) {
    normalized.status = data.status;
  }

  // Campos opcionais - converter string vazia para null
  for (const field of NULLABLE_FIELDS) {
    if (field in data) {
      const value = data[field as keyof Company];
      normalized[field] = emptyToNull(value);
    }
  }

  return normalized as UpdateCompanyData;
};

const randomDigits = (length: number): number[] => {
  return Array.from({ length }, () => Math.floor(Math.random() * 10));
};

const calculateDigit = (numbers: number[], weights: number[]): number => {
  const sum = numbers.reduce((acc, num, idx) => acc + num * weights[idx], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
};

export const sanitizeCnpj = (value: string): string => value.replace(/\D/g, '');

export const generateValidCnpj = (seed?: string): string => {
  const baseDigits = seed
    ? sanitizeCnpj(seed).padEnd(12, '0').slice(0, 12).split('').map(Number)
    : randomDigits(12);

  const digit1 = calculateDigit(baseDigits, WEIGHTS_DIGIT_ONE);
  const digit2 = calculateDigit([...baseDigits, digit1], WEIGHTS_DIGIT_TWO);

  return [...baseDigits, digit1, digit2].join('');
};

export const buildCompanyPayload = (
  data: Partial<CreateCompanyData | UpdateCompanyData>
): UpdateCompanyData => {
  const payload: UpdateCompanyData = {
    ...data,
    cnpj: data.cnpj ? sanitizeCnpj(String(data.cnpj)) : undefined,
    status: (data as UpdateCompanyData).status || 'ACTIVE',
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as UpdateCompanyData;
};
