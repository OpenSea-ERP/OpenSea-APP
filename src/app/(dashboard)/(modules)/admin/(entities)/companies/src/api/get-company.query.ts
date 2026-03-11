/**
 * OpenSea OS - Get Company Query
 *
 * Hook para buscar os detalhes de uma empresa específica.
 *
 * @example
 * ```tsx
 * // Uso básico
 * const { data: company, isLoading, error } = useGetCompany(companyId);
 *
 * // Com opções customizadas
 * const { data } = useGetCompany(companyId, {
 *   enabled: !!companyId,
 *   onSuccess: (company) => console.log('Loaded:', company.legalName),
 * });
 * ```
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { companiesService } from '@/services/admin/companies.service';
import type { Company } from '@/types/hr';
import { companyKeys } from './keys';

/* ===========================================
   TYPES
   =========================================== */

/**
 * Resposta da query de detalhes
 */
export type GetCompanyResponse = Company;

/**
 * Opções customizadas para a query
 */
export type GetCompanyOptions = Omit<
  UseQueryOptions<GetCompanyResponse, Error>,
  'queryKey' | 'queryFn'
>;

/* ===========================================
   QUERY HOOK
   =========================================== */

/**
 * Hook para buscar detalhes de uma empresa
 *
 * Características:
 * - Cache automático de 10 minutos
 * - Validação automática da resposta
 * - Suporte a retry em caso de erro
 *
 * @param id - ID da empresa
 * @param options - Opções adicionais do useQuery
 * @returns Query result com os dados da empresa
 */
export function useGetCompany(id: string, options?: GetCompanyOptions) {
  return useQuery({
    queryKey: companyKeys.detail(id),

    queryFn: async (): Promise<GetCompanyResponse> => {
      const response = await companiesService.getCompany(id);

      // Valida a estrutura da resposta
      if (!response || typeof response !== 'object' || !response.company) {
        throw new Error('Estrutura de resposta inválida');
      }

      return response.company;
    },

    // Só executa se tiver ID
    enabled: !!id,

    // Cache de 10 minutos (dados de detalhe mudam menos)
    staleTime: 10 * 60 * 1000,

    // Retry apenas para erros de servidor
    retry: (failureCount, error) => {
      // Não faz retry para 404 (não encontrado)
      if (error.message.includes('not found')) return false;
      // Máximo 2 retries para outros erros
      return failureCount < 2;
    },

    // Opções customizadas
    ...options,
  });
}

/* ===========================================
   SUB-RESOURCES QUERIES
   =========================================== */

/**
 * Hook para buscar endereços de uma empresa
 */
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

/**
 * Hook para buscar CNAEs de uma empresa
 */
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

/**
 * Hook para buscar stakeholders de uma empresa
 */
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
        // Se não encontrar stakeholders, retorna array vazio
        return [];
      }
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    retry: false, // Não faz retry para stakeholders
    ...options,
  });
}

/**
 * Hook para buscar configurações fiscais de uma empresa
 */
export function useCompanyFiscalSettings(
  companyId: string,
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: companyKeys.fiscalSettings(companyId),
    queryFn: async () => {
      try {
        const response = await companiesService.getFiscalSettings(companyId);

        // Pode vir diretamente ou aninhado
        if (response && 'id' in response) {
          return response;
        }

        const result = response as { fiscalSettings?: unknown };
        return result.fiscalSettings ?? null;
      } catch {
        // Se não encontrar, retorna null
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
