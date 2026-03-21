import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { DigitalCertificate, CreateCertificateData } from '@/types/signature';
import type { PaginationMeta } from '@/types/pagination';

export interface CertificatesListResponse {
  certificates: DigitalCertificate[];
  meta: PaginationMeta;
}

export interface CertificateResponse {
  certificate: DigitalCertificate;
}

export const certificatesService = {
  async listCertificates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<CertificatesListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const url = `${API_ENDPOINTS.SIGNATURE.CERTIFICATES.LIST}${query ? `?${query}` : ''}`;
    return apiClient.get<CertificatesListResponse>(url);
  },

  async createCertificate(data: CreateCertificateData): Promise<CertificateResponse> {
    return apiClient.post<CertificateResponse>(
      API_ENDPOINTS.SIGNATURE.CERTIFICATES.CREATE,
      data,
    );
  },

  async deleteCertificate(id: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.SIGNATURE.CERTIFICATES.DELETE(id));
  },
};
