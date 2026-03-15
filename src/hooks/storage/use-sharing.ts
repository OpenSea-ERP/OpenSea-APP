import { storageSharingService } from '@/services/storage';
import type { CreateShareLinkRequest } from '@/types/storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const SHARING_KEYS = {
  LINKS: (fileId: string) => ['storage-share-links', fileId] as const,
} as const;

export { SHARING_KEYS as storageSharingKeys };

export function useShareLinks(fileId: string | null) {
  return useQuery({
    queryKey: SHARING_KEYS.LINKS(fileId ?? ''),
    queryFn: () => storageSharingService.listShareLinks(fileId!),
    enabled: !!fileId,
  });
}

export function useCreateShareLink(fileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShareLinkRequest) =>
      storageSharingService.createShareLink(fileId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SHARING_KEYS.LINKS(fileId),
      });
    },
  });
}

export function useRevokeShareLink(fileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) =>
      storageSharingService.revokeShareLink(linkId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SHARING_KEYS.LINKS(fileId),
      });
    },
  });
}
