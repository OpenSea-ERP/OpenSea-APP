export type AiInsightType =
  | 'TREND'
  | 'ANOMALY'
  | 'OPPORTUNITY'
  | 'RISK'
  | 'PREDICTION'
  | 'RECOMMENDATION'
  | 'ALERT'
  | 'CELEBRATION';
export type AiInsightPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AiInsightStatus =
  | 'NEW'
  | 'VIEWED'
  | 'ACTED_ON'
  | 'DISMISSED'
  | 'EXPIRED';

export interface AiInsight {
  id: string;
  tenantId: string;
  type: AiInsightType;
  priority: AiInsightPriority;
  title: string;
  content: string;
  renderData?: Record<string, unknown> | null;
  module: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  status: AiInsightStatus;
  actionUrl?: string | null;
  suggestedAction?: string | null;
  expiresAt?: string | null;
  viewedAt?: string | null;
  actedOnAt?: string | null;
  dismissedAt?: string | null;
  createdAt: string;
}
