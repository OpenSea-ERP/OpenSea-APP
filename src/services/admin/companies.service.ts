import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  Company,
  CompanyAddress,
  CompanyCnae,
  CompanyFiscalSettings,
  CompanyStakeholder,
  CreateCompanyAddressData,
  CreateCompanyCnaeData,
  CreateCompanyData,
  CreateCompanyFiscalSettingsData,
  CreateCompanyStakeholderData,
  UpdateCompanyAddressData,
  UpdateCompanyCnaeData,
  UpdateCompanyData,
  UpdateCompanyFiscalSettingsData,
  UpdateCompanyStakeholderData,
} from '@/types/hr';
import type { PaginationMeta } from '@/types/pagination';

export interface CompaniesResponse {
  companies: Company[];
  meta: PaginationMeta;
}

export interface CompanyResponse {
  company: Company;
}

export interface CheckCnpjResponse {
  exists: boolean;
  companyId?: string;
  legalName?: string;
  status?: string;
}

export interface CompanyAddressesResponse {
  addresses: CompanyAddress[];
  total: number;
}

export interface CompanyAddressResponse {
  address: CompanyAddress;
}

export interface CompanyCnaesResponse {
  cnaes: CompanyCnae[];
  meta: PaginationMeta;
}

export interface CompanyCnaeResponse {
  cnae: CompanyCnae;
}

export interface CompanyFiscalSettingsResponse {
  fiscalSettings: CompanyFiscalSettings;
}

export interface CompanyStakeholdersResponse {
  stakeholders: CompanyStakeholder[];
  total: number;
}

export interface CompanyStakeholderResponse {
  stakeholder: CompanyStakeholder;
}

export const companiesService = {
  async listCompanies(params?: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: string;
    includeDeleted?: boolean;
  }): Promise<CompaniesResponse> {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      perPage: String(params?.perPage ?? 20),
    });

    if (params?.includeDeleted) query.append('includeDeleted', 'true');
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    const response = await apiClient.get<Company[] | CompaniesResponse>(
      `${API_ENDPOINTS.COMPANIES.LIST}?${query.toString()}`
    );

    // Backend returns raw array; normalize to { companies, meta }
    if (Array.isArray(response)) {
      return {
        companies: response,
        meta: {
          total: response.length,
          page: params?.page ?? 1,
          limit: params?.perPage ?? 20,
          totalPages: 1,
        },
      };
    }

    return response;
  },

  async getCompany(id: string): Promise<CompanyResponse> {
    return apiClient.get<CompanyResponse>(API_ENDPOINTS.COMPANIES.GET(id));
  },

  async createCompany(data: CreateCompanyData): Promise<CompanyResponse> {
    return apiClient.post<CompanyResponse>(
      API_ENDPOINTS.COMPANIES.CREATE,
      data
    );
  },

  async updateCompany(
    id: string,
    data: UpdateCompanyData
  ): Promise<CompanyResponse> {
    return apiClient.patch<CompanyResponse>(
      API_ENDPOINTS.COMPANIES.UPDATE(id),
      data
    );
  },

  async deleteCompany(id: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.COMPANIES.DELETE(id));
  },

  async checkCnpj(cnpj: string): Promise<CheckCnpjResponse> {
    return apiClient.get<CheckCnpjResponse>(
      `${API_ENDPOINTS.COMPANIES.CHECK_CNPJ}?cnpj=${encodeURIComponent(cnpj)}`
    );
  },

  // ---------------------------------------------------------------------------
  // Addresses
  // ---------------------------------------------------------------------------

  async listAddresses(
    companyId: string,
    params?: { type?: string; isPrimary?: boolean; includeDeleted?: boolean }
  ): Promise<CompanyAddressesResponse> {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.isPrimary !== undefined)
      query.append('isPrimary', String(params.isPrimary));
    if (params?.includeDeleted) query.append('includeDeleted', 'true');

    const suffix = query.toString() ? `?${query.toString()}` : '';

    return apiClient.get<CompanyAddressesResponse>(
      `/v1/admin/companies/${companyId}/addresses${suffix}`
    );
  },

  async createAddress(
    companyId: string,
    data: CreateCompanyAddressData
  ): Promise<CompanyAddressResponse> {
    return apiClient.post<CompanyAddressResponse>(
      `/v1/admin/companies/${companyId}/addresses`,
      data
    );
  },

  async getAddress(
    companyId: string,
    addressId: string
  ): Promise<CompanyAddressResponse> {
    return apiClient.get<CompanyAddressResponse>(
      `/v1/admin/companies/${companyId}/addresses/${addressId}`
    );
  },

  async updateAddress(
    companyId: string,
    addressId: string,
    data: UpdateCompanyAddressData
  ): Promise<CompanyAddressResponse> {
    return apiClient.put<CompanyAddressResponse>(
      `/v1/admin/companies/${companyId}/addresses/${addressId}`,
      data
    );
  },

  async deleteAddress(companyId: string, addressId: string): Promise<void> {
    await apiClient.delete<void>(
      `/v1/admin/companies/${companyId}/addresses/${addressId}`
    );
  },

  // ---------------------------------------------------------------------------
  // CNAEs
  // ---------------------------------------------------------------------------

  async listCnaes(
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
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      perPage: String(params?.perPage ?? 20),
    });

    if (params?.includeDeleted) query.append('includeDeleted', 'true');
    if (params?.code) query.append('code', params.code);
    if (params?.isPrimary !== undefined)
      query.append('isPrimary', String(params.isPrimary));
    if (params?.status) query.append('status', params.status);

    return apiClient.get<CompanyCnaesResponse>(
      `/v1/admin/companies/${companyId}/cnaes?${query.toString()}`
    );
  },

  async getCnae(
    companyId: string,
    cnaeId: string
  ): Promise<CompanyCnaeResponse> {
    return apiClient.get<CompanyCnaeResponse>(
      `/v1/admin/companies/${companyId}/cnaes/${cnaeId}`
    );
  },

  async getPrimaryCnae(companyId: string): Promise<CompanyCnaeResponse> {
    return apiClient.get<CompanyCnaeResponse>(
      `/v1/admin/companies/${companyId}/cnaes/primary`
    );
  },

  async createCnae(
    companyId: string,
    data: CreateCompanyCnaeData
  ): Promise<CompanyCnaeResponse> {
    return apiClient.post<CompanyCnaeResponse>(
      `/v1/admin/companies/${companyId}/cnaes`,
      data
    );
  },

  async updateCnae(
    companyId: string,
    cnaeId: string,
    data: UpdateCompanyCnaeData
  ): Promise<CompanyCnaeResponse> {
    return apiClient.put<CompanyCnaeResponse>(
      `/v1/admin/companies/${companyId}/cnaes/${cnaeId}`,
      data
    );
  },

  async deleteCnae(companyId: string, cnaeId: string): Promise<void> {
    await apiClient.delete<void>(
      `/v1/admin/companies/${companyId}/cnaes/${cnaeId}`
    );
  },

  // ---------------------------------------------------------------------------
  // Fiscal Settings
  // ---------------------------------------------------------------------------

  async createFiscalSettings(
    companyId: string,
    data: CreateCompanyFiscalSettingsData
  ): Promise<CompanyFiscalSettingsResponse> {
    return apiClient.post<CompanyFiscalSettingsResponse>(
      `/v1/admin/companies/${companyId}/fiscal-settings`,
      data
    );
  },

  async getFiscalSettings(
    companyId: string
  ): Promise<CompanyFiscalSettingsResponse> {
    return apiClient.get<CompanyFiscalSettingsResponse>(
      `/v1/admin/companies/${companyId}/fiscal-settings`
    );
  },

  async updateFiscalSettings(
    companyId: string,
    data: UpdateCompanyFiscalSettingsData
  ): Promise<CompanyFiscalSettingsResponse> {
    return apiClient.patch<CompanyFiscalSettingsResponse>(
      `/v1/admin/companies/${companyId}/fiscal-settings`,
      data
    );
  },

  async deleteFiscalSettings(companyId: string): Promise<void> {
    await apiClient.delete<void>(
      `/v1/admin/companies/${companyId}/fiscal-settings`
    );
  },

  // ---------------------------------------------------------------------------
  // Stakeholders
  // ---------------------------------------------------------------------------

  async listStakeholders(
    companyId: string,
    params?: { status?: string; includeInactive?: boolean; role?: string }
  ): Promise<CompanyStakeholdersResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.includeInactive !== undefined)
      query.append('include_inactive', String(params.includeInactive));
    if (params?.role) query.append('role', params.role);

    const suffix = query.toString() ? `?${query.toString()}` : '';

    return apiClient.get<CompanyStakeholdersResponse>(
      `/v1/admin/companies/${companyId}/stakeholders${suffix}`
    );
  },

  async getStakeholder(
    companyId: string,
    stakeholderId: string
  ): Promise<CompanyStakeholderResponse> {
    return apiClient.get<CompanyStakeholderResponse>(
      `/v1/admin/companies/${companyId}/stakeholders/${stakeholderId}`
    );
  },

  async createStakeholder(
    companyId: string,
    data: CreateCompanyStakeholderData
  ): Promise<CompanyStakeholderResponse> {
    return apiClient.post<CompanyStakeholderResponse>(
      `/v1/admin/companies/${companyId}/stakeholders`,
      data
    );
  },

  async updateStakeholder(
    companyId: string,
    stakeholderId: string,
    data: UpdateCompanyStakeholderData
  ): Promise<CompanyStakeholderResponse> {
    return apiClient.patch<CompanyStakeholderResponse>(
      `/v1/admin/companies/${companyId}/stakeholders/${stakeholderId}`,
      data
    );
  },

  async deleteStakeholder(
    companyId: string,
    stakeholderId: string
  ): Promise<void> {
    await apiClient.delete<void>(
      `/v1/admin/companies/${companyId}/stakeholders/${stakeholderId}`
    );
  },

  async getLegalRepresentative(
    companyId: string
  ): Promise<CompanyStakeholderResponse> {
    return apiClient.get<CompanyStakeholderResponse>(
      `/v1/admin/companies/${companyId}/stakeholders/legal-representative`
    );
  },

  async syncStakeholdersFromCnpjApi(
    companyId: string,
    overwriteExisting = false
  ): Promise<{ sync_result: unknown }> {
    return apiClient.post<{ sync_result: unknown }>(
      `/v1/admin/companies/${companyId}/stakeholders/sync-from-cnpj-api`,
      { overwrite_existing: overwriteExisting }
    );
  },

  async requestStakeholderDataPortability(
    companyId: string,
    stakeholderId: string,
    format: 'JSON' | 'CSV' = 'JSON'
  ): Promise<{ request: unknown }> {
    return apiClient.post<{ request: unknown }>(
      `/v1/admin/companies/${companyId}/stakeholders/${stakeholderId}/request-data-portability`,
      { format }
    );
  },
};
