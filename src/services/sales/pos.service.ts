import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  ClosePosSessionRequest,
  CreatePosCashMovementRequest,
  CreatePosTerminalRequest,
  CreatePosTransactionRequest,
  DeviceState,
  OpenPosSessionRequest,
  OpenTotemSessionRequest,
  PairDeviceRequest,
  PairDeviceResponse,
  PairingCodeResponse,
  PairThisDeviceResponse,
  PosCashMovement,
  PosSession,
  PosTerminal,
  PosTerminalsQuery,
  PosTerminalsResponse,
  PosTransaction,
  PosTransactionPayment,
  SessionSummary,
  UpdatePosTerminalRequest,
} from '@/types/sales';

const DEVICE_TOKEN_KEY = 'pos_device_token';

function getDeviceTokenHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem(DEVICE_TOKEN_KEY);
  return token ? { 'X-Pos-Device-Token': token } : {};
}

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

  async getTerminal(id: string): Promise<{ terminal: PosTerminal }> {
    return apiClient.get<{ terminal: PosTerminal }>(
      API_ENDPOINTS.POS.TERMINALS.GET(id)
    );
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
    return apiClient.patch<{ terminal: PosTerminal }>(
      API_ENDPOINTS.POS.TERMINALS.UPDATE(id),
      data
    );
  },

  async deleteTerminal(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.POS.TERMINALS.DELETE(id));
  },

  async getPairingCode(id: string): Promise<PairingCodeResponse> {
    return apiClient.get<PairingCodeResponse>(
      API_ENDPOINTS.POS.TERMINALS.PAIRING_CODE(id)
    );
  },

  async pairThisDevice(
    id: string,
    deviceLabel: string
  ): Promise<PairThisDeviceResponse> {
    return apiClient.post<PairThisDeviceResponse>(
      API_ENDPOINTS.POS.TERMINALS.PAIR_SELF(id),
      { deviceLabel }
    );
  },

  async unpairDevice(id: string, reason?: string): Promise<void> {
    const url = reason
      ? `${API_ENDPOINTS.POS.TERMINALS.UNPAIR(id)}?reason=${encodeURIComponent(reason)}`
      : API_ENDPOINTS.POS.TERMINALS.UNPAIR(id);
    return apiClient.delete(url);
  },

  // Devices
  async pairDevice(data: PairDeviceRequest): Promise<PairDeviceResponse> {
    return apiClient.post<PairDeviceResponse>(
      API_ENDPOINTS.POS.DEVICES.PAIR,
      data
    );
  },

  async getMyDevice(): Promise<DeviceState> {
    return apiClient.get<DeviceState>(API_ENDPOINTS.POS.DEVICES.ME, {
      headers: getDeviceTokenHeader(),
    });
  },

  // Sessions
  async openSession(
    data: OpenPosSessionRequest
  ): Promise<{ session: PosSession }> {
    return apiClient.post<{ session: PosSession }>(
      API_ENDPOINTS.POS.SESSIONS.OPEN,
      data,
      { headers: getDeviceTokenHeader() }
    );
  },

  async openTotemSession(
    data: OpenTotemSessionRequest
  ): Promise<{ session: PosSession }> {
    return apiClient.post<{ session: PosSession }>(
      API_ENDPOINTS.POS.SESSIONS.OPEN_TOTEM,
      data
    );
  },

  async closeSession(
    id: string,
    data: ClosePosSessionRequest
  ): Promise<{ session: PosSession }> {
    return apiClient.post<{ session: PosSession }>(
      API_ENDPOINTS.POS.SESSIONS.CLOSE(id),
      data,
      { headers: getDeviceTokenHeader() }
    );
  },

  async closeOrphanSession(id: string): Promise<{ session: PosSession }> {
    return apiClient.post<{ session: PosSession }>(
      API_ENDPOINTS.POS.SESSIONS.CLOSE_ORPHAN(id),
      {}
    );
  },

  async getCurrentSession(
    terminalId?: string
  ): Promise<{ session: PosSession | null }> {
    const url = terminalId
      ? `${API_ENDPOINTS.POS.SESSIONS.CURRENT}?terminalId=${terminalId}`
      : API_ENDPOINTS.POS.SESSIONS.CURRENT;
    return apiClient.get<{ session: PosSession | null }>(url, {
      headers: getDeviceTokenHeader(),
    });
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

  // Session Summary
  async getSessionSummary(
    sessionId: string
  ): Promise<{ summary: SessionSummary }> {
    return apiClient.get<{ summary: SessionSummary }>(
      API_ENDPOINTS.POS.SESSIONS.SUMMARY(sessionId),
      { headers: getDeviceTokenHeader() }
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
