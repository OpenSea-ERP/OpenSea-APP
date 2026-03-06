'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useLabels,
  useCreateLabel,
  useUpdateLabel,
  useDeleteLabel,
} from '@/hooks/tasks/use-labels';
import { LabelBadge } from '@/components/tasks/shared/label-badge';
import { toast } from 'sonner';
import { Loader2, Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const LABEL_COLORS = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Cinza', value: '#6b7280' },
];

interface BoardLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

export function BoardLabelsDialog({
  open,
  onOpenChange,
  boardId,
}: BoardLabelsDialogProps) {
  const { data: labelsData } = useLabels(boardId);
  const createLabel = useCreateLabel(boardId);
  const updateLabel = useUpdateLabel(boardId);
  const deleteLabel = useDeleteLabel(boardId);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_COLORS[0].value);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');

  const labels = Array.isArray(labelsData) ? labelsData : [];

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error('O nome da etiqueta é obrigatório.');
      return;
    }

    try {
      await createLabel.mutateAsync({
        name: newName.trim(),
        color: newColor,
      });
      setNewName('');
      toast.success('Etiqueta criada!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao criar etiqueta.';
      toast.error(message);
    }
  }

  async function handleUpdate(labelId: string) {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await updateLabel.mutateAsync({
        labelId,
        data: { name: editingName.trim(), color: editingColor },
      });
      setEditingId(null);
      toast.success('Etiqueta atualizada!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar etiqueta.';
      toast.error(message);
    }
  }

  async function handleDelete(labelId: string) {
    try {
      await deleteLabel.mutateAsync(labelId);
      toast.success('Etiqueta removida!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao remover etiqueta.';
      toast.error(message);
    }
  }

  function startEditing(label: { id: string; name: string; color: string }) {
    setEditingId(label.id);
    setEditingName(label.name);
    setEditingColor(label.color);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Etiquetas do Quadro</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current labels */}
          <div className="space-y-2">
            {labels.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma etiqueta criada.
              </p>
            ) : (
              labels.map((label) => (
                <div key={label.id} className="space-y-2">
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <LabelBadge name={label.name} color={label.color} className="text-xs" />
                    <div className="flex-1" />

                    {editingId !== label.id && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEditing(label)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(label.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Inline edit */}
                  {editingId === label.id && (
                    <div className="space-y-2 rounded-md border border-dashed p-3">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(label.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <div className="flex items-center gap-1.5">
                        {LABEL_COLORS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            title={c.name}
                            className={cn(
                              'h-6 w-6 rounded-full transition-all ring-offset-1 ring-offset-background',
                              editingColor === c.value
                                ? 'ring-2 ring-primary scale-110'
                                : 'hover:scale-105',
                            )}
                            style={{ backgroundColor: c.value }}
                            onClick={() => setEditingColor(c.value)}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleUpdate(label.id)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Create label */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Nova etiqueta
            </h3>

            <div className="space-y-2">
              <Input
                placeholder="Nome da etiqueta"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />

              <div className="flex items-center gap-1.5">
                {LABEL_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    className={cn(
                      'h-6 w-6 rounded-full transition-all ring-offset-1 ring-offset-background',
                      newColor === c.value
                        ? 'ring-2 ring-primary scale-110'
                        : 'hover:scale-105',
                    )}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setNewColor(c.value)}
                  />
                ))}
              </div>

              <Button
                onClick={handleCreate}
                disabled={createLabel.isPending || !newName.trim()}
                size="sm"
              >
                {createLabel.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Criar Etiqueta
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
