import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { SupportTicket } from '@/types/admin';

export const supportApi = {
  createTicket: async (data: {
    subject: string;
    description: string;
    category: string;
  }) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.SUPPORT.CREATE,
      data
    );
    return (response as Record<string, unknown>).ticket as SupportTicket;
  },

  listMyTickets: async () => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.SUPPORT.LIST_MY
    );
    return (response as Record<string, unknown>).tickets as SupportTicket[];
  },

  getMyTicket: async (ticketId: string) => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.SUPPORT.GET_MY(ticketId)
    );
    return (response as Record<string, unknown>).ticket as SupportTicket;
  },

  replyMyTicket: async (ticketId: string, data: { content: string }) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.SUPPORT.REPLY_MY(ticketId),
      data
    );
    return response;
  },

  rateTicket: async (
    ticketId: string,
    data: { rating: number; comment?: string }
  ) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.SUPPORT.RATE(ticketId),
      data
    );
    return response;
  },
};
