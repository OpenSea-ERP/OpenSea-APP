'use client';

import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
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
import { useRenameFolder, useRenameFile } from '@/hooks/storage';
import { toast } from 'sonner';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemType: 'folder' | 'file';
  currentName: string;
}

export function RenameDialog({
  open,
  onOpenChange,
  itemId,
  itemType,
  currentName,
}: RenameDialogProps) {
  const [name, setName] = useState(currentName);
  const renameFolderMutation = useRenameFolder();
  const renameFileMutation = useRenameFile();

  useEffect(() => {
    if (open) {
      setName(currentName);
    }
  }, [open, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('O nome é obrigatório');
      return;
    }

    if (trimmedName === currentName) {
      onOpenChange(false);
      return;
    }

    try {
      if (itemType === 'folder') {
        await renameFolderMutation.mutateAsync({
          id: itemId,
          data: { name: trimmedName },
        });
      } else {
        await renameFileMutation.mutateAsync({
          id: itemId,
          data: { name: trimmedName },
        });
      }

      toast.success(
        itemType === 'folder'
          ? 'Pasta renomeada com sucesso'
          : 'Arquivo renomeado com sucesso'
      );
      onOpenChange(false);
    } catch {
      toast.error('Erro ao renomear');
    }
  };

  const isPending =
    renameFolderMutation.isPending || renameFileMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Renomear {itemType === 'folder' ? 'pasta' : 'arquivo'}
          </DialogTitle>
          <DialogDescription>
            Insira o novo nome para &quot;{currentName}&quot;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Novo nome"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !name.trim()}
            >
              {isPending ? 'Renomeando...' : 'Renomear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
