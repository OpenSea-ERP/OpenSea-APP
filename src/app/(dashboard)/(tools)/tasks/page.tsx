'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { BoardList } from '@/components/tasks/boards/board-list';
import { BoardCreateDialog } from '@/components/tasks/boards/board-create-dialog';
import { useBoardsInfinite } from '@/hooks/tasks/use-boards';
import { usePermissions } from '@/hooks/use-permissions';
import { TOOLS_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useDebounce } from '@/core/hooks/use-debounce';
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Archive,
  KanbanSquare,
  User,
  Users,
  Loader2,
} from 'lucide-react';
import type { Board } from '@/types/tasks';

const BOARDS_PER_PAGE = 24;

/** Collapsible section for board groups */
function BoardSection({
  icon: Icon,
  title,
  boards,
  defaultOpen = true,
}: {
  icon: React.ElementType;
  title: string;
  boards: Board[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-2 py-2 group transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
        )}
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
          {title}
        </span>
        <span className="text-xs text-muted-foreground font-medium ml-1">
          ({boards.length})
        </span>
      </button>

      {open && (
        <div className="mt-2 ml-1">
          <BoardList boards={boards} isLoading={false} />
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(TOOLS_PERMISSIONS.TASK_BOARDS.REGISTER);

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useBoardsInfinite({
      search: debouncedSearch || undefined,
      includeArchived: true,
      limit: BOARDS_PER_PAGE,
    });

  const boards = useMemo(
    () => data?.pages.flatMap(p => p.boards) ?? [],
    [data]
  );

  // Separate active from archived
  const activeBoards = useMemo(
    () => boards.filter(b => !b.archivedAt),
    [boards]
  );
  const archivedBoards = useMemo(
    () => boards.filter(b => !!b.archivedAt),
    [boards]
  );

  // Group active boards: personal vs team
  const personalBoards = useMemo(
    () => activeBoards.filter(b => b.type === 'PERSONAL'),
    [activeBoards]
  );

  // Group team boards by teamId
  const teamBoardGroups = useMemo(() => {
    const teamBoards = activeBoards.filter(b => b.type === 'TEAM');
    const groups: Record<string, { teamId: string; boards: Board[] }> = {};

    for (const board of teamBoards) {
      const key = board.teamId ?? '__no_team__';
      if (!groups[key]) {
        groups[key] = { teamId: key, boards: [] };
      }
      groups[key].boards.push(board);
    }

    return Object.values(groups);
  }, [activeBoards]);

  // Intersection observer for auto-load
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasNextPage || isFetchingNextPage) return;

      observerRef.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const actionButtons = canCreate
    ? [
        {
          id: 'new-board',
          title: 'Novo Quadro',
          icon: Plus,
          variant: 'default' as const,
          onClick: () => setCreateOpen(true),
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-5">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[{ label: 'Quadros de Tarefas', href: '/tasks' }]}
        buttons={actionButtons}
      />

      {/* Hero Banner */}
      <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-violet-500/15 dark:bg-violet-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600">
                <KanbanSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  Quadros de Tarefas
                </h1>
                <p className="text-sm text-slate-500 dark:text-white/60">
                  Gerencie seus quadros pessoais e de equipe
                </p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-muted/30 dark:bg-white/5 rounded-md px-3 py-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar quadros por nome..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 w-full bg-white dark:bg-white/10 border-gray-200 dark:border-white/10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Board sections */}
      {isLoading ? (
        <BoardList boards={[]} isLoading={true} />
      ) : (
        <div className="space-y-5">
          {/* Personal boards */}
          {personalBoards.length > 0 && (
            <BoardSection
              icon={User}
              title="Quadros Pessoais"
              boards={personalBoards}
            />
          )}

          {/* Team board groups */}
          {teamBoardGroups.map((group, index) => (
            <BoardSection
              key={group.teamId}
              icon={Users}
              title={
                teamBoardGroups.length > 1
                  ? `Quadros de Equipe ${index + 1}`
                  : 'Quadros de Equipe'
              }
              boards={group.boards}
            />
          ))}

          {/* Empty state: no active boards at all */}
          {activeBoards.length === 0 && !debouncedSearch && (
            <BoardList
              boards={[]}
              isLoading={false}
              emptyTitle="Nenhum quadro encontrado"
              emptyDescription="Crie um novo quadro para organizar suas tarefas."
            />
          )}

          {/* Empty state: search returned nothing */}
          {activeBoards.length === 0 && debouncedSearch && (
            <BoardList
              boards={[]}
              isLoading={false}
              emptyTitle="Nenhum resultado"
              emptyDescription={`Nenhum quadro encontrado para "${debouncedSearch}".`}
            />
          )}

          {/* Archived boards */}
          {archivedBoards.length > 0 && (
            <BoardSection
              icon={Archive}
              title="Quadros Arquivados"
              boards={archivedBoards}
              defaultOpen={false}
            />
          )}

          {/* Load more sentinel */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Carregar mais quadros'
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <BoardCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
