import type { Company } from '@/types/hr';

export type CompanyFormData = Partial<Company>;

export interface DuplicateCompanyPayload {
  id: string;
  legalName?: string;
  tradeName?: string | null;
  cnpj?: string;
}
