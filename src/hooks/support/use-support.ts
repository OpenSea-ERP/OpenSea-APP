'use client';

import { supportApi } from '@/services/support/support-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const supportKeys = {
  all: ['support'] as const,
  myTickets: () => [...supportKeys.all, 'my-tickets'] as const,
  myTicket: (id: string) => [...supportKeys.all, 'my-ticket', id] as const,
};

export function useMyTickets() {
  return useQuery({
    queryKey: supportKeys.myTickets(),
    queryFn: () => supportApi.listMyTickets(),
  });
}

export function useMyTicket(id: string) {
  return useQuery({
    queryKey: supportKeys.myTicket(id),
    queryFn: () => supportApi.getMyTicket(id),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      subject: string;
      description: string;
      category: string;
    }) => supportApi.createTicket(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: supportKeys.myTickets(),
      });
    },
  });
}

export function useReplyMyTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: string;
      data: { content: string };
    }) => supportApi.replyMyTicket(ticketId, data),
    onSuccess: async (_, { ticketId }) => {
      await queryClient.invalidateQueries({
        queryKey: supportKeys.myTicket(ticketId),
      });
    },
  });
}

export function useRateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: string;
      data: { rating: number; comment?: string };
    }) => supportApi.rateTicket(ticketId, data),
    onSuccess: async (_, { ticketId }) => {
      await queryClient.invalidateQueries({
        queryKey: supportKeys.myTicket(ticketId),
      });
    },
  });
}
