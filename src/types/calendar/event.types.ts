// Event enums as union types
export type EventType =
  | 'MEETING'
  | 'TASK'
  | 'REMINDER'
  | 'DEADLINE'
  | 'HOLIDAY'
  | 'BIRTHDAY'
  | 'VACATION'
  | 'ABSENCE'
  | 'FINANCE_DUE'
  | 'PURCHASE_ORDER'
  | 'CUSTOM';

export type EventVisibility = 'PUBLIC' | 'PRIVATE';

export type ParticipantRole = 'OWNER' | 'ASSIGNEE' | 'GUEST';

export type ParticipantStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  respondedAt: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface EventReminder {
  id: string;
  eventId: string;
  userId: string;
  minutesBefore: number;
  isSent: boolean;
  sentAt: string | null;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  tenantId: string;
  calendarId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  type: EventType;
  visibility: EventVisibility;
  color: string | null;
  rrule: string | null;
  timezone: string | null;
  systemSourceType: string | null;
  systemSourceId: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  creatorName: string | null;
  participants?: EventParticipant[];
  reminders?: EventReminder[];
  isRecurring: boolean;
  occurrenceDate: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCalendarEventData {
  calendarId?: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  type?: EventType;
  visibility?: EventVisibility;
  color?: string | null;
  rrule?: string | null;
  timezone?: string | null;
  participants?: { userId: string; role?: ParticipantRole }[];
  reminders?: { minutesBefore: number }[];
}

export interface UpdateCalendarEventData {
  title?: string;
  description?: string | null;
  location?: string | null;
  startDate?: string;
  endDate?: string;
  isAllDay?: boolean;
  type?: EventType;
  visibility?: EventVisibility;
  color?: string | null;
  rrule?: string | null;
  timezone?: string | null;
}

export interface CalendarEventsQuery {
  startDate: string;
  endDate: string;
  type?: EventType;
  search?: string;
  includeSystemEvents?: boolean;
  calendarIds?: string;
  page?: number;
  limit?: number;
}

// Phase 3 - Invites, RSVP, Reminders

export interface InviteParticipantsData {
  participants: { userId: string; role?: ParticipantRole }[];
}

export interface InviteParticipantsResponse {
  invited: number;
}

export interface RespondToEventData {
  status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
}

export interface RespondToEventResponse {
  participantId: string;
  status: string;
}

export interface ManageRemindersData {
  reminders: { minutesBefore: number }[];
}

export interface ManageRemindersResponse {
  count: number;
}

// System event source type mapping for Phase 4
export type SystemSourceType =
  | 'HR_ABSENCE'
  | 'HR_BIRTHDAY'
  | 'FINANCE_ENTRY'
  | 'STOCK_PO';

export const SYSTEM_SOURCE_ROUTES: Record<SystemSourceType, (id: string) => string> = {
  HR_ABSENCE: (id) => `/hr/absences/${id}`,
  HR_BIRTHDAY: (id) => `/hr/employees/${id}`,
  FINANCE_ENTRY: (id) => `/finance/entries/${id}`,
  STOCK_PO: (id) => `/stock/purchase-orders/${id}`,
};

export const SYSTEM_SOURCE_LABELS: Record<SystemSourceType, string> = {
  HR_ABSENCE: 'Ausência/Férias',
  HR_BIRTHDAY: 'Funcionário',
  FINANCE_ENTRY: 'Lançamento Financeiro',
  STOCK_PO: 'Pedido de Compra',
};

// Reminder presets for the UI
export const REMINDER_PRESETS = [
  { label: '5 minutos antes', value: 5 },
  { label: '10 minutos antes', value: 10 },
  { label: '15 minutos antes', value: 15 },
  { label: '30 minutos antes', value: 30 },
  { label: '1 hora antes', value: 60 },
  { label: '1 dia antes', value: 1440 },
] as const;

// Color mapping for event types
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  MEETING: '#3b82f6',
  TASK: '#f59e0b',
  REMINDER: '#8b5cf6',
  DEADLINE: '#ef4444',
  HOLIDAY: '#10b981',
  BIRTHDAY: '#ec4899',
  VACATION: '#06b6d4',
  ABSENCE: '#f97316',
  FINANCE_DUE: '#14b8a6',
  PURCHASE_ORDER: '#6366f1',
  CUSTOM: '#64748b',
};
