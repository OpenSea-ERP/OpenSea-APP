/**
 * OpenSea OS - Vacations API (HR)
 *
 * Funções de acesso à API de férias.
 * Encapsula chamadas ao vacationsService para uso nos hooks.
 */

import { vacationsService } from '@/services/hr/vacations.service';
import type { UpdateVacationPeriodRequest } from '@/services/hr/vacations.service';
import type {
  CreateVacationPeriodData,
  ScheduleVacationData,
  CompleteVacationData,
  SellVacationDaysData,
} from '@/types/hr';
import type { VacationFilters } from './keys';

export const vacationsApi = {
  list: (params?: VacationFilters) =>
    vacationsService.list({
      employeeId: params?.employeeId,
      status: params?.status,
      year: params?.year,
      page: params?.page,
      perPage: params?.perPage ?? 20,
    }),

  get: (id: string) => vacationsService.get(id),

  create: (data: CreateVacationPeriodData) => vacationsService.create(data),

  schedule: (id: string, data: ScheduleVacationData) =>
    vacationsService.schedule(id, data),

  start: (id: string) => vacationsService.start(id),

  complete: (id: string, data: CompleteVacationData) =>
    vacationsService.complete(id, data),

  sellDays: (id: string, data: SellVacationDaysData) =>
    vacationsService.sellDays(id, data),

  cancelSchedule: (id: string) => vacationsService.cancelSchedule(id),

  update: (id: string, data: UpdateVacationPeriodRequest) =>
    vacationsService.update(id, data),

  delete: (id: string) => vacationsService.delete(id),

  getVacationBalance: (employeeId: string) =>
    vacationsService.getVacationBalance(employeeId),
};

export default vacationsApi;
