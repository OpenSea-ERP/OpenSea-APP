import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CadenceSequenceResponse,
  CadencesQuery,
  CreateCadenceRequest,
  PaginatedCadenceSequencesResponse,
  UpdateCadenceRequest,
} from '@/types/sales';

export const cadencesService = {
  async list(query?: CadencesQuery): Promise<PaginatedCadenceSequencesResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('perPage', query.limit.toString());
    if (query?.search) params.append('search', query.search);
    if (query?.isActive !== undefined) params.append('isActive', String(query.isActive));
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

    const url = params.toString()
      ? `${API_ENDPOINTS.CADENCES.LIST}?${params.toString()}`
      : API_ENDPOINTS.CADENCES.LIST;

    const raw = await apiClient.get<Record<string, unknown>>(url);
    if (raw.meta) return raw as unknown as PaginatedCadenceSequencesResponse;
    return {
      cadences: raw.cadences as PaginatedCadenceSequencesResponse['cadences'],
      meta: {
        total: raw.total as number,
        page: raw.page as number,
        limit: (raw.perPage ?? raw.limit ?? 20) as number,
        pages: (raw.totalPages ?? 1) as number,
      },
    };
  },

  async get(id: string): Promise<CadenceSequenceResponse> {
    return apiClient.get<CadenceSequenceResponse>(API_ENDPOINTS.CADENCES.GET(id));
  },

  async create(data: CreateCadenceRequest): Promise<CadenceSequenceResponse> {
    return apiClient.post<CadenceSequenceResponse>(API_ENDPOINTS.CADENCES.CREATE, data);
  },

  async update(id: string, data: UpdateCadenceRequest): Promise<CadenceSequenceResponse> {
    return apiClient.put<CadenceSequenceResponse>(API_ENDPOINTS.CADENCES.UPDATE(id), data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.CADENCES.DELETE(id));
  },
};
