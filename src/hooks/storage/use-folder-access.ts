import { storageAccessService } from '@/services/storage';
import type { SetFolderAccessRequest } from '@/types/storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  ACCESS: (folderId: string) => ['storage-folder-access', folderId],
} as const;

export { QUERY_KEYS as storageAccessKeys };

// GET /v1/storage/folders/:id/access - Lista regras de acesso
export function useFolderAccess(folderId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ACCESS(folderId),
    queryFn: () => storageAccessService.listAccess(folderId),
    enabled: !!folderId,
  });
}

// POST /v1/storage/folders/:id/access - Define regra de acesso
export function useSetFolderAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      folderId,
      data,
    }: {
      folderId: string;
      data: SetFolderAccessRequest;
    }) => storageAccessService.setAccess(folderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ACCESS(variables.folderId),
      });
    },
  });
}

// DELETE /v1/storage/folders/:id/access/:ruleId - Remove regra de acesso
export function useRemoveFolderAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, ruleId }: { folderId: string; ruleId: string }) =>
      storageAccessService.removeAccess(folderId, ruleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ACCESS(variables.folderId),
      });
    },
  });
}
