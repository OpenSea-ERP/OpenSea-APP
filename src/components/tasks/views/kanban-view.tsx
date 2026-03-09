'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { Board, Card, Column } from '@/types/tasks';
import { useMoveCard } from '@/hooks/tasks/use-cards';
import { useUpdateColumn, useReorderColumns } from '@/hooks/tasks/use-columns';
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

function findColumnOfCard(
  cardMap: Map<string, Card[]>,
  cardId: UniqueIdentifier
): string | undefined {
  for (const [colId, colCards] of cardMap) {
    if (colCards.some(c => c.id === cardId)) return colId;
  }
  return undefined;
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
  const moveCard = useMoveCard(boardId);
  const reorderColumns = useReorderColumns(boardId);
  const gradient = getGradientForBoard(boardId);

  // ─── Local state (synced from props, updated optimistically during drag) ───

  const propsColumns = useMemo(
    () => [...(board.columns ?? [])].sort((a, b) => a.position - b.position),
    [board.columns]
  );

  const [orderedColumns, setOrderedColumns] = useState<Column[]>(propsColumns);
  const [localCards, setLocalCards] = useState<Card[]>(cards);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  // Sync from props when server data changes (NOT during drag)
  useEffect(() => {
    if (!activeCard && !activeColumn) setOrderedColumns(propsColumns);
  }, [propsColumns, activeCard, activeColumn]);

  useEffect(() => {
    if (!activeCard && !activeColumn) setLocalCards(cards);
  }, [cards, activeCard, activeColumn]);

  // ─── Derived ───

  const columnIds = useMemo(
    () => orderedColumns.map(c => c.id),
    [orderedColumns]
  );

  const cardsByColumn = useMemo(
    () => buildCardMap(columnIds, localCards),
    [localCards, columnIds]
  );

  // Refs must be written during render (not in useEffect/useLayoutEffect) so that
  // handleDragEnd always reads the latest value — DnD events can fire before effects run.
  // eslint-disable-next-line react-hooks/refs
  const cardsByColumnRef = useRef(cardsByColumn);
  cardsByColumnRef.current = cardsByColumn; // eslint-disable-line react-hooks/refs

  const columnIdsRef = useRef(columnIds);
  columnIdsRef.current = columnIds; // eslint-disable-line react-hooks/refs

  // ─── Sensors ───

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ─── Drag Start ───

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current;
      if (data?.type === 'column') {
        const col = orderedColumns.find(c => c.id === event.active.id);
        if (col) setActiveColumn(col);
      } else {
        const card = data?.card as Card | undefined;
        if (card) setActiveCard(card);
      }
    },
    [orderedColumns]
  );

  // ─── Drag Over ───
  // ALL card state mutations happen inside setLocalCards(prev => ...) to avoid stale closures

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current;
      if (activeData?.type === 'column') return;

      const activeId = active.id as string;
      const overId = over.id as string;
      if (activeId === overId) return;

      const overData = over.data.current;

      setLocalCards(prev => {
        // Build a FRESH map from the latest prev state
        const freshMap = buildCardMap(columnIdsRef.current, prev);

        const sourceColId = findColumnOfCard(freshMap, activeId);
        if (!sourceColId) return prev;

        // Determine target column
        let targetColId: string;
        if (overData?.type === 'column') {
          targetColId = overId;
        } else if (overData?.type === 'card') {
          targetColId = findColumnOfCard(freshMap, overId) ?? sourceColId;
        } else {
          // overId might be a column id
          targetColId = freshMap.has(overId) ? overId : sourceColId;
        }

        // ── Same column: reorder ──
        if (sourceColId === targetColId) {
          const colCards = freshMap.get(sourceColId);
          if (!colCards) return prev;

          const oldIdx = colCards.findIndex(c => c.id === activeId);
          const newIdx = colCards.findIndex(c => c.id === overId);
          if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev;

          const reordered = arrayMove(colCards, oldIdx, newIdx);
          const other = prev.filter(c => c.columnId !== sourceColId);
          return [
            ...other,
            ...reordered.map((c, i) => ({ ...c, position: i })),
          ];
        }

        // ── Cross-column move ──
        const sourceCards = [...(freshMap.get(sourceColId) ?? [])];
        const targetCards = [...(freshMap.get(targetColId) ?? [])];

        const cardIdx = sourceCards.findIndex(c => c.id === activeId);
        if (cardIdx === -1) return prev;

        const [movedCard] = sourceCards.splice(cardIdx, 1);

        let insertIdx = targetCards.length;
        if (overData?.type === 'card') {
          const overIdx = targetCards.findIndex(c => c.id === overId);
          if (overIdx >= 0) insertIdx = overIdx;
        }

        targetCards.splice(insertIdx, 0, {
          ...movedCard,
          columnId: targetColId,
        });

        const touchedColIds = new Set([sourceColId, targetColId]);
        const other = prev.filter(c => !touchedColIds.has(c.columnId));
        return [
          ...other,
          ...sourceCards.map((c, i) => ({ ...c, position: i })),
          ...targetCards.map((c, i) => ({
            ...c,
            position: i,
            columnId: targetColId,
          })),
        ];
      });
    },
    [] // No stale dependencies — everything is inside setLocalCards(prev => ...)
  );

  // ─── Drag End (commit to API) ───

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const activeData = active.data.current;

      // — Column reorder —
      if (activeData?.type === 'column') {
        setActiveColumn(null);
        if (!over || active.id === over.id) return;

        const oldIndex = orderedColumns.findIndex(c => c.id === active.id);
        const newIndex = orderedColumns.findIndex(c => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(orderedColumns, oldIndex, newIndex);
        setOrderedColumns(reordered);
        reorderColumns.mutate({ columnIds: reordered.map(c => c.id) });
        return;
      }

      // — Card move (local state already updated via onDragOver) —
      const activeCardId = active.id as string;

      // Use ref to get the LATEST cardsByColumn (post onDragOver updates)
      const latestMap = cardsByColumnRef.current;
      const finalColumnId = findColumnOfCard(latestMap, activeCardId);

      setActiveCard(null);
      if (!over || !finalColumnId) return;

      const finalCards = latestMap.get(finalColumnId) ?? [];
      const finalPosition = finalCards.findIndex(c => c.id === activeCardId);

      moveCard.mutate({
        cardId: activeCardId,
        data: {
          columnId: finalColumnId,
          position: finalPosition >= 0 ? finalPosition : 0,
        },
      });
    },
    [orderedColumns, moveCard, reorderColumns]
  );

  // ─── Drag Cancel ───

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
    setActiveColumn(null);
    setOrderedColumns(propsColumns);
    setLocalCards(cards);
  }, [propsColumns, cards]);

  // ─── Accessibility: Portuguese announcements for screen readers ───

  const getColumnTitle = useCallback(
    (columnId: string | undefined) => {
      if (!columnId) return '';
      const col = orderedColumns.find(c => c.id === columnId);
      return col?.title ?? '';
    },
    [orderedColumns]
  );

  const dndAccessibility = useMemo(
    () => ({
      screenReaderInstructions: {
        draggable:
          'Para mover um cartão, pressione Espaço ou Enter. Use as setas para mover. Pressione Espaço ou Enter novamente para soltar, ou Escape para cancelar.',
      },
      announcements: {
        onDragStart({ active }: DragStartEvent) {
          const data = active.data.current;
          if (data?.type === 'column') {
            return `Coluna ${getColumnTitle(active.id as string)} selecionada`;
          }
          const card = data?.card as Card | undefined;
          return `Cartão ${card?.title ?? ''} selecionado`;
        },
        onDragOver({ active, over }: DragOverEvent) {
          if (!over) return '';
          const data = active.data.current;
          if (data?.type === 'column') return '';
          const card = data?.card as Card | undefined;
          const overData = over.data.current;
          const targetColId =
            overData?.type === 'column'
              ? (over.id as string)
              : overData?.type === 'card'
                ? (overData.columnId as string)
                : (over.id as string);
          return `Cartão ${card?.title ?? ''} movido para ${getColumnTitle(targetColId)}`;
        },
        onDragEnd({ active, over }: DragEndEvent) {
          if (!over) return 'Movimentação cancelada';
          const data = active.data.current;
          if (data?.type === 'column') {
            return `Coluna ${getColumnTitle(active.id as string)} solta`;
          }
          const card = data?.card as Card | undefined;
          const overData = over.data.current;
          const targetColId =
            overData?.type === 'column'
              ? (over.id as string)
              : overData?.type === 'card'
                ? (overData.columnId as string)
                : (over.id as string);
          return `Cartão ${card?.title ?? ''} solto em ${getColumnTitle(targetColId)}`;
        },
        onDragCancel() {
          return 'Movimentação cancelada';
        },
      },
    }),
    [getColumnTitle]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={dndAccessibility}
    >
      <div
        role="region"
        aria-label="Quadro Kanban"
        className="kanban-scroll h-full overflow-x-auto sm:overflow-y-hidden overflow-y-auto pb-2"
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:min-w-max h-full">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {orderedColumns.map(column => {
              const colCards = cardsByColumn.get(column.id) ?? [];
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cards={colCards}
                  boardId={boardId}
                  boardGradientFrom={gradient.from}
                  allColumns={orderedColumns}
                  onCardClick={onCardClick}
                />
              );
            })}
          </SortableContext>
          <AddColumnButton boardId={boardId} />
        </div>
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeCard ? (
          <CardItem
            card={activeCard}
            onClick={() => {}}
            boardId={boardId}
            isDragOverlay
          />
        ) : null}
        {activeColumn ? (
          <KanbanColumnOverlay
            column={activeColumn}
            cardCount={cardsByColumn.get(activeColumn.id)?.length ?? 0}
            boardGradientFrom={gradient.from}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ─────────────────────────────────────────────────
   Kanban Column — sortable (drag + drop) + inline rename
   ───────────────────────────────────────────────── */

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  boardId: string;
  boardGradientFrom: string;
  allColumns: Column[];
  onCardClick?: (card: Card) => void;
}

function KanbanColumn({
  column,
  cards,
  boardId,
  boardGradientFrom,
  allColumns,
  onCardClick,
}: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

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

  const cardIds = useMemo(() => cards.map(c => c.id), [cards]);
  const isOverWip = column.wipLimit ? cards.length >= column.wipLimit : false;
  const colColor = column.color || boardGradientFrom;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
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
          {...attributes}
          {...listeners}
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

      {/* Cards container */}
      <div
        className={cn(
          'flex-1 space-y-2 rounded-b-xl border border-gray-200 dark:border-white/10 p-2 transition-colors min-h-[80px]',
          'bg-muted/20 dark:bg-white/[0.02]',
          isOver && !isDragging && 'ring-2 ring-inset'
        )}
        style={
          isOver && !isDragging
            ? {
                borderColor: `${colColor}40`,
                boxShadow: `inset 0 0 0 1px ${colColor}20`,
              }
            : undefined
        }
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
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

/* ─────────────────────────────────────────────────
   Column Overlay — shown while dragging a column
   ───────────────────────────────────────────────── */

function KanbanColumnOverlay({
  column,
  cardCount,
  boardGradientFrom,
}: {
  column: Column;
  cardCount: number;
  boardGradientFrom: string;
}) {
  const colColor = column.color || boardGradientFrom;

  return (
    <div className="w-[280px] rounded-xl shadow-2xl ring-2 ring-primary/20 rotate-[2deg] opacity-90">
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-t-xl border border-b-0 border-gray-200 dark:border-white/10"
        style={{
          background: `linear-gradient(135deg, ${colColor}30, ${colColor}15)`,
          borderTopColor: `${colColor}50`,
        }}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span
          className="h-3 w-3 rounded shrink-0"
          style={{ backgroundColor: colColor }}
        />
        <h3 className="text-sm font-semibold truncate flex-1">
          {column.title}
        </h3>
        <span className="text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-md text-muted-foreground bg-muted/50">
          {cardCount}
        </span>
      </div>
      <div className="h-20 rounded-b-xl border border-gray-200 dark:border-white/10 bg-muted/30 dark:bg-white/[0.03]" />
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
