import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  ChartOfAccount,
  ChartOfAccountsQuery,
  CreateChartOfAccountData,
  UpdateChartOfAccountData,
} from '@/types/finance';

export interface ChartOfAccountsResponse {
  chartOfAccounts: ChartOfAccount[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ChartOfAccountResponse {
  chartOfAccount: ChartOfAccount;
}

export const chartOfAccountsService = {
  async list(params?: ChartOfAccountsQuery): Promise<ChartOfAccountsResponse> {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.perPage ?? 20),
    });

    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    if (params?.isActive !== undefined)
      query.append('isActive', String(params.isActive));
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    return apiClient.get<ChartOfAccountsResponse>(
      `${API_ENDPOINTS.CHART_OF_ACCOUNTS.LIST}?${query.toString()}`
    );
  },

  async get(id: string): Promise<ChartOfAccountResponse> {
    return apiClient.get<ChartOfAccountResponse>(
      API_ENDPOINTS.CHART_OF_ACCOUNTS.GET(id)
    );
  },

  async create(
    data: CreateChartOfAccountData
  ): Promise<ChartOfAccountResponse> {
    return apiClient.post<ChartOfAccountResponse>(
      API_ENDPOINTS.CHART_OF_ACCOUNTS.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateChartOfAccountData
  ): Promise<ChartOfAccountResponse> {
    return apiClient.patch<ChartOfAccountResponse>(
      API_ENDPOINTS.CHART_OF_ACCOUNTS.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.CHART_OF_ACCOUNTS.DELETE(id));
  },
};
