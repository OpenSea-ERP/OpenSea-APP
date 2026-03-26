import { medicalExamsService } from '@/services/hr/medical-exams.service';
import type {
  MedicalExam,
  CreateMedicalExamData,
} from '@/types/hr';
import type { ListMedicalExamsParams } from '@/services/hr/medical-exams.service';

export interface MedicalExamsResponse {
  medicalExams: MedicalExam[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export const medicalExamsApi = {
  async list(params?: ListMedicalExamsParams): Promise<MedicalExamsResponse> {
    const response = await medicalExamsService.list(params);
    const exams = response.medicalExams ?? [];
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 100;
    return {
      medicalExams: exams,
      total: exams.length,
      page,
      perPage,
      hasMore: exams.length >= perPage,
    };
  },

  async get(id: string): Promise<MedicalExam> {
    const { medicalExam } = await medicalExamsService.get(id);
    return medicalExam;
  },

  async create(data: CreateMedicalExamData): Promise<MedicalExam> {
    const { medicalExam } = await medicalExamsService.create(data);
    return medicalExam;
  },

  async delete(id: string): Promise<void> {
    await medicalExamsService.delete(id);
  },
};
