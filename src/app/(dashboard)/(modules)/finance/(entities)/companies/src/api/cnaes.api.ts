import { companiesService } from '@/services/admin/companies.service';
import type {
  CompanyCnaeResponse,
  CompanyCnaesResponse,
} from '@/services/admin/companies.service';
import type {
  CompanyCnae,
  CreateCompanyCnaeData,
  UpdateCompanyCnaeData,
} from '@/types/hr';

export const companyCnaesApi = {
  async list(
    companyId: string,
    params?: {
      page?: number;
      perPage?: number;
      code?: string;
      isPrimary?: boolean;
      status?: string;
      includeDeleted?: boolean;
    }
  ): Promise<CompanyCnaesResponse> {
    return companiesService.listCnaes(companyId, params);
  },

  async get(companyId: string, cnaeId: string): Promise<CompanyCnae> {
    const { cnae } = await companiesService.getCnae(companyId, cnaeId);
    return cnae;
  },

  async create(
    companyId: string,
    data: CreateCompanyCnaeData
  ): Promise<CompanyCnae> {
    const { cnae } = await companiesService.createCnae(companyId, data);
    return cnae;
  },

  async update(
    companyId: string,
    cnaeId: string,
    data: UpdateCompanyCnaeData
  ): Promise<CompanyCnae> {
    const { cnae } = await companiesService.updateCnae(companyId, cnaeId, data);
    return cnae;
  },

  async delete(companyId: string, cnaeId: string): Promise<void> {
    await companiesService.deleteCnae(companyId, cnaeId);
  },
};

export type { CompanyCnaeResponse, CompanyCnaesResponse };
