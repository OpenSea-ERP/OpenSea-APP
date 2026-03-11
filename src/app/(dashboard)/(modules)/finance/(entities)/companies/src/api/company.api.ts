import { companiesService } from '@/services/admin/companies.service';
import type {
  CheckCnpjResponse,
  CompaniesResponse,
  CompanyResponse,
} from '@/services/admin/companies.service';
import type { Company, CreateCompanyData, UpdateCompanyData } from '@/types/hr';

export interface ListCompaniesParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  includeDeleted?: boolean;
}

export const companiesApi = {
  async list(params?: ListCompaniesParams): Promise<CompaniesResponse> {
    return companiesService.listCompanies(params);
  },

  async get(id: string): Promise<Company> {
    const response = await companiesService.getCompany(id);

    // Compatível com ambos os formatos: { company } ou Company direto
    if (response && typeof response === 'object' && 'id' in response) {
      return response as unknown as Company;
    }

    if (response && 'company' in response && response.company) {
      return response.company;
    }

    throw new Error('Invalid response format from getCompany');
  },

  async create(data: CreateCompanyData): Promise<Company> {
    const response = await companiesService.createCompany(data);

    // Compatível com ambos os formatos: { company } ou Company direto
    if (response && typeof response === 'object' && 'id' in response) {
      return response as unknown as Company;
    }

    if (response && 'company' in response && response.company) {
      return response.company;
    }

    throw new Error('Invalid response format from createCompany');
  },

  async update(id: string, data: UpdateCompanyData): Promise<Company> {
    const response = await companiesService.updateCompany(id, data);

    // Compatível com ambos os formatos: { company } ou Company direto
    if (response && typeof response === 'object' && 'id' in response) {
      return response as unknown as Company;
    }

    if (response && 'company' in response && response.company) {
      return response.company;
    }

    throw new Error('Invalid response format from updateCompany');
  },

  async delete(id: string): Promise<void> {
    await companiesService.deleteCompany(id);
  },

  async checkCnpj(cnpj: string): Promise<CheckCnpjResponse> {
    return companiesService.checkCnpj(cnpj);
  },
};

export type { CompanyResponse };
