import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  ChatbotConfigResponse,
  UpdateChatbotConfigRequest,
} from '@/types/sales';

export const chatbotService = {
  async getConfig(): Promise<ChatbotConfigResponse> {
    return apiClient.get<ChatbotConfigResponse>(
      API_ENDPOINTS.CHATBOT.GET_CONFIG
    );
  },

  async updateConfig(
    data: UpdateChatbotConfigRequest
  ): Promise<ChatbotConfigResponse> {
    return apiClient.put<ChatbotConfigResponse>(
      API_ENDPOINTS.CHATBOT.UPDATE_CONFIG,
      data
    );
  },
};
