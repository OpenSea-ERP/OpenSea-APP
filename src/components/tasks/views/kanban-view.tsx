'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import type { Board, Card, Column } from '@/types/tasks';
import type { CardsResponse } from '@/services/tasks';
import { useMoveCardLocal, CARD_QUERY_KEYS } from '@/hooks/tasks/use-cards';
import { useUpdateColumn, useReorderColumns } from '@/hooks/tasks/use-columns';
import { BOARD_QUERY_KEYS } from '@/hooks/tasks/use-boards';
import { useQueryClient } from '@tanstack/react-query';
import { getGradientForBoard } from '../shared/board-gradients';
import { CardItem } from '../cards/card-item';
import { CardInlineCreate } from '../cards/card-inline-create';
import { ColumnOptionsMenu } from '../columns/column-options-menu';
import { Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateColumn } from '@/hooks/tasks/use-columns';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────
   Helper: build a column→cards map from a flat cards array
   ───────────────────────────────────────────────── */

function buildCardMap(columnIds: string[], cards: Card[]): Map<string, Card[]> {
  const map = new Map<string, Card[]>();
  for (const id of columnIds) map.set(id, []);
  for (const card of cards) {
    const arr = map.get(card.columnId);
    if (arr) arr.push(card);
  }
  for (const arr of map.values()) arr.sort((a, b) => a.position - b.position);
  return map;
}

/* ═════════════════════════════════════════════════
   KanbanView — main component
   ═════════════════════════════════════════════════ */

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
  const qc = useQueryClient();
  const moveCard = useMoveCardLocal(boardId);
  const reorderColumns = useReorderColumns(boardId);
  const gradient = getGradientForBoard(boardId);

  // ─── Columns: optimistic local state (infrequent operation) ───

  const propsColumns = useMemo(
    () => [...(board.columns ?? [])].sort((a, b) => a.position - b.position),
    [board.columns]
  );

  const [optimisticColumns, setOptimisticColumns] = useState<Column[] | null>(
    null
  );

  const displayColumns = optimisticColumns ?? propsColumns;

  // ─── Cards: always from TanStack Query cache (no local state!) ───
  // Optimistic card updates are written directly to the query cache
  // via qc.setQueriesData(), so multiple rapid drags build on top of
  // each other without race conditions.

  // Debounced cache sync: only refetch from server 1.5s after the LAST drag.
  // This prevents early refetches from overwriting subsequent drags' optimistic data.
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      syncTimerRef.current = null;
    }, 1500);
  }, [qc, boardId]);

  const columnIds = useMemo(
    () => displayColumns.map(c => c.id),
    [displayColumns]
  );

  const cardsByColumn = useMemo(
    () => buildCardMap(columnIds, cards),
    [cards, columnIds]
  );

  // ─── Drag End (the only handler needed) ───

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, type, draggableId } = result;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      // ── Column reorder ──
      if (type === 'COLUMN') {
        const cols = [...displayColumns];
        const [moved] = cols.splice(source.index, 1);
        cols.splice(destination.index, 0, moved);
        const reordered = cols.map((c, i) => ({ ...c, position: i }));

        setOptimisticColumns(reordered);
        reorderColumns.mutate(
          { columnIds: reordered.map(c => c.id) },
          {
            onSettled: () => {
              qc.invalidateQueries({
                queryKey: BOARD_QUERY_KEYS.BOARD(boardId),
              });
              setOptimisticColumns(null);
            },
          }
        );
        return;
      }

      // ── Card move ──
      const sourceColId = source.droppableId;
      const destColId = destination.droppableId;
      const cardId = draggableId;

      // Cancel any in-flight card queries so stale refetches don't
      // overwrite the optimistic cache update we're about to make.
      qc.cancelQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });

      // Compute new cards array with correct positions
      qc.setQueriesData<CardsResponse>(
        { queryKey: CARD_QUERY_KEYS.CARDS(boardId) },
        old => {
          if (!old) return old;
          const currentCards = old.cards;
          const currentColIds = displayColumns.map(c => c.id);
          const currentMap = buildCardMap(currentColIds, currentCards);

          let newCards: Card[];

          if (sourceColId === destColId) {
            // Same-column reorder
            const colCards = [...(currentMap.get(sourceColId) ?? [])];
            const [moved] = colCards.splice(source.index, 1);
            colCards.splice(destination.index, 0, moved);
            const reindexed = colCards.map((c, i) => ({ ...c, position: i }));
            const otherCards = currentCards.filter(
              c => c.columnId !== sourceColId
            );
            newCards = [...otherCards, ...reindexed];
          } else {
            // Cross-column move
            const sourceCards = [...(currentMap.get(sourceColId) ?? [])];
            const destCards = [...(currentMap.get(destColId) ?? [])];

            const [moved] = sourceCards.splice(source.index, 1);
            destCards.splice(destination.index, 0, {
              ...moved,
              columnId: destColId,
            });

            const reindexedSource = sourceCards.map((c, i) => ({
              ...c,
              position: i,
            }));
            const reindexedDest = destCards.map((c, i) => ({
              ...c,
              position: i,
              columnId: destColId,
            }));

            const touchedCols = new Set([sourceColId, destColId]);
            const otherCards = currentCards.filter(
              c => !touchedCols.has(c.columnId)
            );
            newCards = [...otherCards, ...reindexedSource, ...reindexedDest];
          }

          return { ...old, cards: newCards };
        }
      );

      // Fire API call, then schedule a debounced sync with server
      moveCard.mutate({
        cardId,
        data: { columnId: destColId, position: destination.index },
      });
      scheduleSync();
    },
    [displayColumns, moveCard, reorderColumns, qc, boardId, scheduleSync]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" type="COLUMN" direction="horizontal">
        {boardProvided => (
          <div
            role="region"
            aria-label="Quadro Kanban"
            className="kanban-scroll h-full overflow-x-auto sm:overflow-y-hidden overflow-y-auto pb-2"
          >
            <div
              ref={boardProvided.innerRef}
              {...boardProvided.droppableProps}
              className="flex flex-col sm:flex-row gap-3 sm:min-w-max h-full"
            >
              {displayColumns.map((column, colIndex) => {
                const colCards = cardsByColumn.get(column.id) ?? [];
                return (
                  <Draggable
                    key={column.id}
                    draggableId={`col-${column.id}`}
                    index={colIndex}
                  >
                    {(colProvided, colSnapshot) => (
                      <KanbanColumn
                        column={column}
                        cards={colCards}
                        boardId={boardId}
                        boardGradientFrom={gradient.from}
                        allColumns={displayColumns}
                        onCardClick={onCardClick}
                        provided={colProvided}
                        isDragging={colSnapshot.isDragging}
                      />
                    )}
                  </Draggable>
                );
              })}
              {boardProvided.placeholder}
              <AddColumnButton boardId={boardId} />
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

/* ─────────────────────────────────────────────────
   Kanban Column — draggable (for reorder) + droppable (for cards)
   ───────────────────────────────────────────────── */

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  boardId: string;
  boardGradientFrom: string;
  allColumns: Column[];
  onCardClick?: (card: Card) => void;
  provided: import('@hello-pangea/dnd').DraggableProvided;
  isDragging: boolean;
}

function KanbanColumn({
  column,
  cards,
  boardId,
  boardGradientFrom,
  allColumns,
  onCardClick,
  provided,
  isDragging,
}: KanbanColumnProps) {
  // Inline rename state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateColumn = useUpdateColumn(boardId);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function startEditing() {
    setEditValue(column.title);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditValue(column.title);
  }

  function saveTitle() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === column.title) {
      cancelEditing();
      return;
    }

    updateColumn.mutate(
      { columnId: column.id, data: { title: trimmed } },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success('Coluna renomeada!');
        },
        onError: () => {
          toast.error('Erro ao renomear coluna.');
          cancelEditing();
        },
      }
    );
  }

  const isOverWip = column.wipLimit ? cards.length >= column.wipLimit : false;
  const colColor = column.color || boardGradientFrom;

  /* eslint-disable react-hooks/refs -- provided refs are callback refs from @hello-pangea/dnd */
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={cn(
        'flex flex-col w-full sm:w-[280px] shrink-0',
        isDragging && 'opacity-40'
      )}
    >
      {/* Column header with color accent + drag handle */}
      <div
        className="group/header flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl border border-b-0 border-gray-200 dark:border-white/10"
        style={{
          background: `linear-gradient(135deg, ${colColor}12, ${colColor}06)`,
          borderTopColor: `${colColor}30`,
        }}
      >
        {/* Drag handle — visible on hover */}
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover/header:opacity-60 hover:!opacity-100 transition-opacity shrink-0 -ml-1 p-0.5 rounded"
          aria-roledescription="Arrastar para reordenar"
          aria-label={`Arrastar coluna ${column.title}`}
          {...provided.dragHandleProps}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Color dot */}
        <span
          className="h-3 w-3 rounded shrink-0"
          style={{ backgroundColor: colColor }}
        />

        {/* Title — click to rename */}
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') cancelEditing();
            }}
            className={cn(
              'text-sm font-semibold flex-1 min-w-0 bg-white dark:bg-white/10',
              'border border-primary/50 rounded px-1.5 py-0.5 outline-none',
              'focus:ring-2 focus:ring-primary/30'
            )}
          />
        ) : (
          <h3
            className="text-sm font-semibold truncate flex-1 cursor-text hover:bg-black/5 dark:hover:bg-white/5 rounded px-1.5 py-0.5 -mx-1 transition-colors"
            onClick={startEditing}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startEditing();
              }
            }}
            tabIndex={0}
            role="button"
            title="Clique para renomear"
          >
            {column.title}
          </h3>
        )}

        {/* Card count badge */}
        <span
          className={cn(
            'text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-md shrink-0',
            isOverWip
              ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15'
              : 'text-muted-foreground bg-muted/50'
          )}
          aria-label={
            column.wipLimit
              ? `${cards.length} de ${column.wipLimit} cartões${isOverWip ? ' (limite excedido)' : ''}`
              : `${cards.length} cartões`
          }
        >
          {cards.length}
          {column.wipLimit ? `/${column.wipLimit}` : ''}
        </span>

        {/* Options menu */}
        <ColumnOptionsMenu
          column={column}
          boardId={boardId}
          allColumns={allColumns}
          cards={cards}
          onStartEditing={startEditing}
        />
      </div>

      {/* Cards droppable area */}
      <Droppable droppableId={column.id} type="CARD">
        {(dropProvided, dropSnapshot) => (
          <div
            ref={dropProvided.innerRef}
            {...dropProvided.droppableProps}
            className={cn(
              'flex-1 space-y-2 rounded-b-xl border border-gray-200 dark:border-white/10 p-2 transition-colors min-h-[80px]',
              'bg-muted/20 dark:bg-white/[0.02]',
              dropSnapshot.isDraggingOver && !isDragging && 'ring-2 ring-inset'
            )}
            style={
              dropSnapshot.isDraggingOver && !isDragging
                ? {
                    borderColor: `${colColor}40`,
                    boxShadow: `inset 0 0 0 1px ${colColor}20`,
                  }
                : undefined
            }
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(cardProvided, cardSnapshot) => (
                  <CardItem
                    card={card}
                    boardId={boardId}
                    onClick={() => onCardClick?.(card)}
                    provided={cardProvided}
                    isDragging={cardSnapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {dropProvided.placeholder}

            <CardInlineCreate boardId={boardId} columnId={column.id} />
          </div>
        )}
      </Droppable>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Add Column Button
   ───────────────────────────────────────────────── */

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
      }
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
      <div className="w-full sm:w-[280px] shrink-0">
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
    <div className="w-full sm:w-[280px] shrink-0 space-y-2 bg-muted/30 dark:bg-white/[0.02] rounded-xl p-3 border border-gray-200 dark:border-white/10">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nome da coluna..."
        disabled={createColumn.isPending}
        className={cn(
          'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'
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
