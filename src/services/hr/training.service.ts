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
// HELPER
// ============================================================================

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
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
    const result = await apiClient.get<TrainingProgramsResponse>(
      `${this.baseUrl}${buildQuery(params as Record<string, unknown>)}`
    );
    const total = result.total;
    const perPage = params?.perPage ?? 20;
    return {
      ...result,
      page: params?.page ?? 1,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getProgram(id: string): Promise<TrainingProgramResponse> {
    return apiClient.get<TrainingProgramResponse>(
      `${this.baseUrl}/${id}`
    );
  }

  async createProgram(
    programData: CreateTrainingProgramData
  ): Promise<TrainingProgramResponse> {
    return apiClient.post<TrainingProgramResponse>(
      this.baseUrl,
      programData
    );
  }

  async updateProgram(
    id: string,
    programData: UpdateTrainingProgramData
  ): Promise<TrainingProgramResponse> {
    return apiClient.put<TrainingProgramResponse>(
      `${this.baseUrl}/${id}`,
      programData
    );
  }

  async deleteProgram(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // Enrollments
  async listEnrollments(
    params?: ListTrainingEnrollmentsParams
  ): Promise<TrainingEnrollmentsResponse> {
    const result = await apiClient.get<TrainingEnrollmentsResponse>(
      `${this.enrollmentsUrl}${buildQuery(params as Record<string, unknown>)}`
    );
    const total = result.total;
    const perPage = params?.perPage ?? 20;
    return {
      ...result,
      page: params?.page ?? 1,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async enrollEmployee(
    enrollmentData: EnrollInTrainingData
  ): Promise<TrainingEnrollmentResponse> {
    return apiClient.post<TrainingEnrollmentResponse>(
      this.enrollmentsUrl,
      enrollmentData
    );
  }

  async completeEnrollment(
    enrollmentId: string,
    completionData: CompleteTrainingData
  ): Promise<TrainingEnrollmentResponse> {
    return apiClient.patch<TrainingEnrollmentResponse>(
      `${this.enrollmentsUrl}/${enrollmentId}/complete`,
      completionData
    );
  }

  async cancelEnrollment(enrollmentId: string): Promise<void> {
    await apiClient.patch(`${this.enrollmentsUrl}/${enrollmentId}/cancel`);
  }
}

export const trainingService = new TrainingService();
