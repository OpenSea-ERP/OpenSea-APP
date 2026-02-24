import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  BreadcrumbResponse,
  CreateFolderRequest,
  EnsureEntityFolderRequest,
  EnsureEntityFolderResponse,
  FolderContents,
  FolderContentsQuery,
  FolderResponse,
  UpdateFolderRequest,
  FoldersResponse,
  InitializeFoldersResponse,
  MoveFolderRequest,
  RenameFolderRequest,
} from '@/types/storage';

export const storageFoldersService = {
  // POST /v1/storage/folders - Cria uma nova pasta
  async createFolder(data: CreateFolderRequest): Promise<FolderResponse> {
    return apiClient.post<FolderResponse>(
      API_ENDPOINTS.STORAGE.FOLDERS.CREATE,
      data
    );
  },

  // PATCH /v1/storage/folders/:id - Atualiza cor/ícone de uma pasta
  async updateFolder(
    id: string,
    data: UpdateFolderRequest
  ): Promise<FolderResponse> {
    return apiClient.patch<FolderResponse>(
      API_ENDPOINTS.STORAGE.FOLDERS.UPDATE(id),
      data
    );
  },

  // GET /v1/storage/folders/:id - Busca detalhes de uma pasta
  async getFolder(id: string): Promise<FolderResponse> {
    return apiClient.get<FolderResponse>(API_ENDPOINTS.STORAGE.FOLDERS.GET(id));
  },

  // GET /v1/storage/folders/:id/contents - Lista conteúdo de uma pasta
  async getFolderContents(
    id: string,
    query?: FolderContentsQuery
  ): Promise<FolderContents> {
    const params: Record<string, string> = {};
    if (query?.page) params.page = String(query.page);
    if (query?.limit) params.limit = String(query.limit);
    if (query?.search) params.search = query.search;
    if (query?.sort) params.sort = query.sort;

    return apiClient.get<FolderContents>(
      API_ENDPOINTS.STORAGE.FOLDERS.CONTENTS(id),
      { params }
    );
  },

  // GET /v1/storage/folders/root/contents - Lista conteúdo da raiz
  async getRootContents(query?: FolderContentsQuery): Promise<FolderContents> {
    const params: Record<string, string> = {};
    if (query?.page) params.page = String(query.page);
    if (query?.limit) params.limit = String(query.limit);
    if (query?.search) params.search = query.search;
    if (query?.sort) params.sort = query.sort;

    return apiClient.get<FolderContents>(
      API_ENDPOINTS.STORAGE.FOLDERS.ROOT_CONTENTS,
      { params }
    );
  },

  // PATCH /v1/storage/folders/:id/rename - Renomeia uma pasta
  async renameFolder(
    id: string,
    data: RenameFolderRequest
  ): Promise<FolderResponse> {
    return apiClient.patch<FolderResponse>(
      API_ENDPOINTS.STORAGE.FOLDERS.RENAME(id),
      data
    );
  },

  // PATCH /v1/storage/folders/:id/move - Move uma pasta
  async moveFolder(
    id: string,
    data: MoveFolderRequest
  ): Promise<FolderResponse> {
    return apiClient.patch<FolderResponse>(
      API_ENDPOINTS.STORAGE.FOLDERS.MOVE(id),
      data
    );
  },

  // DELETE /v1/storage/folders/:id - Remove uma pasta
  async deleteFolder(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.STORAGE.FOLDERS.DELETE(id));
  },

  // GET /v1/storage/folders/:id/breadcrumb - Busca breadcrumb de uma pasta
  async getBreadcrumb(id: string): Promise<BreadcrumbResponse> {
    return apiClient.get<BreadcrumbResponse>(
      API_ENDPOINTS.STORAGE.FOLDERS.BREADCRUMB(id)
    );
  },

  // GET /v1/storage/folders/search - Pesquisa pastas
  async searchFolders(query: string): Promise<FoldersResponse> {
    return apiClient.get<FoldersResponse>(
      API_ENDPOINTS.STORAGE.FOLDERS.SEARCH,
      { params: { query } }
    );
  },

  // POST /v1/storage/folders/initialize - Inicializa pastas raiz do tenant
  async initializeFolders(): Promise<InitializeFoldersResponse> {
    return apiClient.post<InitializeFoldersResponse>(
      API_ENDPOINTS.STORAGE.FOLDERS.INITIALIZE
    );
  },

  // POST /v1/storage/folders/ensure-entity - Garante pastas de uma entidade
  async ensureEntityFolder(
    request: EnsureEntityFolderRequest
  ): Promise<EnsureEntityFolderResponse> {
    return apiClient.post<EnsureEntityFolderResponse>(
      API_ENDPOINTS.STORAGE.FOLDERS.ENSURE_ENTITY,
      request
    );
  },
};
