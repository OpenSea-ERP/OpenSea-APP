import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  Board,
  BoardsQuery,
  CreateBoardRequest,
  UpdateBoardRequest,
} from '@/types/tasks';

export interface BoardsResponse {
  boards: Board[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface BoardResponse {
  board: Board;
}

export const boardsService = {
  async list(params?: BoardsQuery): Promise<BoardsResponse> {
    const query = new URLSearchParams();

    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    if (params?.teamId) query.append('teamId', params.teamId);
    if (params?.visibility) query.append('visibility', params.visibility);
    if (params?.includeArchived !== undefined) {
      query.append('includeArchived', String(params.includeArchived));
    }

    const queryString = query.toString();
    const url = queryString
      ? `${API_ENDPOINTS.TASKS.BOARDS.LIST}?${queryString}`
      : API_ENDPOINTS.TASKS.BOARDS.LIST;

    return apiClient.get<BoardsResponse>(url);
  },

  async get(boardId: string): Promise<BoardResponse> {
    return apiClient.get<BoardResponse>(
      API_ENDPOINTS.TASKS.BOARDS.GET(boardId)
    );
  },

  async create(data: CreateBoardRequest): Promise<BoardResponse> {
    return apiClient.post<BoardResponse>(
      API_ENDPOINTS.TASKS.BOARDS.CREATE,
      data
    );
  },

  async update(
    boardId: string,
    data: UpdateBoardRequest
  ): Promise<BoardResponse> {
    return apiClient.patch<BoardResponse>(
      API_ENDPOINTS.TASKS.BOARDS.UPDATE(boardId),
      data
    );
  },

  async delete(boardId: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.TASKS.BOARDS.DELETE(boardId));
  },

  async archive(boardId: string, archive: boolean): Promise<BoardResponse> {
    return apiClient.patch<BoardResponse>(
      API_ENDPOINTS.TASKS.BOARDS.ARCHIVE(boardId),
      { archive }
    );
  },
};
