import { apiClient } from '@/lib/api-client';
import type {
  TrainingProgram,
  TrainingEnrollment,
  CreateTrainingProgramData,
  UpdateTrainingProgramData,
  EnrollInTrainingData,
  CompleteTrainingData,
} from '@/types/hr';

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface TrainingProgramsResponse {
  trainingPrograms: TrainingProgram[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TrainingProgramResponse {
  trainingProgram: TrainingProgram;
}

export interface TrainingEnrollmentsResponse {
  enrollments: TrainingEnrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TrainingEnrollmentResponse {
  enrollment: TrainingEnrollment;
}

// ============================================================================
// PARAMS
// ============================================================================

export interface ListTrainingProgramsParams {
  page?: number;
  perPage?: number;
  search?: string;
  category?: string;
  format?: string;
  isActive?: boolean;
  isMandatory?: boolean;
}

export interface ListTrainingEnrollmentsParams {
  page?: number;
  perPage?: number;
  trainingProgramId?: string;
  employeeId?: string;
  status?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class TrainingService {
  private readonly baseUrl = '/v1/hr/training-programs';
  private readonly enrollmentsUrl = '/v1/hr/training-enrollments';

  // Programs
  async listPrograms(
    params?: ListTrainingProgramsParams
  ): Promise<TrainingProgramsResponse> {
    const { data } = await apiClient.get<TrainingProgramsResponse>(
      this.baseUrl,
      { params }
    );
    const total = data.total;
    const perPage = params?.perPage ?? 20;
    return {
      ...data,
      page: params?.page ?? 1,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getProgram(id: string): Promise<TrainingProgramResponse> {
    const { data } = await apiClient.get<TrainingProgramResponse>(
      `${this.baseUrl}/${id}`
    );
    return data;
  }

  async createProgram(
    programData: CreateTrainingProgramData
  ): Promise<TrainingProgramResponse> {
    const { data } = await apiClient.post<TrainingProgramResponse>(
      this.baseUrl,
      programData
    );
    return data;
  }

  async updateProgram(
    id: string,
    programData: UpdateTrainingProgramData
  ): Promise<TrainingProgramResponse> {
    const { data } = await apiClient.put<TrainingProgramResponse>(
      `${this.baseUrl}/${id}`,
      programData
    );
    return data;
  }

  async deleteProgram(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // Enrollments
  async listEnrollments(
    params?: ListTrainingEnrollmentsParams
  ): Promise<TrainingEnrollmentsResponse> {
    const { data } = await apiClient.get<TrainingEnrollmentsResponse>(
      this.enrollmentsUrl,
      { params }
    );
    const total = data.total;
    const perPage = params?.perPage ?? 20;
    return {
      ...data,
      page: params?.page ?? 1,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async enrollEmployee(
    enrollmentData: EnrollInTrainingData
  ): Promise<TrainingEnrollmentResponse> {
    const { data } = await apiClient.post<TrainingEnrollmentResponse>(
      this.enrollmentsUrl,
      enrollmentData
    );
    return data;
  }

  async completeEnrollment(
    enrollmentId: string,
    completionData: CompleteTrainingData
  ): Promise<TrainingEnrollmentResponse> {
    const { data } = await apiClient.patch<TrainingEnrollmentResponse>(
      `${this.enrollmentsUrl}/${enrollmentId}/complete`,
      completionData
    );
    return data;
  }

  async cancelEnrollment(enrollmentId: string): Promise<void> {
    await apiClient.patch(`${this.enrollmentsUrl}/${enrollmentId}/cancel`);
  }
}

export const trainingService = new TrainingService();
