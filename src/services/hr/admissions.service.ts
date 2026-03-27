/**
 * OpenSea OS - Admissions Service
 * Serviço de admissão digital
 */

import { apiClient } from '@/lib/api-client';
import type {
  AdmissionInvite,
  CreateAdmissionData,
  UpdateAdmissionData,
  PublicAdmissionInvite,
  SubmitCandidateDataPayload,
  SignAdmissionPayload,
  AdmissionDocument,
  AdmissionDocumentType,
} from '@/types/hr';

// ============================================================================
// Response Types
// ============================================================================

export interface AdmissionResponse {
  admission: AdmissionInvite;
}

export interface AdmissionsResponse {
  admissions: AdmissionInvite[];
  meta?: {
    total: number;
    page: number;
    perPage: number;
    pages: number;
  };
}

export interface ListAdmissionsParams {
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface PublicAdmissionResponse {
  admission: PublicAdmissionInvite;
}

export interface AdmissionDocumentResponse {
  document: AdmissionDocument;
}

// ============================================================================
// Dashboard Service (authenticated)
// ============================================================================

export const admissionsService = {
  async list(params?: ListAdmissionsParams): Promise<AdmissionsResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.perPage) query.append('perPage', String(params.perPage));
    const qs = query.toString();
    return apiClient.get<AdmissionsResponse>(
      `/v1/hr/admissions${qs ? `?${qs}` : ''}`
    );
  },

  async get(id: string): Promise<AdmissionResponse> {
    return apiClient.get<AdmissionResponse>(`/v1/hr/admissions/${id}`);
  },

  async create(data: CreateAdmissionData): Promise<AdmissionResponse> {
    return apiClient.post<AdmissionResponse>('/v1/hr/admissions', data);
  },

  async update(
    id: string,
    data: UpdateAdmissionData
  ): Promise<AdmissionResponse> {
    return apiClient.patch<AdmissionResponse>(
      `/v1/hr/admissions/${id}`,
      data
    );
  },

  async cancel(id: string): Promise<AdmissionResponse> {
    return apiClient.delete<AdmissionResponse>(`/v1/hr/admissions/${id}`);
  },

  async approve(id: string): Promise<AdmissionResponse> {
    return apiClient.post<AdmissionResponse>(
      `/v1/hr/admissions/${id}/approve`
    );
  },

  async reject(
    id: string,
    reason: string
  ): Promise<AdmissionResponse> {
    return apiClient.post<AdmissionResponse>(
      `/v1/hr/admissions/${id}/reject`,
      { reason }
    );
  },

  async resend(id: string): Promise<AdmissionResponse> {
    return apiClient.post<AdmissionResponse>(
      `/v1/hr/admissions/${id}/resend`
    );
  },
};

// ============================================================================
// Public Service (no auth, token-based)
// ============================================================================

export const publicAdmissionService = {
  async getByToken(token: string): Promise<PublicAdmissionResponse> {
    return apiClient.get<PublicAdmissionResponse>(
      `/v1/public/admission/${token}`
    );
  },

  async submitCandidateData(
    token: string,
    payload: SubmitCandidateDataPayload
  ): Promise<PublicAdmissionResponse> {
    return apiClient.post<PublicAdmissionResponse>(
      `/v1/public/admission/${token}/submit`,
      payload
    );
  },

  async uploadDocument(
    token: string,
    type: AdmissionDocumentType,
    file: File
  ): Promise<AdmissionDocumentResponse> {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    return apiClient.post<AdmissionDocumentResponse>(
      `/v1/public/admission/${token}/upload`,
      formData
    );
  },

  async sign(
    token: string,
    payload: SignAdmissionPayload
  ): Promise<PublicAdmissionResponse> {
    return apiClient.post<PublicAdmissionResponse>(
      `/v1/public/admission/${token}/sign`,
      payload
    );
  },
};
