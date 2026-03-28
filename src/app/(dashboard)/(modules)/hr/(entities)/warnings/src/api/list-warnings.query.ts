/**
 * OpenSea OS - List Warnings Query (HR)
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import type { EmployeeWarning } from '@/types/hr';
import { warningsApi } from './warnings.api';
import { warningKeys, type WarningFilters } from './keys';

export type ListWarningsParams = WarningFilters;

export interface ListWarningsResponse {
  warnings: EmployeeWarning[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

export function useListWarnings(params?: ListWarningsParams) {
  return useInfiniteQuery<ListWarningsResponse>({
    queryKey: warningKeys.list(params),

    queryFn: async ({ pageParam }): Promise<ListWarningsResponse> => {
      const page = pageParam as number;
      const response = await warningsApi.list({
        ...params,
        page,
        perPage: PAGE_SIZE,
      });

      return {
        warnings: response.warnings ?? [],
        total: response.meta?.total ?? 0,
        page: response.meta?.page ?? page,
        perPage: response.meta?.perPage ?? PAGE_SIZE,
        totalPages: response.meta?.totalPages ?? 1,
      };
    },

    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,

    staleTime: 2 * 60 * 1000,
  });
}

export default useListWarnings;
