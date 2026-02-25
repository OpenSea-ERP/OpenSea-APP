import { storageTrashService } from '@/services/storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const TRASH_KEYS = {
  DELETED_ITEMS: ['storage-trash'] as const,
} as const;

export { TRASH_KEYS as storageTrashKeys };

export function useDeletedItems(enabled = true) {
  return useQuery({
    queryKey: TRASH_KEYS.DELETED_ITEMS,
    queryFn: () => storageTrashService.listDeletedItems(1, 100),
    enabled,
  });
}

export function useRestoreFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => storageTrashService.restoreFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRASH_KEYS.DELETED_ITEMS });
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
  });
}

export function useRestoreFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string) =>
      storageTrashService.restoreFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRASH_KEYS.DELETED_ITEMS });
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => storageTrashService.emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRASH_KEYS.DELETED_ITEMS });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
  });
}
