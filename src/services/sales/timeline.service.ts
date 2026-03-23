import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { PaginatedTimelineResponse, TimelineQuery } from '@/types/sales';

export const timelineService = {
  // GET /v1/timeline?entityId=...&entityType=...
  async getTimeline(query: TimelineQuery): Promise<PaginatedTimelineResponse> {
    const params = new URLSearchParams();
    params.append('entityId', query.entityId);
    params.append('entityType', query.entityType);
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    return apiClient.get<PaginatedTimelineResponse>(
      `${API_ENDPOINTS.TIMELINE.GET}?${params.toString()}`
    );
  },
};
