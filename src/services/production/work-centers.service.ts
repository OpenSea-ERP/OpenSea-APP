import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateWorkCenterRequest,
  UpdateWorkCenterRequest,
  WorkCenterResponse,
  WorkCentersResponse,
} from '@/types/production';

export const workCentersService = {
  async list(): Promise<WorkCentersResponse> {
    return apiClient.get<WorkCentersResponse>(
      API_ENDPOINTS.PRODUCTION.WORK_CENTERS.LIST
    );
  },

  async getById(id: string): Promise<WorkCenterResponse> {
    return apiClient.get<WorkCenterResponse>(
      API_ENDPOINTS.PRODUCTION.WORK_CENTERS.GET(id)
    );
  },

  async create(data: CreateWorkCenterRequest): Promise<WorkCenterResponse> {
    return apiClient.post<WorkCenterResponse>(
      API_ENDPOINTS.PRODUCTION.WORK_CENTERS.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateWorkCenterRequest
  ): Promise<WorkCenterResponse> {
    return apiClient.put<WorkCenterResponse>(
      API_ENDPOINTS.PRODUCTION.WORK_CENTERS.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.PRODUCTION.WORK_CENTERS.DELETE(id)
    );
  },
};
