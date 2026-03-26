import { terminationsService } from '@/services/hr/terminations.service';
import type {
  Termination,
  CreateTerminationData,
} from '@/types/hr';
import type { ListTerminationsParams } from '@/services/hr/terminations.service';

export interface TerminationsListResponse {
  terminations: Termination[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export const terminationsApi = {
  async list(params?: ListTerminationsParams): Promise<TerminationsListResponse> {
    const response = await terminationsService.list(params);
    const items = response.terminations ?? [];
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 100;
    return {
      terminations: items,
      total: items.length,
      page,
      perPage,
      hasMore: items.length >= perPage,
    };
  },

  async get(id: string): Promise<Termination> {
    const { termination } = await terminationsService.get(id);
    return termination;
  },

  async create(data: CreateTerminationData): Promise<Termination> {
    const { termination } = await terminationsService.create(data);
    return termination;
  },

  async delete(id: string): Promise<void> {
    await terminationsService.delete(id);
  },

  async calculate(id: string): Promise<Termination> {
    const { termination } = await terminationsService.calculate(id);
    return termination;
  },

  async markAsPaid(id: string): Promise<Termination> {
    const { termination } = await terminationsService.markAsPaid(id);
    return termination;
  },
};
