'use client';

import { useState } from 'react';
import { AttachmentSection } from './attachment-section';
import { CustomFieldsSection } from './custom-fields-section';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CardAttachment, CustomField } from '@/types/tasks';

interface CommentPreview {
  id: string;
  content: string;
  authorName: string | null;
  authorAvatarUrl?: string | null;
  createdAt: string;
}

interface CardModalGeneralTabProps {
  // Description
  description: string;
  onDescriptionChange: (value: string) => void;
  onDescriptionBlur: () => void;
  // Attachments
  attachments: CardAttachment[];
  onUploadAttachment: (file: File) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onLinkStorageFile?: (file: { id: string; name: string; size: number; mimeType: string }) => void;
  // Custom fields
  boardId: string;
  customFields: CustomField[];
  customFieldValues: Record<string, string>;
  onCustomFieldChange: (fieldId: string, value: string) => void;
  // Comments preview
  recentComments: CommentPreview[];
  onAddComment?: (content: string) => void;
  onViewAllComments?: () => void;
  // Mode
  isCreateMode?: boolean;
}

export function CardModalGeneralTab({
  description,
  onDescriptionChange,
  onDescriptionBlur,
  attachments,
  onUploadAttachment,
  onRemoveAttachment,
  onLinkStorageFile,
  boardId,
  customFields,
  customFieldValues,
  onCustomFieldChange,
  recentComments,
  onAddComment,
  onViewAllComments,
  isCreateMode = false,
}: CardModalGeneralTabProps) {
  const [commentText, setCommentText] = useState('');

  const showAttachments = !isCreateMode || attachments.length > 0;

  const handleSendComment = () => {
    if (!commentText.trim() || !onAddComment) return;
    onAddComment(commentText.trim());
    setCommentText('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-5">
        {/* Description */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Descrição
          </p>
          <Textarea
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
            onBlur={onDescriptionBlur}
            placeholder="Adicionar descrição..."
            rows={3}
            className="text-sm resize-none border-border/50 bg-background focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>

        {/* Attachments — hidden in create mode when empty */}
        {showAttachments && (
          <AttachmentSection
            attachments={attachments}
            onUpload={onUploadAttachment}
            onRemove={onRemoveAttachment}
            onLinkStorageFile={onLinkStorageFile}
          />
        )}

        {/* Custom Fields */}
        <CustomFieldsSection
          boardId={boardId}
          fields={customFields}
          values={customFieldValues}
          onChange={onCustomFieldChange}
        />

        {/* Recent Comments Preview */}
        {!isCreateMode && (
          <div className="space-y-2">
            {recentComments.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Últimos comentários
                </p>
                {onViewAllComments && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[10px] text-primary hover:underline transition-colors"
                    onClick={onViewAllComments}
                  >
                    Ver todos
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {recentComments.length > 0 ? (
              <div className="space-y-2">
                {recentComments.slice(0, 3).map(comment => (
                  <div
                    key={comment.id}
                    className="flex gap-2 rounded-md border border-border/40 bg-muted/20 p-2"
                  >
                    <MemberAvatar
                      name={comment.authorName}
                      avatarUrl={comment.authorAvatarUrl}
                      size="sm"
                      className="h-5 w-5 text-[8px] shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium truncate">
                          {comment.authorName ?? 'Desconhecido'}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {format(new Date(comment.createdAt), 'dd/MM HH:mm', {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground py-2">
                <MessageSquare className="h-3.5 w-3.5 opacity-50" />
                Nenhum comentário ainda
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky comment input — messenger style */}
      {!isCreateMode && onAddComment && (
        <div className="shrink-0 border-t border-border/50 pt-3 mt-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
              placeholder="Escrever comentário..."
              rows={1}
              className="text-sm resize-none border-border/50 bg-background focus-visible:ring-1 focus-visible:ring-primary/30 min-h-[36px]"
            />
            <Button
              type="button"
              size="sm"
              className="h-9 px-3 shrink-0"
              disabled={!commentText.trim()}
              onClick={handleSendComment}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
