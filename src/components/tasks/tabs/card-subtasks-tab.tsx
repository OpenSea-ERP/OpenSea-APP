'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ListChecks } from 'lucide-react';
import {
  useSubtasks,
  useCreateSubtask,
  useCompleteSubtask,
  useDeleteSubtask,
} from '@/hooks/tasks/use-subtasks';
import { PriorityBadge } from '@/components/tasks/shared/priority-badge';

interface CardSubtasksTabProps {
  boardId: string;
  cardId: string;
}

export function CardSubtasksTab({ boardId, cardId }: CardSubtasksTabProps) {
  const { data: subtasksData, isLoading } = useSubtasks(boardId, cardId);
  const createSubtask = useCreateSubtask(boardId, cardId);
  const completeSubtask = useCompleteSubtask(boardId, cardId);
  const deleteSubtask = useDeleteSubtask(boardId, cardId);

  const subtasks = subtasksData?.subtasks ?? [];

  const [newTitle, setNewTitle] = useState('');

  const handleCreate = useCallback(() => {
    const title = newTitle.trim();
    if (!title) return;

    createSubtask.mutate(
      { title },
      {
        onSuccess: () => {
          setNewTitle('');
          toast.success('Subtarefa criada');
        },
        onError: () => toast.error('Erro ao criar subtarefa'),
      },
    );
  }, [newTitle, createSubtask]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCreate();
      }
    },
    [handleCreate],
  );

  const handleToggleComplete = useCallback(
    (subtaskId: string, currentStatus: string) => {
      const completed = currentStatus !== 'DONE';
      completeSubtask.mutate(
        { subtaskId, completed },
        {
          onError: () => toast.error('Erro ao atualizar subtarefa'),
        },
      );
    },
    [completeSubtask],
  );

  const handleDelete = useCallback(
    (subtaskId: string) => {
      deleteSubtask.mutate(subtaskId, {
        onSuccess: () => toast.success('Subtarefa removida'),
        onError: () => toast.error('Erro ao remover subtarefa'),
      });
    },
    [deleteSubtask],
  );

  // Progress
  const completedCount = subtasks.filter((s) => s.status === 'DONE').length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4 flex-col w-full">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{completedCount} de {totalCount} concluídas</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : subtasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <ListChecks className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">Nenhuma subtarefa</p>
        </div>
      ) : (
        <div className="space-y-1">
          {subtasks.map((subtask) => {
            const isDone = subtask.status === 'DONE';
            return (
              <div
                key={subtask.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 group hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={isDone}
                  onCheckedChange={() => handleToggleComplete(subtask.id, subtask.status)}
                />
                <span
                  className={`flex-1 text-sm ${isDone ? 'line-through text-muted-foreground' : ''}`}
                >
                  {subtask.title}
                </span>
                <PriorityBadge priority={subtask.priority} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => handleDelete(subtask.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline create */}
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Adicionar subtarefa..."
          className="h-8 text-sm"
          disabled={createSubtask.isPending}
        />
        {newTitle.trim() && (
          <Button
            size="sm"
            className="h-8 shrink-0"
            onClick={handleCreate}
            disabled={createSubtask.isPending}
          >
            Criar
          </Button>
        )}
      </div>
    </div>
  );
}
