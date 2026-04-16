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
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

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

  // Social feed extensions (backend feed endpoint)
  /** Top emoji counts (max 5 entries) returned by `GET /v1/hr/kudos/feed` */
  reactionsSummary?: KudosReactionSummaryEntry[];
  /** Total reply count for thread preview */
  repliesCount?: number;
  /** Whether this kudos was pinned to the top of the feed */
  isPinned?: boolean;
  /** Timestamp when it was pinned */
  pinnedAt?: string | null;
  /** Employee id that pinned the kudos */
  pinnedBy?: string | null;
}

/** Aggregated emoji entry returned in `reactionsSummary` */
export interface KudosReactionSummaryEntry {
  emoji: string;
  count: number;
  /** True when current user has reacted with this emoji */
  hasReacted?: boolean;
}

/** Single reaction record (returned by `GET /v1/hr/kudos/:id/reactions`) */
export interface KudosReaction {
  id: string;
  kudosId: string;
  employeeId: string;
  emoji: string;
  createdAt: string;
  employee?: {
    id: string;
    fullName: string;
    photoUrl?: string;
  };
}

export interface KudosReactionsGroupedResponse {
  reactions: Array<{
    emoji: string;
    count: number;
    employees: Array<{ id: string; fullName: string; photoUrl?: string }>;
  }>;
}

export interface KudosReactionToggleResponse {
  reactions: KudosReactionSummaryEntry[];
  /** True if a reaction was created, false if it was removed */
  added: boolean;
}

/** Single reply on a kudos thread */
export interface KudosReply {
  id: string;
  kudosId: string;
  authorEmployeeId: string;
  authorEmployee?: {
    id: string;
    fullName: string;
    photoUrl?: string;
    position?: { name: string };
    department?: { name: string };
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface KudosRepliesResponse {
  replies: KudosReply[];
}

export interface KudosReplyResponse {
  reply: KudosReply;
}

export interface SendKudosData {
  toEmployeeId: string;
  message: string;
  category: KudosCategory;
  isPublic?: boolean;
}

export interface ToggleReactionData {
  emoji: string;
}

export interface CreateReplyData {
  content: string;
}

export interface UpdateReplyData {
  content: string;
}

export interface KudosFeedQueryParams {
  /** When provided, restricts to pinned (true) or non-pinned (false). */
  pinned?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// Onboarding Checklist
// ============================================================================

export interface OnboardingChecklist {
  id: string;
  tenantId: string;
  employeeId: string;
  title: string;
  items: OnboardingChecklistItem[];
  progress: number;
  createdAt: string;
  updatedAt: string;

  // Populated relation
  employee?: {
    id: string;
    fullName: string;
    position?: { name: string };
    department?: { name: string };
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface EmployeeRequestResponse {
  employeeRequest: EmployeeRequest;
  /** @deprecated Alias for backward compatibility */
  request?: EmployeeRequest;
}

export interface EmployeeRequestsResponse {
  employeeRequests: EmployeeRequest[];
  /** @deprecated Alias for backward compatibility */
  requests?: EmployeeRequest[];
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

export interface HRPendingApprovalsResponse {
  employeeRequests: EmployeeRequest[];
  /** @deprecated Alias for backward compatibility */
  requests?: EmployeeRequest[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

// Note: PendingApprovalsResponse is also defined in stock/item.types.ts
// Use HRPendingApprovalsResponse to avoid barrel export conflict
