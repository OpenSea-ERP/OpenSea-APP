import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { volumesService } from '@/services/stock/volumes.service';
import type {
  CreateVolumeRequest,
  VolumeActionRequest,
  VolumesQuery,
} from '@/types/stock';

const VOLUMES_KEY = ['mobile', 'volumes'] as const;
const VOLUME_KEY = (id: string) => ['mobile', 'volume', id] as const;

export function useVolumes(filters?: Pick<VolumesQuery, 'status' | 'search'>) {
  return useInfiniteQuery({
    queryKey: [...VOLUMES_KEY, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await volumesService.listVolumes({
        page: pageParam,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...filters,
      });
      return response;
    },
    getNextPageParam: lastPage => {
      if (!lastPage.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useVolume(id: string) {
  return useQuery({
    queryKey: VOLUME_KEY(id),
    queryFn: async () => {
      const response = await volumesService.getVolume(id);
      return response.volume;
    },
    enabled: !!id,
  });
}

export function useCreateVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVolumeRequest) =>
      volumesService.createVolume(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOLUMES_KEY });
    },
  });
}

export function useAddItemToVolume(volumeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      volumesService.addItemToVolume(volumeId, { itemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOLUME_KEY(volumeId) });
      queryClient.invalidateQueries({ queryKey: VOLUMES_KEY });
    },
  });
}

export function useRemoveItemFromVolume(volumeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      volumesService.removeItemFromVolume(volumeId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOLUME_KEY(volumeId) });
      queryClient.invalidateQueries({ queryKey: VOLUMES_KEY });
    },
  });
}

export function useCloseVolume(volumeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: VolumeActionRequest) =>
      volumesService.closeVolume(volumeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOLUME_KEY(volumeId) });
      queryClient.invalidateQueries({ queryKey: VOLUMES_KEY });
    },
  });
}
