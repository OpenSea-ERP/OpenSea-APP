import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { AiConversation, AiMessage, SendMessageRequest, SendMessageResponse } from '@/types/ai';

export interface ConversationsResponse {
  conversations: AiConversation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ConversationDetailResponse {
  conversation: AiConversation;
  messages: AiMessage[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const aiChatService = {
  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    return apiClient.post<SendMessageResponse>(API_ENDPOINTS.AI.CHAT.SEND, data);
  },

  async listConversations(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ConversationsResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const url = queryString
      ? `${API_ENDPOINTS.AI.CHAT.LIST_CONVERSATIONS}?${queryString}`
      : API_ENDPOINTS.AI.CHAT.LIST_CONVERSATIONS;

    return apiClient.get<ConversationsResponse>(url);
  },

  async getConversation(
    conversationId: string,
    params?: { page?: number; limit?: number },
  ): Promise<ConversationDetailResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const url = queryString
      ? `${API_ENDPOINTS.AI.CHAT.GET_CONVERSATION(conversationId)}?${queryString}`
      : API_ENDPOINTS.AI.CHAT.GET_CONVERSATION(conversationId);

    return apiClient.get<ConversationDetailResponse>(url);
  },

  async archiveConversation(conversationId: string): Promise<{ success: boolean }> {
    return apiClient.patch<{ success: boolean }>(
      API_ENDPOINTS.AI.CHAT.ARCHIVE_CONVERSATION(conversationId),
    );
  },
};
