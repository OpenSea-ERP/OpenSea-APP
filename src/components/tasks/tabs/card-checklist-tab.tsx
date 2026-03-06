'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, CheckSquare, ChevronDown, ChevronRight } from 'lucide-react';
import {
  useCreateChecklist,
  useUpdateChecklist,
  useDeleteChecklist,
  useAddChecklistItem,
  useToggleChecklistItem,
  useDeleteChecklistItem,
} from '@/hooks/tasks/use-checklists';
import type { Checklist } from '@/types/tasks';

interface CardChecklistTabProps {
  boardId: string;
  cardId: string;
  checklists: Checklist[];
}

function ChecklistSection({
  checklist,
  boardId,
  cardId,
}: {
  checklist: Checklist;
  boardId: string;
  cardId: string;
}) {
  const updateChecklist = useUpdateChecklist(boardId, cardId);
  const deleteChecklist = useDeleteChecklist(boardId, cardId);
  const addItem = useAddChecklistItem(boardId, cardId);
  const toggleItem = useToggleChecklistItem(boardId, cardId);
  const deleteItem = useDeleteChecklistItem(boardId, cardId);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const items = checklist.items ?? [];
  const completedCount = items.filter((i) => i.isCompleted).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleStartEditTitle = useCallback(() => {
    setEditTitle(checklist.title);
    setIsEditingTitle(true);
  }, [checklist.title]);

  const handleSaveTitle = useCallback(() => {
    const title = editTitle.trim();
    if (!title || title === checklist.title) {
      setIsEditingTitle(false);
      return;
    }
    updateChecklist.mutate(
      { checklistId: checklist.id, data: { title } },
      {
        onSuccess: () => setIsEditingTitle(false),
        onError: () => toast.error('Erro ao atualizar checklist'),
      },
    );
  }, [checklist.id, checklist.title, editTitle, updateChecklist]);

  const handleDeleteChecklist = useCallback(() => {
    deleteChecklist.mutate(checklist.id, {
      onSuccess: () => toast.success('Checklist removido'),
      onError: () => toast.error('Erro ao remover checklist'),
    });
  }, [checklist.id, deleteChecklist]);

  const handleAddItem = useCallback(() => {
    const title = newItemTitle.trim();
    if (!title) return;
    addItem.mutate(
      { checklistId: checklist.id, data: { title } },
      {
        onSuccess: () => {
          setNewItemTitle('');
        },
        onError: () => toast.error('Erro ao adicionar item'),
      },
    );
  }, [checklist.id, newItemTitle, addItem]);

  const handleToggleItem = useCallback(
    (itemId: string) => {
      toggleItem.mutate(
        { checklistId: checklist.id, itemId },
        {
          onError: () => toast.error('Erro ao atualizar item'),
        },
      );
    },
    [checklist.id, toggleItem],
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      deleteItem.mutate(
        { checklistId: checklist.id, itemId },
        {
          onError: () => toast.error('Erro ao remover item'),
        },
      );
    },
    [checklist.id, deleteItem],
  );

  return (
    <div className="rounded-md border border-border p-3 space-y-3">
      {/* Checklist header */}
      <div className="flex items-center gap-2">
        <button
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {isEditingTitle ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') setIsEditingTitle(false);
            }}
            className="h-7 text-sm font-medium"
            autoFocus
          />
        ) : (
          <h4
            className="text-sm font-medium cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 flex-1"
            onClick={handleStartEditTitle}
          >
            {checklist.title}
          </h4>
        )}

        <span className="text-xs text-muted-foreground shrink-0">
          {completedCount}/{totalCount}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleDeleteChecklist}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {!collapsed && (
        <>
          {/* Items */}
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-1 py-1 rounded group hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={item.isCompleted}
                  onCheckedChange={() => handleToggleItem(item.id)}
                />
                <span
                  className={`flex-1 text-sm ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}
                >
                  {item.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add item input */}
          <div className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem();
                }
              }}
              placeholder="Adicionar item..."
              className="h-7 text-xs"
              disabled={addItem.isPending}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function CardChecklistTab({
  boardId,
  cardId,
  checklists,
}: CardChecklistTabProps) {
  const createChecklist = useCreateChecklist(boardId, cardId);
  const [showCreate, setShowCreate] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  const handleCreateChecklist = useCallback(() => {
    const title = newChecklistTitle.trim();
    if (!title) return;
    createChecklist.mutate(
      { title },
      {
        onSuccess: () => {
          setNewChecklistTitle('');
          setShowCreate(false);
          toast.success('Checklist criado');
        },
        onError: () => toast.error('Erro ao criar checklist'),
      },
    );
  }, [newChecklistTitle, createChecklist]);

  return (
    <div className="space-y-4 flex-col w-full">
      {checklists.length === 0 && !showCreate ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <CheckSquare className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">Nenhum checklist</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checklists.map((cl) => (
            <ChecklistSection
              key={cl.id}
              checklist={cl}
              boardId={boardId}
              cardId={cardId}
            />
          ))}
        </div>
      )}

      {showCreate ? (
        <div className="flex items-center gap-2">
          <Input
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateChecklist();
              }
              if (e.key === 'Escape') {
                setShowCreate(false);
                setNewChecklistTitle('');
              }
            }}
            placeholder="Nome do checklist..."
            className="h-8 text-sm"
            autoFocus
            disabled={createChecklist.isPending}
          />
          <Button
            size="sm"
            className="h-8"
            onClick={handleCreateChecklist}
            disabled={createChecklist.isPending || !newChecklistTitle.trim()}
          >
            Criar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => {
              setShowCreate(false);
              setNewChecklistTitle('');
            }}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4" />
          Adicionar checklist
        </Button>
      )}
    </div>
  );
}
