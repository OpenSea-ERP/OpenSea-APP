import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CostCenter,
  CostCentersQuery,
  CreateCostCenterData,
  UpdateCostCenterData,
} from '@/types/finance';

export interface CostCentersResponse {
  costCenters: CostCenter[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CostCenterResponse {
  costCenter: CostCenter;
}

export const costCentersService = {
  async list(params?: CostCentersQuery): Promise<CostCentersResponse> {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.perPage ?? 20),
    });

    if (params?.search) query.append('search', params.search);
    if (params?.companyId) query.append('companyId', params.companyId);
    if (params?.isActive !== undefined)
      query.append('isActive', String(params.isActive));
    if (params?.includeDeleted)
      query.append('includeDeleted', String(params.includeDeleted));
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    return apiClient.get<CostCentersResponse>(
      `${API_ENDPOINTS.COST_CENTERS.LIST}?${query.toString()}`
    );
  },

  async get(id: string): Promise<CostCenterResponse> {
    return apiClient.get<CostCenterResponse>(
      API_ENDPOINTS.COST_CENTERS.GET(id)
    );
  },

  async create(data: CreateCostCenterData): Promise<CostCenterResponse> {
    return apiClient.post<CostCenterResponse>(
      API_ENDPOINTS.COST_CENTERS.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateCostCenterData
  ): Promise<CostCenterResponse> {
    return apiClient.patch<CostCenterResponse>(
      API_ENDPOINTS.COST_CENTERS.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.COST_CENTERS.DELETE(id));
  },
};
