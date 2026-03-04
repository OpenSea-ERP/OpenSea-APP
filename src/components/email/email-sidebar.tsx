'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { EmailAccount, EmailFolder, EmailFolderType } from '@/types/email';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertOctagon,
  ChevronDown,
  ChevronRight,
  FileEdit,
  FolderOpen,
  Inbox,
  Layers,
  PlusCircle,
  RefreshCcw,
  Send,
  Settings,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const FOLDER_ICON: Record<EmailFolderType, React.ElementType> = {
  INBOX: Inbox,
  SENT: Send,
  DRAFTS: FileEdit,
  TRASH: Trash2,
  SPAM: AlertOctagon,
  CUSTOM: FolderOpen,
};

const FOLDER_ORDER: EmailFolderType[] = [
  'INBOX',
  'SENT',
  'DRAFTS',
  'SPAM',
  'TRASH',
  'CUSTOM',
];

/** Map IMAP/English folder names to Portuguese */
const FOLDER_PT_NAMES: Record<string, string> = {
  inbox: 'Caixa de entrada',
  sent: 'Enviados',
  'sent mail': 'Enviados',
  'sent items': 'Enviados',
  drafts: 'Rascunhos',
  draft: 'Rascunhos',
  trash: 'Lixeira',
  'deleted items': 'Lixeira',
  deleted: 'Lixeira',
  spam: 'Spam',
  junk: 'Spam',
  'junk e-mail': 'Spam',
  archive: 'Arquivo',
  archives: 'Arquivo',
  all: 'Todos',
  'all mail': 'Todos',
  starred: 'Com estrela',
  flagged: 'Com estrela',
  important: 'Importantes',
};

function getFolderDisplayName(folder: EmailFolder): string {
  const lower = folder.displayName.toLowerCase().trim();
  if (FOLDER_PT_NAMES[lower]) return FOLDER_PT_NAMES[lower];

  const remoteLower = folder.remoteName.toLowerCase().trim();
  if (FOLDER_PT_NAMES[remoteLower]) return FOLDER_PT_NAMES[remoteLower];

  // Try partial matches
  for (const [key, label] of Object.entries(FOLDER_PT_NAMES)) {
    if (lower.includes(key) || remoteLower.includes(key)) return label;
  }

  return folder.displayName;
}

function getInitials(name: string | null, address: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return address.substring(0, 2).toUpperCase();
}

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
  onOpenManageAccounts: () => void;
  onEditAccount?: (account: EmailAccount) => void;
  /** Map of folderId → unread count */
  unreadCounts?: Record<string, number>;
  /** Map of accountId → total unread count (across all folders) */
  accountUnreadCounts?: Record<string, number>;
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
  onOpenManageAccounts,
  onEditAccount,
  unreadCounts = {},
  accountUnreadCounts = {},
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

  // Total unread across all accounts (prefer accountUnreadCounts if available)
  const totalUnread = Object.keys(accountUnreadCounts).length > 0
    ? Object.values(accountUnreadCounts).reduce((sum, count) => sum + count, 0)
    : Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

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
    <div className="flex h-full w-[220px] shrink-0 flex-col border-r bg-muted/40">
      {/* Central inbox button */}
      <div className="p-3">
        <Button
          className={cn('w-full gap-2', isCentralInbox && 'bg-primary/90')}
          variant={isCentralInbox ? 'default' : 'outline'}
          size="sm"
          onClick={onCentralInbox}
        >
          <Layers className="size-3.5" />
          Caixa Central
          {totalUnread > 0 && (
            <span className={cn(
              'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none min-w-[18px] ml-auto',
              isCentralInbox
                ? 'bg-primary-foreground text-primary'
                : 'bg-primary text-primary-foreground'
            )}>
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </Button>
      </div>

      <Separator />

      {/* Accounts with collapsible folders */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contas
          </p>
          <div className="space-y-0.5">
            {accounts.map(account => {
              const isExpanded = expandedAccountId === account.id;
              const isSelected =
                selectedAccountId === account.id && !isCentralInbox;
              // Use per-account unread counts; fall back to totalUnread for selected account
              const accountUnread =
                accountUnreadCounts[account.id] ?? (isSelected ? totalUnread : 0);

              return (
                <div key={account.id} className="group/account">
                  {/* Account button */}
                  <div className="flex items-center gap-0.5">
                    <button
                      className={cn(
                        'flex flex-1 min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                        isSelected
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                      )}
                      onClick={() => handleAccountClick(account.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                      )}
                      <Avatar className="size-5 shrink-0">
                        <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                          {getInitials(account.displayName, account.address)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium leading-tight">
                          {account.displayName || account.address}
                        </p>
                        {account.displayName && (
                          <p className="truncate text-[10px] text-muted-foreground leading-tight">
                            {account.address}
                          </p>
                        )}
                      </div>
                      {accountUnread > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground h-5 min-w-5 px-1.5 text-[10px] font-medium leading-none">
                          {accountUnread > 99 ? '99+' : accountUnread}
                        </span>
                      )}
                    </button>
                    {onEditAccount && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover/account:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAccount(account);
                        }}
                        title="Editar conta"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Collapsible folders */}
                  {isExpanded && isSelected && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-2">
                      {sortedFolders.length === 0 ? (
                        <p className="px-2 py-1 text-[10px] text-muted-foreground">
                          Sincronizando pastas...
                        </p>
                      ) : (
                        sortedFolders.map(folder => {
                          const Icon = FOLDER_ICON[folder.type] ?? FolderOpen;
                          const isFolderSelected =
                            selectedFolderId === folder.id && !isCentralInbox;
                          const folderUnread = unreadCounts[folder.id] ?? 0;

                          return (
                            <button
                              key={folder.id}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors',
                                isFolderSelected
                                  ? 'bg-accent text-accent-foreground font-medium'
                                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                              )}
                              onClick={e => {
                                e.stopPropagation();
                                onFolderChange(folder.id);
                              }}
                            >
                              <Icon className="size-3.5 shrink-0" />
                              <span className="truncate flex-1">
                                {getFolderDisplayName(folder)}
                              </span>
                              {folderUnread > 0 && (
                                <span
                                  className={cn(
                                    'ml-auto inline-flex items-center justify-center rounded-full h-5 min-w-5 px-1.5 text-xs font-medium leading-none',
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="min-w-0 flex-1">
          {selectedAccount?.lastSyncAt ? (
            <div className="leading-tight">
              <p className="text-[10px] text-muted-foreground">
                Sincronizado há:
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">
                {formatDistanceToNow(new Date(selectedAccount.lastSyncAt), {
                  locale: ptBR,
                })}
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              Nunca sincronizado
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={!selectedAccountId || isSyncing}
            onClick={onSyncAccount}
            title="Sincronizar conta"
          >
            <RefreshCcw
              className={cn('size-3.5', isSyncing && 'animate-spin')}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                title="Configurações de e-mail"
              >
                <Settings className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-48">
              <DropdownMenuItem
                onClick={onOpenNewAccount}
                className="gap-2 text-xs"
              >
                <PlusCircle className="size-3.5" />
                Configurar nova conta
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onOpenManageAccounts}
                className="gap-2 text-xs"
              >
                <Settings2 className="size-3.5" />
                Gerenciar contas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
