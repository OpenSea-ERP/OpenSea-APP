/**
 * OpenSea OS - Get Company Query (Finance)
 *
 * Hook para buscar os detalhes de uma empresa específica.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { companiesService } from '@/services/admin/companies.service';
import type { Company } from '@/types/hr';
import { companyKeys } from './keys';

/* ===========================================
   TYPES
   =========================================== */

export type GetCompanyResponse = Company;

export type GetCompanyOptions = Omit<
  UseQueryOptions<GetCompanyResponse, Error>,
  'queryKey' | 'queryFn'
>;

/* ===========================================
   QUERY HOOK
   =========================================== */

export function useGetCompany(id: string, options?: GetCompanyOptions) {
  return useQuery({
    queryKey: companyKeys.detail(id),

    queryFn: async (): Promise<GetCompanyResponse> => {
      const response = await companiesService.getCompany(id);

      if (!response || typeof response !== 'object' || !response.company) {
        throw new Error('Estrutura de resposta inválida');
      }

      return response.company;
    },

    enabled: !!id,
    staleTime: 10 * 60 * 1000,

    retry: (failureCount, error) => {
      if (error.message.includes('not found')) return false;
      return failureCount < 2;
    },

    ...options,
  });
}

/* ===========================================
   SUB-RESOURCES QUERIES
   =========================================== */

export function useCompanyAddresses(
  companyId: string,
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: companyKeys.addresses(companyId),
    queryFn: async () => {
      const response = await companiesService.listAddresses(companyId);
      return (response as { addresses?: unknown[] }).addresses ?? [];
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useCompanyCnaes(
  companyId: string,
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: companyKeys.cnaes(companyId),
    queryFn: async () => {
      const response = await companiesService.listCnaes(companyId, {
        perPage: 100,
      });
      const result = response as { cnaes?: unknown[] };
      return result.cnaes ?? (Array.isArray(response) ? response : []);
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useCompanyStakeholders(
  companyId: string,
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: companyKeys.stakeholders(companyId),
    queryFn: async () => {
      try {
        const response = await companiesService.listStakeholders(companyId, {
          includeInactive: true,
        });
        const result = response as { stakeholders?: unknown[] };
        return result.stakeholders ?? (Array.isArray(response) ? response : []);
      } catch {
        return [];
      }
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    retry: false,
    ...options,
  });
}

export function useCompanyFiscalSettings(
  companyId: string,
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: companyKeys.fiscalSettings(companyId),
    queryFn: async () => {
      try {
        const response = await companiesService.getFiscalSettings(companyId);

        if (response && 'id' in response) {
          return response;
        }

        const result = response as { fiscalSettings?: unknown };
        return result.fiscalSettings ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    retry: false,
    ...options,
  });
}

export default useGetCompany;
