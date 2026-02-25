import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  StorageShareLink,
  CreateShareLinkRequest,
  SharedFileInfo,
  SharedFileDownloadRequest,
  SharedFileDownloadResponse,
} from '@/types/storage';

export const storageSharingService = {
  // POST /v1/storage/files/:fileId/share - Create share link
  async createShareLink(
    fileId: string,
    data: CreateShareLinkRequest,
  ): Promise<StorageShareLink> {
    return apiClient.request<StorageShareLink>(
      API_ENDPOINTS.STORAGE.SHARING.CREATE(fileId),
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
  },

  // GET /v1/storage/files/:fileId/shares - List share links
  async listShareLinks(fileId: string): Promise<StorageShareLink[]> {
    return apiClient.request<StorageShareLink[]>(
      API_ENDPOINTS.STORAGE.SHARING.LIST(fileId),
    );
  },

  // DELETE /v1/storage/shares/:linkId - Revoke share link
  async revokeShareLink(linkId: string): Promise<void> {
    return apiClient.request<void>(
      API_ENDPOINTS.STORAGE.SHARING.REVOKE(linkId),
      {
        method: 'DELETE',
      },
    );
  },

  // GET /v1/public/shared/:token - Access shared file (public, no auth)
  async accessSharedFile(token: string): Promise<SharedFileInfo> {
    return apiClient.request<SharedFileInfo>(
      API_ENDPOINTS.STORAGE.PUBLIC.ACCESS(token),
    );
  },

  // POST /v1/public/shared/:token/download - Download shared file (public, no auth)
  async downloadSharedFile(
    token: string,
    data?: SharedFileDownloadRequest,
  ): Promise<SharedFileDownloadResponse> {
    return apiClient.request<SharedFileDownloadResponse>(
      API_ENDPOINTS.STORAGE.PUBLIC.DOWNLOAD(token),
      {
        method: 'POST',
        body: JSON.stringify(data ?? {}),
      },
    );
  },
};
