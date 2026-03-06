'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useCreateBoard } from '@/hooks/tasks/use-boards';
import {
  BOARD_GRADIENTS,
  setGradientForBoard,
} from '@/components/tasks/shared/board-gradients';
import type { BoardType, BoardVisibility } from '@/types/tasks';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoardCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardCreateDialog({ open, onOpenChange }: BoardCreateDialogProps) {
  const router = useRouter();
  const createBoard = useCreateBoard();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<BoardType>('PERSONAL');
  const [visibility, setVisibility] = useState<BoardVisibility>('PRIVATE');
  const [selectedGradient, setSelectedGradient] = useState(BOARD_GRADIENTS[0].id);

  function resetForm() {
    setName('');
    setDescription('');
    setType('PERSONAL');
    setVisibility('PRIVATE');
    setSelectedGradient(BOARD_GRADIENTS[0].id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('O nome do quadro é obrigatório.');
      return;
    }

    try {
      const result = await createBoard.mutateAsync({
        title: name.trim(),
        description: description.trim() || null,
        type,
        visibility,
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

  const activeGradient = BOARD_GRADIENTS.find((g) => g.id === selectedGradient) ?? BOARD_GRADIENTS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0">
        {/* Gradient preview header */}
        <div
          className="h-20 w-full relative"
          style={activeGradient.style}
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex items-end h-full px-6 pb-3">
            <span className="text-white font-bold text-lg drop-shadow-sm truncate">
              {name || 'Novo Quadro'}
            </span>
          </div>
        </div>

        <div className="px-6 pt-2 pb-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Novo Quadro</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <label htmlFor="board-name" className="text-sm font-medium">
                Nome <span className="text-red-500">*</span>
              </label>
              <Input
                id="board-name"
                placeholder="Ex: Projeto Website"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Gradient Picker */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cor de fundo</label>
              <div className="grid grid-cols-6 gap-2">
                {BOARD_GRADIENTS.map((gradient) => (
                  <button
                    key={gradient.id}
                    type="button"
                    className={cn(
                      'h-8 w-full rounded-md transition-all duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      selectedGradient === gradient.id && 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110',
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

            {/* Descrição */}
            <div className="space-y-1.5">
              <label htmlFor="board-description" className="text-sm font-medium">
                Descrição
              </label>
              <Textarea
                id="board-description"
                placeholder="Descreva o objetivo deste quadro..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Tipo + Visibilidade (inline) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={type} onValueChange={(v) => setType(v as BoardType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Pessoal</SelectItem>
                    <SelectItem value="TEAM">Equipe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Visibilidade</label>
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as BoardVisibility)}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
