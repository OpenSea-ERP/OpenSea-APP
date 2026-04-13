// Activity Types

import type { PaginatedQuery } from '../pagination';

export type ActivityType =
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'TASK'
  | 'NOTE'
  | 'WHATSAPP'
  | 'VISIT'
  | 'PROPOSAL'
  | 'FOLLOW_UP';

export type ActivityOutcome =
  | 'COMPLETED'
  | 'NO_ANSWER'
  | 'BUSY'
  | 'VOICEMAIL'
  | 'WRONG_NUMBER'
  | 'INTERESTED'
  | 'NOT_INTERESTED'
  | 'RESCHEDULED'
  | 'CANCELLED';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  CALL: 'Ligação',
  EMAIL: 'E-mail',
  MEETING: 'Reuniao',
  TASK: 'Tarefa',
  NOTE: 'Nota',
  WHATSAPP: 'WhatsApp',
  VISIT: 'Visita',
  PROPOSAL: 'Proposta',
  FOLLOW_UP: 'Acompanhamento',
};

export const ACTIVITY_OUTCOME_LABELS: Record<ActivityOutcome, string> = {
  COMPLETED: 'Concluido',
  NO_ANSWER: 'Sem Resposta',
  BUSY: 'Ocupado',
  VOICEMAIL: 'Caixa Postal',
  WRONG_NUMBER: 'Número Errado',
  INTERESTED: 'Interessado',
  NOT_INTERESTED: 'Sem Interesse',
  RESCHEDULED: 'Reagendado',
  CANCELLED: 'Cancelado',
};

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  outcome?: ActivityOutcome;
  dealId?: string;
  contactId?: string;
  customerId?: string;
  assignedToUserId?: string;
  dueDate?: string;
  completedAt?: string;
  durationMinutes?: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateActivityRequest {
  type: ActivityType;
  subject: string;
  description?: string;
  outcome?: ActivityOutcome;
  dealId?: string;
  contactId?: string;
  customerId?: string;
  assignedToUserId?: string;
  dueDate?: string;
  durationMinutes?: number;
}

export interface UpdateActivityRequest {
  type?: ActivityType;
  subject?: string;
  description?: string;
  outcome?: ActivityOutcome;
  dealId?: string;
  contactId?: string;
  customerId?: string;
  assignedToUserId?: string;
  dueDate?: string;
  completedAt?: string;
  durationMinutes?: number;
  isCompleted?: boolean;
}

export interface ActivityResponse {
  activity: Activity;
}

export interface PaginatedActivitiesResponse {
  activities: Activity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ActivitiesQuery extends PaginatedQuery {
  search?: string;
  type?: ActivityType;
  dealId?: string;
  contactId?: string;
  customerId?: string;
  assignedToUserId?: string;
  isCompleted?: boolean;
}

// Timeline Types (union for merged timeline)

export type TimelineItemType =
  | 'ACTIVITY'
  | 'DEAL_CREATED'
  | 'DEAL_STAGE_CHANGED'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  | 'NOTE'
  | 'EMAIL'
  | 'CONTACT_CREATED';

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  entityId: string;
  entityType: string;
  createdAt: string;
  createdByUserId?: string;
}

export interface PaginatedTimelineResponse {
  items: TimelineItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface TimelineQuery extends PaginatedQuery {
  entityId: string;
  entityType: 'deal' | 'contact' | 'customer';
}
