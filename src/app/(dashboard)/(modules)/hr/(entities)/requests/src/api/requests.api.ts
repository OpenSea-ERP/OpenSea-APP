/**
 * OpenSea OS - Employee Requests API (HR)
 *
 * Funcoes de acesso a API de solicitacoes do colaborador.
 * Encapsula chamadas ao portalService para uso nos hooks.
 */

import { portalService } from '@/services/hr';
import type { CreateEmployeeRequestData } from '@/types/hr';
import type { RequestFilters } from './keys';

export const requestsApi = {
  listMy: (params?: RequestFilters) =>
    portalService.listMyRequests({
      type: params?.type,
      status: params?.status,
      page: params?.page,
      perPage: params?.perPage ?? 20,
    }),

  listPending: (params?: RequestFilters) =>
    portalService.listPendingApprovals({
      type: params?.type,
      page: params?.page,
      perPage: params?.perPage ?? 20,
    }),

  get: (id: string) => portalService.getRequest(id),

  create: (data: CreateEmployeeRequestData) =>
    portalService.createRequest(data),

  approve: (id: string) => portalService.approveRequest(id),

  reject: (id: string, reason: string) =>
    portalService.rejectRequest(id, reason),

  cancel: (id: string) => portalService.cancelRequest(id),
};

export default requestsApi;
