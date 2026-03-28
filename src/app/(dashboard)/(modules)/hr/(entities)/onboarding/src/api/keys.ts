/**
 * OpenSea OS - Onboarding Query Keys
 */

import type { OnboardingStatus } from '@/types/hr/onboarding.types';

export interface OnboardingFilters {
  page?: number;
  perPage?: number;
  employeeId?: string;
  status?: OnboardingStatus;
  search?: string;
}

export const onboardingKeys = {
  all: ['onboarding-checklists'] as const,
  lists: () => [...onboardingKeys.all, 'list'] as const,
  list: (filters?: OnboardingFilters) =>
    [...onboardingKeys.lists(), filters ?? {}] as const,
  details: () => [...onboardingKeys.all, 'detail'] as const,
  detail: (id: string) => [...onboardingKeys.details(), id] as const,
} as const;

export default onboardingKeys;
