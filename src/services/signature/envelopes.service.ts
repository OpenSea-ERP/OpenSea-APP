import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { SignatureEnvelope, CreateEnvelopeData } from '@/types/signature';
import type { PaginationMeta } from '@/types/pagination';

export interface EnvelopesListResponse {
  envelopes: SignatureEnvelope[];
  meta: PaginationMeta;
}

export interface EnvelopeResponse {
  envelope: SignatureEnvelope;
}

export const envelopesService = {
  async listEnvelopes(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sourceModule?: string;
    search?: string;
  }): Promise<EnvelopesListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.sourceModule) searchParams.set('sourceModule', params.sourceModule);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const url = `${API_ENDPOINTS.SIGNATURE.ENVELOPES.LIST}${query ? `?${query}` : ''}`;
    return apiClient.get<EnvelopesListResponse>(url);
  },

  async getEnvelope(id: string): Promise<EnvelopeResponse> {
    return apiClient.get<EnvelopeResponse>(API_ENDPOINTS.SIGNATURE.ENVELOPES.GET(id));
  },

  async createEnvelope(data: CreateEnvelopeData): Promise<EnvelopeResponse> {
    return apiClient.post<EnvelopeResponse>(
      API_ENDPOINTS.SIGNATURE.ENVELOPES.CREATE,
      data,
    );
  },

  async cancelEnvelope(id: string, _reason?: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.SIGNATURE.ENVELOPES.CANCEL(id));
  },

  async resendNotifications(id: string): Promise<{ notifiedCount: number }> {
    return apiClient.post<{ notifiedCount: number }>(
      API_ENDPOINTS.SIGNATURE.ENVELOPES.RESEND(id),
    );
  },
};
