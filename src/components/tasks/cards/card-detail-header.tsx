'use client';

import { useRef, useEffect } from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  X,
  ListChecks,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriorityBadge } from '@/components/tasks/shared/priority-badge';
import { LabelBadge } from '@/components/tasks/shared/label-badge';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';
import type { Card } from '@/types/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/tasks';
import type { Column } from '@/types/tasks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CardDetailHeaderProps {
  card: Card;
  currentColumn: Column | undefined;
  isOverdue: boolean;
  isDueSoon: boolean;
  isEditingTitle: boolean;
  editTitle: string;
  onEditTitleChange: (value: string) => void;
  onStartEditTitle: () => void;
  onSaveTitle: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent) => void;
  onClose: () => void;
}

export function CardDetailHeader({
  card,
  currentColumn,
  isOverdue,
  isDueSoon,
  isEditingTitle,
  editTitle,
  onEditTitleChange,
  onStartEditTitle,
  onSaveTitle,
  onTitleKeyDown,
  onClose,
}: CardDetailHeaderProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  return (
    <DialogHeader className="px-5 pt-4 pb-0 shrink-0">
      <div className="flex items-start gap-3">
        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={editTitle}
              onChange={e => onEditTitleChange(e.target.value)}
              onBlur={onSaveTitle}
              onKeyDown={onTitleKeyDown}
              className="text-lg font-bold border-none shadow-none px-0 focus-visible:ring-0 h-auto py-0"
            />
          ) : (
            <DialogTitle
              className="text-lg font-bold cursor-pointer hover:text-primary/80 transition-colors leading-tight"
              onClick={onStartEditTitle}
            >
              {card.title}
            </DialogTitle>
          )}
          <DialogDescription className="sr-only">
            Detalhes do cartão {card.title}
          </DialogDescription>

          {/* Inline badges row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Column badge */}
            {currentColumn && (
              <Badge
                variant="outline"
                className="text-[10px] h-5 gap-1 font-normal"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: currentColumn.color ?? '#6b7280',
                  }}
                />
                {currentColumn.title}
              </Badge>
            )}

            {/* Status badge */}
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] h-5 font-medium',
                card.status === 'DONE' &&
                  'bg-green-500/15 text-green-600 dark:text-green-400',
                card.status === 'IN_PROGRESS' &&
                  'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                card.status === 'CANCELED' &&
                  'bg-red-500/15 text-red-600 dark:text-red-400',
                card.status === 'OPEN' &&
                  'bg-gray-500/15 text-gray-600 dark:text-gray-400'
              )}
            >
              {STATUS_CONFIG[card.status].label}
            </Badge>

            {/* Priority badge */}
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] h-5 gap-1 font-medium',
                card.priority === 'URGENT' &&
                  'bg-red-500/15 text-red-600 dark:text-red-400',
                card.priority === 'HIGH' &&
                  'bg-orange-500/15 text-orange-600 dark:text-orange-400',
                card.priority === 'MEDIUM' &&
                  'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
                card.priority === 'LOW' &&
                  'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                card.priority === 'NONE' &&
                  'bg-gray-500/10 text-gray-500'
              )}
            >
              <PriorityBadge priority={card.priority} />
              {PRIORITY_CONFIG[card.priority].label}
            </Badge>

            {/* Due date badge */}
            {card.dueDate && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-[10px] h-5 gap-1 font-medium',
                  isOverdue &&
                    'bg-red-500/15 text-red-600 dark:text-red-400',
                  isDueSoon &&
                    'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                  !isOverdue && !isDueSoon && 'bg-gray-500/10'
                )}
              >
                {isOverdue && <AlertCircle className="h-3 w-3" />}
                <CalendarIcon className="h-3 w-3" />
                {format(new Date(card.dueDate), "dd 'de' MMM", {
                  locale: ptBR,
                })}
              </Badge>
            )}

            {/* Assignee badge */}
            {card.assigneeName && (
              <Badge
                variant="secondary"
                className="text-[10px] h-5 gap-1 font-normal"
              >
                <MemberAvatar
                  name={card.assigneeName}
                  size="sm"
                  className="h-3.5 w-3.5 text-[7px]"
                />
                {card.assigneeName}
              </Badge>
            )}

            {/* Counters */}
            {card._count && card._count.comments > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] h-5 gap-1 font-normal text-muted-foreground"
              >
                <MessageSquare className="h-3 w-3" />
                {card._count.comments}
              </Badge>
            )}
            {card._count && card._count.subtasks > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] h-5 gap-1 font-normal text-muted-foreground"
              >
                <ListChecks className="h-3 w-3" />
                {card._count.completedSubtasks}/{card._count.subtasks}
              </Badge>
            )}

            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <>
                {card.labels.map(label => (
                  <LabelBadge
                    key={label.id}
                    name={label.name}
                    color={label.color}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>
    </DialogHeader>
  );
}
