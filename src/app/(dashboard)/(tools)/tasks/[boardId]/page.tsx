'use client';

import { useState, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBoard } from '@/hooks/tasks/use-boards';
import { useCards } from '@/hooks/tasks/use-cards';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { ViewToggle } from '@/components/tasks/shared/view-toggle';
import {
  BoardFilters,
  type BoardFiltersState,
} from '@/components/tasks/shared/board-filters';
import { KanbanView } from '@/components/tasks/views/kanban-view';
import { ListView } from '@/components/tasks/views/list-view';
import { TableView } from '@/components/tasks/views/table-view';
import { CalendarView } from '@/components/tasks/views/calendar-view';
import { CardDetailModal } from '@/components/tasks/cards/card-detail-modal';
import { BoardSettingsDialog } from '@/components/tasks/boards/board-settings-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Settings, AlertTriangle, ArrowLeft, Archive } from 'lucide-react';
import type { Card as TaskCard } from '@/types/tasks';

function BoardPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const boardId = params.boardId as string;
  const currentView = searchParams.get('view') || 'kanban';

  const {
    data: boardData,
    isLoading: boardLoading,
    isError: boardError,
  } = useBoard(boardId);
  const { data: cardsData } = useCards(boardId, {
    limit: 100,
  });

  const [filters, setFilters] = useState<BoardFiltersState>({});
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const board = boardData?.board;
  const allCards = cardsData?.cards ?? [];

  // Filter cards
  const filteredCards = useMemo(() => {
    let result = allCards;

    if (filters.priority) {
      result = result.filter((c) => c.priority === filters.priority);
    }
    if (filters.assigneeId) {
      result = result.filter((c) => c.assigneeId === filters.assigneeId);
    }
    if (filters.labelId) {
      result = result.filter((c) =>
        c.labels?.some((l) => l.id === filters.labelId),
      );
    }

    return result;
  }, [allCards, filters]);

  const handleCardClick = (card: TaskCard) => {
    setSelectedCardId(card.id);
  };

  const isArchived = !!board?.archivedAt;

  // Loading state
  if (boardLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-4 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-72 space-y-3">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (boardError || !board) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">Quadro não encontrado</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          O quadro solicitado não existe ou você não tem permissão para
          acessá-lo.
        </p>
        <Link href="/tasks">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Quadros
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Archived banner */}
      {isArchived && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-2.5">
          <Archive className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Este quadro está arquivado. As alterações estão desabilitadas.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Quadros', href: '/tasks' },
            { label: board.title },
          ]}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="Configurações do quadro"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* View toggle + Filters bar */}
      <div className="flex items-center gap-4 flex-wrap border-b border-border pb-0">
        <ViewToggle currentView={currentView} />
        <div className="ml-auto pb-2">
          <BoardFilters
            filters={filters}
            onFiltersChange={setFilters}
            labels={board.labels}
            members={board.members}
          />
        </div>
      </div>

      {/* View content */}
      <div className="mt-1">
        {currentView === 'kanban' && (
          <KanbanView
            board={board}
            cards={filteredCards}
            boardId={boardId}
            onCardClick={handleCardClick}
          />
        )}

        {currentView === 'lista' && (
          <ListView
            board={board}
            cards={filteredCards}
            boardId={boardId}
            onCardClick={handleCardClick}
          />
        )}

        {currentView === 'tabela' && (
          <TableView
            board={board}
            cards={filteredCards}
            boardId={boardId}
            onCardClick={handleCardClick}
          />
        )}

        {currentView === 'calendario' && (
          <CalendarView
            board={board}
            cards={filteredCards}
            boardId={boardId}
            onCardClick={handleCardClick}
          />
        )}
      </div>

      {/* Unified Card Detail Modal */}
      {selectedCardId && (
        <CardDetailModal
          open={!!selectedCardId}
          onOpenChange={(open) => {
            if (!open) setSelectedCardId(null);
          }}
          boardId={boardId}
          cardId={selectedCardId}
        />
      )}

      {/* Board Settings Dialog */}
      <BoardSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        boardId={boardId}
      />
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-64" />
          <div className="flex gap-4 mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-72 rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <BoardPageContent />
    </Suspense>
  );
}
