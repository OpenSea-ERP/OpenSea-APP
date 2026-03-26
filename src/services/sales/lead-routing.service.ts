import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateLeadRoutingRuleRequest,
  LeadRoutingQuery,
  LeadRoutingRuleResponse,
  PaginatedLeadRoutingRulesResponse,
  UpdateLeadRoutingRuleRequest,
} from '@/types/sales';

export const leadRoutingService = {
  async list(query?: LeadRoutingQuery): Promise<PaginatedLeadRoutingRulesResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('perPage', query.limit.toString());
    if (query?.search) params.append('search', query.search);
    if (query?.isActive !== undefined) params.append('isActive', String(query.isActive));
    if (query?.strategy) params.append('strategy', query.strategy);
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

    const url = params.toString()
      ? `${API_ENDPOINTS.LEAD_ROUTING.LIST}?${params.toString()}`
      : API_ENDPOINTS.LEAD_ROUTING.LIST;

    const raw = await apiClient.get<Record<string, unknown>>(url);
    if (raw.meta) return raw as unknown as PaginatedLeadRoutingRulesResponse;
    return {
      rules: raw.rules as PaginatedLeadRoutingRulesResponse['rules'],
      meta: {
        total: raw.total as number,
        page: raw.page as number,
        limit: (raw.perPage ?? raw.limit ?? 20) as number,
        pages: (raw.totalPages ?? 1) as number,
      },
    };
  },

  async get(id: string): Promise<LeadRoutingRuleResponse> {
    return apiClient.get<LeadRoutingRuleResponse>(API_ENDPOINTS.LEAD_ROUTING.GET(id));
  },

  async create(data: CreateLeadRoutingRuleRequest): Promise<LeadRoutingRuleResponse> {
    return apiClient.post<LeadRoutingRuleResponse>(API_ENDPOINTS.LEAD_ROUTING.CREATE, data);
  },

  async update(id: string, data: UpdateLeadRoutingRuleRequest): Promise<LeadRoutingRuleResponse> {
    return apiClient.put<LeadRoutingRuleResponse>(API_ENDPOINTS.LEAD_ROUTING.UPDATE(id), data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.LEAD_ROUTING.DELETE(id));
  },
};
