import { apiClient } from '@/lib/api-client';

export interface MaterialIssue {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  batchNumber: string | null;
  issuedById: string;
  issuedAt: string;
  notes: string | null;
}

export const materialIssuesService = {
  async list(productionOrderId: string) {
    return apiClient.get<{ materialIssues: MaterialIssue[] }>(
      `/v1/production/material-issues?productionOrderId=${productionOrderId}`,
    );
  },
  async create(data: {
    productionOrderId: string;
    materialId: string;
    warehouseId: string;
    quantity: number;
    batchNumber?: string;
    notes?: string;
  }) {
    return apiClient.post<{ materialIssue: MaterialIssue }>(
      '/v1/production/material-issues',
      data,
    );
  },
};
