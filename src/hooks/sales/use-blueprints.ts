import { blueprintsService } from '@/services/sales';
import type {
  BlueprintStatus,
  CreateBlueprintRequest,
  UpdateBlueprintRequest,
} from '@/types/sales';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface BlueprintsFilters {
  search?: string;
  pipelineId?: string;
  status?: BlueprintStatus;
}

const QUERY_KEYS = {
  BLUEPRINTS: ['blueprints'],
  BLUEPRINT: (id: string) => ['blueprints', id],
} as const;

export function useBlueprints(filters?: BlueprintsFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.BLUEPRINTS, filters],
    queryFn: () =>
      blueprintsService.list({
        search: filters?.search || undefined,
        pipelineId: filters?.pipelineId || undefined,
        status: filters?.status || undefined,
      }),
    staleTime: 30_000,
  });
}

export function useBlueprint(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.BLUEPRINT(id),
    queryFn: () => blueprintsService.get(id),
    enabled: !!id,
  });
}

export function useCreateBlueprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBlueprintRequest) =>
      blueprintsService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['blueprints'] });
    },
  });
}

export function useUpdateBlueprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlueprintRequest }) =>
      blueprintsService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['blueprints'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BLUEPRINT(variables.id),
      });
    },
  });
}

export function useDeleteBlueprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blueprintsService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['blueprints'] });
    },
  });
}
