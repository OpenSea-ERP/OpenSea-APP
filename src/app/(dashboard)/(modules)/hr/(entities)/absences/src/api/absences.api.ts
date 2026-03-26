/**
 * OpenSea OS - Absences API (HR)
 *
 * Funções de acesso à API de ausências.
 * Encapsula chamadas ao absencesService para uso nos hooks.
 */

import { absencesService } from '@/services/hr/absences.service';
import type { UpdateAbsenceRequest } from '@/services/hr/absences.service';
import type { RequestSickLeaveData, RejectAbsenceData } from '@/types/hr';
import type { AbsenceFilters } from './keys';

export const absencesApi = {
  list: (params?: AbsenceFilters) =>
    absencesService.list({
      employeeId: params?.employeeId,
      type: params?.type,
      status: params?.status,
      startDate: params?.startDate,
      endDate: params?.endDate,
      page: params?.page,
      perPage: params?.perPage ?? 20,
    }),

  get: (id: string) => absencesService.get(id),

  requestSickLeave: (data: RequestSickLeaveData) =>
    absencesService.requestSickLeave(data),

  approve: (id: string) => absencesService.approve(id),

  reject: (id: string, data: RejectAbsenceData) =>
    absencesService.reject(id, data),

  cancel: (id: string) => absencesService.cancel(id),

  update: (id: string, data: UpdateAbsenceRequest) =>
    absencesService.update(id, data),

  delete: (id: string) => absencesService.delete(id),
};

export default absencesApi;
