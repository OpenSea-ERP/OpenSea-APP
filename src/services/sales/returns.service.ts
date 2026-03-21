import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateReturnRequest,
  OrderReturnDTO,
  OrderReturnsResponse,
} from '@/types/sales';

export const returnsService = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    orderId?: string;
  }): Promise<OrderReturnsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.orderId) searchParams.set('orderId', params.orderId);

    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.RETURNS.LIST}?${query}`
      : API_ENDPOINTS.RETURNS.LIST;
    return apiClient.get<OrderReturnsResponse>(url);
  },

  async create(
    data: CreateReturnRequest,
  ): Promise<{ orderReturn: OrderReturnDTO }> {
    return apiClient.post<{ orderReturn: OrderReturnDTO }>(
      API_ENDPOINTS.RETURNS.CREATE,
      data,
    );
  },

  async approve(
    id: string,
  ): Promise<{ orderReturn: OrderReturnDTO }> {
    return apiClient.patch<{ orderReturn: OrderReturnDTO }>(
      API_ENDPOINTS.RETURNS.APPROVE(id),
      {},
    );
  },
};
