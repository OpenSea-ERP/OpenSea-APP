/**
 * OpenSea OS - Employee Requests Query Keys (HR)
 *
 * Chaves de query centralizadas para o modulo de Solicitacoes do Colaborador.
 */

import type { RequestType, RequestStatus } from '@/types/hr';

/* ===========================================
   FILTER TYPES
   =========================================== */

export interface RequestFilters {
  /** Tipo da solicitacao */
  type?: RequestType;
  /** Status da solicitacao */
  status?: RequestStatus;
  /** Pagina (1-indexed) */
  page?: number;
  /** Itens por pagina */
  perPage?: number;
}

/* ===========================================
   QUERY KEYS
   =========================================== */

export const requestKeys = {
  all: ['employee-requests'] as const,

  lists: () => [...requestKeys.all, 'list'] as const,

  list: (filters?: RequestFilters) =>
    [...requestKeys.lists(), filters ?? {}] as const,

  myLists: () => [...requestKeys.all, 'my-list'] as const,

  myList: (filters?: RequestFilters) =>
    [...requestKeys.myLists(), filters ?? {}] as const,

  pendingLists: () => [...requestKeys.all, 'pending'] as const,

  pendingList: (filters?: RequestFilters) =>
    [...requestKeys.pendingLists(), filters ?? {}] as const,

  details: () => [...requestKeys.all, 'detail'] as const,

  detail: (id: string) => [...requestKeys.details(), id] as const,
} as const;

/* ===========================================
   TYPE EXPORTS
   =========================================== */

type RequestKeyFunctions = {
  [K in keyof typeof requestKeys]: (typeof requestKeys)[K] extends (
    ...args: infer _Args
  ) => infer R
    ? R
    : (typeof requestKeys)[K];
};

export type RequestQueryKey = RequestKeyFunctions[keyof RequestKeyFunctions];

export default requestKeys;
