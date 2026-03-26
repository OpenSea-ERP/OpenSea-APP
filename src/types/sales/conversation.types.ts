// Conversation Types

import type { PaginatedQuery } from '../pagination';

export type ConversationStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  OPEN: 'Aberta',
  CLOSED: 'Fechada',
  ARCHIVED: 'Arquivada',
};

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId?: string;
  senderName: string;
  senderType: 'AGENT' | 'SYSTEM';
  content: string;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  customerId: string;
  customerName?: string;
  subject: string;
  status: ConversationStatus;
  lastMessageAt?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  messages?: ConversationMessage[];
}

export interface CreateConversationRequest {
  customerId: string;
  subject: string;
  initialMessage?: string;
}

export interface SendConversationMessageRequest {
  content: string;
}

export interface ConversationsQuery extends PaginatedQuery {
  status?: ConversationStatus;
  customerId?: string;
}
