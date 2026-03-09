'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBoard, useUpdateBoard } from '@/hooks/tasks/use-boards';
import {
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn,
  useReorderColumns,
} from '@/hooks/tasks/use-columns';
import type { BoardVisibility, Column } from '@/types/tasks';
import { toast } from 'sonner';
import {
  Loader2,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BOARD_GRADIENTS,
  getGradientForBoard,
  setGradientForBoard,
} from '@/components/tasks/shared/board-gradients';

interface BoardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

export function BoardSettingsDialog({
  open,
  onOpenChange,
  boardId,
}: BoardSettingsDialogProps) {
  const { data: boardData } = useBoard(boardId);
  const updateBoard = useUpdateBoard();
  const createColumn = useCreateColumn(boardId);
  const updateColumn = useUpdateColumn(boardId);
  const deleteColumn = useDeleteColumn(boardId);
  const reorderColumns = useReorderColumns(boardId);

  const board = boardData?.board;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<BoardVisibility>('PRIVATE');

  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);

  useEffect(() => {
    if (board) {
      setName(board.title);
      setDescription(board.description ?? '');
      setVisibility(board.visibility);
    }
  }, [board]);

  const columns = board?.columns
    ? [...board.columns].sort((a, b) => a.position - b.position)
    : [];

  async function handleSave() {
    if (!name.trim()) {
      toast.error('O nome do quadro é obrigatório.');
      return;
    }

    try {
      await updateBoard.mutateAsync({
        boardId,
        data: {
          title: name.trim(),
          description: description.trim() || null,
          visibility,
        },
      });
      toast.success('Quadro atualizado com sucesso!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar quadro.';
      toast.error(message);
    }
  }

  async function handleAddColumn() {
    if (!newColumnName.trim()) return;

    try {
      await createColumn.mutateAsync({
        title: newColumnName.trim(),
        position: columns.length,
      });
      setNewColumnName('');
      toast.success('Coluna adicionada!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao adicionar coluna.';
      toast.error(message);
    }
  }

  async function handleUpdateColumnName(columnId: string) {
    if (!editingColumnName.trim()) {
      setEditingColumnId(null);
      return;
    }

    try {
      await updateColumn.mutateAsync({
        columnId,
        data: { title: editingColumnName.trim() },
      });
      setEditingColumnId(null);
      toast.success('Coluna atualizada!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar coluna.';
      toast.error(message);
    }
  }

  async function handleDeleteColumn(columnId: string) {
    try {
      await deleteColumn.mutateAsync(columnId);
      setDeletingColumnId(null);
      toast.success('Coluna removida!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao remover coluna.';
      toast.error(message);
    }
  }

  async function handleMoveColumn(column: Column, direction: 'up' | 'down') {
    const currentIndex = columns.findIndex(c => c.id === column.id);
    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= columns.length) return;

    const reordered = [...columns];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      await reorderColumns.mutateAsync({
        columnIds: reordered.map(c => c.id),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao reordenar colunas.';
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações do Quadro</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nome */}
          <div className="space-y-1.5">
            <label htmlFor="settings-name" className="text-sm font-medium">
              Nome <span className="text-red-500">*</span>
            </label>
            <Input
              id="settings-name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-description"
              className="text-sm font-medium"
            >
              Descrição
            </label>
            <Textarea
              id="settings-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Visibilidade */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Visibilidade</label>
            <Select
              value={visibility}
              onValueChange={v => setVisibility(v as BoardVisibility)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Privado</SelectItem>
                <SelectItem value="SHARED">Compartilhado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gradiente */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cor de fundo</label>
            <div className="grid grid-cols-6 gap-2">
              {BOARD_GRADIENTS.map(gradient => {
                const current = getGradientForBoard(boardId, board?.gradientId);
                const isSelected = current.id === gradient.id;
                return (
                  <button
                    key={gradient.id}
                    type="button"
                    className={cn(
                      'h-8 w-full rounded-md transition-all duration-150 hover:scale-110',
                      isSelected &&
                        'ring-2 ring-white ring-offset-2 ring-offset-background scale-110'
                    )}
                    style={gradient.style}
                    onClick={() => {
                      setGradientForBoard(boardId, gradient.id);
                      updateBoard.mutate(
                        { boardId, data: { gradientId: gradient.id } },
                        { onSuccess: () => toast.success('Cor atualizada!') }
                      );
                    }}
                  >
                    {isSelected && (
                      <Check className="h-4 w-4 text-white mx-auto drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colunas */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Colunas</h3>

            <div className="space-y-1">
              {columns.map((column, index) => (
                <div
                  key={column.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-2"
                >
                  {/* Color dot */}
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: column.color ?? '#6b7280' }}
                  />

                  {/* Name or edit input */}
                  {editingColumnId === column.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        value={editingColumnName}
                        onChange={e => setEditingColumnName(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter')
                            handleUpdateColumnName(column.id);
                          if (e.key === 'Escape') setEditingColumnId(null);
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleUpdateColumnName(column.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditingColumnId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm flex-1">{column.title}</span>

                      <div className="flex items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={index === 0}
                          onClick={() => handleMoveColumn(column, 'up')}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={index === columns.length - 1}
                          onClick={() => handleMoveColumn(column, 'down')}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingColumnId(column.id);
                            setEditingColumnName(column.title);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        {deletingColumnId === column.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              onClick={() => handleDeleteColumn(column.id)}
                            >
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setDeletingColumnId(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeletingColumnId(column.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add column */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nome da nova coluna"
                value={newColumnName}
                onChange={e => setNewColumnName(e.target.value)}
                className="text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddColumn();
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddColumn}
                disabled={!newColumnName.trim() || createColumn.isPending}
              >
                {createColumn.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateBoard.isPending}
          >
            Fechar
          </Button>
          <Button onClick={handleSave} disabled={updateBoard.isPending}>
            {updateBoard.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
