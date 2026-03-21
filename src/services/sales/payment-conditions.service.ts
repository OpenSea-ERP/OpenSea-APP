import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreatePaymentConditionRequest,
  PaymentConditionDTO,
  PaymentConditionsResponse,
  UpdatePaymentConditionRequest,
} from '@/types/sales';

export const paymentConditionsService = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    isActive?: boolean;
  }): Promise<PaymentConditionsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.isActive !== undefined)
      searchParams.set('isActive', String(params.isActive));

    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.PAYMENT_CONDITIONS.LIST}?${query}`
      : API_ENDPOINTS.PAYMENT_CONDITIONS.LIST;
    return apiClient.get<PaymentConditionsResponse>(url);
  },

  async create(
    data: CreatePaymentConditionRequest,
  ): Promise<{ paymentCondition: PaymentConditionDTO }> {
    return apiClient.post<{ paymentCondition: PaymentConditionDTO }>(
      API_ENDPOINTS.PAYMENT_CONDITIONS.CREATE,
      data,
    );
  },

  async update(
    id: string,
    data: UpdatePaymentConditionRequest,
  ): Promise<{ paymentCondition: PaymentConditionDTO }> {
    return apiClient.put<{ paymentCondition: PaymentConditionDTO }>(
      API_ENDPOINTS.PAYMENT_CONDITIONS.UPDATE(id),
      data,
    );
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.PAYMENT_CONDITIONS.DELETE(id));
  },
};
