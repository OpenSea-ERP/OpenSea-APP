import { apiClient } from '@/lib/api-client';

export interface ProductionEntryData {
  id: string;
  jobCardId: string;
  operatorId: string;
  quantityGood: number;
  quantityScrapped: number;
  quantityRework: number;
  enteredAt: string;
  notes: string | null;
}

export const productionEntriesService = {
  async list(jobCardId: string) {
    return apiClient.get<{ productionEntries: ProductionEntryData[] }>(
      `/v1/production/production-entries?jobCardId=${jobCardId}`,
    );
  },
  async create(data: {
    jobCardId: string;
    quantityGood: number;
    quantityScrapped?: number;
    quantityRework?: number;
    notes?: string;
  }) {
    return apiClient.post<{ productionEntry: ProductionEntryData }>(
      '/v1/production/production-entries',
      data,
    );
  },
};
