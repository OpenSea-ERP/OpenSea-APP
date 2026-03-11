import { companiesService } from '@/services/admin/companies.service';
import type { CompanyFiscalSettingsResponse } from '@/services/admin/companies.service';
import type {
  CompanyFiscalSettings,
  CreateCompanyFiscalSettingsData,
  UpdateCompanyFiscalSettingsData,
} from '@/types/hr';

export const companyFiscalSettingsApi = {
  async get(companyId: string): Promise<CompanyFiscalSettings> {
    const { fiscalSettings } =
      await companiesService.getFiscalSettings(companyId);
    return fiscalSettings;
  },

  async create(
    companyId: string,
    data: CreateCompanyFiscalSettingsData
  ): Promise<CompanyFiscalSettings> {
    const { fiscalSettings } = await companiesService.createFiscalSettings(
      companyId,
      data
    );
    return fiscalSettings;
  },

  async update(
    companyId: string,
    data: UpdateCompanyFiscalSettingsData
  ): Promise<CompanyFiscalSettings> {
    const { fiscalSettings } = await companiesService.updateFiscalSettings(
      companyId,
      data
    );
    return fiscalSettings;
  },

  async delete(companyId: string): Promise<void> {
    await companiesService.deleteFiscalSettings(companyId);
  },
};

export type { CompanyFiscalSettingsResponse };
