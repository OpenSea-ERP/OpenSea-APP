import { activitiesService } from '@/services/sales';
import type {
  ActivitiesQuery,
  ActivityType,
  CreateActivityRequest,
  UpdateActivityRequest,
} from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

export interface ActivitiesFilters {
  search?: string;
  type?: ActivityType;
  dealId?: string;
  contactId?: string;
  customerId?: string;
  assignedToUserId?: string;
  isCompleted?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const QUERY_KEYS = {
  ACTIVITIES: ['activities'],
  ACTIVITIES_INFINITE: (filters?: ActivitiesFilters) => [
    'activities',
    'infinite',
    filters,
  ],
} as const;

const PAGE_SIZE = 20;

// GET /v1/activities - Infinite scroll com filtros e sorting server-side
export function useActivitiesInfinite(filters?: ActivitiesFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.ACTIVITIES_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      return await activitiesService.list({
        page: pageParam,
        limit: PAGE_SIZE,
        search: filters?.search || undefined,
        type: filters?.type || undefined,
        dealId: filters?.dealId || undefined,
        contactId: filters?.contactId || undefined,
        customerId: filters?.customerId || undefined,
        assignedToUserId: filters?.assignedToUserId || undefined,
        isCompleted: filters?.isCompleted,
        sortBy: filters?.sortBy || undefined,
        sortOrder: filters?.sortOrder || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.pages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });

  const activities = result.data?.pages.flatMap(p => p.activities) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    activities,
    total,
  };
}

// POST /v1/activities - Cria uma nova atividade
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivityRequest) => activitiesService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

// PUT /v1/activities/:activityId - Atualiza uma atividade
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      data,
    }: {
      activityId: string;
      data: UpdateActivityRequest;
    }) => activitiesService.update(activityId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

// DELETE /v1/activities/:activityId - Deleta uma atividade
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => activitiesService.delete(activityId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}
