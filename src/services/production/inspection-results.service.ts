import { apiClient } from '@/lib/api-client';

export interface InspectionResult {
  id: string;
  inspectionPlanId: string;
  productionOrderId: string;
  inspectedById: string;
  inspectedAt: string;
  sampleSize: number;
  defectsFound: number;
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL';
  notes: string | null;
  createdAt: string;
}

export const inspectionResultsService = {
  async list(productionOrderId: string) {
    return apiClient.get<{ inspectionResults: InspectionResult[] }>(
      `/v1/production/inspection-results?productionOrderId=${productionOrderId}`,
    );
  },
  async create(data: {
    inspectionPlanId: string;
    productionOrderId: string;
    sampleSize: number;
    defectsFound?: number;
    status?: string;
    notes?: string;
  }) {
    return apiClient.post<{ inspectionResult: InspectionResult }>(
      '/v1/production/inspection-results',
      data,
    );
  },
  async updateStatus(
    id: string,
    data: { status: string; defectsFound?: number; notes?: string },
  ) {
    return apiClient.patch<{ inspectionResult: InspectionResult }>(
      `/v1/production/inspection-results/${id}/status`,
      data,
    );
  },
};
