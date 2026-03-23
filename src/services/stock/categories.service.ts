import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CategoriesResponse,
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/stock';

export const categoriesService = {
  // GET /v1/categories (all pages)
  async listCategories(): Promise<CategoriesResponse> {
    const allCategories: CategoriesResponse['categories'] = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const response = await apiClient.get<Record<string, unknown>>(
        `${API_ENDPOINTS.CATEGORIES.LIST}?page=${page}&limit=${limit}`
      );

      const items = response.categories as CategoriesResponse['categories'] | undefined;
      if (items && items.length > 0) {
        allCategories.push(...items);
      }

      const meta = response.meta as { pages: number } | undefined;
      if (!meta || page >= meta.pages) break;
      page++;
    }

    return { categories: allCategories } as CategoriesResponse;
  },

  // GET /v1/categories/:id
  async getCategory(id: string): Promise<CategoryResponse> {
    return apiClient.get<CategoryResponse>(API_ENDPOINTS.CATEGORIES.GET(id));
  },

  // POST /v1/categories
  async createCategory(data: CreateCategoryRequest): Promise<CategoryResponse> {
    return apiClient.post<CategoryResponse>(
      API_ENDPOINTS.CATEGORIES.CREATE,
      data
    );
  },

  // PUT /v1/categories/:id
  async updateCategory(
    id: string,
    data: UpdateCategoryRequest
  ): Promise<CategoryResponse> {
    return apiClient.put<CategoryResponse>(
      API_ENDPOINTS.CATEGORIES.UPDATE(id),
      data
    );
  },

  // DELETE /v1/categories/:id
  async deleteCategory(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.CATEGORIES.DELETE(id));
  },

  // PATCH /v1/categories/reorder
  async reorderCategories(
    items: Array<{ id: string; displayOrder: number }>
  ): Promise<void> {
    return apiClient.patch<void>(API_ENDPOINTS.CATEGORIES.REORDER, { items });
  },
};
