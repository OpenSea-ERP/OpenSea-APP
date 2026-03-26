import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  ApprovalRuleListResponse,
  ApprovalRuleResponse,
  CreateApprovalRuleRequest,
  EvaluateApprovalResponse,
  FinanceApprovalAction,
  UpdateApprovalRuleRequest,
} from '@/types/finance';

export const approvalRulesService = {
  async list(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    action?: FinanceApprovalAction;
  }): Promise<ApprovalRuleListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params?.action) query.set('action', params.action);

    return apiClient.get<ApprovalRuleListResponse>(
      `${API_ENDPOINTS.FINANCE_APPROVAL_RULES.LIST}?${query.toString()}`
    );
  },

  async get(id: string): Promise<ApprovalRuleResponse> {
    return apiClient.get<ApprovalRuleResponse>(
      API_ENDPOINTS.FINANCE_APPROVAL_RULES.GET(id)
    );
  },

  async create(data: CreateApprovalRuleRequest): Promise<ApprovalRuleResponse> {
    return apiClient.post<ApprovalRuleResponse>(
      API_ENDPOINTS.FINANCE_APPROVAL_RULES.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateApprovalRuleRequest
  ): Promise<ApprovalRuleResponse> {
    return apiClient.patch<ApprovalRuleResponse>(
      API_ENDPOINTS.FINANCE_APPROVAL_RULES.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.FINANCE_APPROVAL_RULES.DELETE(id));
  },

  async toggleActive(id: string, isActive: boolean): Promise<ApprovalRuleResponse> {
    return apiClient.patch<ApprovalRuleResponse>(
      API_ENDPOINTS.FINANCE_APPROVAL_RULES.UPDATE(id),
      { isActive }
    );
  },

  async evaluate(entryId: string): Promise<EvaluateApprovalResponse> {
    return apiClient.post<EvaluateApprovalResponse>(
      API_ENDPOINTS.FINANCE_APPROVAL_RULES.EVALUATE(entryId),
      {}
    );
  },
};
