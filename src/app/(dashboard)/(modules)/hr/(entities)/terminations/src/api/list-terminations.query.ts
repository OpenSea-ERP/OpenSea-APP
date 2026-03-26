/**
 * OpenSea OS - List Terminations Query
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { terminationsService } from '@/services/hr/terminations.service';
import type { Termination } from '@/types/hr';
import { terminationKeys, type TerminationFilters } from './keys';

export interface ListTerminationsResponse {
  terminations: Termination[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export type ListTerminationsOptions = Omit<
  UseQueryOptions<ListTerminationsResponse, Error>,
  'queryKey' | 'queryFn'
>;

export function useListTerminations(
  params?: TerminationFilters,
  options?: ListTerminationsOptions
) {
  return useQuery({
    queryKey: terminationKeys.list(params),

    queryFn: async (): Promise<ListTerminationsResponse> => {
      const response = await terminationsService.list({
        employeeId: params?.employeeId,
        type: params?.type,
        status: params?.status,
        startDate: params?.startDate,
        endDate: params?.endDate,
        page: params?.page,
        perPage: params?.perPage ?? 100,
      });

      const items =
        (response as { terminations?: Termination[] }).terminations ?? [];
      const page = params?.page ?? 1;
      const perPage = params?.perPage ?? 100;

      return {
        terminations: items,
        total: items.length,
        page,
        perPage,
        hasMore: items.length >= perPage,
      };
    },

    staleTime: 5 * 60 * 1000,
    placeholderData: previousData => previousData,
    ...options,
  });
}

export default useListTerminations;
