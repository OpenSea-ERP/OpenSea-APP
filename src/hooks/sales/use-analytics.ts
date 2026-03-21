import { analyticsService } from '@/services/sales';
import type {
  CreateGoalRequest,
  UpdateGoalRequest,
  CreateDashboardRequest,
  CreateReportRequest,
  CreatePortalAccessRequest,
} from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// --- Query Keys ---

const ANALYTICS_KEYS = {
  goals: {
    all: ['analytics-goals'] as const,
    list: (filters?: Record<string, unknown>) => ['analytics-goals', 'list', filters] as const,
    progress: (id: string) => ['analytics-goals', 'progress', id] as const,
  },
  dashboards: {
    all: ['analytics-dashboards'] as const,
    list: (filters?: Record<string, unknown>) => ['analytics-dashboards', 'list', filters] as const,
  },
  reports: {
    all: ['analytics-reports'] as const,
    list: (filters?: Record<string, unknown>) => ['analytics-reports', 'list', filters] as const,
  },
  rankings: {
    sellers: (params?: Record<string, unknown>) => ['analytics-rankings', 'sellers', params] as const,
    products: (params?: Record<string, unknown>) => ['analytics-rankings', 'products', params] as const,
    customers: (params?: Record<string, unknown>) => ['analytics-rankings', 'customers', params] as const,
  },
} as const;

// --- Goals ---

export function useGoalsInfinite(filters?: Record<string, unknown>, perPage = 20) {
  return useInfiniteQuery({
    queryKey: ANALYTICS_KEYS.goals.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await analyticsService.listGoals({
        ...filters,
        page: pageParam,
        perPage,
      });
      return response;
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useGoalProgress(id: string) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.goals.progress(id),
    queryFn: () => analyticsService.getGoalProgress(id),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGoalRequest) => analyticsService.createGoal(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.goals.all });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalRequest }) =>
      analyticsService.updateGoal(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.goals.all });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => analyticsService.deleteGoal(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.goals.all });
    },
  });
}

// --- Dashboards ---

export function useDashboardsInfinite(filters?: Record<string, unknown>, perPage = 20) {
  return useInfiniteQuery({
    queryKey: ANALYTICS_KEYS.dashboards.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await analyticsService.listDashboards({
        ...filters,
        page: pageParam,
        perPage,
      });
      return response;
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDashboardRequest) => analyticsService.createDashboard(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.dashboards.all });
    },
  });
}

// --- Reports ---

export function useReportsInfinite(filters?: Record<string, unknown>, perPage = 20) {
  return useInfiniteQuery({
    queryKey: ANALYTICS_KEYS.reports.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await analyticsService.listReports({
        ...filters,
        page: pageParam,
        perPage,
      });
      return response;
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReportRequest) => analyticsService.createReport(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.reports.all });
    },
  });
}

// --- Rankings ---

export function useSellerRanking(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.rankings.sellers(params),
    queryFn: () => analyticsService.getSellerRanking(params),
  });
}

export function useProductRanking(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.rankings.products(params),
    queryFn: () => analyticsService.getProductRanking(params),
  });
}

export function useCustomerRanking(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.rankings.customers(params),
    queryFn: () => analyticsService.getCustomerRanking(params),
  });
}

// --- Customer Portal ---

export function useCreatePortalAccess() {
  return useMutation({
    mutationFn: (data: CreatePortalAccessRequest) => analyticsService.createPortalAccess(data),
  });
}
