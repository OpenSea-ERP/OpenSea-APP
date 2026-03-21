'use client';

import { AttachmentSection } from './attachment-section';
import { CustomFieldsSection } from './custom-fields-section';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';
import { MessageSquare, ArrowRight } from 'lucide-react';
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
  // Attachments
  attachments: CardAttachment[];
  onUploadAttachment: (file: File) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  // Custom fields
  boardId: string;
  customFields: CustomField[];
  customFieldValues: Record<string, string>;
  onCustomFieldChange: (fieldId: string, value: string) => void;
  // Comments preview
  recentComments: CommentPreview[];
  onViewAllComments?: () => void;
}

export function CardModalGeneralTab({
  attachments,
  onUploadAttachment,
  onRemoveAttachment,
  boardId,
  customFields,
  customFieldValues,
  onCustomFieldChange,
  recentComments,
  onViewAllComments,
}: CardModalGeneralTabProps) {
  return (
    <div className="space-y-5">
      {/* Attachments */}
      <AttachmentSection
        attachments={attachments}
        onUpload={onUploadAttachment}
        onRemove={onRemoveAttachment}
      />

      {/* Custom Fields */}
      <CustomFieldsSection
        boardId={boardId}
        fields={customFields}
        values={customFieldValues}
        onChange={onCustomFieldChange}
      />

      {/* Recent Comments Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Últimos comentários
          </p>
          {onViewAllComments && recentComments.length > 0 && (
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
                      {format(new Date(comment.createdAt), "dd/MM HH:mm", {
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
    </div>
  );
}
