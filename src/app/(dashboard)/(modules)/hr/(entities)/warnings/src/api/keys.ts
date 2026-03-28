/**
 * OpenSea OS - Warnings Query Keys (HR)
 */

import type { WarningType, WarningSeverity, WarningStatus } from '@/types/hr';

export interface WarningFilters {
  employeeId?: string;
  type?: WarningType;
  severity?: WarningSeverity;
  status?: WarningStatus;
  page?: number;
  perPage?: number;
}

export const warningKeys = {
  all: ['warnings'] as const,
  lists: () => [...warningKeys.all, 'list'] as const,
  list: (filters?: WarningFilters) =>
    [...warningKeys.lists(), filters ?? {}] as const,
  details: () => [...warningKeys.all, 'detail'] as const,
  detail: (id: string) => [...warningKeys.details(), id] as const,
} as const;

export default warningKeys;
