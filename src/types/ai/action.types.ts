export type AiActionStatus =
  | 'PROPOSED'
  | 'CONFIRMED'
  | 'EXECUTED'
  | 'FAILED'
  | 'CANCELLED';

export interface AiActionLog {
  id: string;
  tenantId: string;
  userId: string;
  conversationId: string | null;
  messageId: string | null;
  actionType: string;
  targetModule: string;
  targetEntityType: string;
  targetEntityId: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: AiActionStatus;
  confirmedByUserId: string | null;
  confirmedAt: string | null;
  executedAt: string | null;
  error: string | null;
  createdAt: string;
}
