import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateWorkstationRequest,
  UpdateWorkstationRequest,
  WorkstationResponse,
  WorkstationsResponse,
} from '@/types/production';

export const workstationsService = {
  async list(): Promise<WorkstationsResponse> {
    return apiClient.get<WorkstationsResponse>(
      API_ENDPOINTS.PRODUCTION.WORKSTATIONS.LIST,
    );
  },

  async getById(id: string): Promise<WorkstationResponse> {
    return apiClient.get<WorkstationResponse>(
      API_ENDPOINTS.PRODUCTION.WORKSTATIONS.GET(id),
    );
  },

  async create(data: CreateWorkstationRequest): Promise<WorkstationResponse> {
    return apiClient.post<WorkstationResponse>(
      API_ENDPOINTS.PRODUCTION.WORKSTATIONS.CREATE,
      data,
    );
  },

  async update(
    id: string,
    data: UpdateWorkstationRequest,
  ): Promise<WorkstationResponse> {
    return apiClient.put<WorkstationResponse>(
      API_ENDPOINTS.PRODUCTION.WORKSTATIONS.UPDATE(id),
      data,
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.PRODUCTION.WORKSTATIONS.DELETE(id),
    );
  },
};
