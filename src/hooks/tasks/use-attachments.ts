import { attachmentsService } from '@/services/tasks';
import type { AddAttachmentRequest } from '@/types/tasks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CARD_QUERY_KEYS } from './use-cards';

export const ATTACHMENT_QUERY_KEYS = {
  ATTACHMENTS: (boardId: string, cardId: string) => [
    'task-attachments',
    boardId,
    cardId,
  ],
} as const;

export function useAttachments(boardId: string, cardId: string) {
  return useQuery({
    queryKey: ATTACHMENT_QUERY_KEYS.ATTACHMENTS(boardId, cardId),
    queryFn: () => attachmentsService.list(boardId, cardId),
    enabled: !!boardId && !!cardId,
  });
}

export function useUploadAttachment(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddAttachmentRequest) =>
      attachmentsService.upload(boardId, cardId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ATTACHMENT_QUERY_KEYS.ATTACHMENTS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}

export function useDeleteAttachment(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      attachmentsService.delete(boardId, cardId, attachmentId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ATTACHMENT_QUERY_KEYS.ATTACHMENTS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}
