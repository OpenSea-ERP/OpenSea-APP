'use client';

import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateFolder } from '@/hooks/storage';
import { toast } from 'sonner';

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
  module?: string;
  entityType?: string;
  entityId?: string;
}

const COLOR_OPTIONS = [
  null,
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

export function NewFolderDialog({
  open,
  onOpenChange,
  parentId,
  module,
  entityType,
  entityId,
}: NewFolderDialogProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<string | null>(null);

  const createFolderMutation = useCreateFolder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('O nome da pasta é obrigatório');
      return;
    }

    try {
      await createFolderMutation.mutateAsync({
        name: trimmedName,
        parentId: parentId ?? undefined,
        icon,
        color: color ?? undefined,
        module,
        entityType,
        entityId,
      });

      toast.success('Pasta criada com sucesso');
      handleClose();
    } catch {
      toast.error('Erro ao criar a pasta');
    }
  };

  const handleClose = () => {
    setName('');
    setIcon(undefined);
    setColor(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            Nova pasta
          </DialogTitle>
          <DialogDescription>
            Crie uma nova pasta para organizar seus arquivos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-folder-name" className="text-sm font-medium">Nome</label>
            <Input
              id="new-folder-name"
              placeholder="Nome da pasta"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cor (opcional)</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    color === c
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-gray-300 dark:border-slate-600 hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: c ?? '#f59e0b',
                    opacity: c === null ? 0.4 : 1,
                  }}
                  onClick={() => setColor(c)}
                  title={c === null ? 'Padrão' : c}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createFolderMutation.isPending || !name.trim()}
            >
              {createFolderMutation.isPending ? 'Criando...' : 'Criar pasta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
