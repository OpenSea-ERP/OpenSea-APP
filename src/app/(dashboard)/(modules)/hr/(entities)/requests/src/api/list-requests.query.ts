/**
 * OpenSea OS - List Employee Requests Query (HR)
 *
 * Hooks para listar solicitacoes com suporte a scroll infinito e cache.
 * - useListMyRequests: solicitacoes do colaborador logado
 * - useListPendingRequests: solicitacoes pendentes (gestor)
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import type { EmployeeRequest } from '@/types/hr';
import { requestsApi } from './requests.api';
import { requestKeys, type RequestFilters } from './keys';

/* ===========================================
   TYPES
   =========================================== */

export type ListRequestsParams = RequestFilters;

export interface ListRequestsResponse {
  requests: EmployeeRequest[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

/* ===========================================
   MY REQUESTS QUERY HOOK
   =========================================== */

export function useListMyRequests(params?: ListRequestsParams) {
  return useInfiniteQuery<ListRequestsResponse>({
    queryKey: requestKeys.myList(params),

    queryFn: async ({ pageParam }): Promise<ListRequestsResponse> => {
      const page = pageParam as number;
      const response = await requestsApi.listMy({
        ...params,
        page,
        perPage: PAGE_SIZE,
      });

      return {
        requests: response.employeeRequests ?? [],
        total: response.meta?.total ?? 0,
        page: response.meta?.page ?? page,
        perPage: response.meta?.perPage ?? PAGE_SIZE,
        totalPages: response.meta?.totalPages ?? 1,
      };
    },

    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,

    staleTime: 2 * 60 * 1000,
  });
}

/* ===========================================
   PENDING REQUESTS QUERY HOOK (MANAGER)
   =========================================== */

export function useListPendingRequests(params?: ListRequestsParams) {
  return useInfiniteQuery<ListRequestsResponse>({
    queryKey: requestKeys.pendingList(params),

    queryFn: async ({ pageParam }): Promise<ListRequestsResponse> => {
      const page = pageParam as number;
      const response = await requestsApi.listPending({
        ...params,
        page,
        perPage: PAGE_SIZE,
      });

      return {
        requests: response.employeeRequests ?? [],
        total: response.meta?.total ?? 0,
        page: response.meta?.page ?? page,
        perPage: response.meta?.perPage ?? PAGE_SIZE,
        totalPages: response.meta?.totalPages ?? 1,
      };
    },

    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,

    staleTime: 2 * 60 * 1000,
  });
}
