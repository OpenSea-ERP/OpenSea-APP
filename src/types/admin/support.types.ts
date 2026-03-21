export interface SupportTicket {
  id: string;
  ticketNumber: number;
  tenantId: string;
  tenantName?: string;
  createdByUserId: string;
  creatorName?: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  aiConversationId?: string;
  aiSummary?: string;
  assignedToUserId?: string;
  assigneeName?: string;
  slaFirstResponseMinutes?: number;
  slaResolutionMinutes?: number;
  firstRespondedAt?: string;
  slaBreached: boolean;
  resolvedAt?: string;
  closedAt?: string;
  resolutionNotes?: string;
  satisfactionRating?: number;
  satisfactionComment?: string;
  createdAt: string;
  updatedAt: string;
  messages?: SupportTicketMessage[];
}

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  authorUserId: string;
  authorName?: string;
  authorType: 'TENANT_USER' | 'CENTRAL_TEAM' | 'AI_ASSISTANT';
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface SupportMetrics {
  avgFirstResponseMinutes: number;
  avgResolutionMinutes: number;
  slaBreachCount: number;
  satisfactionAvg: number;
  aiResolutionRate: number;
  openCount: number;
  inProgressCount: number;
  waitingCount: number;
  resolvedCount: number;
}

export interface SlaConfig {
  priority: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  isActive: boolean;
}
