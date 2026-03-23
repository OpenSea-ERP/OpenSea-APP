import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CouponResponse,
  CouponsQuery,
  CreateCouponRequest,
  PaginatedCouponsResponse,
  ValidateCouponRequest,
  ValidateCouponResponse,
} from '@/types/sales';

export const couponsService = {
  async list(query?: CouponsQuery): Promise<PaginatedCouponsResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query?.search) params.append('search', query.search);
    if (query?.type) params.append('type', query.type);
    if (query?.isActive) params.append('isActive', query.isActive);
    if (query?.campaignId) params.append('campaignId', query.campaignId);

    const url = params.toString()
      ? `${API_ENDPOINTS.COUPONS.LIST}?${params.toString()}`
      : API_ENDPOINTS.COUPONS.LIST;

    return apiClient.get<PaginatedCouponsResponse>(url);
  },

  async create(data: CreateCouponRequest): Promise<CouponResponse> {
    return apiClient.post<CouponResponse>(API_ENDPOINTS.COUPONS.CREATE, data);
  },

  async validate(data: ValidateCouponRequest): Promise<ValidateCouponResponse> {
    return apiClient.post<ValidateCouponResponse>(
      API_ENDPOINTS.COUPONS.VALIDATE,
      data
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.COUPONS.DELETE(id));
  },
};
