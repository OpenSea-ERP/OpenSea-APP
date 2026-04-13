'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@/hooks/sales/use-sales-orders';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import type { Comment } from '@/types/sales';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---------------------------------------------------------------------------
// Avatar Component
// ---------------------------------------------------------------------------

function UserAvatar({
  name,
  className,
}: {
  name: string | undefined | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center text-xs font-semibold text-violet-700 dark:text-violet-300 shrink-0',
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comment Item Component
// ---------------------------------------------------------------------------

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | undefined;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  isDeleting: boolean;
}

function CommentItem({
  comment,
  currentUserId,
  onEdit,
  onDelete,
  isDeleting,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const isOwner = currentUserId === comment.userId;

  const handleStartEdit = useCallback(() => {
    setEditContent(comment.content);
    setIsEditing(true);
  }, [comment.content]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) {
      setIsEditing(false);
      return;
    }
    onEdit(comment.id, trimmed);
    setIsEditing(false);
  }, [comment.id, comment.content, editContent, onEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSaveEdit();
      }
      if (e.key === 'Escape') {
        setIsEditing(false);
      }
    },
    [handleSaveEdit]
  );

  return (
    <div className="flex gap-2.5 py-3 group/comment">
      <UserAvatar name={comment.userId} />

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">
            {comment.userId ?? 'Usuario'}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.updatedAt && (
            <span className="text-[10px] text-muted-foreground italic shrink-0">
              (editado)
            </span>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mt-1.5 space-y-1.5">
            <Textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              autoFocus
              className="text-sm"
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSaveEdit}
              >
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm mt-0.5 whitespace-pre-wrap leading-relaxed text-foreground/90">
            {comment.content}
          </p>
        )}

        {/* Actions (owner only, hover) */}
        {isOwner && !isEditing && (
          <div className="mt-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                <DropdownMenuItem onClick={handleStartEdit}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(comment.id)}
                  className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface CommentsSectionProps {
  /** Entity type (e.g. 'order', 'deal') */
  entityType: string;
  /** Entity ID */
  entityId: string;
  /** Optional: render as messaging layout with scrollable area + pinned input */
  messagingLayout?: boolean;
  /** Optional: initially collapsed */
  defaultCollapsed?: boolean;
}

export function CommentsSection({
  entityType,
  entityId,
  messagingLayout = false,
  defaultCollapsed = false,
}: CommentsSectionProps) {
  const { user } = useAuth();
  const { data: commentsData, isLoading } = useComments(entityId);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const comments = commentsData?.comments ?? [];

  const [newContent, setNewContent] = useState('');
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom in messaging layout
  useEffect(() => {
    if (messagingLayout && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length, messagingLayout]);

  const handleSubmit = useCallback(() => {
    const trimmed = newContent.trim();
    if (!trimmed) return;

    createComment.mutate(
      {
        entityType,
        entityId,
        content: trimmed,
      },
      {
        onSuccess: () => {
          setNewContent('');
        },
        onError: () => {
          toast.error(
            'Nao foi possivel adicionar o comentario. Tente novamente.'
          );
        },
      }
    );
  }, [newContent, entityType, entityId, createComment]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleEdit = useCallback(
    (commentId: string, content: string) => {
      updateComment.mutate(
        { commentId, data: { content } },
        {
          onSuccess: () => toast.success('Comentario atualizado.'),
          onError: () =>
            toast.error(
              'Nao foi possivel atualizar o comentario. Tente novamente.'
            ),
        }
      );
    },
    [updateComment]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteComment.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success('Comentario excluido.');
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error('Nao foi possivel excluir o comentario. Tente novamente.');
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deleteComment]);

  // Input component (shared between layouts)
  const commentInput = (
    <div className="flex items-start gap-2.5">
      <UserAvatar name={user?.username} />
      <div
        className={cn(
          'flex-1 rounded-lg border border-slate-300 bg-slate-50 transition-shadow',
          'focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200',
          'dark:border-slate-600 dark:bg-slate-800/60',
          'dark:focus-within:border-slate-500 dark:focus-within:ring-slate-600/30'
        )}
      >
        <textarea
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva um comentario... (Enter para enviar)"
          rows={2}
          disabled={createComment.isPending}
          className={cn(
            'block w-full resize-none rounded-t-lg bg-transparent px-3 py-2 text-sm',
            'text-foreground placeholder:text-slate-400',
            'focus:outline-none disabled:opacity-50',
            'dark:placeholder:text-slate-500'
          )}
        />
        <div
          className={cn(
            'flex items-center justify-end border-t border-slate-200 bg-slate-100 px-3 py-1.5 rounded-b-lg',
            'dark:border-slate-700 dark:bg-slate-800'
          )}
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createComment.isPending || !newContent.trim()}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm',
              'bg-slate-800 text-white hover:bg-slate-700',
              'dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <Send className="h-3 w-3" />
            Comentar
          </button>
        </div>
      </div>
    </div>
  );

  // Messaging layout (scrollable messages + pinned input)
  if (messagingLayout) {
    return (
      <div className="flex flex-col h-full">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-border/50">
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  isDeleting={deleteComment.isPending}
                />
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 border-t border-border/50 p-3 bg-muted/30">
          {commentInput}
        </div>

        <VerifyActionPinModal
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir este comentario."
        />
      </div>
    );
  }

  // Collapsible section layout (used on detail pages)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-white dark:bg-slate-800/60 border border-border overflow-hidden">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
          >
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-500/10">
              <MessageSquare className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Comentários</h3>
                {comments.length > 0 && (
                  <span className="text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded-md text-muted-foreground bg-muted/50">
                    {comments.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comentários e discussoes sobre este{' '}
                {entityType === 'order'
                  ? 'pedido'
                  : entityType === 'deal'
                    ? 'negócio'
                    : 'registro'}
              </p>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div className="border-t border-border px-5 py-4 space-y-4">
            {/* Input */}
            {commentInput}

            {/* Comments list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : comments.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-border/50">
                {comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={user?.id}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                    isDeleting={deleteComment.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>

      <VerifyActionPinModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleDeleteConfirm}
        title="Confirmar Exclusão"
        description="Digite seu PIN de ação para excluir este comentario."
      />
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
      <p className="text-sm">Nenhum comentario ainda</p>
      <p className="text-xs mt-1 opacity-60">Seja o primeiro a comentar</p>
    </div>
  );
}
