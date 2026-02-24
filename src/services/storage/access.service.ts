import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  SetFolderAccessRequest,
  AccessRuleResponse,
  AccessRulesResponse,
} from '@/types/storage';

export const storageAccessService = {
  // GET /v1/storage/folders/:id/access - Lista regras de acesso de uma pasta
  async listAccess(folderId: string): Promise<AccessRulesResponse> {
    return apiClient.get<AccessRulesResponse>(
      API_ENDPOINTS.STORAGE.FOLDERS.ACCESS.LIST(folderId)
    );
  },

  // POST /v1/storage/folders/:id/access - Define regra de acesso
  async setAccess(
    folderId: string,
    data: SetFolderAccessRequest
  ): Promise<AccessRuleResponse> {
    return apiClient.post<AccessRuleResponse>(
      API_ENDPOINTS.STORAGE.FOLDERS.ACCESS.SET(folderId),
      data
    );
  },

  // DELETE /v1/storage/folders/:id/access/:ruleId - Remove regra de acesso
  async removeAccess(folderId: string, ruleId: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.STORAGE.FOLDERS.ACCESS.REMOVE(folderId, ruleId)
    );
  },
};
