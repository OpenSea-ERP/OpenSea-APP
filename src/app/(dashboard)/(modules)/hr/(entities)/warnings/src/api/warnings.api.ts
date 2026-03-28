/**
 * OpenSea OS - Warnings API (HR)
 */

import { warningsService } from '@/services/hr/warnings.service';
import type {
  CreateWarningData,
  UpdateWarningData,
  RevokeWarningData,
} from '@/types/hr';
import type { WarningFilters } from './keys';

export const warningsApi = {
  list: (params?: WarningFilters) =>
    warningsService.list({
      employeeId: params?.employeeId,
      type: params?.type,
      severity: params?.severity,
      status: params?.status,
      page: params?.page,
      perPage: params?.perPage ?? 20,
    }),

  get: (id: string) => warningsService.get(id),

  create: (data: CreateWarningData) => warningsService.create(data),

  update: (id: string, data: UpdateWarningData) =>
    warningsService.update(id, data),

  delete: (id: string) => warningsService.delete(id),

  revoke: (id: string, data: RevokeWarningData) =>
    warningsService.revoke(id, data),

  acknowledge: (id: string) => warningsService.acknowledge(id),
};

export default warningsApi;
