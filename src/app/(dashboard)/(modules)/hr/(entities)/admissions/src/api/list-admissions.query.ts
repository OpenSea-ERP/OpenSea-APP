/**
 * OpenSea OS - List Admissions Query
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { admissionsService } from '@/services/hr/admissions.service';
import type { AdmissionInvite } from '@/types/hr';
import { admissionKeys, type AdmissionFilters } from './keys';

export interface ListAdmissionsResponse {
  admissions: AdmissionInvite[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export type ListAdmissionsOptions = Omit<
  UseQueryOptions<ListAdmissionsResponse, Error>,
  'queryKey' | 'queryFn'
>;

export function useListAdmissions(
  params?: AdmissionFilters,
  options?: ListAdmissionsOptions
) {
  return useQuery({
    queryKey: admissionKeys.list(params),

    queryFn: async (): Promise<ListAdmissionsResponse> => {
      const response = await admissionsService.list({
        status: params?.status,
        search: params?.search,
        page: params?.page,
        perPage: params?.perPage ?? 100,
      });

      const items =
        (response as { admissions?: AdmissionInvite[] }).admissions ?? [];
      const page = params?.page ?? 1;
      const perPage = params?.perPage ?? 100;

      return {
        admissions: items,
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

export default useListAdmissions;
