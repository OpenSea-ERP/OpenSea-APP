import { API_ENDPOINTS } from '@/config/api';
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
      `${API_ENDPOINTS.PRODUCTION.PRODUCTION_ENTRIES.LIST}?jobCardId=${jobCardId}`
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
      API_ENDPOINTS.PRODUCTION.PRODUCTION_ENTRIES.CREATE,
      data
    );
  },
};
