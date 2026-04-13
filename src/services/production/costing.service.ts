import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';

export interface ProductionCost {
  id: string;
  productionOrderId: string;
  costType: 'MATERIAL' | 'LABOR' | 'OVERHEAD';
  description: string | null;
  plannedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CostSummary {
  totalPlanned: number;
  totalActual: number;
  totalVariance: number;
  details: ProductionCost[];
}

export const costingService = {
  async list(orderId: string) {
    return apiClient.get<{ costs: ProductionCost[] }>(
      API_ENDPOINTS.PRODUCTION.COSTING.LIST(orderId)
    );
  },
  async create(
    orderId: string,
    data: {
      costType: 'MATERIAL' | 'LABOR' | 'OVERHEAD';
      description?: string;
      plannedAmount: number;
      actualAmount: number;
    }
  ) {
    return apiClient.post<{ cost: ProductionCost }>(
      API_ENDPOINTS.PRODUCTION.COSTING.CREATE(orderId),
      data
    );
  },
  async update(
    orderId: string,
    id: string,
    data: {
      costType?: 'MATERIAL' | 'LABOR' | 'OVERHEAD';
      description?: string | null;
      plannedAmount?: number;
      actualAmount?: number;
    }
  ) {
    return apiClient.patch<{ cost: ProductionCost }>(
      API_ENDPOINTS.PRODUCTION.COSTING.UPDATE(orderId, id),
      data
    );
  },
  async getSummary(orderId: string) {
    return apiClient.get<CostSummary>(
      API_ENDPOINTS.PRODUCTION.COSTING.SUMMARY(orderId)
    );
  },
};
