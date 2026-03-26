import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateLeadScoringRuleRequest,
  CustomerScore,
  LeadScoringQuery,
  LeadScoringRuleResponse,
  PaginatedLeadScoringRulesResponse,
  UpdateLeadScoringRuleRequest,
} from '@/types/sales';

export const leadScoringService = {
  async list(query?: LeadScoringQuery): Promise<PaginatedLeadScoringRulesResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('perPage', query.limit.toString());
    if (query?.search) params.append('search', query.search);
    if (query?.isActive !== undefined) params.append('isActive', String(query.isActive));
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

    const url = params.toString()
      ? `${API_ENDPOINTS.LEAD_SCORING.LIST}?${params.toString()}`
      : API_ENDPOINTS.LEAD_SCORING.LIST;

    const raw = await apiClient.get<Record<string, unknown>>(url);
    if (raw.meta) return raw as unknown as PaginatedLeadScoringRulesResponse;
    return {
      rules: raw.rules as PaginatedLeadScoringRulesResponse['rules'],
      meta: {
        total: raw.total as number,
        page: raw.page as number,
        limit: (raw.perPage ?? raw.limit ?? 20) as number,
        pages: (raw.totalPages ?? 1) as number,
      },
    };
  },

  async get(id: string): Promise<LeadScoringRuleResponse> {
    return apiClient.get<LeadScoringRuleResponse>(API_ENDPOINTS.LEAD_SCORING.GET(id));
  },

  async create(data: CreateLeadScoringRuleRequest): Promise<LeadScoringRuleResponse> {
    return apiClient.post<LeadScoringRuleResponse>(API_ENDPOINTS.LEAD_SCORING.CREATE, data);
  },

  async update(id: string, data: UpdateLeadScoringRuleRequest): Promise<LeadScoringRuleResponse> {
    return apiClient.put<LeadScoringRuleResponse>(API_ENDPOINTS.LEAD_SCORING.UPDATE(id), data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.LEAD_SCORING.DELETE(id));
  },

  async getCustomerScore(customerId: string): Promise<CustomerScore> {
    return apiClient.get<CustomerScore>(API_ENDPOINTS.LEAD_SCORING.CUSTOMER_SCORE(customerId));
  },
};
