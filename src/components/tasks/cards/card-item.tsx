'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Card } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { isOverdue, formatDueDate, PRIORITY_HEX } from '../_utils';
import type { DraggableProvided } from '@hello-pangea/dnd';
import {
  MessageSquare,
  Paperclip,
  CalendarClock,
  CheckSquare,
} from 'lucide-react';
import { LuCreditCard } from 'react-icons/lu';
import { MemberAvatar } from '../shared/member-avatar';

interface CardItemProps {
  card: Card;
  onClick: () => void;
  boardId: string;
  provided?: DraggableProvided;
  isDragging?: boolean;
  compact?: boolean;
  parentCardTitle?: string;
  boardGradientFrom?: string;
  boardGradientTo?: string;
}

function getCardTopColor(card: Card): string | null {
  if (card.labels && card.labels.length > 0) {
    return card.labels[0].color;
  }
  if (card.priority !== 'NONE') {
    return PRIORITY_HEX[card.priority];
  }
  return null;
}

export const CardItem = memo(function CardItem({
  card,
  onClick,
  boardId,
  provided,
  isDragging = false,
  compact = false,
  parentCardTitle,
  boardGradientFrom,
  boardGradientTo,
}: CardItemProps) {
  const topColor = getCardTopColor(card);
  const overdue = isOverdue(card.dueDate, card.status);
  const hasSubtasks = (card.subtaskCount ?? 0) > 0;
  const hasComments = (card.commentCount ?? 0) > 0;
  const hasAttachments = (card.attachmentCount ?? 0) > 0;
  const hasChecklist = (card.checklistProgress?.total ?? 0) > 0;
  const isSubtask = !!card.parentCardId;
  const hasBottomRow =
    card.assigneeName ||
    card.dueDate ||
    hasComments ||
    hasAttachments ||
    hasSubtasks ||
    hasChecklist;

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      role="button"
      tabIndex={0}
      aria-label={`Abrir cartão ${card.title}`}
      aria-roledescription="item arrastável"
      className={cn(
        'group relative rounded-lg border bg-white dark:bg-white/[0.06] border-gray-200 dark:border-white/10 overflow-hidden cursor-grab active:cursor-grabbing',
        'transition-[box-shadow,opacity] duration-150',
        isDragging && 'opacity-50 shadow-2xl rotate-1 scale-[1.02]',
        !isDragging && 'hover:shadow-md'
      )}
      onClick={e => {
        if (isDragging) return;
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!isDragging) onClick();
        }
      }}
    >
      {/* Color bar at top */}
      {topColor && (
        <div className="h-1 w-full" style={{ backgroundColor: topColor }} />
      )}

      <div className={cn('px-3 pb-3', isSubtask && !compact ? 'pt-2' : 'pt-3')}>
        {/* Labels as compact colored dots */}
        {!compact && card.labels && card.labels.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {card.labels.map(label => (
              <span
                key={label.id}
                className="h-2 w-8 rounded-full"
                style={{ backgroundColor: label.color }}
                title={label.name}
              />
            ))}
          </div>
        )}

        {/* Subtask badge with parent name */}
        {!compact && isSubtask && (
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium text-white mb-1.5 max-w-full shadow-sm"
            style={
              boardGradientFrom && boardGradientTo
                ? {
                    background: `linear-gradient(to right, ${boardGradientFrom}80, ${boardGradientTo}80)`,
                  }
                : { backgroundColor: '#6366f180' }
            }
          >
            <LuCreditCard className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{parentCardTitle ?? 'Subtarefa'}</span>
          </span>
        )}

        {/* Title */}
        <p
          className={cn(
            'text-sm font-medium leading-snug',
            compact ? 'line-clamp-1' : 'line-clamp-2'
          )}
        >
          {card.title}
        </p>

        {/* Bottom row */}
        {!compact && hasBottomRow && (
          <div className="flex items-center justify-between gap-2 mt-2.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              {/* Due date */}
              {card.dueDate && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-medium rounded px-1.5 py-0.5',
                    overdue
                      ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400'
                      : 'text-muted-foreground'
                  )}
                >
                  <CalendarClock className="h-3 w-3" />
                  {formatDueDate(card.dueDate)}
                </span>
              )}

              {/* Subtask progress */}
              {hasSubtasks && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                  <span className="h-1 w-6 rounded-full bg-muted overflow-hidden inline-block align-middle">
                    <span
                      className="h-full bg-primary rounded-full block"
                      style={{
                        width: `${(card.subtaskCount ?? 0) > 0 ? ((card.subtaskCompletedCount ?? 0) / (card.subtaskCount ?? 1)) * 100 : 0}%`,
                      }}
                    />
                  </span>
                  {card.subtaskCompletedCount ?? 0}/{card.subtaskCount ?? 0}
                </span>
              )}

              {/* Comments */}
              {hasComments && (
                <span className="inline-flex items-center gap-0.5 text-[11px]">
                  <MessageSquare className="h-3 w-3" />
                  {card.commentCount}
                </span>
              )}

              {/* Attachments */}
              {hasAttachments && (
                <span className="inline-flex items-center gap-0.5 text-[11px]">
                  <Paperclip className="h-3 w-3" />
                  {card.attachmentCount}
                </span>
              )}

              {/* Checklist progress */}
              {hasChecklist && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                  <CheckSquare className="h-3 w-3" />
                  {card.checklistProgress!.completed}/
                  {card.checklistProgress!.total}
                </span>
              )}
            </div>

            {/* Assignee */}
            {card.assigneeName && (
              <MemberAvatar name={card.assigneeName} size="sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
});
