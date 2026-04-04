import { apiClient } from '@/lib/api-client';
import type {
  AddOrderItemRequest,
  CashierQueueQuery,
  CashierQueueResponse,
  CreatePdvOrderRequest,
  MyDraftsQuery,
  MyDraftsResponse,
  PdvOrder,
  ReceivePaymentRequest,
  ReceivePaymentResponse,
} from '@/types/sales';

const PDV_ENDPOINTS = {
  CREATE: '/v1/orders/pdv',
  ADD_ITEM: (id: string) => `/v1/orders/${id}/add-item`,
  REMOVE_ITEM: (id: string, itemId: string) =>
    `/v1/orders/${id}/items/${itemId}`,
  UPDATE_ITEM: (id: string, itemId: string) =>
    `/v1/orders/${id}/items/${itemId}`,
  SEND_TO_CASHIER: (id: string) => `/v1/orders/${id}/send-to-cashier`,
  CLAIM: (id: string) => `/v1/orders/${id}/claim`,
  RECEIVE_PAYMENT: (id: string) => `/v1/orders/${id}/receive-payment`,
  CASHIER_QUEUE: '/v1/orders/cashier-queue',
  MY_DRAFTS: '/v1/orders/my-drafts',
  BY_CODE: (code: string) => `/v1/orders/by-code/${code}`,
  GET: (id: string) => `/v1/orders/${id}`,
} as const;

export const pdvService = {
  async createPdvOrder(
    data?: CreatePdvOrderRequest
  ): Promise<{ order: PdvOrder }> {
    return apiClient.post<{ order: PdvOrder }>(
      PDV_ENDPOINTS.CREATE,
      data ?? {}
    );
  },

  async addItem(
    orderId: string,
    data: AddOrderItemRequest
  ): Promise<{ order: PdvOrder }> {
    return apiClient.post<{ order: PdvOrder }>(
      PDV_ENDPOINTS.ADD_ITEM(orderId),
      data
    );
  },

  async removeItem(
    orderId: string,
    itemId: string
  ): Promise<{ order: PdvOrder }> {
    return apiClient.delete<{ order: PdvOrder }>(
      PDV_ENDPOINTS.REMOVE_ITEM(orderId, itemId)
    );
  },

  async updateItemQuantity(
    orderId: string,
    itemId: string,
    quantity: number
  ): Promise<{ order: PdvOrder }> {
    return apiClient.patch<{ order: PdvOrder }>(
      PDV_ENDPOINTS.UPDATE_ITEM(orderId, itemId),
      { quantity }
    );
  },

  async sendToCashier(orderId: string): Promise<{ order: PdvOrder }> {
    return apiClient.post<{ order: PdvOrder }>(
      PDV_ENDPOINTS.SEND_TO_CASHIER(orderId),
      {}
    );
  },

  async claimOrder(orderId: string): Promise<{ order: PdvOrder }> {
    return apiClient.post<{ order: PdvOrder }>(
      PDV_ENDPOINTS.CLAIM(orderId),
      {}
    );
  },

  async receivePayment(
    orderId: string,
    data: ReceivePaymentRequest
  ): Promise<ReceivePaymentResponse> {
    return apiClient.post<ReceivePaymentResponse>(
      PDV_ENDPOINTS.RECEIVE_PAYMENT(orderId),
      data
    );
  },

  async getCashierQueue(
    params?: CashierQueueQuery
  ): Promise<CashierQueueResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const url = query
      ? `${PDV_ENDPOINTS.CASHIER_QUEUE}?${query}`
      : PDV_ENDPOINTS.CASHIER_QUEUE;
    return apiClient.get<CashierQueueResponse>(url);
  },

  async getMyDrafts(params?: MyDraftsQuery): Promise<MyDraftsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    const url = query
      ? `${PDV_ENDPOINTS.MY_DRAFTS}?${query}`
      : PDV_ENDPOINTS.MY_DRAFTS;
    return apiClient.get<MyDraftsResponse>(url);
  },

  async getOrderByCode(code: string): Promise<{ order: PdvOrder }> {
    return apiClient.get<{ order: PdvOrder }>(PDV_ENDPOINTS.BY_CODE(code));
  },

  async getOrder(id: string): Promise<{ order: PdvOrder }> {
    return apiClient.get<{ order: PdvOrder }>(PDV_ENDPOINTS.GET(id));
  },
};
