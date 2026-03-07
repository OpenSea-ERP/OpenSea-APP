'use client';

import { cn } from '@/lib/utils';
import type { Card } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Paperclip, CalendarClock } from 'lucide-react';
import { MemberAvatar } from '../shared/member-avatar';

interface CardItemProps {
  card: Card;
  onClick: () => void;
  boardId: string;
  isDragOverlay?: boolean;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days === -1) return 'Ontem';
  if (days < -1) return `${Math.abs(days)}d atrás`;
  if (days <= 7) return `${days}d`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function getCardTopColor(card: Card): string | null {
  if (card.labels && card.labels.length > 0) {
    return card.labels[0].color;
  }
  if (card.priority !== 'NONE') {
    const dotColor = PRIORITY_CONFIG[card.priority].dotColor;
    const colorMap: Record<string, string> = {
      'bg-red-500': '#ef4444',
      'bg-orange-500': '#f97316',
      'bg-yellow-500': '#eab308',
      'bg-blue-500': '#3b82f6',
    };
    return colorMap[dotColor] ?? null;
  }
  return null;
}

export function CardItem({
  card,
  onClick,
  boardId,
  isDragOverlay = false,
}: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
      columnId: card.columnId,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const topColor = getCardTopColor(card);
  const overdue = isOverdue(card.dueDate);
  const counts = card._count;
  const hasSubtasks = counts && counts.subtasks > 0;
  const hasComments = counts && counts.comments > 0;
  const hasAttachments = counts && counts.attachments > 0;
  const hasBottomRow =
    card.assigneeName ||
    card.dueDate ||
    hasComments ||
    hasAttachments ||
    hasSubtasks;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative rounded-lg border bg-white dark:bg-white/[0.06] border-gray-200 dark:border-white/10 overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-150',
        isDragging && 'opacity-30',
        isDragOverlay && 'shadow-2xl rotate-1 scale-105',
        !isDragging && !isDragOverlay && 'hover:shadow-md hover:-translate-y-0.5',
      )}
      onClick={(e) => {
        if (isDragging) return;
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Color bar at top */}
      {topColor && (
        <div
          className="h-1 w-full"
          style={{ backgroundColor: topColor }}
        />
      )}

      <div className="p-3">
        {/* Labels as compact colored dots */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {card.labels.map((label) => (
              <span
                key={label.id}
                className="h-2 w-8 rounded-full"
                style={{ backgroundColor: label.color }}
                title={label.name}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {card.title}
        </p>

        {/* Bottom row */}
        {hasBottomRow && (
          <div className="flex items-center justify-between gap-2 mt-2.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              {/* Due date */}
              {card.dueDate && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-medium rounded px-1.5 py-0.5',
                    overdue
                      ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400'
                      : 'text-muted-foreground',
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
                        width: `${counts.subtasks > 0 ? (counts.completedSubtasks / counts.subtasks) * 100 : 0}%`,
                      }}
                    />
                  </span>
                  {counts.completedSubtasks}/{counts.subtasks}
                </span>
              )}

              {/* Comments */}
              {hasComments && (
                <span className="inline-flex items-center gap-0.5 text-[11px]">
                  <MessageSquare className="h-3 w-3" />
                  {counts.comments}
                </span>
              )}

              {/* Attachments */}
              {hasAttachments && (
                <span className="inline-flex items-center gap-0.5 text-[11px]">
                  <Paperclip className="h-3 w-3" />
                  {counts.attachments}
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
}
