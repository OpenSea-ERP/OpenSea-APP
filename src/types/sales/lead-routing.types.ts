// Lead Routing Types

export type LeadRoutingStrategy =
  | 'ROUND_ROBIN'
  | 'TERRITORY'
  | 'SEGMENT'
  | 'LOAD_BALANCE';

export const LEAD_ROUTING_STRATEGY_LABELS: Record<LeadRoutingStrategy, string> = {
  ROUND_ROBIN: 'Round Robin',
  TERRITORY: 'Território',
  SEGMENT: 'Segmento',
  LOAD_BALANCE: 'Balanceamento',
};

export interface LeadRoutingAssignment {
  id: string;
  userId: string;
  userName?: string;
  totalAssigned: number;
  lastAssignedAt?: string;
}

export interface LeadRoutingRule {
  id: string;
  name: string;
  description?: string;
  strategy: LeadRoutingStrategy;
  isActive: boolean;
  priority: number;
  conditions?: Record<string, unknown>;
  assignments: LeadRoutingAssignment[];
  totalRouted: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadRoutingRuleResponse {
  rule: LeadRoutingRule;
}

export interface LeadRoutingRulesResponse {
  rules: LeadRoutingRule[];
}

export interface PaginatedLeadRoutingRulesResponse {
  rules: LeadRoutingRule[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface LeadRoutingQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  strategy?: LeadRoutingStrategy;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLeadRoutingRuleRequest {
  name: string;
  description?: string;
  strategy: LeadRoutingStrategy;
  isActive?: boolean;
  priority?: number;
  conditions?: Record<string, unknown>;
  userIds: string[];
}

export interface UpdateLeadRoutingRuleRequest {
  name?: string;
  description?: string;
  strategy?: LeadRoutingStrategy;
  isActive?: boolean;
  priority?: number;
  conditions?: Record<string, unknown>;
  userIds?: string[];
}
