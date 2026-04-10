import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  AgentPairingCodeResponse,
  PrintAgentsResponse,
  RegisterAgentResponse,
} from '@/types/sales';

export const printAgentsService = {
  async list(): Promise<PrintAgentsResponse> {
    return apiClient.get<PrintAgentsResponse>(
      API_ENDPOINTS.SALES_PRINTING.AGENTS.LIST,
    );
  },

  async register(name: string): Promise<RegisterAgentResponse> {
    return apiClient.post<RegisterAgentResponse>(
      API_ENDPOINTS.SALES_PRINTING.AGENTS.CREATE,
      { name },
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.SALES_PRINTING.AGENTS.DELETE(id),
    );
  },

  async getPairingCode(id: string): Promise<AgentPairingCodeResponse> {
    return apiClient.get<AgentPairingCodeResponse>(
      API_ENDPOINTS.SALES_PRINTING.AGENTS.PAIRING_CODE(id),
    );
  },

  async unpair(id: string): Promise<void> {
    return apiClient.post(API_ENDPOINTS.SALES_PRINTING.AGENTS.UNPAIR(id));
  },
};
