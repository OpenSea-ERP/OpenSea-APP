// ============================================================================
// Finance Auto-Approval Rule Types
// ============================================================================

export type FinanceApprovalAction = 'AUTO_PAY' | 'AUTO_APPROVE' | 'FLAG_REVIEW';

export interface ApprovalRuleConditions {
  categoryIds?: string[];
  supplierNames?: string[];
  entryType?: 'PAYABLE' | 'RECEIVABLE';
  minRecurrence?: number;
}

export interface FinanceApprovalRule {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  action: FinanceApprovalAction;
  maxAmount?: number;
  conditions: ApprovalRuleConditions;
  priority: number;
  appliedCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateApprovalRuleRequest {
  name: string;
  isActive?: boolean;
  action: FinanceApprovalAction;
  maxAmount?: number;
  conditions?: ApprovalRuleConditions;
  priority?: number;
}

export interface UpdateApprovalRuleRequest {
  name?: string;
  isActive?: boolean;
  action?: FinanceApprovalAction;
  maxAmount?: number | null;
  conditions?: ApprovalRuleConditions;
  priority?: number;
}

export interface ApprovalRuleListResponse {
  rules: FinanceApprovalRule[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApprovalRuleResponse {
  rule: FinanceApprovalRule;
}

export interface EvaluateApprovalResponse {
  matched: boolean;
  rule?: FinanceApprovalRule;
  action?: FinanceApprovalAction;
}

export const APPROVAL_ACTION_LABELS: Record<FinanceApprovalAction, string> = {
  AUTO_PAY: 'Pagamento Automático',
  AUTO_APPROVE: 'Aprovação Automática',
  FLAG_REVIEW: 'Sinalizar Revisão',
};

export const APPROVAL_ACTION_COLORS: Record<
  FinanceApprovalAction,
  { bg: string; text: string; border: string }
> = {
  AUTO_PAY: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  AUTO_APPROVE: {
    bg: 'bg-sky-50 dark:bg-sky-500/8',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
  },
  FLAG_REVIEW: {
    bg: 'bg-amber-50 dark:bg-amber-500/8',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

export const ENTRY_TYPE_LABELS: Record<string, string> = {
  PAYABLE: 'A Pagar',
  RECEIVABLE: 'A Receber',
};
