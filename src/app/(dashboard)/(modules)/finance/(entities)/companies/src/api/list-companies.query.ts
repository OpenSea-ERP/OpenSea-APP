/**
 * OpenSea OS - List Companies Query (Finance)
 *
 * Hook para listar empresas com suporte a filtros, paginação e cache.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { companiesService } from '@/services/admin/companies.service';
import type { Company } from '@/types/hr';
import { companyKeys, type CompanyFilters } from './keys';

/* ===========================================
   TYPES
   =========================================== */

export type ListCompaniesParams = CompanyFilters;

export interface ListCompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export type ListCompaniesOptions = Omit<
  UseQueryOptions<ListCompaniesResponse, Error>,
  'queryKey' | 'queryFn'
>;

/* ===========================================
   QUERY HOOK
   =========================================== */

export function useListCompanies(
  params?: ListCompaniesParams,
  options?: ListCompaniesOptions
) {
  return useQuery({
    queryKey: companyKeys.list(params),

    queryFn: async (): Promise<ListCompaniesResponse> => {
      const response = await companiesService.listCompanies({
        page: params?.page,
        perPage: params?.perPage ?? 100,
        search: params?.search,
        status: params?.status,
        includeDeleted: params?.includeDeleted ?? false,
      });

      let companies: Company[] = [];

      if (Array.isArray(response)) {
        companies = response;
      } else if (response && typeof response === 'object') {
        companies = (response as { companies?: Company[] }).companies ?? [];
      }

      if (!params?.includeDeleted) {
        companies = companies.filter(c => !c.deletedAt);
      }

      const page = params?.page ?? 1;
      const perPage = params?.perPage ?? 100;
      const total = companies.length;
      const hasMore = companies.length >= perPage;

      return {
        companies,
        total,
        page,
        perPage,
        hasMore,
      };
    },

    staleTime: 5 * 60 * 1000,
    placeholderData: previousData => previousData,
    ...options,
  });
}

/* ===========================================
   UTILITY FUNCTIONS
   =========================================== */

export async function prefetchCompanies(
  queryClient: ReturnType<
    typeof import('@tanstack/react-query').useQueryClient
  >,
  params?: ListCompaniesParams
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: companyKeys.list(params),
    queryFn: async () => {
      const response = await companiesService.listCompanies(params);
      const companies = Array.isArray(response)
        ? response
        : ((response as { companies?: Company[] }).companies ?? []);

      return {
        companies: companies.filter((c: Company) => !c.deletedAt),
        total: companies.length,
        page: params?.page ?? 1,
        perPage: params?.perPage ?? 100,
        hasMore: companies.length >= (params?.perPage ?? 100),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export default useListCompanies;
