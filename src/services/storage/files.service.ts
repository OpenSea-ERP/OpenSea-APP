import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  RenameFileRequest,
  MoveFileRequest,
  ListFilesQuery,
  ListFilesResponse,
  FileResponse,
  FileDetailResponse,
  FileVersionResponse,
  VersionsResponse,
  DownloadResponse,
  SearchStorageQuery,
  SearchStorageResponse,
  StorageStats,
} from '@/types/storage';

export const storageFilesService = {
  // POST /v1/storage/folders/:folderId/files - Upload de arquivo
  async uploadFile(
    folderId: string,
    file: File,
    options?: { entityType?: string; entityId?: string }
  ): Promise<FileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.entityType) formData.append('entityType', options.entityType);
    if (options?.entityId) formData.append('entityId', options.entityId);

    return apiClient.request<FileResponse>(
      API_ENDPOINTS.STORAGE.FILES.UPLOAD(folderId),
      {
        method: 'POST',
        body: formData,
        // Não definir Content-Type — o browser adiciona automaticamente
        // com o boundary correto para multipart/form-data
      }
    );
  },

  // GET /v1/storage/files/:id - Busca detalhes de um arquivo com versões
  async getFile(id: string): Promise<FileDetailResponse> {
    return apiClient.get<FileDetailResponse>(
      API_ENDPOINTS.STORAGE.FILES.GET(id)
    );
  },

  // GET /v1/storage/files/:id/download - Obtém URL de download
  async downloadFile(id: string, version?: number): Promise<DownloadResponse> {
    const params: Record<string, string> = {};
    if (version !== undefined) params.version = String(version);

    return apiClient.get<DownloadResponse>(
      API_ENDPOINTS.STORAGE.FILES.DOWNLOAD(id),
      { params }
    );
  },

  // PATCH /v1/storage/files/:id/rename - Renomeia um arquivo
  async renameFile(id: string, data: RenameFileRequest): Promise<FileResponse> {
    return apiClient.patch<FileResponse>(
      API_ENDPOINTS.STORAGE.FILES.RENAME(id),
      data
    );
  },

  // PATCH /v1/storage/files/:id/move - Move um arquivo
  async moveFile(id: string, data: MoveFileRequest): Promise<FileResponse> {
    return apiClient.patch<FileResponse>(
      API_ENDPOINTS.STORAGE.FILES.MOVE(id),
      data
    );
  },

  // DELETE /v1/storage/files/:id - Remove um arquivo
  async deleteFile(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.STORAGE.FILES.DELETE(id));
  },

  // GET /v1/storage/files - Lista arquivos com filtros
  async listFiles(query?: ListFilesQuery): Promise<ListFilesResponse> {
    const params: Record<string, string> = {};
    if (query?.folderId) params.folderId = query.folderId;
    if (query?.fileType) params.fileType = query.fileType;
    if (query?.entityType) params.entityType = query.entityType;
    if (query?.entityId) params.entityId = query.entityId;
    if (query?.search) params.search = query.search;
    if (query?.status) params.status = query.status;
    if (query?.page) params.page = String(query.page);
    if (query?.limit) params.limit = String(query.limit);

    return apiClient.get<ListFilesResponse>(API_ENDPOINTS.STORAGE.FILES.LIST, {
      params,
    });
  },

  // POST /v1/storage/files/:id/versions - Upload de nova versão
  async uploadVersion(
    id: string,
    file: File,
    changeNote?: string
  ): Promise<FileVersionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (changeNote) formData.append('changeNote', changeNote);

    return apiClient.request<FileVersionResponse>(
      API_ENDPOINTS.STORAGE.FILES.VERSIONS.UPLOAD(id),
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  // GET /v1/storage/files/:id/versions - Lista versões de um arquivo
  async listVersions(id: string): Promise<VersionsResponse> {
    return apiClient.get<VersionsResponse>(
      API_ENDPOINTS.STORAGE.FILES.VERSIONS.LIST(id)
    );
  },

  // POST /v1/storage/files/:id/versions/:vId/restore - Restaura uma versão
  async restoreVersion(
    id: string,
    versionId: string
  ): Promise<FileVersionResponse> {
    return apiClient.post<FileVersionResponse>(
      API_ENDPOINTS.STORAGE.FILES.VERSIONS.RESTORE(id, versionId),
      {}
    );
  },

  // GET /v1/storage/search - Busca global de arquivos e pastas
  async searchStorage(query: SearchStorageQuery): Promise<SearchStorageResponse> {
    const params: Record<string, string> = { query: query.query };
    if (query.fileType) params.fileType = query.fileType;
    if (query.page) params.page = String(query.page);
    if (query.limit) params.limit = String(query.limit);

    return apiClient.get<SearchStorageResponse>(API_ENDPOINTS.STORAGE.SEARCH, {
      params,
    });
  },

  // GET /v1/storage/stats - Estatísticas de armazenamento
  async getStats(): Promise<StorageStats> {
    return apiClient.get<StorageStats>(API_ENDPOINTS.STORAGE.STATS);
  },
};
