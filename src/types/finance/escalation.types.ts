// ============================================================================
// Overdue Escalation Types
// ============================================================================

export type EscalationChannel =
  | 'EMAIL'
  | 'WHATSAPP'
  | 'INTERNAL_NOTE'
  | 'SYSTEM_ALERT';

export type EscalationTemplateType =
  | 'FRIENDLY_REMINDER'
  | 'FORMAL_NOTICE'
  | 'URGENT_NOTICE'
  | 'FINAL_NOTICE';

export interface EscalationStep {
  id?: string;
  daysOverdue: number;
  channel: EscalationChannel;
  templateType: EscalationTemplateType;
  message: string;
  order: number;
}

export interface EscalationConfig {
  id: string;
  tenantId: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  steps: EscalationStep[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateEscalationRequest {
  name: string;
  isDefault?: boolean;
  isActive?: boolean;
  steps: Omit<EscalationStep, 'id'>[];
}

export interface UpdateEscalationRequest {
  name?: string;
  isDefault?: boolean;
  isActive?: boolean;
  steps?: Omit<EscalationStep, 'id'>[];
}

export interface EscalationListResponse {
  escalations: EscalationConfig[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

export interface EscalationResponse {
  escalation: EscalationConfig;
}

export type CustomerScoreLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface CustomerScore {
  customerName: string;
  score: number;
  level: CustomerScoreLevel;
  avgDaysToPay: number;
  onTimeRate: number;
  totalEntries: number;
}

export interface CustomerScoreResponse {
  score: CustomerScore;
}

export const ESCALATION_CHANNEL_LABELS: Record<EscalationChannel, string> = {
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
  INTERNAL_NOTE: 'Nota Interna',
  SYSTEM_ALERT: 'Alerta do Sistema',
};

export const ESCALATION_TEMPLATE_LABELS: Record<
  EscalationTemplateType,
  string
> = {
  FRIENDLY_REMINDER: 'Lembrete Amigável',
  FORMAL_NOTICE: 'Aviso Formal',
  URGENT_NOTICE: 'Aviso Urgente',
  FINAL_NOTICE: 'Última Notificação',
};

export const CUSTOMER_SCORE_COLORS: Record<
  CustomerScoreLevel,
  { bg: string; text: string }
> = {
  EXCELLENT: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  GOOD: {
    bg: 'bg-sky-50 dark:bg-sky-500/8',
    text: 'text-sky-700 dark:text-sky-300',
  },
  FAIR: {
    bg: 'bg-amber-50 dark:bg-amber-500/8',
    text: 'text-amber-700 dark:text-amber-300',
  },
  POOR: {
    bg: 'bg-rose-50 dark:bg-rose-500/8',
    text: 'text-rose-700 dark:text-rose-300',
  },
};

export const CUSTOMER_SCORE_LABELS: Record<CustomerScoreLevel, string> = {
  EXCELLENT: 'Excelente',
  GOOD: 'Bom',
  FAIR: 'Regular',
  POOR: 'Ruim',
};
