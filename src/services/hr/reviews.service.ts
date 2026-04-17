import { apiClient } from '@/lib/api-client';
import type {
  ReviewCycle,
  PerformanceReview,
  ReviewCompetency,
  CreateReviewCycleData,
  UpdateReviewCycleData,
  CreateBulkReviewsData,
  SubmitSelfAssessmentData,
  SubmitManagerReviewData,
} from '@/types/hr';

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ReviewCyclesResponse {
  reviewCycles: ReviewCycle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewCycleResponse {
  reviewCycle: ReviewCycle;
}

export interface PerformanceReviewsResponse {
  reviews: PerformanceReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PerformanceReviewResponse {
  review: PerformanceReview;
  /**
   * Competencias da review, disponivel apenas no endpoint de detalhe
   * (GET /v1/hr/performance-reviews/:id). Mutacoes retornam apenas review.
   */
  competencies?: ReviewCompetency[];
}

// ============================================================================
// PARAMS
// ============================================================================

export interface ListReviewCyclesParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: string;
  status?: string;
  isActive?: boolean;
}

export interface ListPerformanceReviewsParams {
  page?: number;
  perPage?: number;
  reviewCycleId?: string;
  employeeId?: string;
  reviewerId?: string;
  status?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function buildQuery(
  params?: ListReviewCyclesParams | ListPerformanceReviewsParams
): string {
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

class ReviewsService {
  private readonly cyclesUrl = '/v1/hr/review-cycles';
  private readonly reviewsUrl = '/v1/hr/performance-reviews';

  // ============================
  // Review Cycles
  // ============================

  async listCycles(
    params?: ListReviewCyclesParams
  ): Promise<ReviewCyclesResponse> {
    const response = await apiClient.get<{
      reviewCycles: ReviewCycle[];
      total: number;
    }>(`${this.cyclesUrl}${buildQuery(params)}`);
    const total = response.total;
    const perPage = params?.perPage ?? 20;
    return {
      ...response,
      page: params?.page ?? 1,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getCycle(id: string): Promise<ReviewCycleResponse> {
    return apiClient.get<ReviewCycleResponse>(`${this.cyclesUrl}/${id}`);
  }

  async createCycle(
    cycleData: CreateReviewCycleData
  ): Promise<ReviewCycleResponse> {
    return apiClient.post<ReviewCycleResponse>(this.cyclesUrl, cycleData);
  }

  async updateCycle(
    id: string,
    cycleData: UpdateReviewCycleData
  ): Promise<ReviewCycleResponse> {
    return apiClient.put<ReviewCycleResponse>(
      `${this.cyclesUrl}/${id}`,
      cycleData
    );
  }

  async deleteCycle(id: string): Promise<void> {
    await apiClient.delete(`${this.cyclesUrl}/${id}`);
  }

  async openCycle(id: string): Promise<ReviewCycleResponse> {
    return apiClient.patch<ReviewCycleResponse>(`${this.cyclesUrl}/${id}/open`);
  }

  async closeCycle(id: string): Promise<ReviewCycleResponse> {
    return apiClient.patch<ReviewCycleResponse>(
      `${this.cyclesUrl}/${id}/close`
    );
  }

  // ============================
  // Performance Reviews
  // ============================

  async listReviews(
    params?: ListPerformanceReviewsParams
  ): Promise<PerformanceReviewsResponse> {
    const response = await apiClient.get<{
      reviews: PerformanceReview[];
      total: number;
    }>(`${this.reviewsUrl}${buildQuery(params)}`);
    const total = response.total;
    const perPage = params?.perPage ?? 20;
    return {
      ...response,
      page: params?.page ?? 1,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getReview(id: string): Promise<PerformanceReviewResponse> {
    return apiClient.get<PerformanceReviewResponse>(`${this.reviewsUrl}/${id}`);
  }

  async createBulkReviews(
    bulkData: CreateBulkReviewsData
  ): Promise<{ reviews: PerformanceReview[] }> {
    return apiClient.post<{ reviews: PerformanceReview[] }>(
      `${this.reviewsUrl}/bulk`,
      bulkData
    );
  }

  async submitSelfAssessment(
    reviewId: string,
    assessmentData: SubmitSelfAssessmentData
  ): Promise<PerformanceReviewResponse> {
    return apiClient.patch<PerformanceReviewResponse>(
      `${this.reviewsUrl}/${reviewId}/self-assessment`,
      assessmentData
    );
  }

  async submitManagerReview(
    reviewId: string,
    reviewData: SubmitManagerReviewData
  ): Promise<PerformanceReviewResponse> {
    return apiClient.patch<PerformanceReviewResponse>(
      `${this.reviewsUrl}/${reviewId}/manager-review`,
      reviewData
    );
  }

  async acknowledgeReview(
    reviewId: string
  ): Promise<PerformanceReviewResponse> {
    return apiClient.patch<PerformanceReviewResponse>(
      `${this.reviewsUrl}/${reviewId}/acknowledge`
    );
  }

  /**
   * Avança o status da avaliação para a próxima etapa (PENDING → SELF_ASSESSMENT
   * → MANAGER_REVIEW → COMPLETED) sem gravar notas nem comentários. O body é
   * strict e rejeita qualquer campo — não envie `selfScore`/`managerScore`.
   *
   * Substitui o hack antigo de chamar `submitSelfAssessment({ selfScore: 0 })`
   * apenas para avançar status, que zerava notas já preenchidas (regressão P0).
   */
  async advanceStatus(reviewId: string): Promise<PerformanceReviewResponse> {
    return apiClient.patch<PerformanceReviewResponse>(
      `${this.reviewsUrl}/${reviewId}/advance-status`,
      {}
    );
  }
}

export const reviewsService = new ReviewsService();
