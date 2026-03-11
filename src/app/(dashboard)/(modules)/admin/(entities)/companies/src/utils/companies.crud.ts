import { logger } from '@/lib/logger';
import type { Company, CreateCompanyData, UpdateCompanyData } from '@/types/hr';
import { companiesApi } from '../api';
import { buildCompanyPayload, generateValidCnpj } from './companies.helpers';

export async function createCompany(data: Partial<Company>): Promise<Company> {
  const payload = buildCompanyPayload(
    data as Partial<CreateCompanyData | UpdateCompanyData>
  );
  return companiesApi.create(payload as CreateCompanyData);
}

export async function updateCompany(
  id: string,
  data: Partial<Company>
): Promise<Company> {
  const payload = buildCompanyPayload(
    data as Partial<CreateCompanyData | UpdateCompanyData>
  );
  return companiesApi.update(id, payload);
}

export async function deleteCompany(id: string): Promise<void> {
  try {
    await companiesApi.delete(id);
  } catch (error) {
    logger.error(
      '[deleteCompany] Erro ao deletar empresa',
      error instanceof Error ? error : undefined
    );
    throw error;
  }
}

export async function duplicateCompany(
  id: string,
  override?: Partial<Company>
): Promise<Company> {
  const original = await companiesApi.get(id);

  const duplicatePayload: Partial<CreateCompanyData> = {
    legalName:
      override?.legalName ||
      `${original.legalName} (Cópia)`.replace(/\s+/g, ' ').trim(),
    tradeName:
      override?.tradeName ||
      (original.tradeName
        ? `${original.tradeName} (Cópia)`
        : original.tradeName),
    cnpj: override?.cnpj || generateValidCnpj(),
    email: original.email,
    phoneMain: original.phoneMain,
    phoneAlt: original.phoneAlt,
    status: original.status,
  };

  const payload = buildCompanyPayload(duplicatePayload);
  return companiesApi.create(payload as CreateCompanyData);
}
