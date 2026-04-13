import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateDefectTypeRequest,
  DefectTypeResponse,
  DefectTypesResponse,
  UpdateDefectTypeRequest,
} from '@/types/production';

export const defectTypesService = {
  async list(): Promise<DefectTypesResponse> {
    return apiClient.get<DefectTypesResponse>(
      API_ENDPOINTS.PRODUCTION.DEFECT_TYPES.LIST
    );
  },

  async create(data: CreateDefectTypeRequest): Promise<DefectTypeResponse> {
    return apiClient.post<DefectTypeResponse>(
      API_ENDPOINTS.PRODUCTION.DEFECT_TYPES.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateDefectTypeRequest
  ): Promise<DefectTypeResponse> {
    return apiClient.put<DefectTypeResponse>(
      API_ENDPOINTS.PRODUCTION.DEFECT_TYPES.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.PRODUCTION.DEFECT_TYPES.DELETE(id)
    );
  },
};
