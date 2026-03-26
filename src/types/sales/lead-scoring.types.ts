// Lead Scoring Types

export type LeadScoreField =
  | 'source'
  | 'type'
  | 'hasEmail'
  | 'hasPhone'
  | 'totalOrders'
  | 'totalSpent'
  | 'lastActivityDays'
  | 'industry'
  | 'city'
  | 'state';

export type LeadScoreCondition =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'is_true'
  | 'is_false';

export type LeadScoreTier = 'HOT' | 'WARM' | 'COLD';

export const LEAD_SCORE_FIELD_LABELS: Record<LeadScoreField, string> = {
  source: 'Origem',
  type: 'Tipo de Pessoa',
  hasEmail: 'Possui E-mail',
  hasPhone: 'Possui Telefone',
  totalOrders: 'Total de Pedidos',
  totalSpent: 'Valor Total Gasto',
  lastActivityDays: 'Dias desde Última Atividade',
  industry: 'Setor',
  city: 'Cidade',
  state: 'Estado',
};

export const LEAD_SCORE_CONDITION_LABELS: Record<LeadScoreCondition, string> = {
  equals: 'Igual a',
  not_equals: 'Diferente de',
  greater_than: 'Maior que',
  less_than: 'Menor que',
  contains: 'Contém',
  is_true: 'Verdadeiro',
  is_false: 'Falso',
};

export const LEAD_SCORE_TIER_LABELS: Record<LeadScoreTier, string> = {
  HOT: 'Quente',
  WARM: 'Morno',
  COLD: 'Frio',
};

export interface LeadScoringRule {
  id: string;
  name: string;
  field: LeadScoreField;
  condition: LeadScoreCondition;
  value: string;
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadScoringRuleResponse {
  rule: LeadScoringRule;
}

export interface LeadScoringRulesResponse {
  rules: LeadScoringRule[];
}

export interface PaginatedLeadScoringRulesResponse {
  rules: LeadScoringRule[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface LeadScoringQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLeadScoringRuleRequest {
  name: string;
  field: LeadScoreField;
  condition: LeadScoreCondition;
  value: string;
  points: number;
  isActive?: boolean;
}

export interface UpdateLeadScoringRuleRequest {
  name?: string;
  field?: LeadScoreField;
  condition?: LeadScoreCondition;
  value?: string;
  points?: number;
  isActive?: boolean;
}

export interface CustomerScore {
  customerId: string;
  score: number;
  tier: LeadScoreTier;
}
