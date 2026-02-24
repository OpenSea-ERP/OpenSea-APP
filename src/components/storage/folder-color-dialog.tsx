'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUpdateFolder } from '@/hooks/storage';
import { toast } from 'sonner';
import type { StorageFolder } from '@/types/storage';
import { FolderIcon } from './folder-icon';

const PRESET_COLORS = [
  '#f59e0b', // amber (default)
  '#ef4444', // red
  '#f97316', // orange
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#78716c', // stone
  '#64748b', // slate
];

interface FolderColorDialogProps {
  folder: StorageFolder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FolderColorDialog({
  folder,
  open,
  onOpenChange,
}: FolderColorDialogProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const updateFolder = useUpdateFolder();

  // Reset selection when dialog opens with a new folder
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && folder) {
      setSelectedColor(folder.color);
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!folder) return;

    try {
      await updateFolder.mutateAsync({
        id: folder.id,
        data: { color: selectedColor },
      });
      toast.success('Cor da pasta atualizada');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao atualizar a cor da pasta');
    }
  };

  // Build a preview folder with the selected color
  const previewFolder: StorageFolder | null = folder
    ? { ...folder, color: selectedColor }
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cor da pasta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preview */}
          {previewFolder && (
            <div className="flex items-center justify-center py-3">
              <div className="flex flex-col items-center gap-2">
                <FolderIcon folder={previewFolder} size="lg" />
                <span className="text-sm text-muted-foreground">
                  {folder?.name}
                </span>
              </div>
            </div>
          )}

          {/* Color grid */}
          <div className="grid grid-cols-7 gap-2 justify-items-center">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all cursor-pointer',
                  'hover:scale-110',
                  selectedColor === color
                    ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-offset-background ring-gray-400 dark:ring-gray-500'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>

          {/* Remove color option */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setSelectedColor(null)}
              disabled={selectedColor === null}
            >
              Remover cor personalizada
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateFolder.isPending}>
            {updateFolder.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
