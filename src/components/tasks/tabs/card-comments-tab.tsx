'use client';

import { useState, useCallback } from 'react';
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
      },
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
        (r) => r.emoji === emoji && r.userId === currentUserId,
      );
      if (existingReaction) {
        removeReaction.mutate(
          { commentId: comment.id, emoji },
          { onError: () => toast.error('Erro ao remover reação') },
        );
      } else {
        addReaction.mutate(
          { commentId: comment.id, emoji },
          { onError: () => toast.error('Erro ao adicionar reação') },
        );
      }
      setEmojiPickerOpen(false);
    },
    [comment.id, comment.reactions, currentUserId, addReaction, removeReaction],
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
    {} as Record<string, { count: number; userReacted: boolean }>,
  );

  return (
    <div className="flex gap-3 py-3">
      <MemberAvatar name={comment.authorName} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {comment.authorName ?? 'Usuário'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.updatedAt && (
            <span className="text-xs text-muted-foreground">(editado)</span>
          )}

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
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
          <div className="mt-2 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={updateComment.isPending}
              >
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
        )}

        {/* Reactions */}
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          {Object.entries(groupedReactions).map(([emoji, data]) => (
            <button
              key={emoji}
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs border transition-colors ${
                data.userReacted
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted'
              }`}
              onClick={() => handleToggleReaction(emoji)}
            >
              <span>{emoji}</span>
              <span>{data.count}</span>
            </button>
          ))}

          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center justify-center rounded-full h-6 w-6 border border-dashed border-border text-muted-foreground hover:bg-muted transition-colors">
                <SmilePlus className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted transition-colors text-base"
                    onClick={() => handleToggleReaction(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

export function CardCommentsTab({ boardId, cardId }: CardCommentsTabProps) {
  const { user } = useAuth();
  const { data: commentsData, isLoading } = useComments(boardId, cardId);
  const createComment = useCreateComment(boardId, cardId);

  const comments = commentsData?.comments ?? [];

  const [newContent, setNewContent] = useState('');

  const handleCreateComment = useCallback(() => {
    const content = newContent.trim();
    if (!content) return;

    createComment.mutate(
      { content },
      {
        onSuccess: () => {
          setNewContent('');
          toast.success('Comentário adicionado');
        },
        onError: () => toast.error('Erro ao adicionar comentário'),
      },
    );
  }, [newContent, createComment]);

  return (
    <div className="space-y-4 flex-col w-full">
      {/* Comment input */}
      <div className="space-y-2">
        <Textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
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
          {comments.map((comment) => (
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
