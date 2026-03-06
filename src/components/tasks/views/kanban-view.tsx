'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import type { Board, Card, Column } from '@/types/tasks';
import { useMoveCard } from '@/hooks/tasks/use-cards';
import { useCreateColumn } from '@/hooks/tasks/use-columns';
import { CardItem } from '../cards/card-item';
import { CardInlineCreate } from '../cards/card-inline-create';
import { Plus, X, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface KanbanViewProps {
  board: Board;
  cards: Card[];
  boardId: string;
  onCardClick?: (card: Card) => void;
}

export function KanbanView({
  board,
  cards,
  boardId,
  onCardClick,
}: KanbanViewProps) {
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const moveCard = useMoveCard(boardId);

  const columns = useMemo(
    () => [...(board.columns ?? [])].sort((a, b) => a.position - b.position),
    [board.columns],
  );

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const col of columns) {
      map.set(col.id, []);
    }
    for (const card of cards) {
      const colCards = map.get(card.columnId);
      if (colCards) {
        colCards.push(card);
      }
    }
    for (const colCards of map.values()) {
      colCards.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [cards, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const card = event.active.data.current?.card as Card | undefined;
    if (card) setActiveCard(card);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null);

      const { active, over } = event;
      if (!over) return;

      const activeCardId = active.id as string;
      const activeData = active.data.current;
      const overData = over.data.current;

      let targetColumnId: string;
      let targetPosition: number;

      if (overData?.type === 'column') {
        targetColumnId = over.id as string;
        const colCards = cardsByColumn.get(targetColumnId) ?? [];
        targetPosition = colCards.length;
      } else if (overData?.type === 'card') {
        targetColumnId = overData.columnId as string;
        const colCards = cardsByColumn.get(targetColumnId) ?? [];
        const overIndex = colCards.findIndex((c) => c.id === over.id);
        targetPosition = overIndex >= 0 ? overIndex : colCards.length;
      } else {
        targetColumnId = over.id as string;
        const colCards = cardsByColumn.get(targetColumnId) ?? [];
        targetPosition = colCards.length;
      }

      if (activeData?.columnId === targetColumnId) {
        const colCards = cardsByColumn.get(targetColumnId) ?? [];
        const currentIndex = colCards.findIndex((c) => c.id === activeCardId);
        if (currentIndex === targetPosition) return;
      }

      moveCard.mutate({
        cardId: activeCardId,
        data: {
          columnId: targetColumnId,
          position: targetPosition,
        },
      });
    },
    [cardsByColumn, moveCard],
  );

  const handleDragOver = useCallback((_event: DragOverEvent) => {}, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4 min-w-max">
          {columns.map((column) => {
            const colCards = cardsByColumn.get(column.id) ?? [];
            return (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={colCards}
                boardId={boardId}
                onCardClick={onCardClick}
              />
            );
          })}
          <AddColumnButton boardId={boardId} />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay>
        {activeCard ? (
          <CardItem
            card={activeCard}
            onClick={() => {}}
            boardId={boardId}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  boardId: string;
  onCardClick?: (card: Card) => void;
}

function KanbanColumn({
  column,
  cards,
  boardId,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      columnId: column.id,
    },
  });

  const cardIds = useMemo(() => cards.map((c) => c.id), [cards]);
  const isOverWip = column.wipLimit ? cards.length >= column.wipLimit : false;

  return (
    <div className="flex flex-col w-[280px] shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 py-2 mb-1">
        {/* Color indicator */}
        <span
          className="h-3 w-1 rounded-full shrink-0"
          style={{ backgroundColor: column.color || '#94a3b8' }}
        />
        <h3 className="text-sm font-semibold truncate flex-1">
          {column.title}
        </h3>
        {/* Card count + WIP */}
        <span
          className={cn(
            'text-xs font-medium tabular-nums',
            isOverWip ? 'text-red-500' : 'text-muted-foreground',
          )}
        >
          {cards.length}
          {column.wipLimit ? `/${column.wipLimit}` : ''}
        </span>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 rounded-xl p-2 transition-colors min-h-[80px]',
          'bg-muted/30 dark:bg-white/[0.02]',
          isOver && 'bg-primary/5 dark:bg-primary/5 ring-2 ring-primary/20 ring-inset',
        )}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              boardId={boardId}
              onClick={() => onCardClick?.(card)}
            />
          ))}
        </SortableContext>

        <CardInlineCreate boardId={boardId} columnId={column.id} />
      </div>
    </div>
  );
}

function AddColumnButton({ boardId }: { boardId: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const createColumn = useCreateColumn(boardId);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setIsAdding(false);
      return;
    }

    createColumn.mutate(
      { title: trimmed },
      {
        onSuccess: () => {
          setName('');
          setIsAdding(false);
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setName('');
      setIsAdding(false);
    }
  }

  if (!isAdding) {
    return (
      <div className="w-[280px] shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5 text-muted-foreground hover:text-foreground rounded-xl h-10"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4" />
          Nova coluna
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[280px] shrink-0 space-y-2 bg-muted/30 dark:bg-white/[0.02] rounded-xl p-3">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nome da coluna..."
        disabled={createColumn.isPending}
        className={cn(
          'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50',
        )}
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleSubmit}
          disabled={createColumn.isPending || !name.trim()}
        >
          Adicionar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => {
            setName('');
            setIsAdding(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
