'use client';

import { useState, useMemo, useRef, useEffect, useCallback, Suspense } from 'react';
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
import { getGradientForBoard } from '@/components/tasks/shared/board-gradients';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Settings,
  AlertTriangle,
  ArrowLeft,
  Archive,
  Search,
  KanbanSquare,
} from 'lucide-react';
import type { Card as TaskCard } from '@/types/tasks';
import { useAuth } from '@/contexts/auth-context';

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
  const [search, setSearch] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { user } = useAuth();
  const board = boardData?.board;
  const allCards = cardsData?.cards ?? [];

  const isViewer = useMemo(() => {
    if (!board || !user) return false;
    if (board.ownerId === user.id) return false;
    const membership = board.members?.find((m) => m.userId === user.id);
    return membership?.role === 'VIEWER';
  }, [board, user]);

  // Filter + search cards
  const filteredCards = useMemo(() => {
    let result = allCards;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }
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
  }, [allCards, search, filters]);

  const handleCardClick = (card: TaskCard) => {
    setSelectedCardId(card.id);
  };

  const isArchived = !!board?.archivedAt;
  const gradient = getGradientForBoard(boardId);

  // Dynamically measure remaining viewport height for kanban
  const viewRef = useRef<HTMLDivElement>(null);
  const [viewHeight, setViewHeight] = useState<number | undefined>();

  const updateViewHeight = useCallback(() => {
    const el = viewRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    setViewHeight(Math.max(200, window.innerHeight - top - 16));
  }, []);

  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (currentView !== 'kanban') {
      setViewHeight(undefined);
      return;
    }
    // Wait a frame for layout to settle
    requestAnimationFrame(updateViewHeight);
    window.addEventListener('resize', updateViewHeight);

    // Lock page scroll when kanban is active
    document.documentElement.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('resize', updateViewHeight);
      document.documentElement.style.overflow = '';
    };
  }, [currentView, updateViewHeight]);

  // Loading state
  if (boardLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-28 w-full rounded-xl" />
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
      {/* Header */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Quadros', href: '/tasks' },
          { label: board.title },
        ]}
        buttons={[
          {
            id: 'settings',
            title: 'Configurações',
            icon: Settings,
            variant: 'outline' as const,
            onClick: () => setSettingsOpen(true),
          },
        ]}
      />

      {/* Archived banner */}
      {isArchived && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-2.5">
          <Archive className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Este quadro está arquivado. As alterações estão desabilitadas.
          </span>
        </div>
      )}

      {/* Hero Banner */}
      <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
        {/* Decorative blobs using board gradient colors */}
        <div
          className="absolute top-0 right-0 w-44 h-44 rounded-full opacity-60 -translate-y-1/2 translate-x-1/2"
          style={{ backgroundColor: `${gradient.from}25` }}
        />
        <div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-60 translate-y-1/2 -translate-x-1/2"
          style={{ backgroundColor: `${gradient.to}20` }}
        />

        <div className="relative z-10">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={gradient.style}
              >
                <KanbanSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  {board.title}
                </h1>
                {board.description && (
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    {board.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Toolbar: search + filters | view modes */}
          <div className="bg-muted/30 dark:bg-white/5 rounded-md px-3 py-2">
            <div className="flex items-center gap-3">
              {/* Left: search + filters */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tarefas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 bg-white dark:bg-white/10 border-gray-200 dark:border-white/10"
                  />
                </div>
                <BoardFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  labels={board.labels}
                  members={board.members}
                />
              </div>

              {/* Right: view modes */}
              <div className="shrink-0">
                <ViewToggle currentView={currentView} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* View content */}
      <div
        ref={viewRef}
        style={viewHeight ? { height: viewHeight, overflow: 'hidden' } : undefined}
      >
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
            readOnly={isViewer}
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
          <Skeleton className="h-28 w-full rounded-xl" />
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
