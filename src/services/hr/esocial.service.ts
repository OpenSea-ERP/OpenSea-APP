import { apiClient } from '@/lib/api-client';
import type {
  EsocialDashboard,
  EsocialConfigResponse,
  UpdateEsocialConfigData,
  EsocialCertificateResponse,
  ListEsocialEventsResponse,
  EsocialEvent,
  UpdateEventStatusResponse,
  EventStatusAction,
  BulkApproveResponse,
  ListEsocialBatchesResponse,
  EsocialBatch,
  TransmitBatchResponse,
} from '@/types/esocial';

export interface CheckBatchStatusResponse {
  batchId: string;
  status: string;
  acceptedCount: number;
  rejectedCount: number;
  events: Array<{
    id: string;
    status: string;
    receipt?: string;
    rejectionCode?: string;
    rejectionMessage?: string;
  }>;
}

export const esocialService = {
  // Dashboard
  async getDashboard(): Promise<EsocialDashboard> {
    return apiClient.get<EsocialDashboard>('/v1/esocial/dashboard');
  },

  // Events
  async listEvents(params: {
    page?: number;
    perPage?: number;
    status?: string;
    eventType?: string;
    search?: string;
  }): Promise<ListEsocialEventsResponse> {
    const stringParams: Record<string, string> = {};
    if (params.page !== undefined) stringParams.page = String(params.page);
    if (params.perPage !== undefined)
      stringParams.perPage = String(params.perPage);
    if (params.status) stringParams.status = params.status;
    if (params.eventType) stringParams.eventType = params.eventType;
    if (params.search) stringParams.search = params.search;
    return apiClient.get<ListEsocialEventsResponse>('/v1/esocial/events', {
      params: stringParams,
    });
  },

  async getEvent(id: string): Promise<{ event: EsocialEvent }> {
    return apiClient.get<{ event: EsocialEvent }>(`/v1/esocial/events/${id}`);
  },

  async updateEventStatus(
    id: string,
    action: EventStatusAction,
    rejectionReason?: string
  ): Promise<UpdateEventStatusResponse> {
    return apiClient.patch<UpdateEventStatusResponse>(
      `/v1/esocial/events/${id}/status`,
      { action, rejectionReason }
    );
  },

  async bulkApprove(eventIds: string[]): Promise<BulkApproveResponse> {
    return apiClient.post<BulkApproveResponse>(
      '/v1/esocial/events/bulk-approve',
      { eventIds }
    );
  },

  // Batches
  async listBatches(params: {
    page?: number;
    perPage?: number;
    status?: string;
  }): Promise<ListEsocialBatchesResponse> {
    const stringParams: Record<string, string> = {};
    if (params.page !== undefined) stringParams.page = String(params.page);
    if (params.perPage !== undefined)
      stringParams.perPage = String(params.perPage);
    if (params.status) stringParams.status = params.status;
    return apiClient.get<ListEsocialBatchesResponse>('/v1/esocial/batches', {
      params: stringParams,
    });
  },

  async getBatch(id: string): Promise<{ batch: EsocialBatch }> {
    return apiClient.get<{ batch: EsocialBatch }>(`/v1/esocial/batches/${id}`);
  },

  async transmitBatch(): Promise<TransmitBatchResponse[]> {
    return apiClient.post<TransmitBatchResponse[]>(
      '/v1/esocial/batches/transmit'
    );
  },

  async checkBatchStatus(id: string): Promise<CheckBatchStatusResponse> {
    return apiClient.post<CheckBatchStatusResponse>(
      `/v1/esocial/batches/${id}/check`
    );
  },

  // Config
  async getConfig(): Promise<EsocialConfigResponse> {
    return apiClient.get<EsocialConfigResponse>('/v1/esocial/config');
  },

  async updateConfig(
    data: UpdateEsocialConfigData
  ): Promise<EsocialConfigResponse> {
    return apiClient.patch<EsocialConfigResponse>('/v1/esocial/config', data);
  },

  // Certificate
  async getCertificate(): Promise<EsocialCertificateResponse | null> {
    try {
      return await apiClient.get<EsocialCertificateResponse>(
        '/v1/esocial/certificate'
      );
    } catch {
      return null;
    }
  },

  async uploadCertificate(
    file: File,
    passphrase: string
  ): Promise<EsocialCertificateResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('passphrase', passphrase);

    return apiClient.post<EsocialCertificateResponse>(
      '/v1/esocial/certificate',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },
};
