// ============================================================================
// Onboarding Types
// Re-export base types from portal.types to avoid duplicates
// ============================================================================

import type { OnboardingChecklist } from './portal.types';

export type { OnboardingChecklist, OnboardingChecklistItem } from './portal.types';

export type OnboardingStatus = 'IN_PROGRESS' | 'COMPLETED';

// ============================================================================
// Request / Response Types
// ============================================================================

export interface CreateOnboardingChecklistData {
  employeeId: string;
  title?: string;
  items?: { title: string; description?: string }[];
}

export interface UpdateOnboardingChecklistData {
  title?: string;
  items?: { title: string; description?: string }[];
}

export interface OnboardingChecklistResponse {
  checklist: OnboardingChecklist;
}

export interface OnboardingChecklistsResponse {
  checklists: OnboardingChecklist[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface ListOnboardingChecklistsParams {
  page?: number;
  perPage?: number;
  employeeId?: string;
  status?: OnboardingStatus;
  search?: string;
}
