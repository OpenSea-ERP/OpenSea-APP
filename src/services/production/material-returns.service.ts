import { apiClient } from '@/lib/api-client';

export interface MaterialReturn {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  reason: string | null;
  returnedById: string;
  returnedAt: string;
}

export const materialReturnsService = {
  async list(productionOrderId: string) {
    return apiClient.get<{ materialReturns: MaterialReturn[] }>(
      `/v1/production/material-returns?productionOrderId=${productionOrderId}`,
    );
  },
  async create(data: {
    productionOrderId: string;
    materialId: string;
    warehouseId: string;
    quantity: number;
    reason?: string;
  }) {
    return apiClient.post<{ materialReturn: MaterialReturn }>(
      '/v1/production/material-returns',
      data,
    );
  },
};
