import { landingPagesService } from '@/services/sales';
import type {
  CreateLandingPageRequest,
  LandingPageStatus,
  LandingPageTemplate,
  UpdateLandingPageRequest,
} from '@/types/sales';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface LandingPagesFilters {
  search?: string;
  status?: LandingPageStatus;
  template?: LandingPageTemplate;
}

const QUERY_KEYS = {
  LANDING_PAGES: ['landing-pages'],
  LANDING_PAGE: (id: string) => ['landing-pages', id],
} as const;

export function useLandingPages(filters?: LandingPagesFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.LANDING_PAGES, filters],
    queryFn: () =>
      landingPagesService.list({
        search: filters?.search || undefined,
        status: filters?.status || undefined,
        template: filters?.template || undefined,
      }),
    staleTime: 30_000,
  });
}

export function useLandingPage(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.LANDING_PAGE(id),
    queryFn: () => landingPagesService.get(id),
    enabled: !!id,
  });
}

export function useCreateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLandingPageRequest) =>
      landingPagesService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
    },
  });
}

export function useUpdateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateLandingPageRequest;
    }) => landingPagesService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LANDING_PAGE(variables.id),
      });
    },
  });
}

export function useDeleteLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => landingPagesService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
    },
  });
}

export function usePublishLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => landingPagesService.publish(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
    },
  });
}

export function useUnpublishLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => landingPagesService.unpublish(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
    },
  });
}
