'use client';

import { useCallback, useState } from 'react';
import { ChevronRight, Folder, FolderInput, Home } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { StorageFolder } from '@/types/storage';
import { useFolderContents } from '@/hooks/storage';
import { useMoveFolder, useMoveFile } from '@/hooks/storage';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MoveItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemType: 'folder' | 'file';
  itemName: string;
  currentFolderId: string | null;
}

export function MoveItemDialog({
  open,
  onOpenChange,
  itemId,
  itemType,
  itemName,
  currentFolderId,
}: MoveItemDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [browseFolderId, setBrowseFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string | null; name: string }>
  >([{ id: null, name: 'Início' }]);

  const { data: contents, isLoading } = useFolderContents(browseFolderId);
  const moveFolderMutation = useMoveFolder();
  const moveFileMutation = useMoveFile();

  const handleNavigate = useCallback((folder: StorageFolder) => {
    setBrowseFolderId(folder.id);
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedFolderId(null);
  }, []);

  const handleNavigateToBreadcrumb = useCallback(
    (index: number) => {
      const target = folderPath[index];
      setBrowseFolderId(target.id);
      setFolderPath(prev => prev.slice(0, index + 1));
      setSelectedFolderId(null);
    },
    [folderPath]
  );

  const handleMove = async () => {
    // O destino pode ser o folder selecionado, ou se nenhum selecionado, o browse folder atual
    const targetId = selectedFolderId ?? browseFolderId;

    if (!targetId) {
      toast.error('Selecione uma pasta de destino');
      return;
    }

    if (targetId === currentFolderId) {
      toast.error('O item já está nesta pasta');
      return;
    }

    // Não permitir mover uma pasta para si mesma
    if (itemType === 'folder' && targetId === itemId) {
      toast.error('Não é possível mover uma pasta para dentro de si mesma');
      return;
    }

    try {
      if (itemType === 'folder') {
        await moveFolderMutation.mutateAsync({
          id: itemId,
          data: { parentId: targetId },
        });
      } else {
        await moveFileMutation.mutateAsync({
          id: itemId,
          data: { folderId: targetId },
        });
      }

      toast.success('Item movido com sucesso');
      handleClose();
    } catch {
      toast.error('Erro ao mover o item');
    }
  };

  const handleClose = () => {
    setSelectedFolderId(null);
    setBrowseFolderId(null);
    setFolderPath([{ id: null, name: 'Início' }]);
    onOpenChange(false);
  };

  const isMovePending =
    moveFolderMutation.isPending || moveFileMutation.isPending;

  // Filtrar a pasta do item ao mover uma pasta (não pode mover para si mesma)
  const availableFolders =
    contents?.folders.filter(f => {
      if (itemType === 'folder' && f.id === itemId) return false;
      return true;
    }) ?? [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="w-5 h-5" />
            Mover &quot;{itemName}&quot;
          </DialogTitle>
          <DialogDescription>Selecione a pasta de destino</DialogDescription>
        </DialogHeader>

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1 text-sm overflow-x-auto py-1">
          {folderPath.map((item, index) => (
            <span key={index} className="contents">
              {index > 0 && (
                <ChevronRight className="w-3 h-3 shrink-0 text-gray-400" />
              )}
              <button
                className={cn(
                  'shrink-0 px-1.5 py-0.5 rounded text-sm transition-colors',
                  index === folderPath.length - 1
                    ? 'font-medium text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                )}
                onClick={() => handleNavigateToBreadcrumb(index)}
              >
                {index === 0 ? (
                  <Home className="w-3.5 h-3.5 inline" />
                ) : (
                  item.name
                )}
              </button>
            </span>
          ))}
        </div>

        {/* Folder tree */}
        <ScrollArea className="h-64 border rounded-lg border-gray-200 dark:border-slate-700">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : availableFolders.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8 text-sm text-gray-500 dark:text-gray-400">
              Nenhuma subpasta encontrada
            </div>
          ) : (
            <div className="p-1">
              {availableFolders.map(folder => (
                <div
                  key={folder.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    selectedFolderId === folder.id
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  )}
                  onClick={() => setSelectedFolderId(folder.id)}
                  onDoubleClick={() => handleNavigate(folder)}
                >
                  <Folder
                    className={cn(
                      'w-5 h-5 shrink-0',
                      folder.color ? '' : 'text-amber-500 dark:text-amber-400'
                    )}
                    style={folder.color ? { color: folder.color } : undefined}
                    fill="currentColor"
                    strokeWidth={1}
                  />
                  <span className="text-sm truncate flex-1">{folder.name}</span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handleMove} disabled={isMovePending}>
            {isMovePending ? 'Movendo...' : 'Mover para cá'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
