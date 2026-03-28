'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCreateBoard } from '@/hooks/tasks/use-boards';
import {
  BOARD_GRADIENTS,
  setGradientForBoard,
} from '@/components/tasks/shared/board-gradients';
import { toast } from 'sonner';
import { Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoardCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, creates a TEAM board linked to this team */
  teamId?: string;
}

export function BoardCreateDialog({
  open,
  onOpenChange,
  teamId,
}: BoardCreateDialogProps) {
  const router = useRouter();
  const createBoard = useCreateBoard();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(
    BOARD_GRADIENTS[0].id
  );

  function resetForm() {
    setTitle('');
    setDescription('');
    setSelectedGradient(BOARD_GRADIENTS[0].id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('O título do quadro é obrigatório.');
      return;
    }

    try {
      const result = await createBoard.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        type: teamId ? 'TEAM' : 'PERSONAL',
        teamId: teamId ?? undefined,
        visibility: teamId ? 'SHARED' : 'PRIVATE',
      });

      setGradientForBoard(result.board.id, selectedGradient);
      toast.success('Quadro criado com sucesso!');
      resetForm();
      onOpenChange(false);
      router.push(`/tasks/${result.board.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao criar quadro.';
      toast.error(message);
    }
  }

  const activeGradient =
    BOARD_GRADIENTS.find(g => g.id === selectedGradient) ?? BOARD_GRADIENTS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Novo Quadro</DialogTitle>
        {/* Gradient preview header */}
        <div
          className="h-20 w-full relative shrink-0"
          style={activeGradient.style}
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex items-center justify-between h-full px-6">
            <span className="text-white font-bold text-lg drop-shadow-sm truncate">
              {title || 'Novo Quadro'}
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-white/80 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <label htmlFor="board-title" className="text-sm font-medium">
              Título <span className="text-red-500">*</span>
            </label>
            <Input
              id="board-title"
              placeholder="Ex: Projeto Website"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label htmlFor="board-description" className="text-sm font-medium">
              Descrição
            </label>
            <Textarea
              id="board-description"
              placeholder="Descreva o objetivo deste quadro..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Gradient Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cor de fundo</label>
            <div className="grid grid-cols-6 gap-2">
              {BOARD_GRADIENTS.map(gradient => (
                <button
                  key={gradient.id}
                  type="button"
                  className={cn(
                    'h-8 w-full rounded-md transition-all duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    selectedGradient === gradient.id &&
                      'ring-2 ring-white ring-offset-2 ring-offset-background scale-110'
                  )}
                  style={gradient.style}
                  onClick={() => setSelectedGradient(gradient.id)}
                >
                  {selectedGradient === gradient.id && (
                    <Check className="h-4 w-4 text-white mx-auto drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createBoard.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createBoard.isPending}>
              {createBoard.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Criar Quadro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
