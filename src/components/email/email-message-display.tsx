'use client';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useDeleteMessage,
  useEmailFolders,
  useEmailMessage,
  useMarkMessageRead,
  useMoveMessage,
  useSyncEmailAccount,
} from '@/hooks/email/use-email';
import type { EmailFolder, EmailMessageListItem } from '@/types/email';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  CornerUpLeft,
  CornerUpRight,
  Download,
  File,
  Forward,
  Image,
  Loader2,
  Mail,
  MailOpen,
  MoreHorizontal,
  Reply,
  ReplyAll,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { emailService } from '@/services/email';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

function getAvatarColor(email: string): string {
  let hash = 0;
  for (const char of email) hash = (hash << 5) - hash + char.charCodeAt(0);
  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
  ];
  return colors[Math.abs(hash) % colors.length];
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return Image;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Find archive folder: there is no ARCHIVE type in EmailFolderType.
 * Fall back to checking remoteName/displayName for common patterns.
 */
function findArchiveFolder(folders: EmailFolder[]): EmailFolder | undefined {
  const archivePatterns = [
    'archive',
    'all mail',
    '[gmail]/all mail',
    'archivados',
    'arquiv',
  ];
  return folders.find(f => {
    const remoteLower = f.remoteName.toLowerCase();
    const displayLower = f.displayName.toLowerCase();
    return archivePatterns.some(
      pattern => remoteLower.includes(pattern) || displayLower.includes(pattern)
    );
  });
}

interface EmailMessageDisplayProps {
  selectedMessage: EmailMessageListItem | null;
  folders: EmailFolder[];
  currentFolderId?: string | null;
  onReply?: (
    message: EmailMessageListItem,
    rfcMessageId?: string | null
  ) => void;
  onReplyAll?: (
    message: EmailMessageListItem,
    toAddresses: string[],
    ccAddresses: string[],
    rfcMessageId?: string | null
  ) => void;
  onForward?: (
    message: EmailMessageListItem,
    rfcMessageId?: string | null
  ) => void;
  onDeleteMessage?: (id: string) => void;
  /** The accountId for the selected message (needed when folders come from a different account in Central Inbox) */
  accountId?: string | null;
}

export function EmailMessageDisplay({
  selectedMessage,
  folders: propFolders,
  currentFolderId,
  onReply,
  onReplyAll,
  onForward,
  onDeleteMessage,
  accountId,
}: EmailMessageDisplayProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<
    string | null
  >(null);
  const [showAllRecipients, setShowAllRecipients] = useState(false);

  // When in Central Inbox, propFolders is empty. Fetch folders for the message's account.
  const messageAccountId = selectedMessage?.accountId ?? accountId ?? null;
  const needsFolders = propFolders.length === 0 && Boolean(messageAccountId);
  const accountFoldersQuery = useEmailFolders(
    needsFolders ? messageAccountId : null
  );
  const folders =
    propFolders.length > 0
      ? propFolders
      : (accountFoldersQuery.data?.data ?? []);

  async function handleDownloadAttachment(
    messageId: string,
    attachmentId: string
  ) {
    try {
      setDownloadingAttachmentId(attachmentId);
      const { url, filename } = await emailService.getAttachmentDownloadUrl(
        messageId,
        attachmentId
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error('Erro ao baixar anexo');
    } finally {
      setDownloadingAttachmentId(null);
    }
  }

  // Hooks-based queries/mutations
  const messageQuery = useEmailMessage(selectedMessage?.id ?? null);
  const markReadMutation = useMarkMessageRead();
  const moveMutation = useMoveMessage();
  const permanentDeleteMutation = useDeleteMessage();
  const syncMutation = useSyncEmailAccount();

  // Auto-mark-as-read after 300ms
  useEffect(() => {
    if (selectedMessage && !selectedMessage.isRead) {
      const timer = setTimeout(() => {
        markReadMutation.mutate({ id: selectedMessage.id, isRead: true });
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMessage?.id]);

  // Reset expanded recipients on message change
  useEffect(() => {
    setShowAllRecipients(false);
  }, [selectedMessage?.id]);

  const handleToggleRead = useCallback(() => {
    if (!selectedMessage) return;
    markReadMutation.mutate({
      id: selectedMessage.id,
      isRead: !selectedMessage.isRead,
    });
  }, [selectedMessage, markReadMutation]);

  // Folder detection by type
  const archiveFolder = findArchiveFolder(folders);
  const inboxFolder = folders.find(f => f.type === 'INBOX');
  const trashFolder = folders.find(f => f.type === 'TRASH');
  const spamFolder = folders.find(f => f.type === 'SPAM');
  const isInArchive = currentFolderId
    ? currentFolderId === archiveFolder?.id
    : false;
  const isInTrash = currentFolderId
    ? currentFolderId === trashFolder?.id
    : false;

  function handleArchiveToggle() {
    if (!selectedMessage) return;

    if (isInArchive && inboxFolder) {
      moveMutation.mutate(
        { id: selectedMessage.id, folderId: inboxFolder.id },
        {
          onSuccess: () => {
            toast.success('Mensagem desarquivada');
            if (messageAccountId) syncMutation.mutate(messageAccountId);
          },
        }
      );
    } else if (archiveFolder) {
      moveMutation.mutate(
        { id: selectedMessage.id, folderId: archiveFolder.id },
        {
          onSuccess: () => {
            toast.success('Mensagem arquivada');
            if (messageAccountId) syncMutation.mutate(messageAccountId);
          },
        }
      );
    } else {
      toast.error('Pasta de arquivo n\u00e3o encontrada');
    }
  }

  function handleSpam() {
    if (!selectedMessage) return;
    if (!spamFolder) {
      toast.error('Pasta de spam n\u00e3o encontrada');
      return;
    }
    moveMutation.mutate(
      { id: selectedMessage.id, folderId: spamFolder.id },
      {
        onSuccess: () => {
          toast.success('Mensagem movida para spam');
          if (messageAccountId) syncMutation.mutate(messageAccountId);
        },
      }
    );
  }

  function handleDelete() {
    if (!selectedMessage) return;

    if (isInTrash) {
      setDeleteConfirmOpen(true);
    } else if (trashFolder) {
      moveMutation.mutate(
        { id: selectedMessage.id, folderId: trashFolder.id },
        {
          onSuccess: () => {
            toast.success('Mensagem movida para a lixeira');
            onDeleteMessage?.(selectedMessage.id);
            if (messageAccountId) syncMutation.mutate(messageAccountId);
          },
        }
      );
    } else {
      setDeleteConfirmOpen(true);
    }
  }

  function handleConfirmPermanentDelete() {
    if (!selectedMessage) return;
    permanentDeleteMutation.mutate(selectedMessage.id, {
      onSuccess: () => {
        onDeleteMessage?.(selectedMessage.id);
        if (messageAccountId) syncMutation.mutate(messageAccountId);
      },
    });
  }

  if (!selectedMessage) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Mail className="size-7 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium">Selecione uma mensagem</p>
          <p className="text-xs text-muted-foreground mt-1">
            Escolha uma mensagem para visualizar
          </p>
        </div>
      </div>
    );
  }

  const detail = messageQuery.data?.message;
  const initials = getInitials(
    selectedMessage.fromName,
    selectedMessage.fromAddress
  );
  const avatarColor = getAvatarColor(selectedMessage.fromAddress);

  // Recipient display logic
  const allTo = detail?.toAddresses ?? [];
  const allCc = detail?.ccAddresses ?? [];
  const totalRecipients = allTo.length + allCc.length;
  const shouldCollapseRecipients = totalRecipients > 3;

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <div className="flex h-full flex-col">
          {/* Action toolbar */}
          <div className="flex items-center gap-0.5 border-b px-4 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-md"
                  onClick={() => onReply?.(selectedMessage, detail?.messageId)}
                >
                  <Reply className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Responder</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-md"
                  onClick={() => {
                    if (detail) {
                      onReplyAll?.(
                        selectedMessage,
                        detail.toAddresses ?? [],
                        detail.ccAddresses ?? [],
                        detail.messageId
                      );
                    } else {
                      onReplyAll?.(selectedMessage, [], [], null);
                    }
                  }}
                >
                  <ReplyAll className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Responder a todos</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-md"
                  onClick={() =>
                    onForward?.(selectedMessage, detail?.messageId)
                  }
                >
                  <Forward className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Encaminhar</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-md"
                  onClick={handleArchiveToggle}
                  disabled={moveMutation.isPending}
                >
                  {isInArchive ? (
                    <ArchiveRestore className="size-4" />
                  ) : (
                    <Archive className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isInArchive ? 'Desarquivar' : 'Arquivar'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-md"
                  onClick={handleSpam}
                  disabled={moveMutation.isPending}
                >
                  <AlertTriangle className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mover para spam</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-md"
                  disabled={
                    moveMutation.isPending || permanentDeleteMutation.isPending
                  }
                  onClick={handleDelete}
                >
                  <Trash2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isInTrash ? 'Excluir permanentemente' : 'Excluir'}
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-md"
                  onClick={handleToggleRead}
                >
                  {selectedMessage.isRead ? (
                    <Mail className="size-4" />
                  ) : (
                    <MailOpen className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {selectedMessage.isRead
                  ? 'Marcar como n\u00e3o lida'
                  : 'Marcar como lida'}
              </TooltipContent>
            </Tooltip>

            <div className="flex-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-md"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onReply?.(selectedMessage, detail?.messageId)}
                  className="gap-2 text-xs"
                >
                  <Reply className="size-3.5" />
                  Responder
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onForward?.(selectedMessage, detail?.messageId)
                  }
                  className="gap-2 text-xs"
                >
                  <Forward className="size-3.5" />
                  Encaminhar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleToggleRead}
                  className="gap-2 text-xs"
                >
                  {selectedMessage.isRead ? (
                    <>
                      <Mail className="size-3.5" />
                      Marcar como n\u00e3o lida
                    </>
                  ) : (
                    <>
                      <MailOpen className="size-3.5" />
                      Marcar como lida
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Email header */}
          <div className="px-6 pt-5 pb-4">
            <h2 className="text-lg font-semibold leading-tight">
              {selectedMessage.subject || '(sem assunto)'}
            </h2>

            <div className="mt-4 flex items-start gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback
                  className="text-sm font-medium text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                {messageQuery.isLoading ? (
                  <div className="space-y-1.5 pt-0.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">
                        {selectedMessage.fromName ||
                          selectedMessage.fromAddress}
                      </span>
                      {selectedMessage.fromName && (
                        <span className="text-xs text-muted-foreground">
                          &lt;{selectedMessage.fromAddress}&gt;
                        </span>
                      )}
                    </div>

                    {/* Recipients */}
                    {detail && (
                      <div className="mt-0.5">
                        {shouldCollapseRecipients && !showAllRecipients ? (
                          <p className="text-xs text-muted-foreground">
                            Para: {allTo.slice(0, 2).join(', ')}
                            {totalRecipients > 2 && (
                              <button
                                className="ml-1 text-primary hover:underline"
                                onClick={() => setShowAllRecipients(true)}
                              >
                                +{totalRecipients - 2} mais
                              </button>
                            )}
                          </p>
                        ) : (
                          <>
                            <p className="text-xs text-muted-foreground">
                              Para:{' '}
                              {allTo.join(', ') || 'destinat\u00e1rio oculto'}
                            </p>
                            {allCc.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Cc: {allCc.join(', ')}
                              </p>
                            )}
                            {shouldCollapseRecipients && (
                              <button
                                className="text-xs text-primary hover:underline mt-0.5"
                                onClick={() => setShowAllRecipients(false)}
                              >
                                Recolher
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-1">
                      {format(
                        new Date(selectedMessage.receivedAt),
                        "d 'de' MMMM 'de' yyyy, HH:mm",
                        { locale: ptBR }
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            {messageQuery.isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            )}

            {!messageQuery.isLoading &&
              (detail?.bodyHtmlSanitized || detail?.bodyText) && (
                <div className="max-w-3xl">
                  {detail.bodyHtmlSanitized ? (
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert text-foreground/80 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: detail.bodyHtmlSanitized,
                      }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground/80">
                      {detail.bodyText}
                    </pre>
                  )}
                </div>
              )}

            {!messageQuery.isLoading &&
              !detail?.bodyHtmlSanitized &&
              !detail?.bodyText && (
                <p className="text-sm text-muted-foreground italic">
                  Sem conte\u00fado dispon\u00edvel.
                </p>
              )}

            {/* Attachments */}
            {detail?.attachments && detail.attachments.length > 0 && (
              <div className="mt-6 space-y-3">
                <Separator />
                <p className="text-sm font-medium pt-1">
                  Anexos ({detail.attachments.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detail.attachments.map(att => {
                    const FileIcon = getFileIcon(att.contentType);
                    const isDownloading = downloadingAttachmentId === att.id;

                    return (
                      <button
                        key={att.id}
                        className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors duration-150 group"
                        onClick={() =>
                          handleDownloadAttachment(detail.id, att.id)
                        }
                        disabled={isDownloading}
                        title={`Baixar ${att.filename}`}
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                          <FileIcon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">
                            {att.filename}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatFileSize(att.size)}
                          </p>
                        </div>
                        {isDownloading ? (
                          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                        ) : (
                          <Download className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick reply footer */}
          <Separator />
          <div className="px-4 py-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-lg"
              onClick={() => onReply?.(selectedMessage, detail?.messageId)}
            >
              <CornerUpLeft className="size-3.5" />
              Responder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-lg"
              onClick={() => onForward?.(selectedMessage, detail?.messageId)}
            >
              <CornerUpRight className="size-3.5" />
              Encaminhar
            </Button>
          </div>
        </div>
      </TooltipProvider>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir mensagem permanentemente"
        description="Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita. A mensagem ser\u00e1 exclu\u00edda permanentemente."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmPermanentDelete}
        variant="destructive"
        icon={<Trash2 className="size-5" />}
      />
    </>
  );
}
