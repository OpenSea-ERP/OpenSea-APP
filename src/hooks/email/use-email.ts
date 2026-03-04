'use client';

import { EMAIL_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { emailService } from '@/services/email';
import type {
    EmailMessagesQuery,
    EmailMessagesResponse,
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

export function useSyncEmailAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => emailService.triggerSync(accountId),
    onSuccess: async () => {
      toast.success('Sincronização disparada');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Falha ao disparar sincronização'),
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
    staleTime: 0,
    refetchInterval: 60_000,
  });
}

/**
 * Central Inbox: queries INBOX from ALL accounts in parallel, merges results.
 * The backend requires accountId, so we query each account separately.
 */
export function useCentralInboxMessages(params: {
  accountIds: string[];
  inboxFolderIds: Record<string, string>; // accountId -> inboxFolderId
  filter: 'all' | 'unread';
  search: string;
  enabled: boolean;
}) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission(EMAIL_PERMISSIONS.MESSAGES.LIST);

  const queries = useQueries({
    queries: params.accountIds.map(accountId => {
      const folderId = params.inboxFolderIds[accountId];
      return {
        queryKey: [
          'email',
          'messages',
          'central',
          accountId,
          folderId,
          params.filter,
          params.search,
        ],
        queryFn: () =>
          emailService.listMessages({
            accountId,
            folderId,
            unread: params.filter === 'unread' ? true : undefined,
            search: params.search || undefined,
            page: 1,
            limit: 50,
          }),
        enabled: params.enabled && canRead && Boolean(folderId),
        refetchInterval: 60_000,
        staleTime: 0,
      } satisfies {
        queryKey: (string | undefined | boolean)[];
        queryFn: () => Promise<EmailMessagesResponse>;
        enabled: boolean;
        refetchInterval: number;
        staleTime: number;
      };
    }),
  });

  const isLoading = queries.some(q => q.isLoading);
  const isError = queries.some(q => q.isError);
  const allMessages = queries
    .flatMap(q => q.data?.data ?? [])
    .sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  const total = queries.reduce((sum, q) => sum + (q.data?.meta.total ?? 0), 0);

  return { messages: allMessages, total, isLoading, isError, queries };
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
  return useQuery({
    queryKey: ['email', 'message', messageId],
    queryFn: () => emailService.getMessage(messageId!),
    enabled: Boolean(messageId),
    staleTime: 1000 * 60 * 5,
  });
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
          const data = old as { pages?: Array<{ data: Array<{ id: string; isRead: boolean }>; meta: unknown }> } | undefined;
          if (!data?.pages) return old;
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              data: page.data.map((msg) =>
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
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: async () => {
      toast.error('Erro ao alterar status da mensagem');
      // Revert on error by refetching
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
    onError: () => toast.error('Falha ao enviar e-mail'),
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
      Promise.all(ids.map(id => emailService.markAsRead(id, isRead))),
    onSuccess: async (_data, { isRead }) => {
      toast.success(isRead ? 'Mensagens marcadas como lidas' : 'Mensagens marcadas como não lidas');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Falha ao marcar mensagens'),
  });
}

export function useBulkMove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, folderId }: { ids: string[]; folderId: string }) =>
      Promise.all(ids.map(id => emailService.moveMessage(id, folderId))),
    onSuccess: async () => {
      toast.success('Mensagens movidas');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Falha ao mover mensagens'),
  });
}

export function useBulkDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map(id => emailService.deleteMessage(id))),
    onSuccess: async () => {
      toast.success('Mensagens excluídas');
      await queryClient.invalidateQueries({ queryKey: ['email'] });
    },
    onError: () => toast.error('Falha ao excluir mensagens'),
  });
}
