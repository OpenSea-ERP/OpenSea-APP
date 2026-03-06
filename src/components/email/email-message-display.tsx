'use client';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { emailService } from '@/services/email';
import type { EmailFolder, EmailMessageListItem } from '@/types/email';
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Download,
  FileSpreadsheet,
  FileText,
  Forward,
  Image,
  Loader2,
  Mail,
  MailOpen,
  MoreHorizontal,
  Paperclip,
  Reply,
  ReplyAll,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmailHtmlBody } from './email-html-body';
import {
  formatEmailDateFull,
  formatFileSize,
  getAvatarColor,
  getInitials,
} from './email-utils';

function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return Image;
  if (
    contentType.includes('spreadsheet') ||
    contentType.includes('excel') ||
    contentType.includes('csv')
  )
    return FileSpreadsheet;
  return FileText;
}

function getFileIconColor(contentType: string): string {
  if (contentType.startsWith('image/')) return '#8b5cf6'; // violet
  if (contentType.includes('pdf')) return '#ef4444'; // red
  if (
    contentType.includes('spreadsheet') ||
    contentType.includes('excel') ||
    contentType.includes('csv')
  )
    return '#10b981'; // emerald
  if (
    contentType.includes('word') ||
    contentType.includes('document') ||
    contentType.includes('text/')
  )
    return '#3b82f6'; // blue
  return '#6b7280'; // gray
}

function stripGlobalEmailStyles(html: string): string {
  return html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*?>/gi, '')
    .replace(/<meta[^>]*?>/gi, '')
    .replace(/<\/?(?:html|head|body)[^>]*?>/gi, '');
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
    rfcMessageId?: string | null,
    quotedBody?: string | null
  ) => void;
  onReplyAll?: (
    message: EmailMessageListItem,
    toAddresses: string[],
    ccAddresses: string[],
    rfcMessageId?: string | null,
    quotedBody?: string | null
  ) => void;
  onForward?: (
    message: EmailMessageListItem,
    rfcMessageId?: string | null,
    quotedBody?: string | null
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
      const { blob, filename } = await emailService.downloadAttachment(
        messageId,
        attachmentId
      );
      // Create a temporary Object URL and trigger download
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Free memory
      URL.revokeObjectURL(objectUrl);
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
      toast.error('Pasta de arquivo não encontrada');
    }
  }

  function handleSpam() {
    if (!selectedMessage) return;
    if (!spamFolder) {
      toast.error('Pasta de spam não encontrada');
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

  const detail = messageQuery.data?.message;
  const safeBodyHtml = useMemo(() => {
    if (!detail?.bodyHtmlSanitized) return null;
    return stripGlobalEmailStyles(detail.bodyHtmlSanitized);
  }, [detail?.bodyHtmlSanitized]);

  if (!selectedMessage) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-6">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Mail className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Selecione uma mensagem</p>
          <p className="text-xs text-muted-foreground mt-1.5">
            Escolha uma mensagem para visualizar
          </p>
        </div>
      </div>
    );
  }
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
        <div
          className="flex h-full flex-col"
          data-testid="email-message-display"
        >
          {/* Action toolbar */}
          <div className="flex items-center gap-1.5 border-b px-5 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg"
                  onClick={() =>
                    onReply?.(
                      selectedMessage,
                      detail?.messageId,
                      detail?.bodyHtmlSanitized
                    )
                  }
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
                  className="size-9 rounded-lg"
                  onClick={() => {
                    if (detail) {
                      onReplyAll?.(
                        selectedMessage,
                        detail.toAddresses ?? [],
                        detail.ccAddresses ?? [],
                        detail.messageId,
                        detail.bodyHtmlSanitized
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
                  className="size-9 rounded-lg"
                  onClick={() =>
                    onForward?.(
                      selectedMessage,
                      detail?.messageId,
                      detail?.bodyHtmlSanitized
                    )
                  }
                >
                  <Forward className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Encaminhar</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 mx-1.5" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg"
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
                  className="size-9 rounded-lg"
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
                  className="size-9 rounded-lg"
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

            <Separator orientation="vertical" className="h-5 mx-1.5" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg"
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
                  ? 'Marcar como não lida'
                  : 'Marcar como lida'}
              </TooltipContent>
            </Tooltip>

            <div className="flex-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg"
                  aria-label="Mais opções"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    onReply?.(
                      selectedMessage,
                      detail?.messageId,
                      detail?.bodyHtmlSanitized
                    )
                  }
                  className="gap-2 text-xs"
                >
                  <Reply className="size-3.5" />
                  Responder
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onForward?.(
                      selectedMessage,
                      detail?.messageId,
                      detail?.bodyHtmlSanitized
                    )
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
                      Marcar como não lida
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
          <div className="px-6 pt-6 pb-5">
            <h2 className="text-lg font-semibold leading-tight">
              {selectedMessage.subject || '(sem assunto)'}
            </h2>

            <div className="mt-5 flex items-start gap-4">
              <Avatar className="size-12 shrink-0">
                <AvatarFallback
                  className="text-sm font-semibold text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                {messageQuery.isLoading ? (
                  <div className="space-y-2 pt-0.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3.5 w-64" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-semibold">
                        {selectedMessage.fromName ||
                          selectedMessage.fromAddress}
                      </span>
                      {selectedMessage.fromName && (
                        <span className="text-sm text-muted-foreground">
                          &lt;{selectedMessage.fromAddress}&gt;
                        </span>
                      )}
                    </div>

                    {/* Recipients */}
                    {detail && (
                      <div className="mt-1.5">
                        {shouldCollapseRecipients && !showAllRecipients ? (
                          <p className="text-xs text-muted-foreground">
                            Para: {allTo.slice(0, 2).join(', ')}
                            {totalRecipients > 2 && (
                              <Button
                                variant="link"
                                size="sm"
                                className="ml-1 h-auto p-0 text-xs"
                                onClick={() => setShowAllRecipients(true)}
                              >
                                +{totalRecipients - 2} mais
                              </Button>
                            )}
                          </p>
                        ) : (
                          <>
                            <p className="text-xs text-muted-foreground">
                              Para: {allTo.join(', ') || 'destinatário oculto'}
                            </p>
                            {allCc.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Cc: {allCc.join(', ')}
                              </p>
                            )}
                            {shouldCollapseRecipients && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs mt-0.5"
                                onClick={() => setShowAllRecipients(false)}
                              >
                                Recolher
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {formatEmailDateFull(selectedMessage.receivedAt)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Attachments bar (Outlook-style) */}
          {detail?.attachments && detail.attachments.length > 0 && (
            <>
              <div className="px-6 py-3 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {detail.attachments.length}{' '}
                    {detail.attachments.length === 1 ? 'anexo' : 'anexos'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {detail.attachments.map(att => {
                    const FileIcon = getFileIcon(att.contentType);
                    const iconColor = getFileIconColor(att.contentType);
                    const isDownloading = downloadingAttachmentId === att.id;

                    return (
                      <button
                        key={att.id}
                        className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-left hover:bg-muted/40 hover:shadow-sm transition-all duration-150 group"
                        onClick={() =>
                          handleDownloadAttachment(detail.id, att.id)
                        }
                        disabled={isDownloading}
                        title={`Baixar ${att.filename} (${formatFileSize(att.size)})`}
                      >
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded"
                          style={{ backgroundColor: `${iconColor}15` }}
                        >
                          <FileIcon
                            className="size-4"
                            style={{ color: iconColor }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate max-w-40">
                            {att.filename}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatFileSize(att.size)}
                          </p>
                        </div>
                        {isDownloading ? (
                          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                        ) : (
                          <Download className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
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

            {!messageQuery.isLoading && (safeBodyHtml || detail?.bodyText) && (
              <div className="max-w-3xl">
                {safeBodyHtml ? (
                  <EmailHtmlBody
                    html={safeBodyHtml}
                    messageId={selectedMessage.id}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground/80">
                    {detail?.bodyText ?? ''}
                  </pre>
                )}
              </div>
            )}

            {!messageQuery.isLoading && !safeBodyHtml && !detail?.bodyText && (
              <p className="text-sm text-muted-foreground italic">
                Sem conteúdo disponível.
              </p>
            )}
          </div>
        </div>
      </TooltipProvider>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir mensagem permanentemente"
        description="Esta ação não pode ser desfeita. A mensagem será excluída permanentemente."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmPermanentDelete}
        variant="destructive"
        icon={<Trash2 className="size-5" />}
      />
    </>
  );
}
