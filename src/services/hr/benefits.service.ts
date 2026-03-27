import { apiClient } from '@/lib/api-client';
import type {
  BenefitPlan,
  BenefitEnrollment,
  FlexBenefitAllocation,
  BenefitDeduction,
  CreateBenefitPlanData,
  UpdateBenefitPlanData,
  EnrollEmployeeData,
  BulkEnrollData,
  UpdateEnrollmentData,
  AllocateFlexData,
} from '@/types/hr';
import type { PaginationMeta } from '@/types/pagination';

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface BenefitPlansResponse {
  benefitPlans: BenefitPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  meta?: PaginationMeta;
}

export interface BenefitPlanResponse {
  benefitPlan: BenefitPlan;
}

export interface BenefitEnrollmentsResponse {
  enrollments: BenefitEnrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  meta?: PaginationMeta;
}

export interface BenefitEnrollmentResponse {
  enrollment: BenefitEnrollment;
}

export interface BulkEnrollResponse {
  enrollments: BenefitEnrollment[];
  count: number;
}

export interface FlexAllocationResponse {
  allocation: FlexBenefitAllocation;
}

export interface FlexHistoryResponse {
  allocations: FlexBenefitAllocation[];
}

export interface BenefitDeductionsResponse {
  deductions: BenefitDeduction[];
  total: number;
}

export interface CalculateDeductionsResponse {
  deductions: BenefitDeduction[];
  totalAmount: number;
}

// ============================================================================
// PARAMS
// ============================================================================

export interface ListBenefitPlansParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: string;
  isActive?: boolean;
}

export interface ListEnrollmentsParams {
  page?: number;
  perPage?: number;
  benefitPlanId?: string;
  employeeId?: string;
  status?: string;
}

export interface ListDeductionsParams {
  referenceMonth?: number;
  referenceYear?: number;
  employeeId?: string;
  benefitPlanId?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export const benefitsService = {
  // ========== PLANS ==========

  async listPlans(
    params?: ListBenefitPlansParams
  ): Promise<BenefitPlansResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.perPage) query.append('perPage', String(params.perPage));
    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    if (params?.isActive !== undefined)
      query.append('isActive', String(params.isActive));

    const qs = query.toString();
    return apiClient.get<BenefitPlansResponse>(
      `/v1/hr/benefit-plans${qs ? `?${qs}` : ''}`
    );
  },

  async getPlan(id: string): Promise<BenefitPlanResponse> {
    return apiClient.get<BenefitPlanResponse>(`/v1/hr/benefit-plans/${id}`);
  },

  async createPlan(data: CreateBenefitPlanData): Promise<BenefitPlanResponse> {
    return apiClient.post<BenefitPlanResponse>('/v1/hr/benefit-plans', data);
  },

  async updatePlan(
    id: string,
    data: UpdateBenefitPlanData
  ): Promise<BenefitPlanResponse> {
    return apiClient.put<BenefitPlanResponse>(
      `/v1/hr/benefit-plans/${id}`,
      data
    );
  },

  async deletePlan(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/benefit-plans/${id}`);
  },

  // ========== ENROLLMENTS ==========

  async listEnrollments(
    params?: ListEnrollmentsParams
  ): Promise<BenefitEnrollmentsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.perPage) query.append('perPage', String(params.perPage));
    if (params?.benefitPlanId)
      query.append('benefitPlanId', params.benefitPlanId);
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.status) query.append('status', params.status);

    const qs = query.toString();
    return apiClient.get<BenefitEnrollmentsResponse>(
      `/v1/hr/benefit-enrollments${qs ? `?${qs}` : ''}`
    );
  },

  async enrollEmployee(
    data: EnrollEmployeeData
  ): Promise<BenefitEnrollmentResponse> {
    return apiClient.post<BenefitEnrollmentResponse>(
      '/v1/hr/benefit-enrollments',
      data
    );
  },

  async bulkEnroll(data: BulkEnrollData): Promise<BulkEnrollResponse> {
    return apiClient.post<BulkEnrollResponse>(
      '/v1/hr/benefit-enrollments/bulk',
      data
    );
  },

  async updateEnrollment(
    id: string,
    data: UpdateEnrollmentData
  ): Promise<BenefitEnrollmentResponse> {
    return apiClient.put<BenefitEnrollmentResponse>(
      `/v1/hr/benefit-enrollments/${id}`,
      data
    );
  },

  async cancelEnrollment(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/benefit-enrollments/${id}`);
  },

  // ========== FLEX ==========

  async getMyAllocation(): Promise<FlexAllocationResponse> {
    return apiClient.get<FlexAllocationResponse>(
      '/v1/hr/flex-benefits/my-allocation'
    );
  },

  async allocateFlex(data: AllocateFlexData): Promise<FlexAllocationResponse> {
    return apiClient.post<FlexAllocationResponse>(
      '/v1/hr/flex-benefits/allocate',
      data
    );
  },

  async getFlexHistory(): Promise<FlexHistoryResponse> {
    return apiClient.get<FlexHistoryResponse>(
      '/v1/hr/flex-benefits/history'
    );
  },

  // ========== DEDUCTIONS ==========

  async listDeductions(
    params?: ListDeductionsParams
  ): Promise<BenefitDeductionsResponse> {
    const query = new URLSearchParams();
    if (params?.referenceMonth)
      query.append('referenceMonth', String(params.referenceMonth));
    if (params?.referenceYear)
      query.append('referenceYear', String(params.referenceYear));
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.benefitPlanId)
      query.append('benefitPlanId', params.benefitPlanId);

    const qs = query.toString();
    return apiClient.get<BenefitDeductionsResponse>(
      `/v1/hr/benefit-deductions${qs ? `?${qs}` : ''}`
    );
  },

  async calculateDeductions(params: {
    referenceMonth: number;
    referenceYear: number;
  }): Promise<CalculateDeductionsResponse> {
    return apiClient.post<CalculateDeductionsResponse>(
      '/v1/hr/benefit-deductions/calculate',
      params
    );
  },
};
