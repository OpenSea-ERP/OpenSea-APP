import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateEscalationRequest,
  CustomerScoreResponse,
  EscalationListResponse,
  EscalationResponse,
  UpdateEscalationRequest,
} from '@/types/finance';

export const escalationService = {
  async list(params?: {
    page?: number;
    limit?: number;
  }): Promise<EscalationListResponse> {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
    });
    return apiClient.get<EscalationListResponse>(
      `${API_ENDPOINTS.FINANCE_ESCALATION.LIST}?${query.toString()}`
    );
  },

  async get(id: string): Promise<EscalationResponse> {
    return apiClient.get<EscalationResponse>(
      API_ENDPOINTS.FINANCE_ESCALATION.GET(id)
    );
  },

  async create(data: CreateEscalationRequest): Promise<EscalationResponse> {
    return apiClient.post<EscalationResponse>(
      API_ENDPOINTS.FINANCE_ESCALATION.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateEscalationRequest
  ): Promise<EscalationResponse> {
    return apiClient.patch<EscalationResponse>(
      API_ENDPOINTS.FINANCE_ESCALATION.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.FINANCE_ESCALATION.DELETE(id));
  },

  async duplicate(id: string): Promise<EscalationResponse> {
    return apiClient.post<EscalationResponse>(
      API_ENDPOINTS.FINANCE_ESCALATION.DUPLICATE(id),
      {}
    );
  },

  async toggleActive(id: string): Promise<EscalationResponse> {
    return apiClient.patch<EscalationResponse>(
      API_ENDPOINTS.FINANCE_ESCALATION.TOGGLE_ACTIVE(id),
      {}
    );
  },
};

export const customerScoreService = {
  async getScore(customerName: string): Promise<CustomerScoreResponse> {
    const query = new URLSearchParams({ customerName });
    return apiClient.get<CustomerScoreResponse>(
      `${API_ENDPOINTS.FINANCE_CUSTOMER_SCORE.GET}?${query.toString()}`
    );
  },
};
