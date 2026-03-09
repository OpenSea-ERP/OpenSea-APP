'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Board, Card } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { getGradientForBoard } from '../shared/board-gradients';
import { CardInlineCreate } from '../cards/card-inline-create';
import { MemberAvatar } from '../shared/member-avatar';
import {
  ChevronDown,
  ChevronRight,
  CalendarClock,
  MessageSquare,
} from 'lucide-react';

interface ListViewProps {
  board: Board;
  cards: Card[];
  boardId: string;
  onCardClick?: (card: Card) => void;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function formatDueDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ListView({
  board,
  cards,
  boardId,
  onCardClick,
}: ListViewProps) {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(
    new Set()
  );

  const gradient = getGradientForBoard(boardId);

  const columns = useMemo(
    () => [...(board.columns ?? [])].sort((a, b) => a.position - b.position),
    [board.columns]
  );

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const col of columns) {
      map.set(col.id, []);
    }
    for (const card of cards) {
      const colCards = map.get(card.columnId);
      if (colCards) colCards.push(card);
    }
    for (const colCards of map.values()) {
      colCards.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [cards, columns]);

  function toggleColumn(columnId: string) {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) next.delete(columnId);
      else next.add(columnId);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {columns.map(column => {
        const colCards = cardsByColumn.get(column.id) ?? [];
        const isCollapsed = collapsedColumns.has(column.id);
        const colColor = column.color || gradient.from;

        return (
          <div
            key={column.id}
            className="rounded-xl border border-gray-200 dark:border-white/10 bg-card overflow-hidden"
          >
            {/* Column Header with colored accent */}
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/50 transition-colors"
              style={{
                background: `linear-gradient(90deg, ${colColor}10, transparent)`,
              }}
              onClick={() => toggleColumn(column.id)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span
                className="h-3 w-3 rounded shrink-0"
                style={{ backgroundColor: colColor }}
              />
              <span className="text-sm font-semibold">{column.title}</span>
              <span className="text-xs font-medium tabular-nums ml-1 px-1.5 py-0.5 rounded-md bg-muted/50">
                {colCards.length}
              </span>
            </button>

            {/* Card Rows */}
            {!isCollapsed && (
              <div className="border-t border-gray-200 dark:border-white/10">
                {colCards.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted-foreground">
                    Nenhum cartão nesta coluna
                  </div>
                ) : (
                  colCards.map(card => {
                    const priorityConfig = PRIORITY_CONFIG[card.priority];
                    const overdue = isOverdue(card.dueDate);
                    const hasComments = card._count && card._count.comments > 0;

                    return (
                      <button
                        key={card.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors border-b border-border/50 last:border-b-0 cursor-pointer"
                        onClick={() => onCardClick?.(card)}
                      >
                        {/* Left color bar from column */}
                        <span
                          className="h-6 w-1 rounded-full shrink-0"
                          style={{ backgroundColor: `${colColor}60` }}
                        />
                        <span
                          className={cn(
                            'h-2.5 w-2.5 rounded-full shrink-0',
                            priorityConfig.dotColor
                          )}
                        />
                        <span className="flex-1 text-sm font-medium truncate">
                          {card.title}
                        </span>

                        {/* Labels as dots */}
                        {card.labels && card.labels.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1 shrink-0">
                            {card.labels.slice(0, 4).map(label => (
                              <span
                                key={label.id}
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: label.color }}
                                title={label.name}
                              />
                            ))}
                          </div>
                        )}

                        {hasComments && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground shrink-0">
                            <MessageSquare className="h-3 w-3" />
                            {card._count!.comments}
                          </span>
                        )}

                        {card.dueDate && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[11px] font-medium rounded px-1.5 py-0.5 shrink-0',
                              overdue
                                ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400'
                                : 'text-muted-foreground'
                            )}
                          >
                            <CalendarClock className="h-3 w-3" />
                            {formatDueDate(card.dueDate)}
                          </span>
                        )}

                        {card.assigneeName && (
                          <MemberAvatar name={card.assigneeName} size="sm" />
                        )}
                      </button>
                    );
                  })
                )}

                <div className="px-2 py-1.5 border-t border-border/50">
                  <CardInlineCreate boardId={boardId} columnId={column.id} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
