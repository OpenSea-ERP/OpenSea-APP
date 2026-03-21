import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { SignatureTemplate, CreateTemplateData } from '@/types/signature';
import type { PaginationMeta } from '@/types/pagination';

export interface TemplatesListResponse {
  templates: SignatureTemplate[];
  meta: PaginationMeta;
}

export interface TemplateResponse {
  template: SignatureTemplate;
}

export const signatureTemplatesService = {
  async listTemplates(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<TemplatesListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const url = `${API_ENDPOINTS.SIGNATURE.TEMPLATES.LIST}${query ? `?${query}` : ''}`;
    return apiClient.get<TemplatesListResponse>(url);
  },

  async createTemplate(data: CreateTemplateData): Promise<TemplateResponse> {
    return apiClient.post<TemplateResponse>(
      API_ENDPOINTS.SIGNATURE.TEMPLATES.CREATE,
      data,
    );
  },
};
