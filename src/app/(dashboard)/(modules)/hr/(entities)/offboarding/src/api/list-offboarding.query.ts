/**
 * OpenSea OS - List Offboarding Checklists Query (Infinite Scroll)
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { offboardingService } from '@/services/hr/offboarding.service';
import { offboardingKeys, type OffboardingFilters } from './keys';

const PAGE_SIZE = 20;

export function useListOffboardingChecklists(filters?: OffboardingFilters) {
  return useInfiniteQuery({
    queryKey: offboardingKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await offboardingService.listChecklists({
        page: pageParam,
        perPage: filters?.perPage ?? PAGE_SIZE,
        employeeId: filters?.employeeId,
        status: filters?.status,
        search: filters?.search,
      });

      return {
        checklists: response.checklists,
        meta: response.meta,
      };
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });
}
