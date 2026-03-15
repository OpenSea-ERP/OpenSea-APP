import { volumesService } from '@/services/stock';
import type {
  CreateVolumeRequest,
  UpdateVolumeRequest,
  AddItemToVolumeRequest,
  VolumeActionRequest,
  VolumesQuery,
} from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const VOLUME_QUERY_KEYS = {
  VOLUMES: ['volumes'],
  VOLUME: (id: string) => ['volumes', id],
  ROMANEIO: (id: string) => ['volumes', id, 'romaneio'],
} as const;

// GET /v1/volumes - Lista todos os volumes
export function useVolumes(query?: VolumesQuery) {
  return useQuery({
    queryKey: [...VOLUME_QUERY_KEYS.VOLUMES, query],
    queryFn: () => volumesService.listVolumes(query),
  });
}

// GET /v1/volumes/:id - Busca um volume específico
export function useVolume(id: string) {
  return useQuery({
    queryKey: VOLUME_QUERY_KEYS.VOLUME(id),
    queryFn: () => volumesService.getVolume(id),
    enabled: !!id,
  });
}

// GET /v1/volumes/:id/romaneio - Busca o romaneio de um volume
export function useVolumeRomaneio(id: string) {
  return useQuery({
    queryKey: VOLUME_QUERY_KEYS.ROMANEIO(id),
    queryFn: () => volumesService.getRomaneio(id),
    enabled: !!id,
  });
}

// POST /v1/volumes - Cria um novo volume
export function useCreateVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVolumeRequest) =>
      volumesService.createVolume(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: VOLUME_QUERY_KEYS.VOLUMES });
    },
  });
}

// PATCH /v1/volumes/:id - Atualiza um volume
export function useUpdateVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVolumeRequest }) =>
      volumesService.updateVolume(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: VOLUME_QUERY_KEYS.VOLUMES });
      await queryClient.invalidateQueries({
        queryKey: VOLUME_QUERY_KEYS.VOLUME(variables.id),
      });
    },
  });
}

// DELETE /v1/volumes/:id - Deleta um volume
export function useDeleteVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => volumesService.deleteVolume(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: VOLUME_QUERY_KEYS.VOLUMES });
    },
  });
}

// POST /v1/volumes/:id/items - Adiciona item ao volume
export function useAddItemToVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      volumeId,
      data,
    }: {
      volumeId: string;
      data: AddItemToVolumeRequest;
    }) => volumesService.addItemToVolume(volumeId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: VOLUME_QUERY_KEYS.VOLUMES });
      await queryClient.invalidateQueries({
        queryKey: VOLUME_QUERY_KEYS.VOLUME(variables.volumeId),
      });
      // Also invalidate items as they may have changed
      await queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

// DELETE /v1/volumes/:volumeId/items/:itemId - Remove item do volume
export function useRemoveItemFromVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ volumeId, itemId }: { volumeId: string; itemId: string }) =>
      volumesService.removeItemFromVolume(volumeId, itemId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: VOLUME_QUERY_KEYS.VOLUMES });
      await queryClient.invalidateQueries({
        queryKey: VOLUME_QUERY_KEYS.VOLUME(variables.volumeId),
      });
      await queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

// POST /v1/volumes/:id/close - Fecha um volume
export function useCloseVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: VolumeActionRequest }) =>
      volumesService.closeVolume(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: VOLUME_QUERY_KEYS.VOLUMES });
      await queryClient.invalidateQueries({
        queryKey: VOLUME_QUERY_KEYS.VOLUME(variables.id),
      });
      // Movements may have been created
      await queryClient.invalidateQueries({ queryKey: ['movements'] });
    },
  });
}

// POST /v1/volumes/:id/reopen - Reabre um volume
export function useReopenVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: VolumeActionRequest }) =>
      volumesService.reopenVolume(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: VOLUME_QUERY_KEYS.VOLUMES });
      await queryClient.invalidateQueries({
        queryKey: VOLUME_QUERY_KEYS.VOLUME(variables.id),
      });
    },
  });
}

// POST /v1/volumes/:id/deliver - Entrega um volume
export function useDeliverVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: VolumeActionRequest }) =>
      volumesService.deliverVolume(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: VOLUME_QUERY_KEYS.VOLUMES });
      await queryClient.invalidateQueries({
        queryKey: VOLUME_QUERY_KEYS.VOLUME(variables.id),
      });
    },
  });
}

// POST /v1/volumes/:id/return - Retorna um volume
export function useReturnVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: VolumeActionRequest }) =>
      volumesService.returnVolume(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: VOLUME_QUERY_KEYS.VOLUMES });
      await queryClient.invalidateQueries({
        queryKey: VOLUME_QUERY_KEYS.VOLUME(variables.id),
      });
      // Items may have returned to stock
      await queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

// POST /v1/volumes/scan - Escaneia código de volume
export function useScanVolume() {
  return useMutation({
    mutationFn: (code: string) => volumesService.scanVolume(code),
  });
}
