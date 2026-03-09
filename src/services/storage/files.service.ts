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
  MultipartInitiateRequest,
  MultipartInitiateResponse,
  MultipartCompleteRequest,
  MultipartCompleteResponse,
  CompressFilesRequest,
  CompressFilesResponse,
  DecompressFileRequest,
  DecompressFileResponse,
} from '@/types/storage';

// Serve token cache: short-lived JWT for file serving (avoids exposing session token in URLs)
let _serveTokenCache: { token: string; expiresAt: number } | null = null;

export const storageFilesService = {
  /**
   * Gets a short-lived serve token (5min), cached with 60s safety margin.
   */
  async getServeToken(): Promise<string> {
    const now = Date.now();
    if (_serveTokenCache && _serveTokenCache.expiresAt > now + 60_000) {
      return _serveTokenCache.token;
    }

    const response = await apiClient.post<{ token: string; expiresIn: number }>(
      API_ENDPOINTS.STORAGE.FILES.SERVE_TOKEN,
      {},
    );

    _serveTokenCache = {
      token: response.token,
      expiresAt: now + response.expiresIn * 1000,
    };

    return response.token;
  },

  /**
   * Returns the full proxy serve URL with auth token as query param.
   * Used for <iframe>, <video>, <img> src attributes which cannot send Authorization headers.
   * Falls back to session token if serve token is not yet cached (sync method).
   */
  getServeUrl(id: string, options?: { version?: number; download?: boolean; password?: string; format?: 'pdf' }): string {
    // Use cached serve token if available, otherwise fall back to session token
    const token = _serveTokenCache && _serveTokenCache.expiresAt > Date.now() + 60_000
      ? _serveTokenCache.token
      : typeof window !== 'undefined'
        ? localStorage.getItem(authConfig.tokenKey)
        : null;
    const base = `${apiConfig.baseURL}${API_ENDPOINTS.STORAGE.FILES.SERVE(id)}`;
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (options?.version) params.set('version', String(options.version));
    if (options?.download) params.set('download', '1');
    if (options?.password) params.set('password', options.password);
    if (options?.format) params.set('format', options.format);
    return `${base}?${params.toString()}`;
  },

  /**
   * Returns a serve URL using a fresh short-lived token (async version).
   */
  async getServeUrlWithToken(id: string, options?: { version?: number; download?: boolean; password?: string; format?: 'pdf' }): Promise<string> {
    const token = await this.getServeToken();
    const base = `${apiConfig.baseURL}${API_ENDPOINTS.STORAGE.FILES.SERVE(id)}`;
    const params = new URLSearchParams();
    params.set('token', token);
    if (options?.version) params.set('version', String(options.version));
    if (options?.download) params.set('download', '1');
    if (options?.password) params.set('password', options.password);
    if (options?.format) params.set('format', options.format);
    return `${base}?${params.toString()}`;
  },

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

  // POST /v1/storage/files/compress - Compactar arquivos/pastas em ZIP
  async compressFiles(data: CompressFilesRequest): Promise<CompressFilesResponse> {
    return apiClient.post<CompressFilesResponse>(
      API_ENDPOINTS.STORAGE.FILES.COMPRESS,
      data,
    );
  },

  // POST /v1/storage/files/:id/decompress - Descompactar arquivo ZIP
  async decompressFile(id: string, data?: DecompressFileRequest): Promise<DecompressFileResponse> {
    return apiClient.post<DecompressFileResponse>(
      API_ENDPOINTS.STORAGE.FILES.DECOMPRESS(id),
      data ?? {},
    );
  },

  // --- Multipart Upload (for files > 50MB) ---

  // POST /v1/storage/files/multipart/initiate
  async initiateMultipartUpload(
    data: MultipartInitiateRequest,
  ): Promise<MultipartInitiateResponse> {
    return apiClient.post<MultipartInitiateResponse>(
      API_ENDPOINTS.STORAGE.FILES.MULTIPART.INITIATE,
      data,
    );
  },

  // POST /v1/storage/files/multipart/complete
  async completeMultipartUpload(
    data: MultipartCompleteRequest,
  ): Promise<MultipartCompleteResponse> {
    return apiClient.post<MultipartCompleteResponse>(
      API_ENDPOINTS.STORAGE.FILES.MULTIPART.COMPLETE,
      data,
    );
  },

  // POST /v1/storage/files/multipart/abort
  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    return apiClient.post<void>(
      API_ENDPOINTS.STORAGE.FILES.MULTIPART.ABORT,
      { key, uploadId },
    );
  },

  // Upload a single part to a presigned URL, returns ETag
  async uploadPart(
    url: string,
    blob: Blob,
    onProgress?: (loaded: number) => void,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(e.loaded);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('ETag');
          if (etag) {
            resolve(etag.replace(/"/g, ''));
          } else {
            reject(new Error('ETag não encontrado na resposta'));
          }
        } else {
          reject(new Error(`Upload da parte falhou (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error('Erro de rede durante upload da parte'));
      xhr.timeout = 5 * 60 * 1000;
      xhr.ontimeout = () => reject(new Error('Upload da parte expirou'));

      xhr.send(blob);
    });
  },

  // Smart upload: auto-selects between single and multipart based on file size
  MULTIPART_THRESHOLD: 50 * 1024 * 1024, // 50MB
  PART_SIZE: 5 * 1024 * 1024, // 5MB per part

  async smartUpload(
    folderId: string | null,
    file: File,
    onProgress: (percent: number) => void,
    options?: { entityType?: string; entityId?: string },
  ): Promise<FileResponse> {
    if (file.size < this.MULTIPART_THRESHOLD) {
      return this.uploadFileWithProgress(folderId, file, onProgress, options);
    }

    // Multipart upload for large files
    const totalParts = Math.ceil(file.size / this.PART_SIZE);

    // Step 1: Initiate
    onProgress(0);
    const { uploadId, key, partUrls } = await this.initiateMultipartUpload({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      folderId,
    });

    try {
      // Step 2: Upload parts with progress tracking
      const completedParts: Array<{ partNumber: number; etag: string }> = [];
      let totalUploaded = 0;

      // Upload parts sequentially to avoid overwhelming the connection
      for (const { partNumber, url } of partUrls) {
        const start = (partNumber - 1) * this.PART_SIZE;
        const end = Math.min(start + this.PART_SIZE, file.size);
        const blob = file.slice(start, end);

        const etag = await this.uploadPart(url, blob, (loaded) => {
          const currentTotal = totalUploaded + loaded;
          onProgress(Math.round((currentTotal / file.size) * 95)); // Reserve 5% for completion
        });

        totalUploaded += end - start;
        completedParts.push({ partNumber, etag });
        onProgress(Math.round((totalUploaded / file.size) * 95));
      }

      // Step 3: Complete multipart upload (backend creates the file record and returns it)
      const response = await this.completeMultipartUpload({
        key,
        uploadId,
        parts: completedParts,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        folderId,
        entityType: options?.entityType,
        entityId: options?.entityId,
      });

      onProgress(100);

      return response;
    } catch (error) {
      // Abort on failure
      await this.abortMultipartUpload(key, uploadId).catch(() => {});
      throw error;
    }
  },

  // --- Bulk Operations ---

  // POST /v1/storage/bulk/delete - Excluir múltiplos itens
  async bulkDelete(data: { fileIds?: string[]; folderIds?: string[] }): Promise<{
    deletedFiles: number;
    deletedFolders: number;
    errors: string[];
  }> {
    return apiClient.post(API_ENDPOINTS.STORAGE.BULK.DELETE, data);
  },

  // POST /v1/storage/bulk/move - Mover múltiplos itens
  async bulkMove(data: {
    fileIds?: string[];
    folderIds?: string[];
    targetFolderId: string | null;
  }): Promise<{
    movedFiles: number;
    movedFolders: number;
    errors: string[];
  }> {
    return apiClient.post(API_ENDPOINTS.STORAGE.BULK.MOVE, data);
  },
};
