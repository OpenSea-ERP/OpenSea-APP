import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  InspectionPlanResponse,
  InspectionPlansResponse,
} from '@/types/production';

export const inspectionPlansService = {
  async list(params?: {
    operationRoutingId?: string;
    isActive?: boolean;
  }): Promise<InspectionPlansResponse> {
    const searchParams = new URLSearchParams();
    if (params?.operationRoutingId)
      searchParams.set('operationRoutingId', params.operationRoutingId);
    if (params?.isActive !== undefined)
      searchParams.set('isActive', String(params.isActive));
    const qs = searchParams.toString();
    return apiClient.get<InspectionPlansResponse>(
      `${API_ENDPOINTS.PRODUCTION.INSPECTION_PLANS.LIST}${qs ? `?${qs}` : ''}`,
    );
  },

  async create(
    data: Record<string, unknown>,
  ): Promise<InspectionPlanResponse> {
    return apiClient.post<InspectionPlanResponse>(
      API_ENDPOINTS.PRODUCTION.INSPECTION_PLANS.CREATE,
      data,
    );
  },

  async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<InspectionPlanResponse> {
    return apiClient.put<InspectionPlanResponse>(
      API_ENDPOINTS.PRODUCTION.INSPECTION_PLANS.UPDATE(id),
      data,
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.PRODUCTION.INSPECTION_PLANS.DELETE(id),
    );
  },
};
