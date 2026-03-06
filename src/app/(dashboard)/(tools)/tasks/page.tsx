'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { BoardList } from '@/components/tasks/boards/board-list';
import { BoardCreateDialog } from '@/components/tasks/boards/board-create-dialog';
import { useBoards } from '@/hooks/tasks/use-boards';
import { usePermissions } from '@/hooks/use-permissions';
import { Plus, Search, ChevronDown, ChevronRight, Archive } from 'lucide-react';

export default function TasksPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('tasks.boards.create');

  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useBoards({
    search: search || undefined,
    includeArchived: showArchived,
  });

  const boards = data?.boards ?? [];

  const activeBoards = useMemo(
    () => boards.filter((b) => !b.archivedAt),
    [boards],
  );

  const archivedBoards = useMemo(
    () => boards.filter((b) => !!b.archivedAt),
    [boards],
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
    <div className="flex flex-col gap-4">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[{ label: 'Quadros de Tarefas', href: '/tasks' }]}
        buttons={actionButtons}
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar quadros..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Active Boards */}
      <BoardList boards={activeBoards} isLoading={isLoading} />

      {/* Archived Section */}
      {showArchived && archivedBoards.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowArchived(false)}
          >
            <ChevronDown className="h-4 w-4" />
            <Archive className="h-4 w-4" />
            Arquivados ({archivedBoards.length})
          </button>
          <BoardList
            boards={archivedBoards}
            isLoading={false}
            emptyTitle="Nenhum quadro arquivado"
            emptyDescription="Quadros arquivados aparecerão aqui."
          />
        </div>
      )}

      {/* Toggle archived visibility */}
      {!showArchived && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start text-muted-foreground"
          onClick={() => setShowArchived(true)}
        >
          <ChevronRight className="h-4 w-4 mr-1" />
          <Archive className="h-4 w-4 mr-1" />
          Mostrar arquivados
        </Button>
      )}

      {showArchived && archivedBoards.length === 0 && !isLoading && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start text-muted-foreground"
          onClick={() => setShowArchived(false)}
        >
          <ChevronDown className="h-4 w-4 mr-1" />
          <Archive className="h-4 w-4 mr-1" />
          Ocultar arquivados
        </Button>
      )}

      {/* Create Dialog */}
      <BoardCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
