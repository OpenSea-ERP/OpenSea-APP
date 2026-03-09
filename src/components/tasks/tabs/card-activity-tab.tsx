'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Plus,
  Minus,
  Tag,
  User,
  MessageSquare,
  CheckSquare,
  Pencil,
  FileText,
  Activity,
} from 'lucide-react';
import { useCardActivity } from '@/hooks/tasks/use-activity';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';
import { formatRelativeTime } from '@/components/tasks/tabs/_utils';
import type { CardActivity, CardActivityType } from '@/types/tasks';

interface CardActivityTabProps {
  boardId: string;
  cardId: string;
}

const ACTIVITY_ICON: Record<CardActivityType, React.ReactNode> = {
  CARD_CREATED: <Plus className="h-3.5 w-3.5 text-green-500" />,
  CARD_UPDATED: <Pencil className="h-3.5 w-3.5 text-blue-500" />,
  CARD_MOVED: <ArrowRight className="h-3.5 w-3.5 text-purple-500" />,
  CARD_ARCHIVED: <FileText className="h-3.5 w-3.5 text-amber-500" />,
  MEMBER_ASSIGNED: <User className="h-3.5 w-3.5 text-cyan-500" />,
  MEMBER_UNASSIGNED: <User className="h-3.5 w-3.5 text-gray-400" />,
  LABEL_ADDED: <Tag className="h-3.5 w-3.5 text-emerald-500" />,
  LABEL_REMOVED: <Tag className="h-3.5 w-3.5 text-gray-400" />,
  COMMENT_ADDED: <MessageSquare className="h-3.5 w-3.5 text-blue-400" />,
  FIELD_CHANGED: <Pencil className="h-3.5 w-3.5 text-orange-500" />,
  SUBTASK_ADDED: <Plus className="h-3.5 w-3.5 text-green-400" />,
  SUBTASK_UPDATED: <Pencil className="h-3.5 w-3.5 text-blue-400" />,
  SUBTASK_REMOVED: <Minus className="h-3.5 w-3.5 text-red-400" />,
  SUBTASK_REOPENED: <CheckSquare className="h-3.5 w-3.5 text-amber-400" />,
  CHECKLIST_ITEM_COMPLETED: (
    <CheckSquare className="h-3.5 w-3.5 text-green-500" />
  ),
  CHECKLIST_ITEM_UNCOMPLETED: (
    <CheckSquare className="h-3.5 w-3.5 text-gray-400" />
  ),
};

const PAGE_SIZE = 20;

export function CardActivityTab({ boardId, cardId }: CardActivityTabProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCardActivity(boardId, cardId, {
    page,
    limit: PAGE_SIZE,
  });

  const accumulatedRef = useRef<CardActivity[]>([]);
  const lastPageRef = useRef(0);

  const currentPageActivities = data?.activities ?? [];
  const meta = data?.meta;
  const hasMore = meta ? meta.page < meta.pages : false;

  useEffect(() => {
    if (data && meta && meta.page > lastPageRef.current) {
      accumulatedRef.current = [
        ...accumulatedRef.current,
        ...currentPageActivities,
      ];
      lastPageRef.current = meta.page;
    }
  }, [data, meta, currentPageActivities]);

  // Reset accumulation when card changes
  useEffect(() => {
    accumulatedRef.current = [];
    lastPageRef.current = 0;
    setPage(1);
  }, [cardId]);

  const activities =
    page === 1 ? currentPageActivities : accumulatedRef.current;

  const handleLoadMore = useCallback(() => {
    setPage(p => p + 1);
  }, []);

  if (isLoading && page === 1) {
    return (
      <div className="flex items-center justify-center py-8 w-full">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground w-full">
        <Activity className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Nenhuma atividade registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 flex-col w-full">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-3 bottom-3 w-px bg-border" />

        <div className="space-y-0">
          {activities.map(item => (
            <div key={item.id} className="flex items-start gap-3 py-2 relative">
              {/* Icon circle */}
              <div className="relative z-10 flex items-center justify-center h-8 w-8 rounded-full bg-background border border-border shrink-0">
                {ACTIVITY_ICON[item.type] ?? (
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm">
                  <span className="font-medium">
                    {item.userName ?? 'Usuário'}
                  </span>{' '}
                  <span className="text-muted-foreground">
                    {item.description}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </div>
  );
}
