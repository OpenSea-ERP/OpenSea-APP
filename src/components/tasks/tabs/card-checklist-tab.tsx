'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Trash2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Copy,
  ClipboardPaste,
} from 'lucide-react';
import {
  useChecklists,
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
}

function ChecklistSection({
  checklist,
  boardId,
  cardId,
  onCopy,
}: {
  checklist: Checklist;
  boardId: string;
  cardId: string;
  onCopy?: (data: { title: string; items: string[] }) => void;
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
  const completedCount = items.filter(i => i.isCompleted).length;
  const totalCount = items.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
        onError: () =>
          toast.error(
            'Não foi possível atualizar o checklist. Tente novamente.'
          ),
      }
    );
  }, [checklist.id, checklist.title, editTitle, updateChecklist]);

  const handleDeleteChecklist = useCallback(() => {
    deleteChecklist.mutate(checklist.id, {
      onSuccess: () => toast.success('Checklist removido'),
      onError: () =>
        toast.error('Não foi possível remover o checklist. Tente novamente.'),
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
        onError: () =>
          toast.error('Não foi possível adicionar o item. Tente novamente.'),
      }
    );
  }, [checklist.id, newItemTitle, addItem]);

  const handleToggleItem = useCallback(
    (itemId: string, currentlyCompleted: boolean) => {
      toggleItem.mutate(
        { checklistId: checklist.id, itemId, isCompleted: !currentlyCompleted },
        {
          onError: () =>
            toast.error('Não foi possível atualizar o item. Tente novamente.'),
        }
      );
    },
    [checklist.id, toggleItem]
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      deleteItem.mutate(
        { checklistId: checklist.id, itemId },
        {
          onError: () =>
            toast.error('Não foi possível remover o item. Tente novamente.'),
        }
      );
    },
    [checklist.id, deleteItem]
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
            onChange={e => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={e => {
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

        <button
          type="button"
          title="Copiar checklist"
          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-colors shrink-0"
          onClick={() => {
            const data = {
              title: checklist.title,
              items: (checklist.items ?? []).map(i => i.title),
            };
            localStorage.setItem('task-checklist-clipboard', JSON.stringify(data));
            onCopy?.(data);
            toast.success('Checklist copiado');
          }}
        >
          <Copy className="h-3 w-3" />
        </button>

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
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-1 py-1 rounded group hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={item.isCompleted}
                  onCheckedChange={() =>
                    handleToggleItem(item.id, item.isCompleted)
                  }
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
              onChange={e => setNewItemTitle(e.target.value)}
              onKeyDown={e => {
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

const CLIPBOARD_KEY = 'task-checklist-clipboard';

export function CardChecklistTab({ boardId, cardId }: CardChecklistTabProps) {
  const { data: checklistsData, isLoading } = useChecklists(boardId, cardId);
  const checklists = checklistsData?.checklists ?? [];

  const createChecklist = useCreateChecklist(boardId, cardId);
  const addItem = useAddChecklistItem(boardId, cardId);
  const [showCreate, setShowCreate] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  const [clipboard, setClipboard] = useState<{ title: string; items: string[] } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(CLIPBOARD_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const handleImportChecklist = useCallback(async () => {
    if (!clipboard) return;

    try {
      const result = await createChecklist.mutateAsync({ title: clipboard.title });
      const newChecklistId = result?.checklist?.id;

      if (newChecklistId) {
        for (const itemTitle of clipboard.items) {
          await addItem.mutateAsync({
            checklistId: newChecklistId,
            data: { title: itemTitle },
          });
        }
      }

      localStorage.removeItem(CLIPBOARD_KEY);
      setClipboard(null);
      toast.success(`Checklist "${clipboard.title}" importado`);
    } catch {
      toast.error('Não foi possível importar o checklist.');
    }
  }, [clipboard, createChecklist, addItem]);

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
        onError: () =>
          toast.error('Não foi possível criar o checklist. Tente novamente.'),
      }
    );
  }, [newChecklistTitle, createChecklist]);

  return (
    <div className="space-y-3 flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-secondary-foreground/70" />
          <span className="text-sm font-semibold text-secondary-foreground">
            Checklists
          </span>
          {checklists.length > 0 && (
            <span className="text-xs text-secondary-foreground/60">
              ({checklists.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {clipboard && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-secondary-foreground/70 hover:text-secondary-foreground"
              onClick={handleImportChecklist}
              disabled={createChecklist.isPending || addItem.isPending}
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Importar &ldquo;{clipboard.title}&rdquo;
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-secondary-foreground/70 hover:text-secondary-foreground"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Inline create */}
      {showCreate && (
        <div className="flex items-center gap-2">
          <Input
            value={newChecklistTitle}
            onChange={e => setNewChecklistTitle(e.target.value)}
            onKeyDown={e => {
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
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : checklists.length === 0 && !showCreate ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <CheckSquare className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">Nenhum checklist</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checklists.map(cl => (
            <ChecklistSection
              key={cl.id}
              checklist={cl}
              boardId={boardId}
              cardId={cardId}
              onCopy={(data) => setClipboard(data)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
