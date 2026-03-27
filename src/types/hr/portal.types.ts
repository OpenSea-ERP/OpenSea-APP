// ============================================================================
// Employee Portal Types
// ============================================================================

/** Request types that employees can submit */
export type RequestType =
  | 'VACATION'
  | 'ABSENCE'
  | 'ADVANCE'
  | 'DATA_CHANGE'
  | 'SUPPORT';

/** Status of an employee request */
export type RequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

/** Priority levels for company announcements */
export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

/** Categories for kudos/recognition */
export type KudosCategory =
  | 'TEAMWORK'
  | 'INNOVATION'
  | 'LEADERSHIP'
  | 'EXCELLENCE'
  | 'HELPFULNESS';

/** Onboarding checklist item */
export interface OnboardingChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'DOCUMENTATION' | 'TRAINING' | 'COMPANY_INTRO' | 'SETTINGS';
  completed: boolean;
  completedAt: string | null;
}

// ============================================================================
// Employee Request
// ============================================================================

export interface EmployeeRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  type: RequestType;
  status: RequestStatus;
  data: Record<string, unknown>;
  approverEmployeeId: string | null;
  approverEmployee?: {
    id: string;
    fullName: string;
  };
  employee?: {
    id: string;
    fullName: string;
    department?: { id: string; name: string };
  };
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequestData {
  type: RequestType;
  data: Record<string, unknown>;
}

// ============================================================================
// Company Announcement
// ============================================================================

export interface CompanyAnnouncement {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  publishedAt: string;
  expiresAt: string | null;
  authorEmployeeId: string;
  authorEmployee?: {
    id: string;
    fullName: string;
  };
  targetDepartmentIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  expiresAt?: string;
  targetDepartmentIds?: string[];
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  expiresAt?: string | null;
  targetDepartmentIds?: string[];
  isActive?: boolean;
}

// ============================================================================
// Employee Kudos
// ============================================================================

export interface EmployeeKudos {
  id: string;
  tenantId: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  fromEmployee?: {
    id: string;
    fullName: string;
    photoUrl?: string;
    position?: { name: string };
    department?: { name: string };
  };
  toEmployee?: {
    id: string;
    fullName: string;
    photoUrl?: string;
    position?: { name: string };
    department?: { name: string };
  };
  message: string;
  category: KudosCategory;
  isPublic: boolean;
  createdAt: string;
}

export interface SendKudosData {
  toEmployeeId: string;
  message: string;
  category: KudosCategory;
  isPublic?: boolean;
}

// ============================================================================
// Onboarding Checklist
// ============================================================================

export interface OnboardingChecklist {
  id: string;
  tenantId: string;
  employeeId: string;
  items: OnboardingChecklistItem[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface EmployeeRequestResponse {
  request: EmployeeRequest;
}

export interface EmployeeRequestsResponse {
  requests: EmployeeRequest[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

export interface AnnouncementResponse {
  announcement: CompanyAnnouncement;
}

export interface AnnouncementsResponse {
  announcements: CompanyAnnouncement[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

export interface KudosResponse {
  kudos: EmployeeKudos;
}

export interface KudosListResponse {
  kudos: EmployeeKudos[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

export interface OnboardingResponse {
  onboarding: OnboardingChecklist;
}

export interface PendingApprovalsResponse {
  requests: EmployeeRequest[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}
