'use client';

import {
  EmailAccountEditDialog,
  EmailAccountWizard,
  EmailComposeDialog,
  EmailMessageDisplay,
  EmailMessageList,
  EmailSidebar,
} from '@/components/email';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { EMAIL_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useAllAccountFolders,
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
import { useQueryClient } from '@tanstack/react-query';
import { emailService } from '@/services/email';
import type { EmailAccount, EmailMessageListItem } from '@/types/email';
import { Card } from '@/components/ui/card';
import { Mail, PencilLine, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type ComposeMode =
  | { type: 'new' }
  | { type: 'reply'; message: EmailMessageListItem; rfcMessageId?: string | null }
  | {
      type: 'replyAll';
      message: EmailMessageListItem;
      replyAllTo: string[];
      replyAllCc: string[];
      rfcMessageId?: string | null;
    }
  | { type: 'forward'; message: EmailMessageListItem; rfcMessageId?: string | null };

export default function EmailPage() {
  const { hasPermission } = usePermissions();
  const canSend = hasPermission(EMAIL_PERMISSIONS.MESSAGES.SEND);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread'>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>({ type: 'new' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCentralInbox, setIsCentralInbox] = useState(false);
  const [accountWizardOpen, setAccountWizardOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<EmailAccount | null>(null);
  const queryClient = useQueryClient();
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce da busca — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.length >= 2 ? searchQuery : '');
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Data Fetching via Hooks ─────────────────────────────────────────────

  const accountsQuery = useEmailAccounts();
  const accounts = accountsQuery.data?.data ?? [];
  const accountUnreadCounts = useEmailAccountUnreadCounts();

  useEffect(() => {
    const firstAccount = accounts[0];
    if (!selectedAccountId && firstAccount) {
      setSelectedAccountId(firstAccount.id);
    }
  }, [accounts, selectedAccountId]);

  const foldersQuery = useEmailFolders(selectedAccountId);
  const folders = foldersQuery.data?.data ?? [];

  useEffect(() => {
    if (!selectedFolderId && folders.length > 0) {
      const inbox = folders.find(f => f.type === 'INBOX') ?? folders[0];
      setSelectedFolderId(inbox.id);
    }
  }, [folders, selectedFolderId]);

  useEffect(() => {
    setSelectedFolderId(null);
    setSelectedMessageId(null);
    setSearchQuery('');
    setSelectedIds(new Set());
    setIsCentralInbox(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId]);

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

  // ─── Regular Messages Query ──────────────────────────────────────────────

  const messagesQuery = useEmailMessages({
    accountId: isCentralInbox ? null : selectedAccountId,
    folderId: isCentralInbox ? null : selectedFolderId,
    filter: messageFilter,
    search: debouncedSearch,
  });

  // ─── Central Inbox: fetch ALL accounts' INBOX folders ────────────────────

  const allAccountIds = useMemo(
    () => accounts.map(a => a.id),
    [accounts]
  );

  const allFolderQueries = useAllAccountFolders(
    isCentralInbox ? allAccountIds : []
  );

  // Build map: accountId -> INBOX folderId
  const inboxFolderIds = useMemo(() => {
    const map: Record<string, string> = {};
    allFolderQueries.forEach((q, idx) => {
      if (q.data?.data) {
        const inbox = q.data.data.find(f => f.type === 'INBOX');
        if (inbox) {
          map[allAccountIds[idx]] = inbox.id;
        }
      }
    });
    return map;
  }, [allFolderQueries, allAccountIds]);

  const centralInbox = useCentralInboxMessages({
    accountIds: allAccountIds,
    inboxFolderIds,
    filter: messageFilter,
    search: debouncedSearch,
    enabled: isCentralInbox,
  });

  // ─── Merge messages based on mode ────────────────────────────────────────

  const messages = isCentralInbox
    ? centralInbox.messages
    : messagesQuery.data?.pages.flatMap(p => p.data) ?? [];

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

  const selectedMessage = useMemo<EmailMessageListItem | null>(
    () => messages.find(m => m.id === selectedMessageId) ?? null,
    [messages, selectedMessageId]
  );
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

  // — Polling: detect new messages on auto-refresh —
  const prevTotalRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (messagesTotal === undefined) return;
    if (
      prevTotalRef.current !== undefined &&
      messagesTotal > prevTotalRef.current
    ) {
      const diff = messagesTotal - prevTotalRef.current;
      toast.info(
        `${diff} nova${diff > 1 ? 's' : ''} mensagem${diff > 1 ? 'ns' : ''} recebida${diff > 1 ? 's' : ''}`
      );
    }
    prevTotalRef.current = messagesTotal;
  }, [messagesTotal]);

  // Reset counter when folder/account changes
  useEffect(() => {
    prevTotalRef.current = undefined;
  }, [selectedFolderId, selectedAccountId]);

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

  function openReply(message: EmailMessageListItem, rfcMessageId?: string | null) {
    setComposeMode({ type: 'reply', message, rfcMessageId });
    setComposeOpen(true);
  }

  function openReplyAll(
    message: EmailMessageListItem,
    toAddresses: string[],
    ccAddresses: string[],
    rfcMessageId?: string | null
  ) {
    setComposeMode({
      type: 'replyAll',
      message,
      replyAllTo: toAddresses,
      replyAllCc: ccAddresses,
      rfcMessageId,
    });
    setComposeOpen(true);
  }

  function openForward(message: EmailMessageListItem, rfcMessageId?: string | null) {
    setComposeMode({ type: 'forward', message, rfcMessageId });
    setComposeOpen(true);
  }

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
      if (e.key === 'Delete' && !composeOpen) {
        e.preventDefault();
        handleDeleteSelected();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, composeOpen]);

  // Action bar buttons: Sync first, then Novo e-mail
  const syncActionButtons = [
    ...(selectedAccountId && !isCentralInbox
      ? [
          {
            id: 'sync',
            title: 'Sincronizar',
            icon: RefreshCw,
            variant: 'ghost' as const,
            onClick: () => syncMutation.mutate(selectedAccountId),
          },
        ]
      : []),
    ...(canSend
      ? [
          {
            id: 'compose',
            title: 'Novo e-mail',
            icon: PencilLine,
            onClick: openCompose,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Action Bar + Hero Card */}
      <div className="px-6 pt-4 pb-4 shrink-0 space-y-4">
        <PageActionBar
          breadcrumbItems={[{ label: 'E-mail', href: '/email' }]}
          buttons={syncActionButtons}
        />

        {/* Hero Card */}
        <Card className="relative overflow-hidden p-6 md:p-8 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="absolute top-0 right-0 w-56 h-56 bg-violet-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-linear-to-br from-violet-500 to-purple-600">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  E-mail
                </h1>
                <p className="text-sm text-gray-600 dark:text-white/60">
                  Gerencie suas mensagens e contas de e-mail
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 3-panel layout — fills remaining height */}
      <div className="flex flex-1 min-h-0 overflow-hidden px-6 pb-4">
        <div className="flex flex-1 rounded-lg border overflow-hidden bg-background">
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
              if (selectedAccountId) syncMutation.mutate(selectedAccountId);
            }}
            isSyncing={syncMutation.isPending}
            onCentralInbox={() => {
              setIsCentralInbox(true);
              setSelectedFolderId(null);
              setSelectedMessageId(null);
              setSelectedIds(new Set());
            }}
            onOpenNewAccount={() => setAccountWizardOpen(true)}
            onOpenManageAccounts={() => setAccountWizardOpen(true)}
            onEditAccount={(account) => setEditAccount(account)}
            unreadCounts={unreadCounts}
            accountUnreadCounts={accountUnreadCounts}
            isLoadingAccounts={accountsQuery.isLoading}
          />

          <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0">
            <ResizablePanel
              defaultSize={35}
              minSize={25}
              maxSize={50}
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
                    : selectedFolder?.displayName
                }
                hasMore={
                  isCentralInbox ? false : messagesQuery.hasNextPage
                }
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
                  bulkMarkReadMutation.mutate({ ids, isRead }, {
                    onSuccess: () => setSelectedIds(new Set()),
                  });
                }}
                onBulkArchive={ids => {
                  // Look for an archive folder by common remote names
                  const archiveFolder = folders.find(f =>
                    f.remoteName.toLowerCase().includes('archive') ||
                    f.remoteName.toLowerCase().includes('arquivo') ||
                    f.displayName.toLowerCase().includes('archive') ||
                    f.displayName.toLowerCase().includes('arquivo')
                  );
                  if (!archiveFolder) {
                    toast.error('Pasta de arquivo não encontrada');
                    return;
                  }
                  bulkMoveMutation.mutate({ ids, folderId: archiveFolder.id }, {
                    onSuccess: () => {
                      setSelectedIds(new Set());
                      toast.success('Mensagens arquivadas');
                    },
                  });
                }}
                onBulkDelete={ids => {
                  const trashFolder = folders.find(f => f.type === 'TRASH');
                  if (trashFolder) {
                    bulkMoveMutation.mutate({ ids, folderId: trashFolder.id }, {
                      onSuccess: () => {
                        setSelectedIds(new Set());
                        toast.success('Mensagens movidas para a lixeira');
                      },
                    });
                  } else {
                    bulkDeleteMutation.mutate(ids, {
                      onSuccess: () => setSelectedIds(new Set()),
                    });
                  }
                }}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={65} minSize={40}>
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

        <EmailComposeDialog
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          accounts={accounts}
          defaultAccountId={selectedAccountId ?? undefined}
          mode={composeMode}
        />
      </div>

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
          onOpenChange={(open) => { if (!open) setEditAccount(null); }}
        />
      )}
    </div>
  );
}
