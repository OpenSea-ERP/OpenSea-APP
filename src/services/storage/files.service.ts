import { API_ENDPOINTS, apiConfig, authConfig } from '@/config/api';
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
  PreviewFileResponse,
  SearchStorageQuery,
  SearchStorageResponse,
  StorageStats,
} from '@/types/storage';

export const storageFilesService = {
  // POST /v1/storage/folders/:folderId/files or POST /v1/storage/files - Upload de arquivo
  async uploadFile(
    folderId: string | null,
    file: File,
    options?: { entityType?: string; entityId?: string }
  ): Promise<FileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.entityType) formData.append('entityType', options.entityType);
    if (options?.entityId) formData.append('entityId', options.entityId);

    const endpoint = folderId
      ? API_ENDPOINTS.STORAGE.FILES.UPLOAD(folderId)
      : API_ENDPOINTS.STORAGE.FILES.UPLOAD_ROOT;

    return apiClient.request<FileResponse>(endpoint, {
      method: 'POST',
      body: formData,
      // Não definir Content-Type — o browser adiciona automaticamente
      // com o boundary correto para multipart/form-data
    });
  },

  // Upload with real progress tracking via XMLHttpRequest
  uploadFileWithProgress(
    folderId: string | null,
    file: File,
    onProgress: (percent: number) => void,
    options?: { entityType?: string; entityId?: string }
  ): Promise<FileResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      if (options?.entityType) formData.append('entityType', options.entityType);
      if (options?.entityId) formData.append('entityId', options.entityId);

      const endpoint = folderId
        ? API_ENDPOINTS.STORAGE.FILES.UPLOAD(folderId)
        : API_ENDPOINTS.STORAGE.FILES.UPLOAD_ROOT;

      const url = new URL(endpoint, apiConfig.baseURL).toString();
      const token = typeof window !== 'undefined'
        ? localStorage.getItem(authConfig.tokenKey)
        : null;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error('Resposta inválida do servidor'));
          }
        } else {
          reject(new Error(`Upload falhou (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error('Erro de rede durante o upload'));
      xhr.ontimeout = () => reject(new Error('Upload expirou'));
      xhr.timeout = 5 * 60 * 1000; // 5 minutes for large files

      xhr.send(formData);
    });
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

  // GET /v1/storage/files/:id/preview - Obtém URL de preview com presigned URL
  async previewFile(id: string): Promise<PreviewFileResponse> {
    return apiClient.get<PreviewFileResponse>(
      API_ENDPOINTS.STORAGE.FILES.PREVIEW(id)
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
