import { pipelinesService } from '@/services/sales';
import type {
  CreatePipelineRequest,
  CreatePipelineStageRequest,
  PipelineType,
  ReorderPipelineStagesRequest,
  UpdatePipelineRequest,
  UpdatePipelineStageRequest,
} from '@/types/sales';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface PipelinesFilters {
  search?: string;
  type?: PipelineType;
  isActive?: boolean;
}

const QUERY_KEYS = {
  PIPELINES: ['pipelines'],
  PIPELINE: (id: string) => ['pipelines', id],
  PIPELINE_STAGES: (pipelineId: string) => ['pipelines', pipelineId, 'stages'],
} as const;

// GET /v1/pipelines - Lista todos os pipelines
export function usePipelines(filters?: PipelinesFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PIPELINES, filters],
    queryFn: () =>
      pipelinesService.list({
        search: filters?.search || undefined,
        type: filters?.type || undefined,
        isActive: filters?.isActive,
      }),
    staleTime: 30_000,
  });
}

// GET /v1/pipelines/:pipelineId - Busca um pipeline especifico
export function usePipeline(pipelineId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PIPELINE(pipelineId),
    queryFn: () => pipelinesService.get(pipelineId),
    enabled: !!pipelineId,
  });
}

// POST /v1/pipelines - Cria um novo pipeline
export function useCreatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePipelineRequest) => pipelinesService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

// PUT /v1/pipelines/:pipelineId - Atualiza um pipeline
export function useUpdatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      data,
    }: {
      pipelineId: string;
      data: UpdatePipelineRequest;
    }) => pipelinesService.update(pipelineId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PIPELINE(variables.pipelineId),
      });
    },
  });
}

// DELETE /v1/pipelines/:pipelineId - Deleta um pipeline
export function useDeletePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pipelineId: string) => pipelinesService.delete(pipelineId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

// --- Pipeline Stages ---

// GET /v1/pipelines/:pipelineId/stages - Lista stages do pipeline
export function usePipelineStages(pipelineId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PIPELINE_STAGES(pipelineId),
    queryFn: () => pipelinesService.listStages(pipelineId),
    enabled: !!pipelineId,
  });
}

// POST /v1/pipelines/:pipelineId/stages - Cria um novo stage
export function useCreatePipelineStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      data,
    }: {
      pipelineId: string;
      data: CreatePipelineStageRequest;
    }) => pipelinesService.createStage(pipelineId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PIPELINE_STAGES(variables.pipelineId),
      });
    },
  });
}

// PUT /v1/pipelines/:pipelineId/stages/:stageId - Atualiza um stage
export function useUpdatePipelineStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      stageId,
      data,
    }: {
      pipelineId: string;
      stageId: string;
      data: UpdatePipelineStageRequest;
    }) => pipelinesService.updateStage(pipelineId, stageId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PIPELINE_STAGES(variables.pipelineId),
      });
    },
  });
}

// DELETE /v1/pipelines/:pipelineId/stages/:stageId - Deleta um stage
export function useDeletePipelineStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      stageId,
    }: {
      pipelineId: string;
      stageId: string;
    }) => pipelinesService.deleteStage(pipelineId, stageId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PIPELINE_STAGES(variables.pipelineId),
      });
    },
  });
}

// PUT /v1/pipelines/:pipelineId/stages/reorder - Reordena stages
export function useReorderPipelineStages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      data,
    }: {
      pipelineId: string;
      data: ReorderPipelineStagesRequest;
    }) => pipelinesService.reorderStages(pipelineId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PIPELINE_STAGES(variables.pipelineId),
      });
    },
  });
}
