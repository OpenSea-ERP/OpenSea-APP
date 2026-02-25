import { storageTrashService } from '@/services/storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const TRASH_KEYS = {
  DELETED_ITEMS: (page: number, limit: number) =>
    ['storage-trash', page, limit] as const,
} as const;

export { TRASH_KEYS as storageTrashKeys };

export function useDeletedItems(
  page = 1,
  limit = 20,
  enabled = true,
) {
  return useQuery({
    queryKey: TRASH_KEYS.DELETED_ITEMS(page, limit),
    queryFn: () => storageTrashService.listDeletedItems(page, limit),
    enabled,
  });
}

export function useRestoreFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => storageTrashService.restoreFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-trash'] });
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
      queryClient.invalidateQueries({ queryKey: ['storage-trash'] });
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
      queryClient.invalidateQueries({ queryKey: ['storage-trash'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
  });
}
