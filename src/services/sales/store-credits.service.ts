import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateStoreCreditRequest,
  StoreCreditBalanceResponse,
  StoreCreditDTO,
} from '@/types/sales';

export const storeCreditsService = {
  async getBalance(customerId: string): Promise<StoreCreditBalanceResponse> {
    return apiClient.get<StoreCreditBalanceResponse>(
      `${API_ENDPOINTS.STORE_CREDITS.BALANCE}?customerId=${customerId}`,
    );
  },

  async create(
    data: CreateStoreCreditRequest,
  ): Promise<{ storeCredit: StoreCreditDTO }> {
    return apiClient.post<{ storeCredit: StoreCreditDTO }>(
      API_ENDPOINTS.STORE_CREDITS.CREATE,
      data,
    );
  },
};
