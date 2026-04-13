import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateWorkstationTypeRequest,
  UpdateWorkstationTypeRequest,
  WorkstationTypeResponse,
  WorkstationTypesResponse,
} from '@/types/production';

export const workstationTypesService = {
  async list(): Promise<WorkstationTypesResponse> {
    return apiClient.get<WorkstationTypesResponse>(
      API_ENDPOINTS.PRODUCTION.WORKSTATION_TYPES.LIST,
    );
  },

  async getById(id: string): Promise<WorkstationTypeResponse> {
    return apiClient.get<WorkstationTypeResponse>(
      API_ENDPOINTS.PRODUCTION.WORKSTATION_TYPES.GET(id),
    );
  },

  async create(
    data: CreateWorkstationTypeRequest,
  ): Promise<WorkstationTypeResponse> {
    return apiClient.post<WorkstationTypeResponse>(
      API_ENDPOINTS.PRODUCTION.WORKSTATION_TYPES.CREATE,
      data,
    );
  },

  async update(
    id: string,
    data: UpdateWorkstationTypeRequest,
  ): Promise<WorkstationTypeResponse> {
    return apiClient.put<WorkstationTypeResponse>(
      API_ENDPOINTS.PRODUCTION.WORKSTATION_TYPES.UPDATE(id),
      data,
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.PRODUCTION.WORKSTATION_TYPES.DELETE(id),
    );
  },
};
