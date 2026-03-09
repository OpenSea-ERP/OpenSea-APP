'use client';

import { getFolderDisplayName } from '@/components/email/email-utils';
import { EMAIL_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useBulkDelete,
  useBulkMarkRead,
  useBulkMove,
  useCentralInboxMessages,
  useEmailAccounts,
  useEmailFolders,
  useEmailMessages,
  useMoveMessage,
  useSyncEmailAccount,
  useToggleMessageFlag,
} from '@/hooks/email/use-email';
import { useEmailAccountUnreadCounts } from '@/hooks/email/use-email-unread-count';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePermissions } from '@/hooks/use-permissions';
import { emailService } from '@/services/email';
import type { EmailAccount, EmailMessageListItem } from '@/types/email';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ComposeMode =
  | { type: 'new' }
  | {
      type: 'reply';
      message: EmailMessageListItem;
      rfcMessageId?: string | null;
      quotedBody?: string | null;
    }
  | {
      type: 'replyAll';
      message: EmailMessageListItem;
      replyAllTo: string[];
      replyAllCc: string[];
      rfcMessageId?: string | null;
      quotedBody?: string | null;
    }
  | {
      type: 'forward';
      message: EmailMessageListItem;
      rfcMessageId?: string | null;
      quotedBody?: string | null;
    };

// ─── URL Sync Helper ────────────────────────────────────────────────────────

function syncUrlParams(params: {
  aid?: string | null;
  fid?: string | null;
  mid?: string | null;
}) {
  const url = new URL(window.location.href);
  const sp = url.searchParams;

  // Remove action after first use — it's a one-shot param
  sp.delete('action');

  if (params.aid === 'central' || (!params.aid && !params.mid)) {
    sp.set('aid', 'central');
    sp.delete('fid');
  } else if (params.aid) {
    sp.set('aid', params.aid);
    if (params.fid) {
      sp.set('fid', params.fid);
    } else {
      sp.delete('fid');
    }
  }

  if (params.mid) {
    sp.set('mid', params.mid);
  } else {
    sp.delete('mid');
  }

  window.history.replaceState(null, '', url.toString());
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useEmailPage() {
  const { hasPermission } = usePermissions();
  const canSend = hasPermission(EMAIL_PERMISSIONS.MESSAGES.SEND);
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // ─── URL Params (read once on mount) ──────────────────────────────────────
  const aid = searchParams.get('aid');
  const mid = searchParams.get('mid');
  const fid = searchParams.get('fid');
  const action = searchParams.get('action') as
    | 'compose'
    | 'reply'
    | 'forward'
    | null;

  const hasInitialParams = !!aid || !!mid || !!fid;
  const urlParamsActiveRef = useRef(hasInitialParams);
  const urlParamsResolvedRef = useRef(!mid);
  const actionHandledRef = useRef(false);

  // ─── Core State ───────────────────────────────────────────────────────────

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    () => {
      if (mid) return null;
      if (aid && aid !== 'central') return aid;
      return null;
    }
  );
  const prevAccountRef = useRef(selectedAccountId);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    () => {
      if (mid) return null;
      return fid;
    }
  );

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(mid);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>({ type: 'new' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isCentralInbox, setIsCentralInbox] = useState(() => {
    if (mid) return false;
    if (aid === 'central') return true;
    if (aid) return false;
    return true;
  });

  const [accountWizardOpen, setAccountWizardOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<EmailAccount | null>(null);
  const [mobileView, setMobileView] = useState<'sidebar' | 'list' | 'detail'>('list');

  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSelectedMessageRef = useRef<EmailMessageListItem | null>(null);

  // ─── Search Debounce ──────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.length >= 2 ? searchQuery : '');
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Deep-link Resolution (mid param) ─────────────────────────────────────

  useEffect(() => {
    if (!mid || urlParamsResolvedRef.current) return;
    let cancelled = false;

    emailService
      .getMessage(mid)
      .then((response) => {
        if (cancelled) return;
        const msg = response.message;

        lastSelectedMessageRef.current = {
          id: msg.id,
          accountId: msg.accountId,
          folderId: msg.folderId,
          subject: msg.subject,
          fromAddress: msg.fromAddress,
          fromName: msg.fromName,
          snippet: msg.snippet,
          receivedAt: msg.receivedAt,
          isRead: msg.isRead,
          isFlagged: msg.isFlagged,
          isAnswered: msg.isAnswered,
          hasAttachments: msg.hasAttachments,
        } satisfies EmailMessageListItem;

        setSelectedAccountId(msg.accountId);
        setSelectedFolderId(msg.folderId);
        setSelectedMessageId(msg.id);
        setIsCentralInbox(false);
        urlParamsResolvedRef.current = true;
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Mensagem não encontrada');
        urlParamsActiveRef.current = false;
        urlParamsResolvedRef.current = true;
        setIsCentralInbox(true);
        setSelectedMessageId(null);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mid]);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const accountsQuery = useEmailAccounts();
  const accounts = accountsQuery.data?.data ?? [];
  const accountUnreadCounts = useEmailAccountUnreadCounts();

  // Auto-select first account
  useEffect(() => {
    if (urlParamsActiveRef.current) return;
    if (isCentralInbox) return;
    const firstAccount = accounts[0];
    if (!selectedAccountId && firstAccount) {
      setSelectedAccountId(firstAccount.id);
    }
  }, [accounts, selectedAccountId, isCentralInbox]);

  const foldersQuery = useEmailFolders(selectedAccountId);
  const folders = foldersQuery.data?.data ?? [];

  // Auto-select inbox folder
  useEffect(() => {
    if (urlParamsActiveRef.current) return;
    if (isCentralInbox) return;
    if (!selectedFolderId && folders.length > 0) {
      const inbox = folders.find(f => f.type === 'INBOX') ?? folders[0];
      setSelectedFolderId(inbox.id);
    }
  }, [folders, selectedFolderId, isCentralInbox]);

  // Reset on account change
  useEffect(() => {
    if (selectedAccountId === prevAccountRef.current) {
      prevAccountRef.current = selectedAccountId;
      return;
    }
    prevAccountRef.current = selectedAccountId;
    if (urlParamsActiveRef.current) return;
    setSelectedFolderId(null);
    setSelectedMessageId(null);
    setSearchQuery('');
    setSelectedIds(new Set());
    setIsCentralInbox(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId]);

  // Deactivate URL guard
  useEffect(() => {
    if (urlParamsResolvedRef.current && urlParamsActiveRef.current) {
      urlParamsActiveRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, selectedFolderId, selectedMessageId]);

  // ─── F13: Sync state → URL (replaceState, no navigation) ─────────────────

  useEffect(() => {
    // Skip during initial URL resolution
    if (urlParamsActiveRef.current) return;

    syncUrlParams({
      aid: isCentralInbox ? 'central' : selectedAccountId,
      fid: selectedFolderId,
      mid: selectedMessageId,
    });
  }, [isCentralInbox, selectedAccountId, selectedFolderId, selectedMessageId]);

  // ─── Debounced Sync on Folder Change ──────────────────────────────────────

  useEffect(() => {
    if (!selectedAccountId || !selectedFolderId || isCentralInbox) return;

    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);

    syncDebounceRef.current = setTimeout(() => {
      emailService
        .triggerSync(selectedAccountId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['email', 'messages'] });
          queryClient.invalidateQueries({ queryKey: ['email', 'folders'] });
          queryClient.invalidateQueries({ queryKey: ['email', 'accounts'] });
        })
        .catch(() => {});
    }, 2000);

    return () => {
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, selectedFolderId]);

  // ─── Periodic Refresh ─────────────────────────────────────────────────────

  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!selectedAccountId && !isCentralInbox) return;
    if (accounts.length === 0) return;

    const REFRESH_INTERVAL_MS = 60_000;

    async function periodicRefresh() {
      if (document.hidden || isSyncingRef.current) return;
      isSyncingRef.current = true;
      try {
        queryClient.invalidateQueries({ queryKey: ['email', 'messages'] });
        queryClient.invalidateQueries({ queryKey: ['email', 'folders'] });
      } finally {
        isSyncingRef.current = false;
      }
    }

    const interval = setInterval(periodicRefresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, isCentralInbox, accounts.length]);

  // ─── Messages ─────────────────────────────────────────────────────────────

  // 'starred' is client-side only — send 'all' to the server
  const serverFilter = messageFilter === 'starred' ? 'all' : messageFilter;

  const messagesQuery = useEmailMessages({
    accountId: isCentralInbox ? null : selectedAccountId,
    folderId: isCentralInbox ? null : selectedFolderId,
    filter: serverFilter,
    search: debouncedSearch,
  });

  const allAccountIds = useMemo(() => accounts.map(a => a.id), [accounts]);

  const centralInbox = useCentralInboxMessages({
    accountIds: allAccountIds,
    filter: serverFilter,
    search: debouncedSearch,
    enabled: isCentralInbox,
  });

  const rawMessages = isCentralInbox
    ? centralInbox.messages
    : (messagesQuery.data?.pages.flatMap(p => p.data) ?? []);

  const messages = messageFilter === 'starred'
    ? rawMessages.filter(m => m.isFlagged)
    : rawMessages;

  const messagesTotal = isCentralInbox
    ? centralInbox.total
    : messagesQuery.data?.pages[0]?.meta.total;

  const messagesLoading = isCentralInbox
    ? centralInbox.isLoading
    : messagesQuery.isLoading;

  const messagesError = isCentralInbox
    ? centralInbox.isError
    : messagesQuery.isError;

  // Auto-select first message
  useEffect(() => {
    const firstMessage = messages[0];
    if (!selectedMessageId && firstMessage) {
      setSelectedMessageId(firstMessage.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesQuery.data, centralInbox.messages.length]);

  const selectedMessage = useMemo<EmailMessageListItem | null>(() => {
    const found = messages.find(m => m.id === selectedMessageId) ?? null;
    if (found) {
      lastSelectedMessageRef.current = found;
      return found;
    }
    if (
      selectedMessageId &&
      lastSelectedMessageRef.current?.id === selectedMessageId
    ) {
      return lastSelectedMessageRef.current;
    }
    lastSelectedMessageRef.current = null;
    return null;
  }, [messages, selectedMessageId]);

  // ─── Prefetch ─────────────────────────────────────────────────────────────

  const prefetchedMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const message of messages.slice(0, 8)) {
      if (prefetchedMessageIdsRef.current.has(message.id)) continue;
      prefetchedMessageIdsRef.current.add(message.id);
      void queryClient.prefetchQuery({
        queryKey: ['email', 'message', message.id],
        queryFn: () => emailService.getMessage(message.id),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [messages, queryClient]);

  useEffect(() => {
    if (!selectedMessageId) return;
    const selectedIndex = messages.findIndex(m => m.id === selectedMessageId);
    if (selectedIndex === -1) return;

    const adjacent = [
      messages[selectedIndex - 1],
      messages[selectedIndex + 1],
    ].filter((m): m is EmailMessageListItem => Boolean(m));

    for (const message of adjacent) {
      if (prefetchedMessageIdsRef.current.has(message.id)) continue;
      prefetchedMessageIdsRef.current.add(message.id);
      void queryClient.prefetchQuery({
        queryKey: ['email', 'message', message.id],
        queryFn: () => emailService.getMessage(message.id),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [selectedMessageId, messages, queryClient]);

  const selectedFolder = useMemo(
    () => folders.find(f => f.id === selectedFolderId) ?? null,
    [folders, selectedFolderId]
  );

  const unreadCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const folder of folders) {
      if (folder.unreadMessages > 0) {
        counts[folder.id] = folder.unreadMessages;
      }
    }
    return counts;
  }, [folders]);

  // ─── Mutations ────────────────────────────────────────────────────────────

  const syncMutation = useSyncEmailAccount();
  const bulkMarkReadMutation = useBulkMarkRead();
  const bulkMoveMutation = useBulkMove();
  const bulkDeleteMutation = useBulkDelete();
  const moveMutation = useMoveMessage();
  const flagMutation = useToggleMessageFlag();

  // ─── Compose Actions ──────────────────────────────────────────────────────

  const openCompose = useCallback(() => {
    setComposeMode({ type: 'new' });
    setComposeOpen(true);
  }, []);

  const openReply = useCallback(
    (
      message: EmailMessageListItem,
      rfcMessageId?: string | null,
      quotedBody?: string | null
    ) => {
      setComposeMode({ type: 'reply', message, rfcMessageId, quotedBody });
      setComposeOpen(true);
    },
    []
  );

  const openReplyAll = useCallback(
    (
      message: EmailMessageListItem,
      toAddresses: string[],
      ccAddresses: string[],
      rfcMessageId?: string | null,
      quotedBody?: string | null
    ) => {
      setComposeMode({
        type: 'replyAll',
        message,
        replyAllTo: toAddresses,
        replyAllCc: ccAddresses,
        rfcMessageId,
        quotedBody,
      });
      setComposeOpen(true);
    },
    []
  );

  const openForward = useCallback(
    (
      message: EmailMessageListItem,
      rfcMessageId?: string | null,
      quotedBody?: string | null
    ) => {
      setComposeMode({ type: 'forward', message, rfcMessageId, quotedBody });
      setComposeOpen(true);
    },
    []
  );

  // ─── URL Action Handling ──────────────────────────────────────────────────

  useEffect(() => {
    if (!action || actionHandledRef.current) return;
    if (action === 'compose') {
      actionHandledRef.current = true;
      openCompose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  useEffect(() => {
    if (!action || action === 'compose' || actionHandledRef.current) return;
    if (!selectedMessage) return;
    actionHandledRef.current = true;

    emailService
      .getMessage(selectedMessage.id)
      .then((response) => {
        const msg = response.message;
        const quoted = msg.bodyHtmlSanitized ?? msg.bodyText;
        const rfcId = msg.messageId;

        if (action === 'reply') openReply(selectedMessage, rfcId, quoted);
        else if (action === 'forward') openForward(selectedMessage, rfcId, quoted);
      })
      .catch(() => {
        if (action === 'reply') openReply(selectedMessage);
        else if (action === 'forward') openForward(selectedMessage);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, selectedMessage]);

  // ─── Delete Handler ───────────────────────────────────────────────────────

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size > 0) return;
    if (selectedMessageId) {
      const trashFolder = folders.find(f => f.type === 'TRASH');
      if (trashFolder) {
        moveMutation.mutate(
          { id: selectedMessageId, folderId: trashFolder.id },
          {
            onSuccess: () => {
              toast.success('Mensagem movida para a lixeira');
              setSelectedMessageId(null);
            },
          }
        );
      }
    }
  }, [selectedMessageId, selectedIds.size, folders, moveMutation]);

  // Keyboard Delete
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'Delete' && !composeOpen) {
        e.preventDefault();
        handleDeleteSelected();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, composeOpen]);

  // ─── Aria Announcements ───────────────────────────────────────────────────

  const prevMessageCountRef = useRef(messages.length);
  const [ariaAnnouncement, setAriaAnnouncement] = useState('');

  useEffect(() => {
    const prev = prevMessageCountRef.current;
    const curr = messages.length;
    prevMessageCountRef.current = curr;

    if (curr > prev && prev > 0) {
      const newCount = curr - prev;
      setAriaAnnouncement(
        `${newCount} nova${newCount > 1 ? 's' : ''} mensagem${newCount > 1 ? 'ns' : ''}`
      );
    }
  }, [messages.length]);

  // ─── Props Builders ───────────────────────────────────────────────────────

  const sidebarProps = useMemo(
    () => ({
      accounts,
      folders,
      selectedAccountId,
      selectedFolderId,
      isCentralInbox,
      onAccountChange: (id: string) => {
        setSelectedAccountId(id);
        setIsCentralInbox(false);
      },
      onFolderChange: (id: string) => {
        setSelectedFolderId(id);
        setSelectedMessageId(null);
        setSelectedIds(new Set<string>());
        setIsCentralInbox(false);
        if (isMobile) setMobileView('list');
      },
      onSyncAccount: () => {
        if (selectedAccountId) syncMutation.mutate(selectedAccountId);
      },
      isSyncing: syncMutation.isPending,
      onCentralInbox: () => {
        setIsCentralInbox(true);
        setSelectedFolderId(null);
        setSelectedMessageId(null);
        setSelectedIds(new Set<string>());
        if (isMobile) setMobileView('list');
      },
      onOpenNewAccount: () => setAccountWizardOpen(true),
      onEditAccount: (account: EmailAccount) => setEditAccount(account),
      unreadCounts,
      accountUnreadCounts,
      isLoadingAccounts: accountsQuery.isLoading,
    }),
    [
      accounts, folders, selectedAccountId, selectedFolderId,
      isCentralInbox, isMobile, syncMutation, unreadCounts,
      accountUnreadCounts, accountsQuery.isLoading,
    ]
  );

  const messageListProps = useMemo(
    () => ({
      messages,
      total: messagesTotal,
      selectedMessageId,
      onSelectMessage: (id: string) => {
        setSelectedMessageId(id);
        if (isMobile) setMobileView('detail');
      },
      isLoading: messagesLoading,
      isError: messagesError,
      noAccount: !selectedAccountId && !isCentralInbox,
      searchQuery,
      onSearchChange: (q: string) => {
        setSearchQuery(q);
        setSelectedMessageId(null);
      },
      filter: messageFilter,
      onFilterChange: (f: 'all' | 'unread' | 'starred') => {
        setMessageFilter(f);
        setSelectedMessageId(null);
      },
      folderTotalMessages: selectedFolder?.totalMessages,
      folderUnreadMessages: selectedFolder?.unreadMessages,
      folderName: isCentralInbox
        ? 'Caixa Central'
        : selectedFolder
          ? getFolderDisplayName(selectedFolder)
          : undefined,
      hasMore: isCentralInbox ? false : messagesQuery.hasNextPage,
      isFetchingNextPage: isCentralInbox
        ? false
        : messagesQuery.isFetchingNextPage,
      onLoadMore: () => {
        if (!isCentralInbox) messagesQuery.fetchNextPage();
      },
      selectedIds,
      onSelectedIdsChange: setSelectedIds,
      onToggleSelect: (id: string) =>
        setSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      onSelectAll: () => setSelectedIds(new Set(messages.map(m => m.id))),
      onClearSelection: () => setSelectedIds(new Set()),
      onBulkMarkRead: (ids: string[], isRead: boolean) => {
        bulkMarkReadMutation.mutate(
          { ids, isRead },
          { onSuccess: () => setSelectedIds(new Set()) }
        );
      },
      onBulkArchive: (ids: string[]) => {
        const archiveFolder = folders.find(
          f =>
            f.remoteName.toLowerCase().includes('archive') ||
            f.remoteName.toLowerCase().includes('arquivo') ||
            f.displayName.toLowerCase().includes('archive') ||
            f.displayName.toLowerCase().includes('arquivo')
        );
        if (!archiveFolder) {
          toast.error('Pasta de arquivo não encontrada');
          return;
        }
        bulkMoveMutation.mutate(
          { ids, folderId: archiveFolder.id },
          {
            onSuccess: () => {
              setSelectedIds(new Set());
              toast.success('Mensagens arquivadas');
            },
          }
        );
      },
      onBulkDelete: (ids: string[]) => {
        const trashFolder = folders.find(f => f.type === 'TRASH');
        if (trashFolder) {
          bulkMoveMutation.mutate(
            { ids, folderId: trashFolder.id },
            {
              onSuccess: () => {
                setSelectedIds(new Set());
                toast.success('Mensagens movidas para a lixeira');
              },
            }
          );
        } else {
          bulkDeleteMutation.mutate(ids, {
            onSuccess: () => setSelectedIds(new Set()),
          });
        }
      },
      onToggleFlag: (id: string, isFlagged: boolean) => {
        flagMutation.mutate({ id, isFlagged });
      },
    }),
    [
      messages, messagesTotal, selectedMessageId, isMobile, messagesLoading,
      messagesError, selectedAccountId, isCentralInbox, searchQuery,
      messageFilter, selectedFolder, messagesQuery, selectedIds, folders,
      bulkMarkReadMutation, bulkMoveMutation, bulkDeleteMutation, flagMutation,
    ]
  );

  const messageDisplayProps = useMemo(
    () => ({
      selectedMessage,
      folders: isCentralInbox ? [] : folders,
      currentFolderId: selectedFolderId,
      onReply: openReply,
      onReplyAll: openReplyAll,
      onForward: openForward,
      onDeleteMessage: () => setSelectedMessageId(null),
      accountId: selectedMessage?.accountId ?? selectedAccountId,
    }),
    [
      selectedMessage, isCentralInbox, folders, selectedFolderId,
      openReply, openReplyAll, openForward, selectedAccountId,
    ]
  );

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    // Layout
    isMobile,
    mobileView,
    setMobileView,

    // Permissions
    canSend,

    // Accounts
    accounts,
    accountsQuery,
    hasAccounts: accounts.length > 0 || accountsQuery.isLoading,

    // Compose
    composeOpen,
    setComposeOpen,
    composeMode,
    openCompose,

    // Account management
    accountWizardOpen,
    setAccountWizardOpen,
    editAccount,
    setEditAccount,

    // Selection state
    selectedAccountId,
    selectedFolderId,
    selectedFolder,
    selectedMessage,
    isCentralInbox,

    // Component props
    sidebarProps,
    messageListProps,
    messageDisplayProps,

    // Aria
    ariaAnnouncement,
  };
}
