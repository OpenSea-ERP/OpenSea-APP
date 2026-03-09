'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  MessageSquare,
  SmilePlus,
  Send,
} from 'lucide-react';
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useAddReaction,
  useRemoveReaction,
} from '@/hooks/tasks/use-comments';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';
import { formatRelativeTime } from '@/components/tasks/tabs/_utils';
import { useAuth } from '@/contexts/auth-context';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Comment } from '@/types/tasks';

interface CardCommentsTabProps {
  boardId: string;
  cardId: string;
  /** Render in messaging layout: scrollable messages above, input pinned below */
  messagingLayout?: boolean;
}

const QUICK_EMOJIS = ['👍', '👎', '❤️', '🎉', '😄', '😮', '🤔', '👀'];

function CommentItem({
  comment,
  boardId,
  cardId,
  currentUserId,
}: {
  comment: Comment;
  boardId: string;
  cardId: string;
  currentUserId: string | undefined;
}) {
  const updateComment = useUpdateComment(boardId, cardId);
  const deleteComment = useDeleteComment(boardId, cardId);
  const addReaction = useAddReaction(boardId, cardId);
  const removeReaction = useRemoveReaction(boardId, cardId);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const isOwner = currentUserId === comment.authorId;

  const handleStartEdit = useCallback(() => {
    setEditContent(comment.content);
    setIsEditing(true);
  }, [comment.content]);

  const handleSaveEdit = useCallback(() => {
    const content = editContent.trim();
    if (!content || content === comment.content) {
      setIsEditing(false);
      return;
    }
    updateComment.mutate(
      { commentId: comment.id, data: { content } },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success('Comentário atualizado');
        },
        onError: () => toast.error('Erro ao atualizar comentário'),
      }
    );
  }, [comment.id, comment.content, editContent, updateComment]);

  const handleDelete = useCallback(() => {
    deleteComment.mutate(comment.id, {
      onSuccess: () => toast.success('Comentário excluído'),
      onError: () => toast.error('Erro ao excluir comentário'),
    });
  }, [comment.id, deleteComment]);

  const handleToggleReaction = useCallback(
    (emoji: string) => {
      const existingReaction = comment.reactions?.find(
        r => r.emoji === emoji && r.userId === currentUserId
      );
      if (existingReaction) {
        removeReaction.mutate(
          { commentId: comment.id, emoji },
          { onError: () => toast.error('Erro ao remover reação') }
        );
      } else {
        addReaction.mutate(
          { commentId: comment.id, emoji },
          { onError: () => toast.error('Erro ao adicionar reação') }
        );
      }
      setEmojiPickerOpen(false);
    },
    [comment.id, comment.reactions, currentUserId, addReaction, removeReaction]
  );

  // Group reactions by emoji
  const groupedReactions = (comment.reactions ?? []).reduce(
    (acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { count: 0, userReacted: false };
      }
      acc[r.emoji].count += 1;
      if (r.userId === currentUserId) {
        acc[r.emoji].userReacted = true;
      }
      return acc;
    },
    {} as Record<string, { count: number; userReacted: boolean }>
  );

  return (
    <div className="flex gap-2.5 py-2.5 group/comment">
      <MemberAvatar name={comment.authorName} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {comment.authorName ?? 'Usuário'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.updatedAt && (
            <span className="text-[10px] text-muted-foreground italic">
              (editado)
            </span>
          )}

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-auto opacity-0 group-hover/comment:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleStartEdit}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1.5 space-y-1.5">
            <Textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={2}
              autoFocus
              className="text-sm"
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSaveEdit}
                disabled={updateComment.isPending}
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
          <p className="text-sm mt-0.5 whitespace-pre-wrap leading-relaxed">
            {comment.content}
          </p>
        )}

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {Object.entries(groupedReactions).map(([emoji, data]) => (
              <button
                key={emoji}
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] border transition-colors ${
                  data.userReacted
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-border hover:bg-muted'
                }`}
                onClick={() => handleToggleReaction(emoji)}
              >
                <span>{emoji}</span>
                <span className="font-medium">{data.count}</span>
              </button>
            ))}

            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-full h-5 w-5 border border-dashed border-border/50 text-muted-foreground hover:bg-muted transition-colors opacity-0 group-hover/comment:opacity-100">
                  <SmilePlus className="h-2.5 w-2.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1.5" align="start">
                <div className="flex gap-0.5">
                  {QUICK_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-sm"
                      onClick={() => handleToggleReaction(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}

export function CardCommentsTab({
  boardId,
  cardId,
  messagingLayout,
}: CardCommentsTabProps) {
  const { user } = useAuth();
  const { data: commentsData, isLoading } = useComments(boardId, cardId);
  const createComment = useCreateComment(boardId, cardId);

  const comments = commentsData?.comments ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  const [newContent, setNewContent] = useState('');

  // Auto-scroll to bottom when new comments arrive (messaging mode)
  useEffect(() => {
    if (messagingLayout && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length, messagingLayout]);

  const handleCreateComment = useCallback(() => {
    const content = newContent.trim();
    if (!content) return;

    createComment.mutate(
      { content },
      {
        onSuccess: () => {
          setNewContent('');
        },
        onError: () => toast.error('Erro ao adicionar comentário'),
      }
    );
  }, [newContent, createComment]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleCreateComment();
      }
    },
    [handleCreateComment]
  );

  // Messaging layout: messages above, input pinned below
  if (messagingLayout) {
    return (
      <div className="flex flex-col h-full">
        {/* Scrollable messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">Nenhum comentário ainda</p>
              <p className="text-[10px] mt-1 opacity-60">
                Inicie uma conversa sobre esta tarefa
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 py-2">
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  boardId={boardId}
                  cardId={cardId}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pinned input at bottom */}
        <div className="shrink-0 border-t border-border/50 p-3 bg-muted/30">
          <div className="flex items-end gap-2">
            <Textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva um comentário... (Enter para enviar)"
              rows={1}
              className="text-sm min-h-[36px] max-h-[100px] resize-none"
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleCreateComment}
              disabled={createComment.isPending || !newContent.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Original layout (used in tabs)
  return (
    <div className="space-y-4 flex-col w-full">
      {/* Comment input */}
      <div className="space-y-2">
        <Textarea
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="Escreva um comentário..."
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleCreateComment}
            disabled={createComment.isPending || !newContent.trim()}
          >
            Comentar
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">Nenhum comentário</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              boardId={boardId}
              cardId={cardId}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
