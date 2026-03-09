'use client';

import {
  EmailAccountEditDialog,
  EmailAccountWizard,
  EmailComposeDialog,
  EmailEmptyState,
  EmailMessageDisplay,
  EmailMessageList,
  EmailSidebar,
} from '@/components/email';
import { getFolderDisplayName } from '@/components/email/email-utils';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
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
} from '@/hooks/email/use-email';
import { useEmailAccountUnreadCounts } from '@/hooks/email/use-email-unread-count';
import { usePermissions } from '@/hooks/use-permissions';
import { emailService } from '@/services/email';
import type { EmailAccount, EmailMessageListItem } from '@/types/email';
import { useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TbMailPlus } from 'react-icons/tb';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

type ComposeMode =
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

export default function EmailPage() {
  const { hasPermission } = usePermissions();
  const canSend = hasPermission(EMAIL_PERMISSIONS.MESSAGES.SEND);
  const searchParams = useSearchParams();

  // ─── URL Params ────────────────────────────────────────────────────────────
  //
  //   aid  = Account ID ("central" for central inbox, or account UUID)
  //   mid  = Message ID  (deep-link: fetches message to discover account/folder)
  //   fid  = Folder ID   (used with aid to open a specific folder)
  //   action = "compose" | "reply" | "forward"
  //
  // Combinations:
  //   /email                         → Central Inbox (default)
  //   /email?aid=central             → Central Inbox (explicit)
  //   /email?aid=xxx                 → Specific account, auto-select INBOX
  //   /email?aid=xxx&fid=yyy         → Specific account + folder
  //   /email?mid=xxx                 → Fetch message → select account/folder/message
  //   /email?action=compose          → Open compose dialog
  //   /email?mid=xxx&action=reply    → Open reply for that message

  const aid = searchParams.get('aid');
  const mid = searchParams.get('mid');
  const fid = searchParams.get('fid');
  const action = searchParams.get('action') as
    | 'compose'
    | 'reply'
    | 'forward'
    | null;

  /**
   * When any URL param drives initial state, auto-select effects (first account,
   * inbox folder, account-change reset) are paused so they don't overwrite the
   * URL-driven state. The guard is lowered after one render+effects cycle once
   * the resolved state has been applied.
   */
  const hasInitialParams = !!aid || !!mid || !!fid;
  const urlParamsActiveRef = useRef(hasInitialParams);
  const urlParamsResolvedRef = useRef(!mid); // Needs async fetch only when mid is present
  const actionHandledRef = useRef(false);

  // ─── State (initial values driven by URL params) ──────────────────────────

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    () => {
      if (mid) return null; // Will be resolved by message fetch
      if (aid && aid !== 'central') return aid;
      return null;
    }
  );
  // Tracks previous accountId to detect actual changes (StrictMode-safe)
  const prevAccountRef = useRef(selectedAccountId);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    () => {
      if (mid) return null; // Will be resolved by message fetch
      return fid;
    }
  );

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    mid
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread'>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>({ type: 'new' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isCentralInbox, setIsCentralInbox] = useState(() => {
    if (mid) return false; // Message fetch will set account/folder
    if (aid === 'central') return true;
    if (aid) return false; // Specific account requested
    return true; // ★ DEFAULT: Central Inbox
  });

  const [accountWizardOpen, setAccountWizardOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<EmailAccount | null>(null);
  const queryClient = useQueryClient();
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keeps a ref to the last selected message so it persists when the message
  // disappears from the list (e.g. deep-link before folder loads, or unread filter).
  const lastSelectedMessageRef = useRef<EmailMessageListItem | null>(null);

  // Debounce da busca — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.length >= 2 ? searchQuery : '');
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Message deep-link resolution (mid param) ─────────────────────────────
  // Fetches the message by ID to discover its accountId + folderId, then sets
  // all three selection states at once. A fallback EmailMessageListItem is
  // built so the display panel can render immediately while the folder's
  // message list is still loading.

  useEffect(() => {
    if (!mid || urlParamsResolvedRef.current) return;

    let cancelled = false;

    emailService
      .getMessage(mid)
      .then((response) => {
        if (cancelled) return;
        const msg = response.message;

        // Build a minimal list item as display fallback
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
          isAnswered: msg.isAnswered,
          hasAttachments: msg.hasAttachments,
        } satisfies EmailMessageListItem;

        // Set all states (React batches these)
        setSelectedAccountId(msg.accountId);
        setSelectedFolderId(msg.folderId);
        setSelectedMessageId(msg.id);
        setIsCentralInbox(false);

        urlParamsResolvedRef.current = true;
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Mensagem não encontrada');
        // Allow normal behavior — fall back to Central Inbox
        urlParamsActiveRef.current = false;
        urlParamsResolvedRef.current = true;
        setIsCentralInbox(true);
        setSelectedMessageId(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mid]);

  // ─── Data Fetching via Hooks ─────────────────────────────────────────────

  const accountsQuery = useEmailAccounts();
  const accounts = accountsQuery.data?.data ?? [];
  const accountUnreadCounts = useEmailAccountUnreadCounts();

  // Auto-select first account (only when NOT in Central Inbox and no URL params)
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

  // Auto-select inbox folder (only when NOT in Central Inbox and no URL params)
  useEffect(() => {
    if (urlParamsActiveRef.current) return;
    if (isCentralInbox) return;
    if (!selectedFolderId && folders.length > 0) {
      const inbox = folders.find(f => f.type === 'INBOX') ?? folders[0];
      setSelectedFolderId(inbox.id);
    }
  }, [folders, selectedFolderId, isCentralInbox]);

  // Reset selections when switching accounts (skip if value didn't actually change)
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

  /**
   * Deactivate the URL params guard AFTER the account-change reset effect
   * has had a chance to skip. React runs useEffects in declaration order,
   * so placing this right after the reset effect guarantees it only lowers
   * the guard once the "dangerous" reset has already been skipped.
   */
  useEffect(() => {
    if (urlParamsResolvedRef.current && urlParamsActiveRef.current) {
      urlParamsActiveRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, selectedFolderId, selectedMessageId]);

  // ─── Debounced sync on folder/account change ──────────────────────────
  useEffect(() => {
    if (!selectedAccountId || !selectedFolderId || isCentralInbox) return;

    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    syncDebounceRef.current = setTimeout(() => {
      emailService
        .triggerSync(selectedAccountId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['email', 'messages'] });
          queryClient.invalidateQueries({ queryKey: ['email', 'folders'] });
          queryClient.invalidateQueries({ queryKey: ['email', 'accounts'] });
        })
        .catch(() => {}); // Silent — sync failure shouldn't block UI
    }, 2000);

    return () => {
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, selectedFolderId]);

  // ─── Periodic data refresh (backend scheduler handles IMAP sync) ───────
  // The backend scheduler syncs all active accounts every 5 minutes via BullMQ.
  // The frontend only needs to refetch cached data periodically without triggering
  // additional IMAP connections, reducing load on the server significantly.
  const isSyncingRef = useRef(false);
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;

  useEffect(() => {
    if (!selectedAccountId && !isCentralInbox) return;
    if (accounts.length === 0) return;

    const REFRESH_INTERVAL_MS = 60_000; // Refetch from DB every 60s

    async function periodicRefresh() {
      // Skip if tab is hidden or a refresh is already in progress
      if (document.hidden || isSyncingRef.current) return;

      isSyncingRef.current = true;
      try {
        // Just invalidate queries to refetch from DB — no IMAP sync trigger
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

  // ─── Regular Messages Query ──────────────────────────────────────────────

  const messagesQuery = useEmailMessages({
    accountId: isCentralInbox ? null : selectedAccountId,
    folderId: isCentralInbox ? null : selectedFolderId,
    filter: messageFilter,
    search: debouncedSearch,
  });

  // ─── Central Inbox ────────────────────────────────────────────────────────

  const allAccountIds = useMemo(() => accounts.map(a => a.id), [accounts]);

  const centralInbox = useCentralInboxMessages({
    accountIds: allAccountIds,
    filter: messageFilter,
    search: debouncedSearch,
    enabled: isCentralInbox,
  });

  // ─── Merge messages based on mode ────────────────────────────────────────

  const messages = isCentralInbox
    ? centralInbox.messages
    : (messagesQuery.data?.pages.flatMap(p => p.data) ?? []);

  const messagesTotal = isCentralInbox
    ? centralInbox.total
    : messagesQuery.data?.pages[0]?.meta.total;

  const messagesLoading = isCentralInbox
    ? centralInbox.isLoading
    : messagesQuery.isLoading;

  const messagesError = isCentralInbox
    ? centralInbox.isError
    : messagesQuery.isError;

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
    // Message disappeared from list (e.g. marked as read during unread-filtered polling).
    // Keep showing it until user explicitly navigates away.
    if (
      selectedMessageId &&
      lastSelectedMessageRef.current?.id === selectedMessageId
    ) {
      return lastSelectedMessageRef.current;
    }
    lastSelectedMessageRef.current = null;
    return null;
  }, [messages, selectedMessageId]);

  const prefetchedMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const candidates = messages.slice(0, 8);

    for (const message of candidates) {
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
    ].filter((message): message is EmailMessageListItem => Boolean(message));

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

  /** Server-side unread counts per folder */
  const unreadCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const folder of folders) {
      if (folder.unreadMessages > 0) {
        counts[folder.id] = folder.unreadMessages;
      }
    }
    return counts;
  }, [folders]);


  // ─── Mutations via Hooks ─────────────────────────────────────────────────

  const syncMutation = useSyncEmailAccount();
  const bulkMarkReadMutation = useBulkMarkRead();
  const bulkMoveMutation = useBulkMove();
  const bulkDeleteMutation = useBulkDelete();
  const moveMutation = useMoveMessage();

  function openCompose() {
    setComposeMode({ type: 'new' });
    setComposeOpen(true);
  }

  function openReply(
    message: EmailMessageListItem,
    rfcMessageId?: string | null,
    quotedBody?: string | null
  ) {
    setComposeMode({ type: 'reply', message, rfcMessageId, quotedBody });
    setComposeOpen(true);
  }

  function openReplyAll(
    message: EmailMessageListItem,
    toAddresses: string[],
    ccAddresses: string[],
    rfcMessageId?: string | null,
    quotedBody?: string | null
  ) {
    setComposeMode({
      type: 'replyAll',
      message,
      replyAllTo: toAddresses,
      replyAllCc: ccAddresses,
      rfcMessageId,
      quotedBody,
    });
    setComposeOpen(true);
  }

  function openForward(
    message: EmailMessageListItem,
    rfcMessageId?: string | null,
    quotedBody?: string | null
  ) {
    setComposeMode({ type: 'forward', message, rfcMessageId, quotedBody });
    setComposeOpen(true);
  }

  // ─── URL action handling ─────────────────────────────────────────────────
  // action=compose opens the compose dialog immediately.
  // action=reply|forward waits for the message to load, then opens the dialog
  // with the quoted body fetched from the full message detail.

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

    // Fetch full message detail for quoted body
    emailService
      .getMessage(selectedMessage.id)
      .then((response) => {
        const msg = response.message;
        const quoted = msg.bodyHtmlSanitized ?? msg.bodyText;
        const rfcId = msg.messageId;

        if (action === 'reply') {
          openReply(selectedMessage, rfcId, quoted);
        } else if (action === 'forward') {
          openForward(selectedMessage, rfcId, quoted);
        }
      })
      .catch(() => {
        // Fallback: open without quoted body
        if (action === 'reply') {
          openReply(selectedMessage);
        } else if (action === 'forward') {
          openForward(selectedMessage);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, selectedMessage]);

  // Keyboard Delete handler (single message — bulk delete is handled by EmailMessageList)
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size > 0) return; // Bulk delete handled by message list component
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when user is typing in an input/textarea
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

  // Action bar buttons
  const actionBarButtons = [
    ...(canSend && accounts.length > 0
      ? [
          {
            id: 'compose',
            title: 'Novo Email',
            icon: TbMailPlus,
            variant: 'default' as const,
            onClick: openCompose,
          },
        ]
      : []),
  ];

  const hasAccounts = accounts.length > 0 || accountsQuery.isLoading;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-10rem)]">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[{ label: 'E-mail', href: '/email' }]}
        buttons={actionBarButtons}
      />

      {/* Hero Banner */}
      <Card className="relative overflow-hidden p-6 md:p-8 bg-white dark:bg-white/5 border-gray-200/80 dark:border-white/10 shadow-sm dark:shadow-none shrink-0">
        <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/15 dark:bg-blue-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                E-mail
              </h1>
              <p className="text-sm text-slate-500 dark:text-white/60">
                Gerencie suas caixas de entrada, envie e receba mensagens
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Body — empty state or 3-panel layout */}
      {!hasAccounts ? (
        <Card className="bg-white dark:bg-white/5 border-gray-200/80 dark:border-white/10 shadow-sm dark:shadow-none p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
          <EmailEmptyState onAddAccount={() => setAccountWizardOpen(true)} />
        </Card>
      ) : (
        <Card className="bg-white dark:bg-white/5 border-gray-200/80 dark:border-white/10 shadow-sm dark:shadow-none p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="flex flex-1 min-h-0">
            <ResizablePanelGroup
              direction="horizontal"
              className="flex-1 min-w-0"
            >
              <ResizablePanel
                defaultSize={20}
                minSize={16}
                maxSize={28}
                className="border-r"
              >
                <EmailSidebar
                  accounts={accounts}
                  folders={folders}
                  selectedAccountId={selectedAccountId}
                  selectedFolderId={selectedFolderId}
                  isCentralInbox={isCentralInbox}
                  onAccountChange={id => {
                    setSelectedAccountId(id);
                    setIsCentralInbox(false);
                  }}
                  onFolderChange={id => {
                    setSelectedFolderId(id);
                    setSelectedMessageId(null);
                    setSelectedIds(new Set());
                    setIsCentralInbox(false);
                  }}
                  onSyncAccount={() => {
                    if (selectedAccountId)
                      syncMutation.mutate(selectedAccountId);
                  }}
                  isSyncing={syncMutation.isPending}
                  onCentralInbox={() => {
                    setIsCentralInbox(true);
                    setSelectedFolderId(null);
                    setSelectedMessageId(null);
                    setSelectedIds(new Set());
                  }}
                  onOpenNewAccount={() => setAccountWizardOpen(true)}
                  onEditAccount={account => setEditAccount(account)}
                  unreadCounts={unreadCounts}
                  accountUnreadCounts={accountUnreadCounts}
                  isLoadingAccounts={accountsQuery.isLoading}
                />
              </ResizablePanel>

              <ResizableHandle />

              <ResizablePanel
                defaultSize={30}
                minSize={22}
                maxSize={45}
                className="border-r"
              >
                <EmailMessageList
                  messages={messages}
                  total={messagesTotal}
                  selectedMessageId={selectedMessageId}
                  onSelectMessage={id => setSelectedMessageId(id)}
                  isLoading={messagesLoading}
                  isError={messagesError}
                  noAccount={!selectedAccountId && !isCentralInbox}
                  searchQuery={searchQuery}
                  onSearchChange={q => {
                    setSearchQuery(q);
                    setSelectedMessageId(null);
                  }}
                  filter={messageFilter}
                  onFilterChange={f => {
                    setMessageFilter(f);
                    setSelectedMessageId(null);
                  }}
                  folderTotalMessages={selectedFolder?.totalMessages}
                  folderUnreadMessages={selectedFolder?.unreadMessages}
                  folderName={
                    isCentralInbox
                      ? 'Caixa Central'
                      : selectedFolder
                        ? getFolderDisplayName(selectedFolder)
                        : undefined
                  }
                  hasMore={isCentralInbox ? false : messagesQuery.hasNextPage}
                  isFetchingNextPage={
                    isCentralInbox ? false : messagesQuery.isFetchingNextPage
                  }
                  onLoadMore={() => {
                    if (!isCentralInbox) messagesQuery.fetchNextPage();
                  }}
                  selectedIds={selectedIds}
                  onSelectedIdsChange={setSelectedIds}
                  onToggleSelect={id =>
                    setSelectedIds(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                  onSelectAll={() =>
                    setSelectedIds(new Set(messages.map(m => m.id)))
                  }
                  onClearSelection={() => setSelectedIds(new Set())}
                  onBulkMarkRead={(ids, isRead) => {
                    bulkMarkReadMutation.mutate(
                      { ids, isRead },
                      {
                        onSuccess: () => setSelectedIds(new Set()),
                      }
                    );
                  }}
                  onBulkArchive={ids => {
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
                  }}
                  onBulkDelete={ids => {
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
                  }}
                />
              </ResizablePanel>

              <ResizableHandle />

              <ResizablePanel defaultSize={50} minSize={35}>
                <EmailMessageDisplay
                  selectedMessage={selectedMessage}
                  folders={isCentralInbox ? [] : folders}
                  currentFolderId={selectedFolderId}
                  onReply={openReply}
                  onReplyAll={openReplyAll}
                  onForward={openForward}
                  onDeleteMessage={() => setSelectedMessageId(null)}
                  accountId={selectedMessage?.accountId ?? selectedAccountId}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </Card>
      )}

      {/* Compose Dialog */}
      <EmailComposeDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        accounts={accounts}
        defaultAccountId={selectedAccountId ?? undefined}
        mode={composeMode}
      />

      {/* Account Wizard Modal */}
      <EmailAccountWizard
        open={accountWizardOpen}
        onOpenChange={setAccountWizardOpen}
      />

      {/* Account Edit Modal */}
      {editAccount && (
        <EmailAccountEditDialog
          account={editAccount}
          open={!!editAccount}
          onOpenChange={open => {
            if (!open) setEditAccount(null);
          }}
        />
      )}
    </div>
  );
}
