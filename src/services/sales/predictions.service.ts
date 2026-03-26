import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';

export interface DealPrediction {
  dealId: string;
  probability: number;
  estimatedCloseDate: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: Array<{
    name: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    description: string;
  }>;
  generatedAt: string;
}

export interface DealPredictionResponse {
  prediction: DealPrediction;
}

export const predictionsService = {
  async getDealPrediction(dealId: string): Promise<DealPredictionResponse> {
    return apiClient.get<DealPredictionResponse>(
      API_ENDPOINTS.PREDICTIONS.DEAL(dealId)
    );
  },
};
