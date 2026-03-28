// ============================================================================
// Onboarding Types
// ============================================================================

export interface OnboardingChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string | null;
}

export interface OnboardingChecklist {
  id: string;
  tenantId: string;
  employeeId: string;
  title: string;
  items: OnboardingChecklistItem[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

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
