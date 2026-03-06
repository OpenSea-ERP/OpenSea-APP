'use client';

import { useEffect } from 'react';

import { EMAIL_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { emailService } from '@/services/email';
import type {
  ShareEmailAccountRequest,
  UpdateEmailAccountRequest,
} from '@/types/email';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

const EMAIL_BULK_CONCURRENCY = 4;

interface BulkQueueResult {
  total: number;
  success: number;
  failed: string[];
}

async function runBulkQueue(
  ids: string[],
  worker: (id: string) => Promise<void>,
  concurrency: number = EMAIL_BULK_CONCURRENCY
): Promise<BulkQueueResult> {
  if (ids.length === 0) {
    return { total: 0, success: 0, failed: [] };
  }

  const queue = [...ids];
  const failed: string[] = [];
  let success = 0;

  const runWorker = async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) return;

      try {
        await worker(id);
        success += 1;
      } catch {
        failed.push(id);
      }
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, ids.length));
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

  return {
    total: ids.length,
    success,
    failed,
  };
}

function updateMessageReadStateInCache(
  old: unknown,
  ids: string[],
  isRead: boolean
) {
  const data = old as
    | {
        pages?: Array<{
          data: Array<{ id: string; isRead: boolean }>;
          meta: unknown;
        }>;
      }
    | undefined;

  if (!data?.pages) return old;

  const idSet = new Set(ids);

  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      data: page.data.map(msg =>
        idSet.has(msg.id) ? { ...msg, isRead } : msg
      ),
    })),
  };
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export function useEmailAccounts() {
  const { hasPermission } = usePermissions();
  const canList = hasPermission(EMAIL_PERMISSIONS.ACCOUNTS.LIST);

  return useQuery({
    queryKey: ['email', 'accounts'],
    queryFn: () => emailService.listAccounts(),
    enabled: canList,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateEmailAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: emailService.createAccount.bind(emailService),
    onSuccess: async () => {
      toast.success('Conta criada com sucesso');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Erro ao criar conta'),
  });
}

export function useUpdateEmailAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateEmailAccountRequest & { id: string }) =>
      emailService.updateAccount(id, data),
    onSuccess: async () => {
      toast.success('Conta atualizada');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Erro ao atualizar conta'),
  });
}

export function useDeleteEmailAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailService.deleteAccount(id),
    onSuccess: async () => {
      toast.success('Conta removida');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Erro ao remover conta'),
  });
}

export function useTestEmailConnection() {
  return useMutation({
    mutationFn: (params: { accountId: string } & Record<string, unknown>) =>
      emailService.testConnection(params.accountId),
    onError: () => toast.error('Falha ao testar conexão'),
  });
}

export function useSyncEmailAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => emailService.triggerSync(accountId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Falha ao solicitar sincronismo'),
  });
}

export function useShareEmailAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: ShareEmailAccountRequest & { id: string }) =>
      emailService.shareAccount(id, data),
    onSuccess: async () => {
      toast.success('Conta compartilhada');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Erro ao compartilhar conta'),
  });
}

export function useUnshareEmailAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      emailService.unshareAccount(id, userId),
    onSuccess: async () => {
      toast.success('Acesso revogado');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Erro ao revogar acesso'),
  });
}

// ─── Folders ─────────────────────────────────────────────────────────────────

export function useEmailFolders(accountId: string | null) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission(EMAIL_PERMISSIONS.MESSAGES.LIST);

  return useQuery({
    queryKey: ['email', 'folders', accountId],
    queryFn: () => emailService.listFolders(accountId!),
    enabled: Boolean(accountId) && canRead,
    staleTime: 30_000,
  });
}

// ─── Messages ────────────────────────────────────────────────────────────────

export function useEmailMessages(params: {
  accountId: string | null;
  folderId: string | null;
  filter: 'all' | 'unread';
  search: string;
}) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission(EMAIL_PERMISSIONS.MESSAGES.LIST);

  return useInfiniteQuery({
    queryKey: [
      'email',
      'messages',
      params.accountId,
      params.folderId,
      params.filter,
      params.search,
    ],
    queryFn: ({ pageParam }) =>
      emailService.listMessages({
        accountId: params.accountId!,
        folderId: params.folderId ?? undefined,
        unread: params.filter === 'unread' ? true : undefined,
        search: params.search || undefined,
        page: pageParam,
        limit: 30,
      }),
    initialPageParam: 1 as number,
    getNextPageParam: lastPage =>
      lastPage.meta.page < lastPage.meta.pages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: Boolean(params.accountId) && canRead,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Central Inbox: queries INBOX from ALL accounts in parallel, merges results.
 * The backend requires accountId, so we query each account separately.
 */
export function useCentralInboxMessages(params: {
  accountIds: string[];
  filter: 'all' | 'unread';
  search: string;
  enabled: boolean;
}) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission(EMAIL_PERMISSIONS.MESSAGES.LIST);

  const query = useQuery({
    queryKey: [
      'email',
      'messages',
      'central',
      params.accountIds,
      params.filter,
      params.search,
    ],
    queryFn: () =>
      emailService.listCentralInbox({
        accountIds: params.accountIds,
        unread: params.filter === 'unread' ? true : undefined,
        search: params.search || undefined,
        page: 1,
        limit: 50,
      }),
    enabled: params.enabled && canRead && params.accountIds.length > 0,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return {
    messages: query.data?.data ?? [],
    total: query.data?.meta.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Fetches all folders for multiple accounts in parallel (for Central Inbox).
 */
export function useAllAccountFolders(accountIds: string[]) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission(EMAIL_PERMISSIONS.MESSAGES.LIST);

  return useQueries({
    queries: accountIds.map(accountId => ({
      queryKey: ['email', 'folders', accountId],
      queryFn: () => emailService.listFolders(accountId),
      enabled: canRead,
      staleTime: 30_000,
    })),
  });
}

export function useEmailMessage(messageId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['email', 'message', messageId],
    queryFn: () => emailService.getMessage(messageId!),
    enabled: Boolean(messageId),
    staleTime: 1000 * 60 * 5,
  });

  // Sync hasAttachments flag back into the list cache.
  // The backend auto-corrects the flag on first detail view (lazy-fetch),
  // so we propagate the corrected value to the list cache here.
  const detailId = query.data?.message?.id;
  const detailHasAttachments = query.data?.message?.hasAttachments;

  useEffect(() => {
    if (!detailId || !detailHasAttachments) return;

    queryClient.setQueriesData(
      { queryKey: ['email', 'messages'] },
      (old: unknown) => {
        const data = old as
          | {
              pages?: Array<{
                data: Array<{ id: string; hasAttachments: boolean }>;
                meta: unknown;
              }>;
            }
          | undefined;

        if (!data?.pages) return old;

        let changed = false;
        const pages = data.pages.map(page => ({
          ...page,
          data: page.data.map(msg => {
            if (msg.id === detailId && !msg.hasAttachments) {
              changed = true;
              return { ...msg, hasAttachments: true };
            }
            return msg;
          }),
        }));

        return changed ? { ...data, pages } : old;
      }
    );
  }, [detailId, detailHasAttachments, queryClient]);

  return query;
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      emailService.markAsRead(id, isRead),
    onMutate: async ({ id, isRead }) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['email', 'messages'] });

      // Optimistically update message in infinite query caches
      queryClient.setQueriesData(
        { queryKey: ['email', 'messages'] },
        (old: unknown) => {
          const data = old as
            | {
                pages?: Array<{
                  data: Array<{ id: string; isRead: boolean }>;
                  meta: unknown;
                }>;
              }
            | undefined;
          if (!data?.pages) return old;
          return {
            ...data,
            pages: data.pages.map(page => ({
              ...page,
              data: page.data.map(msg =>
                msg.id === id ? { ...msg, isRead } : msg
              ),
            })),
          };
        }
      );

      // Also update single message query if it exists
      queryClient.setQueriesData(
        { queryKey: ['email', 'message', id] },
        (old: unknown) => {
          if (!old) return old;
          const data = old as { message?: { id: string; isRead: boolean } };
          if (data.message) {
            return { ...data, message: { ...data.message, isRead } };
          }
          return old;
        }
      );
    },
    onSuccess: async () => {
      // Only invalidate folder/account unread counts, NOT messages.
      // The optimistic update in onMutate already set the correct isRead state.
      // Invalidating ['email', 'messages'] would refetch with server-side filters
      // (e.g. unread:true) and remove the just-read message from the list,
      // causing the message display to close unexpectedly.
      await queryClient.invalidateQueries({ queryKey: ['email', 'folders'] });
      await queryClient.invalidateQueries({ queryKey: ['email', 'accounts'] });
    },
    onError: async () => {
      toast.error('Erro ao alterar status da mensagem');
      // Revert on error by refetching everything
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
  });
}

export function useMoveMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string }) =>
      emailService.moveMessage(id, folderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Erro ao mover mensagem'),
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailService.deleteMessage(id),
    onSuccess: async () => {
      toast.success('Mensagem excluída permanentemente');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Erro ao excluir mensagem'),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: emailService.sendMessage.bind(emailService),
    onSuccess: async () => {
      toast.success('E-mail enviado com sucesso');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: (error: Error) => {
      const message = error.message || 'Erro desconhecido';
      console.error('[Email Send] Falha ao enviar:', message, error);
      toast.error(`Falha ao enviar e-mail: ${message}`);
    },
  });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: emailService.saveDraft.bind(emailService),
    onSuccess: async () => {
      toast.success('Rascunho salvo');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Falha ao salvar rascunho'),
  });
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export function useBulkMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, isRead }: { ids: string[]; isRead: boolean }) =>
      runBulkQueue(ids, id => emailService.markAsRead(id, isRead)),
    onMutate: async ({ ids, isRead }) => {
      await queryClient.cancelQueries({ queryKey: ['email', 'messages'] });

      queryClient.setQueriesData(
        { queryKey: ['email', 'messages'] },
        (old: unknown) => updateMessageReadStateInCache(old, ids, isRead)
      );

      for (const id of ids) {
        queryClient.setQueriesData(
          { queryKey: ['email', 'message', id] },
          (old: unknown) => {
            if (!old) return old;
            const data = old as { message?: { id: string; isRead: boolean } };
            if (!data.message) return old;
            return {
              ...data,
              message: { ...data.message, isRead },
            };
          }
        );
      }
    },
    onSuccess: async (result, { isRead }) => {
      const actionLabel = isRead ? 'lidas' : 'não lidas';

      if (result.failed.length === 0) {
        toast.success(`Mensagens marcadas como ${actionLabel}`);
      } else if (result.success > 0) {
        toast.warning(
          `${result.success}/${result.total} mensagens atualizadas. ${result.failed.length} falharam.`
        );
      } else {
        toast.error('Falha ao marcar mensagens');
      }

      await queryClient.invalidateQueries({ queryKey: ['email', 'folders'] });
      await queryClient.invalidateQueries({ queryKey: ['email', 'accounts'] });

      if (result.failed.length > 0) {
        await queryClient.invalidateQueries({
          queryKey: ['email', 'messages'],
        });
      }
    },
    onError: async () => {
      toast.error('Falha ao marcar mensagens');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
  });
}

export function useBulkMove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, folderId }: { ids: string[]; folderId: string }) =>
      runBulkQueue(ids, id => emailService.moveMessage(id, folderId)),
    onSuccess: async result => {
      if (result.failed.length === 0) {
        toast.success('Mensagens movidas');
      } else if (result.success > 0) {
        toast.warning(
          `${result.success}/${result.total} mensagens movidas. ${result.failed.length} falharam.`
        );
      } else {
        toast.error('Falha ao mover mensagens');
      }
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Falha ao mover mensagens'),
  });
}

export function useBulkDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      runBulkQueue(ids, id => emailService.deleteMessage(id)),
    onSuccess: async result => {
      if (result.failed.length === 0) {
        toast.success('Mensagens excluídas');
      } else if (result.success > 0) {
        toast.warning(
          `${result.success}/${result.total} mensagens excluídas. ${result.failed.length} falharam.`
        );
      } else {
        toast.error('Falha ao excluir mensagens');
      }
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Falha ao excluir mensagens'),
  });
}
