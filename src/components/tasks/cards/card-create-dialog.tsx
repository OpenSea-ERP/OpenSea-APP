'use client';

import { useState } from 'react';
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
import { useBoard } from '@/hooks/tasks/use-boards';
import { useCreateCard } from '@/hooks/tasks/use-cards';
import type { CardPriority } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { PriorityBadge } from '@/components/tasks/shared/priority-badge';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CardCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  defaultColumnId?: string;
}

const PRIORITY_OPTIONS: CardPriority[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export function CardCreateDialog({
  open,
  onOpenChange,
  boardId,
  defaultColumnId,
}: CardCreateDialogProps) {
  const { data: boardData } = useBoard(boardId);
  const createCard = useCreateCard(boardId);

  const board = boardData?.board;
  const columns = board?.columns ?? [];
  const members = board?.members ?? [];

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);
  const firstColumnId = sortedColumns[0]?.id ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId || firstColumnId);
  const [priority, setPriority] = useState<CardPriority>('NONE');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');

  // Update columnId when board loads if no default was set
  if (!columnId && firstColumnId) {
    setColumnId(firstColumnId);
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setColumnId(defaultColumnId || firstColumnId);
    setPriority('NONE');
    setAssigneeId('');
    setDueDate('');
    setEstimatedHours('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('O título do card é obrigatório.');
      return;
    }

    if (!columnId) {
      toast.error('Selecione uma coluna.');
      return;
    }

    try {
      await createCard.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        columnId,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      });

      toast.success('Card criado com sucesso!');
      resetForm();
      onOpenChange(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao criar card.';
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Card</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <label htmlFor="card-title" className="text-sm font-medium">
              Título <span className="text-red-500">*</span>
            </label>
            <Input
              id="card-title"
              placeholder="Ex: Implementar funcionalidade X"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label htmlFor="card-description" className="text-sm font-medium">
              Descrição
            </label>
            <Textarea
              id="card-description"
              placeholder="Descreva o card..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Coluna */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Coluna</label>
            <Select value={columnId} onValueChange={setColumnId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a coluna" />
              </SelectTrigger>
              <SelectContent>
                {sortedColumns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: col.color || '#94a3b8' }}
                      />
                      {col.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Prioridade</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as CardPriority)}>
              <SelectTrigger>
                <SelectValue>
                  <span className="flex items-center gap-1.5">
                    <PriorityBadge priority={priority} />
                    {PRIORITY_CONFIG[priority].label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="flex items-center gap-1.5">
                      <PriorityBadge priority={p} />
                      {PRIORITY_CONFIG[p].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Responsável</label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Sem responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-muted-foreground">Sem responsável</span>
                </SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    <span className="flex items-center gap-2">
                      <MemberAvatar name={m.userName} size="sm" />
                      {m.userName ?? m.userEmail}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prazo + Estimativa row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="card-due-date" className="text-sm font-medium">
                Prazo
              </label>
              <Input
                id="card-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="card-estimated-hours" className="text-sm font-medium">
                Estimativa (horas)
              </label>
              <Input
                id="card-estimated-hours"
                type="number"
                min={0}
                step={0.5}
                placeholder="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createCard.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createCard.isPending}>
              {createCard.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Criar Card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
