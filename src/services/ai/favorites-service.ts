import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { AiFavoriteQuery, CreateFavoriteRequest } from '@/types/ai';

export interface FavoritesResponse {
  favorites: AiFavoriteQuery[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const aiFavoritesService = {
  async list(params?: {
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<FavoritesResponse> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const url = queryString
      ? `${API_ENDPOINTS.AI.FAVORITES.LIST}?${queryString}`
      : API_ENDPOINTS.AI.FAVORITES.LIST;

    return apiClient.get<FavoritesResponse>(url);
  },

  async create(data: CreateFavoriteRequest): Promise<{ favorite: AiFavoriteQuery }> {
    return apiClient.post<{ favorite: AiFavoriteQuery }>(
      API_ENDPOINTS.AI.FAVORITES.CREATE,
      data,
    );
  },

  async delete(favoriteId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(
      API_ENDPOINTS.AI.FAVORITES.DELETE(favoriteId),
    );
  },
};
