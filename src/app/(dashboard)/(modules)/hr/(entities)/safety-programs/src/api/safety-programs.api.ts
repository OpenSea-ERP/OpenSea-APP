import { safetyProgramsService } from '@/services/hr/safety-programs.service';
import type { SafetyProgram, CreateSafetyProgramData, UpdateSafetyProgramData } from '@/types/hr';

export interface SafetyProgramsApiResponse {
  safetyPrograms: SafetyProgram[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export const safetyProgramsApi = {
  async list(params?: {
    type?: string;
    status?: string;
    page?: number;
    perPage?: number;
  }): Promise<SafetyProgramsApiResponse> {
    const response = await safetyProgramsService.list(params);
    const programs = response.safetyPrograms ?? [];
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 100;
    return {
      safetyPrograms: programs,
      total: programs.length,
      page,
      perPage,
      hasMore: programs.length >= perPage,
    };
  },

  async get(id: string): Promise<SafetyProgram> {
    const { safetyProgram } = await safetyProgramsService.get(id);
    return safetyProgram;
  },

  async create(data: CreateSafetyProgramData): Promise<SafetyProgram> {
    const { safetyProgram } = await safetyProgramsService.create(data);
    return safetyProgram;
  },

  async update(id: string, data: UpdateSafetyProgramData): Promise<SafetyProgram> {
    const { safetyProgram } = await safetyProgramsService.update(id, data);
    return safetyProgram;
  },

  async delete(id: string): Promise<void> {
    await safetyProgramsService.delete(id);
  },
};
