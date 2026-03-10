import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  Contract,
  ContractsQuery,
  CreateContractData,
  UpdateContractData,
  SupplierHistory,
  GenerateEntriesResult,
} from '@/types/finance';
import type { PaginationMeta } from '@/types/pagination';

export interface ContractsResponse {
  contracts: Contract[];
  meta: PaginationMeta;
}

export interface ContractResponse {
  contract: Contract;
  generatedEntriesCount?: number;
  nextPaymentDate?: string | null;
}

export const contractsService = {
  async list(params?: ContractsQuery): Promise<ContractsResponse> {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.perPage ?? 20),
    });

    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.companyName) query.append('companyName', params.companyName);
    if (params?.startDateFrom)
      query.append('startDateFrom', params.startDateFrom);
    if (params?.startDateTo) query.append('startDateTo', params.startDateTo);
    if (params?.endDateFrom) query.append('endDateFrom', params.endDateFrom);
    if (params?.endDateTo) query.append('endDateTo', params.endDateTo);

    return apiClient.get<ContractsResponse>(
      `${API_ENDPOINTS.CONTRACTS.LIST}?${query.toString()}`
    );
  },

  async get(id: string): Promise<ContractResponse> {
    return apiClient.get<ContractResponse>(API_ENDPOINTS.CONTRACTS.GET(id));
  },

  async create(data: CreateContractData): Promise<ContractResponse> {
    return apiClient.post<ContractResponse>(
      API_ENDPOINTS.CONTRACTS.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateContractData
  ): Promise<ContractResponse> {
    return apiClient.put<ContractResponse>(
      API_ENDPOINTS.CONTRACTS.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.CONTRACTS.DELETE(id));
  },

  async generateEntries(id: string): Promise<GenerateEntriesResult> {
    return apiClient.post<GenerateEntriesResult>(
      API_ENDPOINTS.CONTRACTS.GENERATE_ENTRIES(id),
      {}
    );
  },

  async getSupplierHistory(params: {
    companyId?: string;
    companyName?: string;
  }): Promise<SupplierHistory> {
    const query = new URLSearchParams();
    if (params.companyId) query.append('companyId', params.companyId);
    if (params.companyName) query.append('companyName', params.companyName);

    return apiClient.get<SupplierHistory>(
      `${API_ENDPOINTS.CONTRACTS.SUPPLIER_HISTORY}?${query.toString()}`
    );
  },
};
