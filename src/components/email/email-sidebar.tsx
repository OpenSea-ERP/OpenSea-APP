'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { EmailAccount, EmailFolder } from '@/types/email';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronDown,
  Folder,
  Layers,
  Mail,
  Plus,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  FOLDER_ICON,
  FOLDER_ORDER,
  getAvatarColor,
  getFolderDisplayName,
  getInitials,
} from './email-utils';

interface EmailSidebarProps {
  accounts: EmailAccount[];
  folders: EmailFolder[];
  selectedAccountId: string | null;
  selectedFolderId: string | null;
  isCentralInbox?: boolean;
  onAccountChange: (id: string) => void;
  onFolderChange: (id: string) => void;
  onSyncAccount: () => void;
  isSyncing: boolean;
  onCentralInbox: () => void;
  onOpenNewAccount: () => void;
  onEditAccount?: (account: EmailAccount) => void;
  /** Map of folderId -> unread count */
  unreadCounts?: Record<string, number>;
  /** Map of accountId -> total unread count (across all folders) */
  accountUnreadCounts?: Record<string, number>;
  /** Whether accounts are still loading */
  isLoadingAccounts?: boolean;
}

/** Group accounts into personal + team groups */
interface AccountGroup {
  label: string;
  teamId: string | null;
  accounts: EmailAccount[];
}

function groupAccounts(accounts: EmailAccount[]): AccountGroup[] {
  const personal: EmailAccount[] = [];
  const teamMap = new Map<string, { name: string; accounts: EmailAccount[] }>();

  for (const account of accounts) {
    if (account.teamId && account.teamName) {
      const existing = teamMap.get(account.teamId);
      if (existing) {
        existing.accounts.push(account);
      } else {
        teamMap.set(account.teamId, {
          name: account.teamName,
          accounts: [account],
        });
      }
    } else {
      personal.push(account);
    }
  }

  const groups: AccountGroup[] = [];

  if (personal.length > 0) {
    groups.push({ label: 'Contas Pessoais', teamId: null, accounts: personal });
  }

  for (const [teamId, { name, accounts: teamAccounts }] of teamMap) {
    groups.push({ label: name, teamId, accounts: teamAccounts });
  }

  return groups;
}

export function EmailSidebar({
  accounts,
  folders,
  selectedAccountId,
  selectedFolderId,
  isCentralInbox = false,
  onAccountChange,
  onFolderChange,
  onSyncAccount,
  isSyncing,
  onCentralInbox,
  onOpenNewAccount,
  onEditAccount,
  unreadCounts = {},
  accountUnreadCounts = {},
  isLoadingAccounts = false,
}: EmailSidebarProps) {
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(
    selectedAccountId
  );

  // Sync expanded state with selected account
  useEffect(() => {
    if (isCentralInbox) {
      setExpandedAccountId(null);
    } else if (selectedAccountId) {
      setExpandedAccountId(selectedAccountId);
    }
  }, [selectedAccountId, isCentralInbox]);

  const selectedAccount =
    accounts.find(a => a.id === selectedAccountId) ?? null;

  const sortedFolders = [...folders].sort((a, b) => {
    const ai = FOLDER_ORDER.indexOf(a.type);
    const bi = FOLDER_ORDER.indexOf(b.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Total unread across all accounts
  const totalUnread =
    Object.keys(accountUnreadCounts).length > 0
      ? Object.values(accountUnreadCounts).reduce(
          (sum, count) => sum + count,
          0
        )
      : Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // Group accounts by personal vs team
  const accountGroups = useMemo(() => groupAccounts(accounts), [accounts]);

  function handleAccountClick(accountId: string) {
    if (expandedAccountId === accountId) {
      setExpandedAccountId(null);
    } else {
      setExpandedAccountId(accountId);
      if (accountId !== selectedAccountId) {
        onAccountChange(accountId);
      }
    }
  }

  return (
    <div
      className="flex h-full w-full flex-col"
      data-testid="email-sidebar"
    >
      {/* Central Inbox + Add Account */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant={isCentralInbox ? 'default' : 'secondary'}
            className={cn(
              'flex-1 justify-start gap-3 rounded-xl h-10 text-sm font-medium',
              isCentralInbox && 'shadow-md'
            )}
            onClick={onCentralInbox}
            data-testid="email-central-inbox"
          >
            <Layers className="size-5 shrink-0" />
            <span className="flex-1 text-left">Caixa Central</span>
            {totalUnread > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-2 h-5.5 min-w-5.5 text-[11px] font-semibold leading-none',
                  isCentralInbox
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-primary text-primary-foreground'
                )}
                title={`${totalUnread} mensagen${totalUnread === 1 ? '' : 's'} não lida${totalUnread === 1 ? '' : 's'}`}
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            onClick={onOpenNewAccount}
            title="Adicionar conta"
            aria-label="Adicionar conta"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Accounts grouped by Personal / Teams */}
      <ScrollArea className="flex-1">
        <div className="px-3 pb-2">
          {/* Loading skeleton */}
          {isLoadingAccounts && accounts.length === 0 && (
            <div className="space-y-3 px-1 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No accounts empty state */}
          {!isLoadingAccounts && accounts.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-10 text-center">
              <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
                <Mail className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Nenhuma conta de e-mail</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure uma conta para começar
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={onOpenNewAccount}
              >
                <Plus className="size-3.5" />
                Adicionar conta
              </Button>
            </div>
          )}

          {/* Account groups */}
          {accountGroups.map(group => (
            <div key={group.teamId ?? 'personal'} className="mt-2">
              {/* Group label */}
              <div className="px-1 pt-2 pb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
              </div>

              {/* Accounts in this group */}
              <div className="space-y-0.5">
                {group.accounts.map(account => {
                  const isExpanded = expandedAccountId === account.id;
                  const isSelected =
                    selectedAccountId === account.id && !isCentralInbox;
                  const accountUnread =
                    accountUnreadCounts[account.id] ?? (isSelected ? totalUnread : 0);
                  const avatarColor = getAvatarColor(account.address);

                  return (
                    <div key={account.id}>
                      {/* Account header */}
                      <div className="group/account relative">
                        <button
                          className={cn(
                            'flex w-full min-w-0 items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition-all duration-200',
                            isSelected && !isCentralInbox
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-muted/60 text-foreground'
                          )}
                          onClick={() => handleAccountClick(account.id)}
                        >
                          {/* Avatar */}
                          <div
                            className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
                            style={{ backgroundColor: avatarColor }}
                          >
                            <span className="text-xs font-semibold leading-none">
                              {getInitials(account.displayName, account.address)}
                            </span>
                          </div>

                          {/* Name + Email */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-tight">
                              {account.displayName || account.address}
                            </p>
                            {account.displayName && (
                              <p className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                                {account.address}
                              </p>
                            )}
                          </div>

                          {/* Unread badge — hidden on group hover (replaced by settings icon) */}
                          {accountUnread > 0 && (
                            <span
                              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground h-5 min-w-5 px-1.5 text-[11px] font-semibold leading-none group-hover/account:opacity-0 transition-opacity duration-200"
                              title={`${accountUnread} mensagen${accountUnread === 1 ? '' : 's'} não lida${accountUnread === 1 ? '' : 's'}`}
                            >
                              {accountUnread > 99 ? '99+' : accountUnread}
                            </span>
                          )}

                          {/* Chevron */}
                          <ChevronDown
                            className={cn(
                              'size-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                              !isExpanded && '-rotate-90'
                            )}
                          />
                        </button>

                        {/* Settings button on hover — replaces unread badge position */}
                        {onEditAccount && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 absolute right-8 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/account:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity duration-200 rounded-lg"
                            onClick={e => {
                              e.stopPropagation();
                              onEditAccount(account);
                            }}
                            title="Configurar conta"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Collapsible folders */}
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-200',
                          isExpanded
                            ? 'max-h-[500px] opacity-100'
                            : 'max-h-0 opacity-0'
                        )}
                      >
                        <div className="ml-6 mt-1 mb-2 space-y-0.5 pl-4">
                          {sortedFolders.length === 0 ? (
                            <p className="px-3 py-2 text-[11px] text-muted-foreground">
                              Sincronizando pastas...
                            </p>
                          ) : (
                            sortedFolders.map(folder => {
                              const Icon = FOLDER_ICON[folder.type] ?? Folder;
                              const isFolderSelected =
                                selectedFolderId === folder.id && !isCentralInbox;
                              const folderUnread = unreadCounts[folder.id] ?? 0;

                              return (
                                <button
                                  key={folder.id}
                                  className={cn(
                                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-xs transition-all duration-150',
                                    isFolderSelected
                                      ? 'bg-primary/10 text-primary font-medium'
                                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                                  )}
                                  onClick={e => {
                                    e.stopPropagation();
                                    onFolderChange(folder.id);
                                  }}
                                >
                                  <Icon className="size-4 shrink-0" />
                                  <span
                                    className="truncate flex-1"
                                    title={getFolderDisplayName(folder)}
                                  >
                                    {getFolderDisplayName(folder)}
                                  </span>
                                  {folderUnread > 0 && (
                                    <span
                                      className={cn(
                                        'ml-auto inline-flex items-center justify-center rounded-full h-5 min-w-5 px-1.5 text-[10px] font-semibold leading-none',
                                        folder.type === 'INBOX'
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-muted-foreground'
                                      )}
                                    >
                                      {folderUnread > 99 ? '99+' : folderUnread}
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Sync footer */}
      <div className="border-t px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            {selectedAccount?.lastSyncAt ? (
              <p className="text-[10px] text-muted-foreground leading-tight">
                Sincronizado há{' '}
                <span className="font-medium">
                  {formatDistanceToNow(new Date(selectedAccount.lastSyncAt), {
                    locale: ptBR,
                  })}
                </span>
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Nunca sincronizado
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg"
            disabled={!selectedAccountId || isSyncing}
            onClick={onSyncAccount}
            title="Sincronizar conta"
            aria-label="Sincronizar conta"
          >
            <RefreshCw
              className={cn('size-3.5', isSyncing && 'animate-spin')}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
