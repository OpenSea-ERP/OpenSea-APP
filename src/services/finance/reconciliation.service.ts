import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  Reconciliation,
  ReconciliationDetail,
  ReconciliationImportPreview,
  ReconciliationMatchSuggestion,
  ReconciliationsQuery,
} from '@/types/finance';
import type { PaginationMeta } from '@/types/pagination';

export interface ReconciliationsResponse {
  reconciliations: Reconciliation[];
  meta: PaginationMeta;
}

export interface ReconciliationResponse {
  reconciliation: ReconciliationDetail;
}

export interface ReconciliationImportResponse {
  reconciliation: Reconciliation;
  preview: ReconciliationImportPreview;
}

export interface ReconciliationSuggestionsResponse {
  suggestions: ReconciliationMatchSuggestion[];
}

export const reconciliationService = {
  async list(params?: ReconciliationsQuery): Promise<ReconciliationsResponse> {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.perPage ?? 20),
    });

    if (params?.bankAccountId)
      query.append('bankAccountId', params.bankAccountId);
    if (params?.status) query.append('status', params.status);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    return apiClient.get<ReconciliationsResponse>(
      `${API_ENDPOINTS.RECONCILIATION.LIST}?${query.toString()}`
    );
  },

  async get(id: string): Promise<ReconciliationResponse> {
    return apiClient.get<ReconciliationResponse>(
      API_ENDPOINTS.RECONCILIATION.GET(id)
    );
  },

  async import(
    bankAccountId: string,
    file: File
  ): Promise<ReconciliationImportResponse> {
    const formData = new FormData();
    formData.append('bankAccountId', bankAccountId);
    formData.append('file', file);

    return apiClient.post<ReconciliationImportResponse>(
      API_ENDPOINTS.RECONCILIATION.IMPORT,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },

  async matchItem(
    reconciliationId: string,
    itemId: string,
    entryId: string
  ): Promise<void> {
    await apiClient.post<void>(
      API_ENDPOINTS.RECONCILIATION.MATCH_ITEM(reconciliationId, itemId),
      { entryId }
    );
  },

  async ignoreItem(
    reconciliationId: string,
    itemId: string,
    reason?: string
  ): Promise<void> {
    await apiClient.post<void>(
      API_ENDPOINTS.RECONCILIATION.IGNORE_ITEM(reconciliationId, itemId),
      { reason }
    );
  },

  async createEntryFromItem(
    reconciliationId: string,
    itemId: string
  ): Promise<void> {
    await apiClient.post<void>(
      API_ENDPOINTS.RECONCILIATION.CREATE_ENTRY(reconciliationId, itemId),
      {}
    );
  },

  async getSuggestions(
    reconciliationId: string,
    itemId: string
  ): Promise<ReconciliationSuggestionsResponse> {
    return apiClient.get<ReconciliationSuggestionsResponse>(
      API_ENDPOINTS.RECONCILIATION.SUGGESTIONS(reconciliationId, itemId)
    );
  },

  async complete(id: string): Promise<void> {
    await apiClient.post<void>(API_ENDPOINTS.RECONCILIATION.COMPLETE(id), {});
  },

  async cancel(id: string): Promise<void> {
    await apiClient.post<void>(API_ENDPOINTS.RECONCILIATION.CANCEL(id), {});
  },
};
