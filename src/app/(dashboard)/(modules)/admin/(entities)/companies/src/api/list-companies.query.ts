/**
 * OpenSea OS - List Companies Query
 *
 * Hook para listar empresas com suporte a filtros, paginação e cache.
 *
 * @example
 * ```tsx
 * // Listagem básica
 * const { data, isLoading, error } = useListCompanies();
 *
 * // Com filtros
 * const { data } = useListCompanies({
 *   search: 'acme',
 *   status: 'ACTIVE',
 *   perPage: 50,
 * });
 *
 * // Acessando os dados
 * data?.companies.map(company => (
 *   <CompanyCard key={company.id} company={company} />
 * ));
 * ```
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { companiesService } from '@/services/admin/companies.service';
import type { Company } from '@/types/hr';
import { companyKeys, type CompanyFilters } from './keys';

/* ===========================================
   TYPES
   =========================================== */

/**
 * Parâmetros aceitos pela query
 */
export type ListCompaniesParams = CompanyFilters;

/**
 * Resposta normalizada da query
 */
export interface ListCompaniesResponse {
  /** Lista de empresas */
  companies: Company[];
  /** Total de empresas (para paginação) */
  total: number;
  /** Página atual */
  page: number;
  /** Itens por página */
  perPage: number;
  /** Indica se há mais páginas */
  hasMore: boolean;
}

/**
 * Opções customizadas para a query
 */
export type ListCompaniesOptions = Omit<
  UseQueryOptions<ListCompaniesResponse, Error>,
  'queryKey' | 'queryFn'
>;

/* ===========================================
   QUERY HOOK
   =========================================== */

/**
 * Hook para listar empresas
 *
 * Características:
 * - Cache automático de 5 minutos
 * - Normalização da resposta da API
 * - Filtragem de empresas deletadas
 * - Suporte a paginação e busca
 *
 * @param params - Filtros opcionais
 * @param options - Opções adicionais do useQuery
 * @returns Query result com lista de empresas
 */
export function useListCompanies(
  params?: ListCompaniesParams,
  options?: ListCompaniesOptions
) {
  return useQuery({
    queryKey: companyKeys.list(params),

    queryFn: async (): Promise<ListCompaniesResponse> => {
      // Chama o service
      const response = await companiesService.listCompanies({
        page: params?.page,
        perPage: params?.perPage ?? 100,
        search: params?.search,
        status: params?.status,
        includeDeleted: params?.includeDeleted ?? false,
      });

      // Normaliza a resposta (pode vir como array ou objeto)
      let companies: Company[] = [];

      if (Array.isArray(response)) {
        companies = response;
      } else if (response && typeof response === 'object') {
        companies = (response as { companies?: Company[] }).companies ?? [];
      }

      // Filtra empresas deletadas (segurança extra)
      if (!params?.includeDeleted) {
        companies = companies.filter(c => !c.deletedAt);
      }

      // Calcula paginação
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

    // Cache de 5 minutos
    staleTime: 5 * 60 * 1000,

    // Mantém dados anteriores enquanto revalida
    placeholderData: previousData => previousData,

    // Opções customizadas
    ...options,
  });
}

/* ===========================================
   UTILITY FUNCTIONS
   =========================================== */

/**
 * Pré-carrega a lista de empresas
 * Útil para prefetching em navegação
 *
 * @example
 * ```tsx
 * // No hover de um link
 * onMouseEnter={() => prefetchCompanies(queryClient)}
 * ```
 */
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
