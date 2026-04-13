import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  BankConnection,
  ConnectTokenResponse,
  SyncResult,
} from '@/types/finance';

export interface BankConnectionResponse {
  connection: BankConnection;
}

export interface ListBankConnectionsResponse {
  data: BankConnection[];
}

export const bankConnectionsService = {
  async list(): Promise<ListBankConnectionsResponse> {
    return apiClient.get<ListBankConnectionsResponse>(
      API_ENDPOINTS.BANK_CONNECTIONS.LIST,
    );
  },

  async getConnectToken(): Promise<ConnectTokenResponse> {
    return apiClient.post<ConnectTokenResponse>(
      API_ENDPOINTS.BANK_CONNECTIONS.CONNECT_TOKEN,
      {}
    );
  },

  async connect(
    bankAccountId: string,
    externalItemId: string
  ): Promise<BankConnectionResponse> {
    return apiClient.post<BankConnectionResponse>(
      API_ENDPOINTS.BANK_CONNECTIONS.CREATE,
      { bankAccountId, externalItemId }
    );
  },

  async sync(connectionId: string): Promise<SyncResult> {
    return apiClient.post<SyncResult>(
      API_ENDPOINTS.BANK_CONNECTIONS.SYNC(connectionId),
      {}
    );
  },

  async disconnect(connectionId: string): Promise<void> {
    await apiClient.delete<void>(
      API_ENDPOINTS.BANK_CONNECTIONS.DELETE(connectionId)
    );
  },
};
