'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import type { Board, Card } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { useMoveCard } from '@/hooks/tasks/use-cards';
import { useReorderColumns } from '@/hooks/tasks/use-columns';
import { isOverdue, formatDateShort } from '../_utils';
import { getGradientForBoard } from '../shared/board-gradients';
import { CardInlineCreate } from '../cards/card-inline-create';
import { MemberAvatar } from '../shared/member-avatar';
import {
  ChevronDown,
  ChevronRight,
  CalendarClock,
  MessageSquare,
  GripVertical,
} from 'lucide-react';

interface ListViewProps {
  board: Board;
  cards: Card[];
  boardId: string;
  onCardClick?: (card: Card) => void;
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

  const moveCard = useMoveCard(boardId);
  const reorderColumns = useReorderColumns(boardId);
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

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, type, draggableId } = result;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      // Column reorder
      if (type === 'COLUMN') {
        const reordered = [...columns];
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);
        reorderColumns.mutate({
          columnIds: reordered.map(c => c.id),
        });
        return;
      }

      // Card move
      moveCard.mutate({
        cardId: draggableId,
        data: {
          columnId: destination.droppableId,
          position: destination.index,
        },
      });
    },
    [columns, moveCard, reorderColumns]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="list-board" type="COLUMN" direction="vertical">
        {boardProvided => (
          <div
            ref={boardProvided.innerRef}
            {...boardProvided.droppableProps}
            className="space-y-3"
          >
            {columns.map((column, colIndex) => {
              const colCards = cardsByColumn.get(column.id) ?? [];
              const isCollapsed = collapsedColumns.has(column.id);
              const colColor = column.color || gradient.from;

              return (
                <Draggable
                  key={column.id}
                  draggableId={`col-${column.id}`}
                  index={colIndex}
                >
                  {(colProvided, colSnapshot) => (
                    <div
                      ref={colProvided.innerRef}
                      {...colProvided.draggableProps}
                      className={cn(
                        'rounded-xl border border-gray-200 dark:border-white/10 bg-card overflow-hidden',
                        colSnapshot.isDragging && 'shadow-lg opacity-90'
                      )}
                    >
                      {/* Column Header */}
                      <div
                        className="group/colheader flex items-center gap-1 px-2 py-2.5 hover:bg-muted/50 transition-colors"
                        style={{
                          background: `linear-gradient(90deg, ${colColor}10, transparent)`,
                        }}
                      >
                        {/* Column drag handle */}
                        <button
                          type="button"
                          className="cursor-grab active:cursor-grabbing opacity-0 group-hover/colheader:opacity-60 hover:!opacity-100 transition-opacity shrink-0 p-0.5 rounded"
                          aria-label={`Arrastar coluna ${column.title}`}
                          {...colProvided.dragHandleProps}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </button>

                        <button
                          type="button"
                          className="flex-1 flex items-center gap-2.5 text-left"
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
                          <span className="text-sm font-semibold">
                            {column.title}
                          </span>
                          <span className="text-xs font-medium tabular-nums ml-1 px-1.5 py-0.5 rounded-md bg-muted/50">
                            {colCards.length}
                          </span>
                        </button>
                      </div>

                      {/* Card Rows — Droppable */}
                      {!isCollapsed && (
                        <Droppable droppableId={column.id} type="CARD">
                          {(dropProvided, dropSnapshot) => (
                            <div
                              ref={dropProvided.innerRef}
                              {...dropProvided.droppableProps}
                              className={cn(
                                'border-t border-gray-200 dark:border-white/10 transition-colors',
                                dropSnapshot.isDraggingOver && 'bg-muted/20'
                              )}
                            >
                              {colCards.length === 0 &&
                              !dropSnapshot.isDraggingOver ? (
                                <div
                                  role="status"
                                  aria-live="polite"
                                  className="px-4 py-3 text-xs text-muted-foreground"
                                >
                                  Nenhum cartão nesta coluna
                                </div>
                              ) : (
                                colCards.map((card, index) => (
                                  <Draggable
                                    key={card.id}
                                    draggableId={card.id}
                                    index={index}
                                  >
                                    {(dragProvided, dragSnapshot) => (
                                      <ListCardRow
                                        card={card}
                                        colColor={colColor}
                                        provided={dragProvided}
                                        isDragging={dragSnapshot.isDragging}
                                        onClick={() => onCardClick?.(card)}
                                      />
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {dropProvided.placeholder}

                              <div className="px-2 py-1.5 border-t border-border/50">
                                <CardInlineCreate
                                  boardId={boardId}
                                  columnId={column.id}
                                />
                              </div>
                            </div>
                          )}
                        </Droppable>
                      )}
                    </div>
                  )}
                </Draggable>
              );
            })}
            {boardProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

/* ─────────────────────────────────────────────────
   List Card Row — draggable card in list view
   ───────────────────────────────────────────────── */

interface ListCardRowProps {
  card: Card;
  colColor: string;
  provided: import('@hello-pangea/dnd').DraggableProvided;
  isDragging: boolean;
  onClick: () => void;
}

function ListCardRow({
  card,
  colColor,
  provided,
  isDragging,
  onClick,
}: ListCardRowProps) {
  const priorityConfig = PRIORITY_CONFIG[card.priority];
  const overdue = isOverdue(card.dueDate, card.status);
  const hasComments = card._count && card._count.comments > 0;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={cn(
        'group/row flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-b-0',
        isDragging && 'bg-card shadow-lg rounded-lg border border-border'
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className={cn(
          'cursor-grab active:cursor-grabbing transition-opacity shrink-0 -ml-2 p-0.5 rounded',
          isDragging
            ? 'opacity-100'
            : 'opacity-0 group-hover/row:opacity-60 hover:!opacity-100'
        )}
        aria-label={`Arrastar cartão ${card.title}`}
        {...provided.dragHandleProps}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Left color bar */}
      <span
        className="h-6 w-1 rounded-full shrink-0"
        style={{ backgroundColor: `${colColor}60` }}
      />

      {/* Priority dot */}
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full shrink-0',
          priorityConfig.dotColor
        )}
      />

      {/* Title — clickable area */}
      <button
        type="button"
        className="flex-1 text-sm font-medium truncate text-left cursor-pointer"
        onClick={onClick}
      >
        {card.title}
      </button>

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
          {formatDateShort(card.dueDate)}
        </span>
      )}

      {card.assigneeName && (
        <MemberAvatar name={card.assigneeName} size="sm" />
      )}
    </div>
  );
}
