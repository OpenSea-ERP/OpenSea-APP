export type AiConversationContext = 'DEDICATED' | 'INLINE' | 'COMMAND_BAR' | 'VOICE';
export type AiConversationStatus = 'ACTIVE' | 'ARCHIVED';

export interface AiConversation {
  id: string;
  tenantId: string;
  userId: string;
  title: string | null;
  status: AiConversationStatus;
  context: AiConversationContext;
  contextModule: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export type AiMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL_CALL' | 'TOOL_RESULT';
export type AiMessageContentType = 'TEXT' | 'CHART' | 'TABLE' | 'KPI_CARD' | 'ACTION_CARD' | 'IMAGE' | 'ERROR' | 'LOADING';

export interface AiMessage {
  id: string;
  conversationId?: string;
  role: AiMessageRole;
  content: string | null;
  contentType: AiMessageContentType;
  renderData?: Record<string, unknown> | null;
  attachments?: Record<string, unknown> | null;
  aiModel?: string | null;
  aiLatencyMs?: number | null;
  toolCalls?: Record<string, unknown> | null;
  actionsTaken?: Record<string, unknown> | null;
  audioUrl?: string | null;
  transcription?: string | null;
  createdAt: string;
}

export interface SendMessageRequest {
  conversationId?: string;
  content: string;
  context?: AiConversationContext;
  contextModule?: string;
  contextEntityType?: string;
  contextEntityId?: string;
}

export interface SendMessageResponse {
  conversationId: string;
  userMessage: AiMessage;
  assistantMessage: AiMessage;
}
