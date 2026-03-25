import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  FinanceEntry,
  FinanceEntriesQuery,
  CreateFinanceEntryData,
  UpdateFinanceEntryData,
  RegisterPaymentData,
  FinanceEntryPayment,
  FinanceAttachment,
  FinanceAttachmentType,
  ParseBoletoRequest,
  ParseBoletoResult,
  ParsePixRequest,
  ParsePixResult,
  BatchCreateRequest,
  BatchCreateResponse,
} from '@/types/finance';
export interface FinanceEntriesResponse {
  entries: FinanceEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface FinanceEntryResponse {
  entry: FinanceEntry;
}

export interface RegisterPaymentResponse {
  payment: FinanceEntryPayment;
}

export interface CheckOverdueResponse {
  markedOverdue: number;
}

export const financeEntriesService = {
  async list(params?: FinanceEntriesQuery): Promise<FinanceEntriesResponse> {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.perPage ?? 20),
    });

    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    if (params?.status) {
      const statuses = Array.isArray(params.status)
        ? params.status
        : [params.status];
      statuses.forEach(s => query.append('status', s));
    }
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.costCenterId) query.append('costCenterId', params.costCenterId);
    if (params?.bankAccountId)
      query.append('bankAccountId', params.bankAccountId);
    if (params?.dueDateFrom) query.append('dueDateFrom', params.dueDateFrom);
    if (params?.dueDateTo) query.append('dueDateTo', params.dueDateTo);
    if (params?.isOverdue !== undefined)
      query.append('isOverdue', String(params.isOverdue));
    if (params?.customerName) query.append('customerName', params.customerName);
    if (params?.supplierName) query.append('supplierName', params.supplierName);
    if (params?.overdueRange) query.append('overdueRange', params.overdueRange);
    if (params?.includeDeleted)
      query.append('includeDeleted', String(params.includeDeleted));
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    return apiClient.get<FinanceEntriesResponse>(
      `${API_ENDPOINTS.FINANCE_ENTRIES.LIST}?${query.toString()}`
    );
  },

  async get(id: string): Promise<FinanceEntryResponse> {
    return apiClient.get<FinanceEntryResponse>(
      API_ENDPOINTS.FINANCE_ENTRIES.GET(id)
    );
  },

  async create(data: CreateFinanceEntryData): Promise<FinanceEntryResponse> {
    return apiClient.post<FinanceEntryResponse>(
      API_ENDPOINTS.FINANCE_ENTRIES.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateFinanceEntryData
  ): Promise<FinanceEntryResponse> {
    return apiClient.patch<FinanceEntryResponse>(
      API_ENDPOINTS.FINANCE_ENTRIES.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.FINANCE_ENTRIES.DELETE(id));
  },

  async cancel(id: string): Promise<FinanceEntryResponse> {
    return apiClient.patch<FinanceEntryResponse>(
      API_ENDPOINTS.FINANCE_ENTRIES.CANCEL(id),
      {}
    );
  },

  async registerPayment(
    entryId: string,
    data: RegisterPaymentData
  ): Promise<RegisterPaymentResponse> {
    return apiClient.post<RegisterPaymentResponse>(
      API_ENDPOINTS.FINANCE_ENTRIES.REGISTER_PAYMENT(entryId),
      data
    );
  },

  async checkOverdue(): Promise<CheckOverdueResponse> {
    return apiClient.post<CheckOverdueResponse>(
      API_ENDPOINTS.FINANCE_DASHBOARD.CHECK_OVERDUE,
      {}
    );
  },

  async parseBoleto(data: ParseBoletoRequest): Promise<ParseBoletoResult> {
    return apiClient.post<ParseBoletoResult>(
      API_ENDPOINTS.FINANCE_DASHBOARD.PARSE_BOLETO,
      data
    );
  },

  async parsePix(data: ParsePixRequest): Promise<ParsePixResult> {
    return apiClient.post<ParsePixResult>(
      API_ENDPOINTS.FINANCE_DASHBOARD.PARSE_PIX,
      data
    );
  },

  async createBatch(data: BatchCreateRequest): Promise<BatchCreateResponse> {
    return apiClient.post<BatchCreateResponse>(
      API_ENDPOINTS.FINANCE_ENTRIES.CREATE_BATCH,
      data
    );
  },

  async uploadAttachment(
    entryId: string,
    file: File,
    type: FinanceAttachmentType
  ): Promise<{ attachment: FinanceAttachment }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return apiClient.post<{ attachment: FinanceAttachment }>(
      API_ENDPOINTS.FINANCE_ENTRIES.UPLOAD_ATTACHMENT(entryId),
      formData
    );
  },
};
