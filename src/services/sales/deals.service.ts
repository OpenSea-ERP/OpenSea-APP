import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  ChangeDealStageRequest,
  CreateDealRequest,
  DealResponse,
  DealsQuery,
  PaginatedDealsResponse,
  UpdateDealRequest,
} from '@/types/sales';

export const dealsService = {
  // GET /v1/deals with pagination and filters
  async list(query?: DealsQuery): Promise<PaginatedDealsResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query?.search) params.append('search', query.search);
    if (query?.pipelineId) params.append('pipelineId', query.pipelineId);
    if (query?.stageId) params.append('stageId', query.stageId);
    if (query?.status) params.append('status', query.status);
    if (query?.customerId) params.append('customerId', query.customerId);
    if (query?.assignedToUserId)
      params.append('assignedToUserId', query.assignedToUserId);
    if (query?.minValue !== undefined)
      params.append('minValue', query.minValue.toString());
    if (query?.maxValue !== undefined)
      params.append('maxValue', query.maxValue.toString());

    const url = params.toString()
      ? `${API_ENDPOINTS.DEALS.LIST}?${params.toString()}`
      : API_ENDPOINTS.DEALS.LIST;

    return apiClient.get<PaginatedDealsResponse>(url);
  },

  // GET /v1/deals/:dealId
  async get(dealId: string): Promise<DealResponse> {
    return apiClient.get<DealResponse>(API_ENDPOINTS.DEALS.GET(dealId));
  },

  // POST /v1/deals
  async create(data: CreateDealRequest): Promise<DealResponse> {
    return apiClient.post<DealResponse>(API_ENDPOINTS.DEALS.CREATE, data);
  },

  // PUT /v1/deals/:dealId
  async update(dealId: string, data: UpdateDealRequest): Promise<DealResponse> {
    return apiClient.put<DealResponse>(
      API_ENDPOINTS.DEALS.UPDATE(dealId),
      data
    );
  },

  // DELETE /v1/deals/:dealId
  async delete(dealId: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.DEALS.DELETE(dealId));
  },

  // PUT /v1/deals/:dealId/stage
  async changeStage(
    dealId: string,
    data: ChangeDealStageRequest
  ): Promise<DealResponse> {
    return apiClient.put<DealResponse>(
      API_ENDPOINTS.DEALS.CHANGE_STAGE(dealId),
      data
    );
  },
};
