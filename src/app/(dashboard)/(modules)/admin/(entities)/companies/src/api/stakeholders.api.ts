import { companiesService } from '@/services/admin/companies.service';
import type {
  CompanyStakeholderResponse,
  CompanyStakeholdersResponse,
} from '@/services/admin/companies.service';
import type {
  CompanyStakeholder,
  CreateCompanyStakeholderData,
  UpdateCompanyStakeholderData,
} from '@/types/hr';

export const companyStakeholdersApi = {
  async list(
    companyId: string,
    params?: { status?: string; includeInactive?: boolean; role?: string }
  ): Promise<CompanyStakeholdersResponse> {
    return companiesService.listStakeholders(companyId, params);
  },

  async get(
    companyId: string,
    stakeholderId: string
  ): Promise<CompanyStakeholder> {
    const { stakeholder } = await companiesService.getStakeholder(
      companyId,
      stakeholderId
    );
    return stakeholder;
  },

  async create(
    companyId: string,
    data: CreateCompanyStakeholderData
  ): Promise<CompanyStakeholder> {
    const { stakeholder } = await companiesService.createStakeholder(
      companyId,
      data
    );
    return stakeholder;
  },

  async update(
    companyId: string,
    stakeholderId: string,
    data: UpdateCompanyStakeholderData
  ): Promise<CompanyStakeholder> {
    const { stakeholder } = await companiesService.updateStakeholder(
      companyId,
      stakeholderId,
      data
    );
    return stakeholder;
  },

  async delete(companyId: string, stakeholderId: string): Promise<void> {
    await companiesService.deleteStakeholder(companyId, stakeholderId);
  },

  async getLegalRepresentative(
    companyId: string
  ): Promise<CompanyStakeholder | null> {
    const { stakeholder } =
      await companiesService.getLegalRepresentative(companyId);
    return stakeholder;
  },

  async syncFromCnpjApi(
    companyId: string,
    overwriteExisting = false
  ): Promise<{ sync_result: unknown }> {
    return companiesService.syncStakeholdersFromCnpjApi(
      companyId,
      overwriteExisting
    );
  },

  async requestDataPortability(
    companyId: string,
    stakeholderId: string,
    format: 'JSON' | 'CSV' = 'JSON'
  ): Promise<{ request: unknown }> {
    return companiesService.requestStakeholderDataPortability(
      companyId,
      stakeholderId,
      format
    );
  },
};

export type { CompanyStakeholderResponse, CompanyStakeholdersResponse };
