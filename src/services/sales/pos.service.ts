import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  ClosePosSessionRequest,
  CreatePosCashMovementRequest,
  CreatePosTerminalRequest,
  CreatePosTransactionRequest,
  OpenPosSessionRequest,
  PosCashMovement,
  PosSession,
  PosTerminal,
  PosTerminalsQuery,
  PosTerminalsResponse,
  PosTransaction,
  PosTransactionPayment,
  UpdatePosTerminalRequest,
} from '@/types/sales';

export const posService = {
  // Terminals
  async listTerminals(
    params?: PosTerminalsQuery
  ): Promise<PosTerminalsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.mode) searchParams.set('mode', params.mode);
    if (params?.isActive !== undefined)
      searchParams.set('isActive', String(params.isActive));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.POS.TERMINALS.LIST}?${query}`
      : API_ENDPOINTS.POS.TERMINALS.LIST;
    return apiClient.get<PosTerminalsResponse>(url);
  },

  async createTerminal(
    data: CreatePosTerminalRequest
  ): Promise<{ terminal: PosTerminal }> {
    return apiClient.post<{ terminal: PosTerminal }>(
      API_ENDPOINTS.POS.TERMINALS.CREATE,
      data
    );
  },

  async updateTerminal(
    id: string,
    data: UpdatePosTerminalRequest
  ): Promise<{ terminal: PosTerminal }> {
    return apiClient.put<{ terminal: PosTerminal }>(
      API_ENDPOINTS.POS.TERMINALS.UPDATE(id),
      data
    );
  },

  async deleteTerminal(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.POS.TERMINALS.DELETE(id));
  },

  // Sessions
  async openSession(
    data: OpenPosSessionRequest
  ): Promise<{ session: PosSession }> {
    return apiClient.post<{ session: PosSession }>(
      API_ENDPOINTS.POS.SESSIONS.OPEN,
      data
    );
  },

  async closeSession(
    id: string,
    data: ClosePosSessionRequest
  ): Promise<{ session: PosSession }> {
    return apiClient.post<{ session: PosSession }>(
      API_ENDPOINTS.POS.SESSIONS.CLOSE(id),
      data
    );
  },

  async getActiveSession(
    terminalId: string
  ): Promise<{ session: PosSession | null }> {
    return apiClient.get<{ session: PosSession | null }>(
      API_ENDPOINTS.POS.SESSIONS.GET_ACTIVE(terminalId)
    );
  },

  // Transactions
  async createTransaction(data: CreatePosTransactionRequest): Promise<{
    transaction: PosTransaction;
    payments: PosTransactionPayment[];
  }> {
    return apiClient.post<{
      transaction: PosTransaction;
      payments: PosTransactionPayment[];
    }>(API_ENDPOINTS.POS.TRANSACTIONS.CREATE, data);
  },

  async cancelTransaction(
    id: string
  ): Promise<{ transaction: PosTransaction }> {
    return apiClient.post<{ transaction: PosTransaction }>(
      API_ENDPOINTS.POS.TRANSACTIONS.CANCEL(id),
      {}
    );
  },

  // Cash
  async createCashMovement(
    data: CreatePosCashMovementRequest
  ): Promise<{ movement: PosCashMovement }> {
    return apiClient.post<{ movement: PosCashMovement }>(
      API_ENDPOINTS.POS.CASH.MOVEMENT,
      data
    );
  },
};
