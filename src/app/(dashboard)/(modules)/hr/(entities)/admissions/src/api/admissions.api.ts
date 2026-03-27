/**
 * OpenSea OS - Admissions API Wrapper
 */

import { admissionsService } from '@/services/hr/admissions.service';
import type {
  AdmissionInvite,
  CreateAdmissionData,
  UpdateAdmissionData,
} from '@/types/hr';
import type { ListAdmissionsParams } from '@/services/hr/admissions.service';

export interface AdmissionsListResponse {
  admissions: AdmissionInvite[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export const admissionsApi = {
  async list(params?: ListAdmissionsParams): Promise<AdmissionsListResponse> {
    const response = await admissionsService.list(params);
    const items = response.admissions ?? [];
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 100;
    return {
      admissions: items,
      total: items.length,
      page,
      perPage,
      hasMore: items.length >= perPage,
    };
  },

  async get(id: string): Promise<AdmissionInvite> {
    const { admission } = await admissionsService.get(id);
    return admission;
  },

  async create(data: CreateAdmissionData): Promise<AdmissionInvite> {
    const { admission } = await admissionsService.create(data);
    return admission;
  },

  async update(id: string, data: UpdateAdmissionData): Promise<AdmissionInvite> {
    const { admission } = await admissionsService.update(id, data);
    return admission;
  },

  async cancel(id: string): Promise<void> {
    await admissionsService.cancel(id);
  },

  async approve(id: string): Promise<AdmissionInvite> {
    const { admission } = await admissionsService.approve(id);
    return admission;
  },

  async reject(id: string, reason: string): Promise<AdmissionInvite> {
    const { admission } = await admissionsService.reject(id, reason);
    return admission;
  },

  async resend(id: string): Promise<AdmissionInvite> {
    const { admission } = await admissionsService.resend(id);
    return admission;
  },
};
