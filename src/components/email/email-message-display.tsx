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
  AlertOctagon,
  Archive,
  ArchiveRestore,
  CornerUpLeft,
  CornerUpRight,
  Download,
  Forward,
  Mail,
  MailOpen,
  Reply,
  ReplyAll,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { emailService } from '@/services/email';

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

/**
 * Find archive folder: there is no ARCHIVE type in EmailFolderType.
 * Fall back to checking remoteName/displayName for common patterns.
 */
function findArchiveFolder(folders: EmailFolder[]): EmailFolder | undefined {
  // First check for CUSTOM folders with archive-like names
  const archivePatterns = ['archive', 'all mail', '[gmail]/all mail', 'archivados', 'arquiv'];
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
  onReply?: (message: EmailMessageListItem, rfcMessageId?: string | null) => void;
  onReplyAll?: (
    message: EmailMessageListItem,
    toAddresses: string[],
    ccAddresses: string[],
    rfcMessageId?: string | null
  ) => void;
  onForward?: (message: EmailMessageListItem, rfcMessageId?: string | null) => void;
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

  // When in Central Inbox, propFolders is empty. Fetch folders for the message's account.
  const messageAccountId = selectedMessage?.accountId ?? accountId ?? null;
  const needsFolders = propFolders.length === 0 && Boolean(messageAccountId);
  const accountFoldersQuery = useEmailFolders(needsFolders ? messageAccountId : null);
  const folders = propFolders.length > 0 ? propFolders : (accountFoldersQuery.data?.data ?? []);

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

  // ─── Hooks-based queries/mutations ─────────────────────────────────────

  const messageQuery = useEmailMessage(selectedMessage?.id ?? null);
  const markReadMutation = useMarkMessageRead();
  const moveMutation = useMoveMessage();
  const permanentDeleteMutation = useDeleteMessage();
  const syncMutation = useSyncEmailAccount();

  // Auto-mark-as-read after 1s
  useEffect(() => {
    if (selectedMessage && !selectedMessage.isRead) {
      const timer = setTimeout(() => {
        markReadMutation.mutate({ id: selectedMessage.id, isRead: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMessage?.id]);

  const handleToggleRead = useCallback(() => {
    if (!selectedMessage) return;
    markReadMutation.mutate({
      id: selectedMessage.id,
      isRead: !selectedMessage.isRead,
    });
  }, [selectedMessage, markReadMutation]);

  // ─── Folder detection by type ──────────────────────────────────────────

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
      // Unarchive -> move back to inbox
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
      // Already in trash — show confirm for permanent deletion
      setDeleteConfirmOpen(true);
    } else if (trashFolder) {
      // Not in trash — move to trash (reversible, no confirmation needed)
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
      // No trash folder found — permanent delete with confirm
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
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Mail className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Nenhuma mensagem selecionada</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Clique em uma mensagem para visualizar
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

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <div className="flex h-full flex-col">
          {/* Toolbar */}
          <div className="flex items-center gap-1 border-b px-4 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
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
                  className="size-8"
                  onClick={handleSpam}
                  disabled={moveMutation.isPending}
                >
                  <AlertOctagon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mover para spam</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
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

            <Separator orientation="vertical" className="h-5 mx-1" />

            <div className="flex-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
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
                  className="size-8"
                  onClick={() => {
                    if (detail) {
                      onReplyAll?.(
                        selectedMessage,
                        detail.toAddresses ?? [],
                        detail.ccAddresses ?? [],
                        detail.messageId
                      );
                    } else {
                      // detail not loaded yet — reply with just fromAddress, no RFC Message-ID
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
                  className="size-8"
                  onClick={() => onForward?.(selectedMessage, detail?.messageId)}
                >
                  <Forward className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Encaminhar</TooltipContent>
            </Tooltip>
          </div>

          {/* Email header */}
          <div className="px-6 pt-4 pb-3">
            <h2 className="text-lg font-semibold leading-tight">
              {selectedMessage.subject || '(sem assunto)'}
            </h2>

            <div className="mt-3 flex items-start gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {selectedMessage.fromName ||
                          selectedMessage.fromAddress}
                      </span>
                      {selectedMessage.fromName && (
                        <span className="text-xs text-muted-foreground">
                          &lt;{selectedMessage.fromAddress}&gt;
                        </span>
                      )}
                    </div>
                    {detail && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Para:{' '}
                        {detail.toAddresses.join(', ') || 'destinatário oculto'}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(
                        new Date(selectedMessage.receivedAt),
                        "d 'de' MMMM 'de' yyyy 'às' HH:mm",
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

            {!messageQuery.isLoading && (detail?.bodyHtmlSanitized || detail?.bodyText) && (
              <div className="rounded-lg border bg-white/5 p-4 mb-4">
                {detail.bodyHtmlSanitized ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert text-slate-500 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: detail.bodyHtmlSanitized }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-slate-500">
                    {detail.bodyText}
                  </pre>
                )}
              </div>
            )}

            {!messageQuery.isLoading && !detail?.bodyHtmlSanitized && !detail?.bodyText && (
              <p className="text-sm text-muted-foreground italic">
                Sem conteúdo disponível.
              </p>
            )}

            {/* Attachments */}
            {detail?.attachments && detail.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                <Separator />
                <p className="text-sm font-medium pt-2">
                  Anexos ({detail.attachments.length})
                </p>
                <div className="flex flex-wrap gap-2 pb-2">
                  {detail.attachments.map(att => (
                    <button
                      key={att.id}
                      className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-xs hover:bg-muted transition-colors group"
                      onClick={() =>
                        handleDownloadAttachment(detail.id, att.id)
                      }
                      disabled={downloadingAttachmentId === att.id}
                      title={`Baixar ${att.filename}`}
                    >
                      <span className="font-medium truncate max-w-[140px]">
                        {att.filename}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {Math.round(att.size / 1024)} KB
                      </span>
                      <Download className="size-3 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick reply footer */}
          <Separator />
          <div className="px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onReply?.(selectedMessage, detail?.messageId)}
            >
              <CornerUpLeft className="size-3.5" />
              Responder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 ml-2"
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
