import { apiClient } from '@/lib/api-client';
import type {
  CreatePixChargeRequest,
  CashierCreatePixChargeResponse,
  PixChargesQuery,
  PixChargesResponse,
} from '@/types/cashier';

export const cashierService = {
  async createPixCharge(
    body: CreatePixChargeRequest
  ): Promise<CashierCreatePixChargeResponse> {
    return apiClient.post<CashierCreatePixChargeResponse>(
      '/v1/cashier/pix',
      body
    );
  },

  async listPixCharges(params?: PixChargesQuery): Promise<PixChargesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const url = query ? `/v1/cashier/pix?${query}` : '/v1/cashier/pix';
    return apiClient.get<PixChargesResponse>(url);
  },
};
