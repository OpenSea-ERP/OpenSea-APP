'use client';

import { Trash2, RotateCcw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDeletedItems,
  useRestoreFile,
  useRestoreFolder,
} from '@/hooks/storage';
import { cn } from '@/lib/utils';
import { formatFileSize } from './utils';
import { FileTypeIcon } from './file-type-icon';
import { FolderIcon } from './folder-icon';
import { EmptyTrashDialog } from './empty-trash-dialog';
import { toast } from 'sonner';
import { useState } from 'react';
import type { FileTypeCategory } from '@/types/storage';

const TRASH_PAGE_LIMIT = 20;

interface TrashViewProps {
  className?: string;
}

export function TrashView({ className }: TrashViewProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDeletedItems(page, TRASH_PAGE_LIMIT);
  const restoreFile = useRestoreFile();
  const restoreFolder = useRestoreFolder();
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);

  const handleRestoreFile = async (fileId: string, name: string) => {
    try {
      await restoreFile.mutateAsync(fileId);
      toast.success(`Arquivo "${name}" restaurado`);
    } catch {
      toast.error('Falha ao restaurar arquivo');
    }
  };

  const handleRestoreFolder = async (folderId: string, name: string) => {
    try {
      await restoreFolder.mutateAsync(folderId);
      toast.success(`Pasta "${name}" restaurada`);
    } catch {
      toast.error('Falha ao restaurar pasta');
    }
  };

  if (isLoading) {
    return (
      <div className={cn('p-6 space-y-3', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  const totalItems = (data?.totalFiles ?? 0) + (data?.totalFolders ?? 0);

  if (totalItems === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-16 text-center',
          className,
        )}
      >
        <Trash2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          A lixeira está vazia
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Itens excluídos aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Trash2 className="h-4 w-4" />
          <span>
            {totalItems} {totalItems === 1 ? 'item' : 'itens'} na lixeira
          </span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setEmptyTrashOpen(true)}
        >
          Esvaziar lixeira
        </Button>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {/* Deleted folders */}
        {data?.folders.map((folder) => (
          <div
            key={folder.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50/50 dark:bg-white/5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <FolderIcon
              folder={folder}
              size="sm"
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate line-through text-gray-600 dark:text-gray-400">
                {folder.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Pasta · {folder.path}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              onClick={() => handleRestoreFolder(folder.id, folder.name)}
              disabled={restoreFolder.isPending}
            >
              {restoreFolder.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1" />
              )}
              Restaurar
            </Button>
          </div>
        ))}

        {/* Deleted files */}
        {data?.files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50/50 dark:bg-white/5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <FileTypeIcon
              fileType={file.fileType as FileTypeCategory}
              size={20}
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate line-through text-gray-600 dark:text-gray-400">
                {file.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatFileSize(file.size)} · {file.path}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              onClick={() => handleRestoreFile(file.id, file.name)}
              disabled={restoreFile.isPending}
            >
              {restoreFile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1" />
              )}
              Restaurar
            </Button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalItems > TRASH_PAGE_LIMIT && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Página {page} de {Math.ceil(totalItems / TRASH_PAGE_LIMIT)}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= Math.ceil(totalItems / TRASH_PAGE_LIMIT)}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <EmptyTrashDialog
        open={emptyTrashOpen}
        onOpenChange={setEmptyTrashOpen}
      />
    </div>
  );
}
