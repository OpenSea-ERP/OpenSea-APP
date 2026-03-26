import { cipaService } from '@/services/hr/cipa.service';
import type { CipaMandate, CreateCipaMandateData } from '@/types/hr';

export interface CipaMandatesApiResponse {
  mandates: CipaMandate[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export const cipaApi = {
  async listMandates(params?: {
    status?: string;
    page?: number;
    perPage?: number;
  }): Promise<CipaMandatesApiResponse> {
    const response = await cipaService.listMandates(params);
    const mandates = response.mandates ?? [];
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 100;
    return {
      mandates,
      total: mandates.length,
      page,
      perPage,
      hasMore: mandates.length >= perPage,
    };
  },

  async getMandate(id: string): Promise<CipaMandate> {
    const { mandate } = await cipaService.getMandate(id);
    return mandate;
  },

  async createMandate(data: CreateCipaMandateData): Promise<CipaMandate> {
    const { mandate } = await cipaService.createMandate(data);
    return mandate;
  },

  async deleteMandate(id: string): Promise<void> {
    await cipaService.deleteMandate(id);
  },
};
