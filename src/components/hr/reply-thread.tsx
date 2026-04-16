/**
 * ReplyThread
 *
 * Lista respostas de um kudos com:
 * - Avatares + nome + texto + timestamp
 * - Edicao inline para o autor
 * - Exclusao protegida por VerifyActionPinModal (autor ou admin)
 * - Input "Responder..." no fim do thread (Enter envia, Shift+Enter quebra)
 */

'use client';

import { Button } from '@/components/ui/button';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { UserAvatar } from '@/components/shared/user-avatar';
import {
  useCreateKudosReply,
  useDeleteKudosReply,
  useKudosReplies,
  useUpdateKudosReply,
} from '@/hooks/hr/use-kudos';
import { translateError } from '@/lib/error-messages';
import { cn } from '@/lib/utils';
import type { KudosReply } from '@/types/hr';
import { Loader2, Pencil, Send, Trash2 } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { toast } from 'sonner';

// ============================================================================
// COMPONENT
// ============================================================================

interface ReplyThreadProps {
  kudosId: string;
  /** Identifier of the currently logged employee (for author scoping). */
  currentEmployeeId?: string;
  /** When true, user can delete any reply (hr.kudos.admin). Authors can always delete their own. */
  canAdminReplies?: boolean;
}

export function ReplyThread({
  kudosId,
  currentEmployeeId,
  canAdminReplies = false,
}: ReplyThreadProps) {
  const { data, isLoading, isError, refetch } = useKudosReplies(kudosId);
  const createReply = useCreateKudosReply();
  const updateReply = useUpdateKudosReply();
  const deleteReply = useDeleteKudosReply();

  const [draft, setDraft] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const replies = data?.replies ?? [];

  const handleSendReply = async () => {
    const content = draft.trim();
    if (!content) return;

    try {
      await createReply.mutateAsync({ kudosId, content });
      setDraft('');
    } catch (err) {
      toast.error(
        translateError(err instanceof Error ? err.message : String(err))
      );
    }
  };

  const handleStartEdit = (reply: KudosReply) => {
    setEditingReplyId(reply.id);
    setEditDraft(reply.content);
  };

  const handleCancelEdit = () => {
    setEditingReplyId(null);
    setEditDraft('');
  };

  const handleSubmitEdit = async (replyId: string) => {
    const content = editDraft.trim();
    if (!content) return;

    try {
      await updateReply.mutateAsync({ replyId, kudosId, content });
      setEditingReplyId(null);
      setEditDraft('');
      toast.success('Resposta atualizada');
    } catch (err) {
      toast.error(
        translateError(err instanceof Error ? err.message : String(err))
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteReply.mutateAsync({
        replyId: pendingDeleteId,
        kudosId,
      });
      toast.success('Resposta removida');
    } catch (err) {
      toast.error(
        translateError(err instanceof Error ? err.message : String(err))
      );
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendReply();
    }
  };

  const handleEditKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
    replyId: string
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmitEdit(replyId);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelEdit();
    }
  };

  return (
    <div className="space-y-3" data-testid={`kudos-thread-${kudosId}`}>
      {/* List of replies */}
      {isLoading ? (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/8 dark:text-rose-300">
          Erro ao carregar respostas.{' '}
          <button
            type="button"
            onClick={() => refetch()}
            className="underline underline-offset-2"
          >
            Tentar novamente
          </button>
        </div>
      ) : replies.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Seja o primeiro a responder.
        </p>
      ) : (
        <ul className="space-y-3">
          {replies.map(reply => {
            const isAuthor =
              !!currentEmployeeId &&
              reply.authorEmployeeId === currentEmployeeId;
            const canEdit = isAuthor;
            const canDelete = isAuthor || canAdminReplies;
            const isEditing = editingReplyId === reply.id;

            return (
              <li
                key={reply.id}
                className="flex gap-2"
                data-testid={`kudos-reply-item-${reply.id}`}
              >
                <UserAvatar
                  name={reply.authorEmployee?.fullName}
                  avatarUrl={reply.authorEmployee?.photoUrl}
                  size="sm"
                  className="h-7 w-7 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {reply.authorEmployee?.fullName ?? 'Colaborador'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatReplyTime(reply.createdAt)}
                      {reply.updatedAt !== reply.createdAt && ' (editado)'}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="mt-1 space-y-2">
                      <textarea
                        value={editDraft}
                        onChange={e => setEditDraft(e.target.value)}
                        onKeyDown={e => handleEditKeyDown(e, reply.id)}
                        rows={2}
                        className={cn(
                          'w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          'resize-none'
                        )}
                        autoFocus
                        data-testid={`kudos-reply-edit-${reply.id}`}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={
                            !editDraft.trim() || updateReply.isPending
                          }
                          onClick={() => handleSubmitEdit(reply.id)}
                        >
                          {updateReply.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Salvar'
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group mt-0.5 flex items-start justify-between gap-2">
                      <p className="whitespace-pre-line text-sm text-foreground/90">
                        {reply.content}
                      </p>
                      {(canEdit || canDelete) && (
                        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(reply)}
                              aria-label="Editar resposta"
                              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              data-testid={`kudos-reply-edit-btn-${reply.id}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(reply.id)}
                              aria-label="Excluir resposta"
                              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                              data-testid={`kudos-reply-delete-btn-${reply.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2 pt-1">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleDraftKeyDown}
          placeholder="Responder..."
          rows={1}
          className={cn(
            'flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'resize-none min-h-[36px] max-h-32'
          )}
          data-testid={`kudos-reply-composer-${kudosId}`}
        />
        <Button
          type="button"
          size="sm"
          disabled={!draft.trim() || createReply.isPending}
          onClick={handleSendReply}
          aria-label="Enviar resposta"
          data-testid={`kudos-reply-send-${kudosId}`}
        >
          {createReply.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Delete confirmation (PIN) */}
      <VerifyActionPinModal
        isOpen={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onSuccess={handleConfirmDelete}
        title="Excluir resposta"
        description="Digite seu PIN de Acao para excluir esta resposta. Essa acao nao pode ser desfeita."
      />

    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatReplyTime(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
