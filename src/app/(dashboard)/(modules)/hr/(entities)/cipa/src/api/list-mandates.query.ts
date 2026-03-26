/**
 * OpenSea OS - List CIPA Mandates Query
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { cipaService } from '@/services/hr/cipa.service';
import type { CipaMandate } from '@/types/hr';
import { cipaKeys, type CipaMandateFilters } from './keys';

export interface ListCipaMandatesResponse {
  mandates: CipaMandate[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export type ListCipaMandatesOptions = Omit<
  UseQueryOptions<ListCipaMandatesResponse, Error>,
  'queryKey' | 'queryFn'
>;

export function useListCipaMandates(
  params?: CipaMandateFilters,
  options?: ListCipaMandatesOptions
) {
  return useQuery({
    queryKey: cipaKeys.mandateList(params),

    queryFn: async (): Promise<ListCipaMandatesResponse> => {
      const response = await cipaService.listMandates({
        status: params?.status,
        page: params?.page,
        perPage: params?.perPage ?? 100,
      });

      const mandates =
        (response as { mandates?: CipaMandate[] }).mandates ?? [];
      const page = params?.page ?? 1;
      const perPage = params?.perPage ?? 100;

      return {
        mandates,
        total: mandates.length,
        page,
        perPage,
        hasMore: mandates.length >= perPage,
      };
    },

    staleTime: 5 * 60 * 1000,
    placeholderData: previousData => previousData,
    ...options,
  });
}

export default useListCipaMandates;
