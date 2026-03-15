import { labelsService } from '@/services/stock';
import type {
  GenerateSerializedLabelsRequest,
  LinkLabelRequest,
  LabelsQuery,
  GenerateLabelRequest,
} from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const LABEL_QUERY_KEYS = {
  SERIALIZED_LABELS: ['serialized-labels'],
  SERIALIZED_LABEL: (code: string) => ['serialized-labels', code],
} as const;

// ============================================
// SERIALIZED LABELS
// ============================================

// GET /v1/serialized-labels - Lista etiquetas serializadas
export function useSerializedLabels(query?: LabelsQuery) {
  return useQuery({
    queryKey: [...LABEL_QUERY_KEYS.SERIALIZED_LABELS, query],
    queryFn: () => labelsService.listSerializedLabels(query),
  });
}

// GET /v1/serialized-labels/:code - Busca uma etiqueta específica
export function useSerializedLabel(code: string) {
  return useQuery({
    queryKey: LABEL_QUERY_KEYS.SERIALIZED_LABEL(code),
    queryFn: () => labelsService.getSerializedLabel(code),
    enabled: !!code,
  });
}

// POST /v1/serialized-labels/generate - Gera etiquetas serializadas
export function useGenerateSerializedLabels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateSerializedLabelsRequest) =>
      labelsService.generateSerializedLabels(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: LABEL_QUERY_KEYS.SERIALIZED_LABELS,
      });
    },
  });
}

// POST /v1/serialized-labels/:code/link - Vincula uma etiqueta a uma entidade
export function useLinkSerializedLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, data }: { code: string; data: LinkLabelRequest }) =>
      labelsService.linkSerializedLabel(code, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: LABEL_QUERY_KEYS.SERIALIZED_LABELS,
      });
      await queryClient.invalidateQueries({
        queryKey: LABEL_QUERY_KEYS.SERIALIZED_LABEL(variables.code),
      });
    },
  });
}

// POST /v1/serialized-labels/:code/void - Invalida uma etiqueta
export function useVoidSerializedLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => labelsService.voidSerializedLabel(code),
    onSuccess: async (_, code) => {
      await queryClient.invalidateQueries({
        queryKey: LABEL_QUERY_KEYS.SERIALIZED_LABELS,
      });
      await queryClient.invalidateQueries({
        queryKey: LABEL_QUERY_KEYS.SERIALIZED_LABEL(code),
      });
    },
  });
}

// ============================================
// LABEL GENERATION (for printing)
// ============================================

// POST /v1/labels/generate - Gera etiquetas para impressão
export function useGenerateLabels() {
  return useMutation({
    mutationFn: (data: GenerateLabelRequest) =>
      labelsService.generateLabels(data),
  });
}

// Convenience hooks for specific label types
export function useGenerateItemLabels() {
  return useMutation({
    mutationFn: ({
      itemIds,
      options,
    }: {
      itemIds: string[];
      options?: GenerateLabelRequest['options'];
    }) => labelsService.generateItemLabels(itemIds, options),
  });
}

export function useGenerateVariantLabels() {
  return useMutation({
    mutationFn: ({
      variantIds,
      options,
    }: {
      variantIds: string[];
      options?: GenerateLabelRequest['options'];
    }) => labelsService.generateVariantLabels(variantIds, options),
  });
}

export function useGenerateLocationLabels() {
  return useMutation({
    mutationFn: ({
      locationIds,
      options,
    }: {
      locationIds: string[];
      options?: GenerateLabelRequest['options'];
    }) => labelsService.generateLocationLabels(locationIds, options),
  });
}

export function useGenerateVolumeLabels() {
  return useMutation({
    mutationFn: ({
      volumeIds,
      options,
    }: {
      volumeIds: string[];
      options?: GenerateLabelRequest['options'];
    }) => labelsService.generateVolumeLabels(volumeIds, options),
  });
}
