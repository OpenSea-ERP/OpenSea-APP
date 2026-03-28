// ============================================================================
// Offboarding Types
// ============================================================================

export interface OffboardingChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string | null;
}

export interface OffboardingChecklist {
  id: string;
  tenantId: string;
  employeeId: string;
  terminationId: string | null;
  title: string;
  items: OffboardingChecklistItem[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export type OffboardingStatus = 'IN_PROGRESS' | 'COMPLETED';

// ============================================================================
// Request / Response Types
// ============================================================================

export interface CreateOffboardingChecklistData {
  employeeId: string;
  terminationId?: string;
  title?: string;
  items?: { title: string; description?: string }[];
}

export interface UpdateOffboardingChecklistData {
  title?: string;
  items?: { title: string; description?: string }[];
}

export interface OffboardingChecklistResponse {
  checklist: OffboardingChecklist;
}

export interface OffboardingChecklistsResponse {
  checklists: OffboardingChecklist[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface ListOffboardingChecklistsParams {
  page?: number;
  perPage?: number;
  employeeId?: string;
  status?: OffboardingStatus;
  search?: string;
}
