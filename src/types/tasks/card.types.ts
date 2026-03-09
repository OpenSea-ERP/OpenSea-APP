import type { Label } from './label.types';
import type { Checklist } from './checklist.types';
import type { CardCustomFieldValue } from './custom-field.types';

// Card enums as union types
export type CardStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';

export type CardPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Card {
  id: string;
  boardId: string;
  columnId: string;
  parentCardId: string | null;
  title: string;
  description: string | null;
  status: CardStatus;
  priority: CardPriority;
  position: number;
  dueDate: string | null;
  startDate: string | null;
  estimatedHours: number | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdBy: string;
  creatorName: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  labels?: Label[];
  subtasks?: Card[];
  checklists?: Checklist[];
  customFieldValues?: CardCustomFieldValue[];
  _count?: {
    subtasks: number;
    completedSubtasks: number;
    comments: number;
    attachments: number;
  };
}

export interface CreateCardRequest {
  columnId?: string;
  parentCardId?: string | null;
  title: string;
  description?: string | null;
  status?: CardStatus;
  priority?: CardPriority;
  position?: number;
  dueDate?: string | null;
  startDate?: string | null;
  estimatedHours?: number | null;
  assigneeId?: string | null;
  labelIds?: string[];
}

export interface UpdateCardRequest {
  columnId?: string;
  parentCardId?: string | null;
  title?: string;
  description?: string | null;
  status?: CardStatus;
  priority?: CardPriority;
  position?: number;
  dueDate?: string | null;
  startDate?: string | null;
  estimatedHours?: number | null;
  assigneeId?: string | null;
}

export interface MoveCardRequest {
  columnId: string;
  position: number;
}

export interface CardsQuery {
  page?: number;
  limit?: number;
  search?: string;
  columnId?: string;
  status?: CardStatus;
  priority?: CardPriority;
  assigneeId?: string;
  labelId?: string;
  hasDueDate?: boolean;
  includeArchived?: boolean;
}

// Priority config for UI rendering (PT-BR labels)
export const PRIORITY_CONFIG: Record<
  CardPriority,
  { label: string; color: string; dotColor: string }
> = {
  URGENT: { label: 'Urgente', color: 'text-red-600', dotColor: 'bg-red-500' },
  HIGH: { label: 'Alta', color: 'text-orange-600', dotColor: 'bg-orange-500' },
  MEDIUM: {
    label: 'Média',
    color: 'text-yellow-600',
    dotColor: 'bg-yellow-500',
  },
  LOW: { label: 'Baixa', color: 'text-blue-600', dotColor: 'bg-blue-500' },
  NONE: {
    label: 'Nenhuma',
    color: 'text-muted-foreground',
    dotColor: 'bg-gray-400',
  },
};

// Status config for UI rendering (PT-BR labels)
export const STATUS_CONFIG: Record<
  CardStatus,
  { label: string; color: string }
> = {
  OPEN: { label: 'Aberto', color: 'text-gray-600' },
  IN_PROGRESS: { label: 'Em Progresso', color: 'text-blue-600' },
  DONE: { label: 'Concluído', color: 'text-green-600' },
  CANCELED: { label: 'Cancelado', color: 'text-red-600' },
};
