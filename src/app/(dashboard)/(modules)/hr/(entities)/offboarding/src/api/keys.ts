/**
 * OpenSea OS - Offboarding Query Keys
 */

import type { OffboardingStatus } from '@/types/hr/offboarding.types';

export interface OffboardingFilters {
  page?: number;
  perPage?: number;
  employeeId?: string;
  status?: OffboardingStatus;
  search?: string;
}

export const offboardingKeys = {
  all: ['offboarding-checklists'] as const,
  lists: () => [...offboardingKeys.all, 'list'] as const,
  list: (filters?: OffboardingFilters) =>
    [...offboardingKeys.lists(), filters ?? {}] as const,
  details: () => [...offboardingKeys.all, 'detail'] as const,
  detail: (id: string) => [...offboardingKeys.details(), id] as const,
} as const;

export default offboardingKeys;
