import { campaignsService } from '@/services/sales';
import type {
  CampaignsQuery,
  CampaignStatus,
  CampaignType,
  CreateCampaignRequest,
  UpdateCampaignRequest,
} from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export interface CampaignsFilters {
  search?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const QUERY_KEYS = {
  CAMPAIGNS: ['campaigns'],
  CAMPAIGNS_INFINITE: (filters?: CampaignsFilters) => [
    'campaigns',
    'infinite',
    filters,
  ],
  CAMPAIGN: (id: string) => ['campaigns', id],
} as const;

const PAGE_SIZE = 20;

export function useCampaignsInfinite(filters?: CampaignsFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.CAMPAIGNS_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      return await campaignsService.list({
        page: pageParam,
        limit: PAGE_SIZE,
        search: filters?.search || undefined,
        type: filters?.type || undefined,
        status: filters?.status || undefined,
        sortBy: filters?.sortBy || undefined,
        sortOrder: filters?.sortOrder || undefined,
      } as CampaignsQuery);
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

  const campaigns = result.data?.pages.flatMap(p => p.campaigns) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return { ...result, campaigns, total };
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CAMPAIGN(id),
    queryFn: () => campaignsService.get(id),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaignRequest) => campaignsService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignRequest }) =>
      campaignsService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CAMPAIGN(variables.id),
      });
    },
  });
}

export function useActivateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignsService.activate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignsService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
