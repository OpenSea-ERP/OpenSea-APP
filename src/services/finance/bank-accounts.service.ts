import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  BankAccount,
  BankAccountsQuery,
  BankApiConfigData,
  CreateBankAccountData,
  UpdateBankAccountData,
} from '@/types/finance';
import type { PaginationMeta } from '@/types/pagination';

export interface BankAccountsResponse {
  bankAccounts: BankAccount[];
  meta: PaginationMeta;
}

export interface BankAccountResponse {
  bankAccount: BankAccount;
}

export const bankAccountsService = {
  async list(params?: BankAccountsQuery): Promise<BankAccountsResponse> {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.perPage ?? 20),
    });

    if (params?.search) query.append('search', params.search);
    if (params?.companyId) query.append('companyId', params.companyId);
    if (params?.accountType) query.append('accountType', params.accountType);
    if (params?.status) query.append('status', params.status);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    return apiClient.get<BankAccountsResponse>(
      `${API_ENDPOINTS.BANK_ACCOUNTS.LIST}?${query.toString()}`
    );
  },

  async get(id: string): Promise<BankAccountResponse> {
    return apiClient.get<BankAccountResponse>(
      API_ENDPOINTS.BANK_ACCOUNTS.GET(id)
    );
  },

  async create(data: CreateBankAccountData): Promise<BankAccountResponse> {
    return apiClient.post<BankAccountResponse>(
      API_ENDPOINTS.BANK_ACCOUNTS.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateBankAccountData
  ): Promise<BankAccountResponse> {
    return apiClient.patch<BankAccountResponse>(
      API_ENDPOINTS.BANK_ACCOUNTS.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.BANK_ACCOUNTS.DELETE(id));
  },

  async updateApiConfig(id: string, data: BankApiConfigData): Promise<void> {
    await apiClient.patch<void>(
      `/v1/finance/bank-accounts/${id}/api-config`,
      data
    );
  },

  async testBankApiConnection(
    id: string
  ): Promise<{ balance: number; message: string }> {
    return apiClient.get<{ balance: number; message: string }>(
      `/v1/finance/bank-accounts/${id}/balance`
    );
  },

  async healthCheck(id: string): Promise<{
    health: {
      provider: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      latencyMs: number;
      checks: {
        auth: { ok: boolean; error?: string };
        balance: { ok: boolean; error?: string };
        timestamp: string;
      };
      sandbox: boolean;
    };
  }> {
    return apiClient.get(`/v1/finance/bank-accounts/${id}/health`);
  },
};
