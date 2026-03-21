import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  AddCatalogItemRequest,
  BrandResponse,
  CatalogResponse,
  CatalogsResponse,
  CreateCatalogRequest,
  CreateGeneratedContentRequest,
  GeneratedContentResponse,
  GeneratedContentsResponse,
  UpdateBrandRequest,
  UpdateCatalogRequest,
} from '@/types/sales';

export const catalogsService = {
  // GET /v1/catalogs
  async listCatalogs(params?: Record<string, string>): Promise<CatalogsResponse> {
    const searchParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient.get<CatalogsResponse>(
      `${API_ENDPOINTS.CATALOGS.LIST}${searchParams}`,
    );
  },

  // GET /v1/catalogs/:id
  async getCatalog(id: string): Promise<CatalogResponse> {
    return apiClient.get<CatalogResponse>(API_ENDPOINTS.CATALOGS.GET(id));
  },

  // POST /v1/catalogs
  async createCatalog(data: CreateCatalogRequest): Promise<CatalogResponse> {
    return apiClient.post<CatalogResponse>(
      API_ENDPOINTS.CATALOGS.CREATE,
      data,
    );
  },

  // PUT /v1/catalogs/:id
  async updateCatalog(
    id: string,
    data: UpdateCatalogRequest,
  ): Promise<CatalogResponse> {
    return apiClient.put<CatalogResponse>(
      API_ENDPOINTS.CATALOGS.UPDATE(id),
      data,
    );
  },

  // DELETE /v1/catalogs/:id
  async deleteCatalog(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.CATALOGS.DELETE(id));
  },

  // POST /v1/catalogs/:id/items
  async addCatalogItem(
    catalogId: string,
    data: AddCatalogItemRequest,
  ): Promise<{ itemId: string }> {
    return apiClient.post<{ itemId: string }>(
      API_ENDPOINTS.CATALOGS.ADD_ITEM(catalogId),
      data,
    );
  },

  // DELETE /v1/catalogs/:id/items/:itemId
  async removeCatalogItem(
    catalogId: string,
    itemId: string,
  ): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.CATALOGS.REMOVE_ITEM(catalogId, itemId),
    );
  },
};

export const brandService = {
  // GET /v1/brand
  async getBrand(): Promise<BrandResponse> {
    return apiClient.get<BrandResponse>(API_ENDPOINTS.BRAND.GET);
  },

  // PUT /v1/brand
  async updateBrand(data: UpdateBrandRequest): Promise<BrandResponse> {
    return apiClient.put<BrandResponse>(API_ENDPOINTS.BRAND.UPDATE, data);
  },
};

export const contentService = {
  // GET /v1/content
  async listContents(
    params?: Record<string, string>,
  ): Promise<GeneratedContentsResponse> {
    const searchParams = params
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    return apiClient.get<GeneratedContentsResponse>(
      `${API_ENDPOINTS.CONTENT.LIST}${searchParams}`,
    );
  },

  // GET /v1/content/:id
  async getContent(id: string): Promise<GeneratedContentResponse> {
    return apiClient.get<GeneratedContentResponse>(
      API_ENDPOINTS.CONTENT.GET(id),
    );
  },

  // POST /v1/content/generate
  async generateContent(
    data: CreateGeneratedContentRequest,
  ): Promise<GeneratedContentResponse> {
    return apiClient.post<GeneratedContentResponse>(
      API_ENDPOINTS.CONTENT.GENERATE,
      data,
    );
  },

  // DELETE /v1/content/:id
  async deleteContent(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.CONTENT.DELETE(id));
  },

  // PATCH /v1/content/:id/approve
  async approveContent(id: string): Promise<GeneratedContentResponse> {
    return apiClient.patch<GeneratedContentResponse>(
      API_ENDPOINTS.CONTENT.APPROVE(id),
    );
  },
};
