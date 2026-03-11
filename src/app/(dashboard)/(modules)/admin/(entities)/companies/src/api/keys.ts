/**
 * OpenSea OS - Companies Query Keys
 *
 * Chaves de query centralizadas para o módulo Companies.
 * Seguindo o padrão de factory functions para type-safety e
 * invalidação granular de cache.
 *
 * @example
 * ```tsx
 * // Invalidar todas as queries de companies
 * queryClient.invalidateQueries({ queryKey: companyKeys.all });
 *
 * // Invalidar apenas listagens
 * queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
 *
 * // Invalidar uma company específica e seus sub-recursos
 * queryClient.invalidateQueries({ queryKey: companyKeys.detail(id) });
 * ```
 */

import type { CompanyStatus } from '@/types/hr';

/* ===========================================
   FILTER TYPES
   =========================================== */

/**
 * Filtros para listagem de empresas
 */
export interface CompanyFilters {
  /** Número da página (1-indexed) */
  page?: number;
  /** Itens por página */
  perPage?: number;
  /** Termo de busca (razão social, nome fantasia, CNPJ) */
  search?: string;
  /** Filtrar por status */
  status?: CompanyStatus;
  /** Incluir empresas deletadas (soft delete) */
  includeDeleted?: boolean;
}

/* ===========================================
   QUERY KEYS
   =========================================== */

export const companyKeys = {
  /**
   * Chave base para todas as queries de companies
   * Usar para invalidar TUDO relacionado a companies
   */
  all: ['companies'] as const,

  /**
   * Chave base para listagens
   * Usar para invalidar todas as listagens (independente dos filtros)
   */
  lists: () => [...companyKeys.all, 'list'] as const,

  /**
   * Chave para listagem com filtros específicos
   * Cada combinação de filtros gera uma entrada de cache separada
   */
  list: (filters?: CompanyFilters) =>
    [...companyKeys.lists(), filters ?? {}] as const,

  /**
   * Chave base para detalhes
   * Usar para invalidar todos os detalhes
   */
  details: () => [...companyKeys.all, 'detail'] as const,

  /**
   * Chave para detalhes de uma company específica
   * Também serve como base para sub-recursos
   */
  detail: (id: string) => [...companyKeys.details(), id] as const,

  /* ===========================================
     SUB-RECURSOS
     =========================================== */

  /**
   * Endereços de uma company
   */
  addresses: (companyId: string) =>
    [...companyKeys.detail(companyId), 'addresses'] as const,

  /**
   * CNAEs de uma company
   */
  cnaes: (companyId: string) =>
    [...companyKeys.detail(companyId), 'cnaes'] as const,

  /**
   * Sócios/stakeholders de uma company
   */
  stakeholders: (companyId: string) =>
    [...companyKeys.detail(companyId), 'stakeholders'] as const,

  /**
   * Configurações fiscais de uma company
   */
  fiscalSettings: (companyId: string) =>
    [...companyKeys.detail(companyId), 'fiscal-settings'] as const,

  /**
   * Departamentos de uma company (relacionamento)
   */
  departments: (companyId: string) =>
    [...companyKeys.detail(companyId), 'departments'] as const,

  /**
   * Funcionários de uma company (relacionamento)
   */
  employees: (companyId: string) =>
    [...companyKeys.detail(companyId), 'employees'] as const,

  /* ===========================================
     QUERIES ESPECIAIS
     =========================================== */

  /**
   * Verificação de CNPJ duplicado
   */
  checkCnpj: (cnpj: string) =>
    [...companyKeys.all, 'check-cnpj', cnpj] as const,

  /**
   * Busca de CNPJ na BrasilAPI
   */
  brasilApiLookup: (cnpj: string) =>
    [...companyKeys.all, 'brasil-api', cnpj] as const,
} as const;

/* ===========================================
   TYPE EXPORTS
   =========================================== */

/**
 * Tipo para qualquer query key de companies
 */
type CompanyKeyFunctions = {
  [K in keyof typeof companyKeys]: (typeof companyKeys)[K] extends (
    ...args: infer _Args
  ) => infer R
    ? R
    : (typeof companyKeys)[K];
};

export type CompanyQueryKey = CompanyKeyFunctions[keyof CompanyKeyFunctions];

export default companyKeys;
