/**
 * One-on-One Meeting Types
 * Tipos para reuniões 1:1 entre gestor e liderado (estilo Lattice / 15Five).
 */

// ============================================================================
// ENUMS
// ============================================================================

export type OneOnOneStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type OneOnOneRole = 'manager' | 'report';

export type OneOnOneRecurrence =
  | 'ONE_TIME'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY';

// ============================================================================
// ENTITIES
// ============================================================================

export interface OneOnOneParticipantSummary {
  id: string;
  fullName: string;
  email?: string | null;
  position?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
}

export interface TalkingPoint {
  id: string;
  meetingId: string;
  authorId: string;
  authorRole: OneOnOneRole;
  content: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  // Enriched
  author?: OneOnOneParticipantSummary | null;
}

export interface OneOnOneActionItem {
  id: string;
  meetingId: string;
  ownerId: string;
  content: string;
  completed: boolean;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  // Enriched
  owner?: OneOnOneParticipantSummary | null;
}

export interface OneOnOneNote {
  id: string;
  meetingId: string;
  authorId: string;
  authorRole: OneOnOneRole;
  /** When true, only the author can see it. */
  isPrivate: boolean;
  content: string;
  updatedAt: string;
}

export interface OneOnOneMeeting {
  id: string;
  managerId: string;
  reportId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: OneOnOneStatus;
  cancelledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Enriched
  manager?: OneOnOneParticipantSummary | null;
  report?: OneOnOneParticipantSummary | null;
  talkingPoints?: TalkingPoint[];
  actionItems?: OneOnOneActionItem[];
  /** Notes filtered by role on the backend (private notes only for the requester) */
  notes?: OneOnOneNote[];
  /** Optional aggregate counters returned by list endpoints */
  _count?: {
    talkingPoints?: number;
    actionItems?: number;
    openActionItems?: number;
  };
}

// ============================================================================
// FILTERS / DTOs
// ============================================================================

export interface ListOneOnOnesFilters {
  role?: OneOnOneRole;
  status?: OneOnOneStatus;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}

export interface ScheduleOneOnOneData {
  reportId: string;
  scheduledAt: string;
  durationMinutes?: number;
  /** Only the first occurrence is sent to the API; recurrence is handled client-side as multiple POSTs. */
  recurrence?: OneOnOneRecurrence;
  /** When recurrence != ONE_TIME, how many occurrences to schedule (defaults to 1). */
  occurrences?: number;
}

export interface UpdateOneOnOneData {
  scheduledAt?: string;
  durationMinutes?: number;
  status?: OneOnOneStatus;
}

export interface AddTalkingPointData {
  content: string;
}

export interface UpdateTalkingPointData {
  content?: string;
  resolved?: boolean;
}

export interface AddActionItemData {
  content: string;
  ownerId: string;
  dueDate?: string;
}

export interface UpdateActionItemData {
  content?: string;
  ownerId?: string;
  dueDate?: string | null;
  completed?: boolean;
}

export interface UpsertNoteData {
  content: string;
  isPrivate: boolean;
}
