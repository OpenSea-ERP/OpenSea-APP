import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CancelOrderRequest,
  ChangeOrderStageRequest,
  CreateOrderRequest,
  OrderResponse,
  OrdersQuery,
  OrdersResponse,
  UpdateOrderRequest,
} from '@/types/sales';

export const ordersService = {
  async listOrders(params?: OrdersQuery): Promise<OrdersResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.channel) searchParams.set('channel', params.channel);
    if (params?.stageId) searchParams.set('stageId', params.stageId);
    if (params?.pipelineId) searchParams.set('pipelineId', params.pipelineId);
    if (params?.customerId) searchParams.set('customerId', params.customerId);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.ORDERS.LIST}?${query}`
      : API_ENDPOINTS.ORDERS.LIST;
    return apiClient.get<OrdersResponse>(url);
  },

  async getOrder(id: string): Promise<OrderResponse> {
    return apiClient.get<OrderResponse>(API_ENDPOINTS.ORDERS.GET(id));
  },

  async createOrder(data: CreateOrderRequest): Promise<OrderResponse> {
    return apiClient.post<OrderResponse>(API_ENDPOINTS.ORDERS.CREATE, data);
  },

  async updateOrder(
    id: string,
    data: UpdateOrderRequest,
  ): Promise<{ order: OrderResponse['order'] }> {
    return apiClient.put<{ order: OrderResponse['order'] }>(
      API_ENDPOINTS.ORDERS.UPDATE(id),
      data,
    );
  },

  async deleteOrder(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.ORDERS.DELETE(id));
  },

  async confirmOrder(
    id: string,
  ): Promise<{ order: OrderResponse['order'] }> {
    return apiClient.post<{ order: OrderResponse['order'] }>(
      API_ENDPOINTS.ORDERS.CONFIRM(id),
      {},
    );
  },

  async cancelOrder(
    id: string,
    data: CancelOrderRequest,
  ): Promise<{ order: OrderResponse['order'] }> {
    return apiClient.post<{ order: OrderResponse['order'] }>(
      API_ENDPOINTS.ORDERS.CANCEL(id),
      data,
    );
  },

  async changeOrderStage(
    id: string,
    data: ChangeOrderStageRequest,
  ): Promise<{ order: OrderResponse['order'] }> {
    return apiClient.patch<{ order: OrderResponse['order'] }>(
      API_ENDPOINTS.ORDERS.CHANGE_STAGE(id),
      data,
    );
  },

  async convertQuote(
    id: string,
  ): Promise<{ order: OrderResponse['order'] }> {
    return apiClient.post<{ order: OrderResponse['order'] }>(
      API_ENDPOINTS.ORDERS.CONVERT_QUOTE(id),
      {},
    );
  },
};
