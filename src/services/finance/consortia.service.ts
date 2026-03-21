import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  Consortium,
  ConsortiaQuery,
  CreateConsortiumData,
  UpdateConsortiumData,
  PayConsortiumInstallmentData,
  MarkContemplatedData,
  ConsortiumPayment,
} from '@/types/finance';
import type { PaginationMeta } from '@/types/pagination';

export interface ConsortiaResponse {
  consortia: Consortium[];
  meta: PaginationMeta;
}

export interface ConsortiumResponse {
  consortium: Consortium;
}

export interface ConsortiumPaymentResponse {
  payment: ConsortiumPayment;
}

export const consortiaService = {
  async list(params?: ConsortiaQuery): Promise<ConsortiaResponse> {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.perPage ?? 20),
    });

    if (params?.search) query.append('search', params.search);
    if (params?.bankAccountId)
      query.append('bankAccountId', params.bankAccountId);
    if (params?.costCenterId) query.append('costCenterId', params.costCenterId);
    if (params?.status) query.append('status', params.status);
    if (params?.isContemplated !== undefined)
      query.append('isContemplated', String(params.isContemplated));
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    return apiClient.get<ConsortiaResponse>(
      `${API_ENDPOINTS.CONSORTIA.LIST}?${query.toString()}`
    );
  },

  async get(id: string): Promise<ConsortiumResponse> {
    return apiClient.get<ConsortiumResponse>(API_ENDPOINTS.CONSORTIA.GET(id));
  },

  async create(data: CreateConsortiumData): Promise<ConsortiumResponse> {
    return apiClient.post<ConsortiumResponse>(
      API_ENDPOINTS.CONSORTIA.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateConsortiumData
  ): Promise<ConsortiumResponse> {
    return apiClient.put<ConsortiumResponse>(
      API_ENDPOINTS.CONSORTIA.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.CONSORTIA.DELETE(id));
  },

  async registerPayment(
    consortiumId: string,
    data: PayConsortiumInstallmentData
  ): Promise<ConsortiumPaymentResponse> {
    return apiClient.post<ConsortiumPaymentResponse>(
      API_ENDPOINTS.CONSORTIA.REGISTER_PAYMENT(consortiumId),
      data
    );
  },

  async markContemplated(
    id: string,
    data: MarkContemplatedData
  ): Promise<ConsortiumResponse> {
    return apiClient.patch<ConsortiumResponse>(
      API_ENDPOINTS.CONSORTIA.MARK_CONTEMPLATED(id),
      data
    );
  },
};
