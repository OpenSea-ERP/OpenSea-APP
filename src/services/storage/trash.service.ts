import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  DeletedItemsResponse,
  EmptyTrashResponse,
  FileResponse,
} from '@/types/storage';
import type { StorageFolder } from '@/types/storage';

export const storageTrashService = {
  async listDeletedItems(page = 1, limit = 20): Promise<DeletedItemsResponse> {
    return apiClient.get<DeletedItemsResponse>(API_ENDPOINTS.STORAGE.TRASH.LIST, {
      params: { page: String(page), limit: String(limit) },
    });
  },

  async restoreFile(fileId: string): Promise<FileResponse> {
    return apiClient.post<FileResponse>(
      API_ENDPOINTS.STORAGE.TRASH.RESTORE_FILE(fileId),
      {},
    );
  },

  async restoreFolder(folderId: string): Promise<{ folder: StorageFolder }> {
    return apiClient.post<{ folder: StorageFolder }>(
      API_ENDPOINTS.STORAGE.TRASH.RESTORE_FOLDER(folderId),
      {},
    );
  },

  async emptyTrash(): Promise<EmptyTrashResponse> {
    return apiClient.delete<EmptyTrashResponse>(API_ENDPOINTS.STORAGE.TRASH.EMPTY);
  },
};
