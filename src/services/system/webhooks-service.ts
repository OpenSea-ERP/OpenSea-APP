/**
 * Webhooks (outbound) service — Phase 11
 * Cliente axios para os 11 endpoints REST `/v1/system/webhooks/*` (Plan 11-02).
 *
 * PIN-gated mutations (delete, regenerate-secret, reactivate) recebem
 * `actionPin` e enviam via header `X-Action-Pin` (ADR-032 / Plan 11-02 Task 4).
 */

import { apiClient } from '@/lib/api-client';
import type {
  CreateWebhookRequest,
  CreateWebhookResponse,
  PingWebhookResponse,
  RegenerateWebhookSecretResponse,
  ReprocessBulkResponse,
  UpdateWebhookRequest,
  WebhookDeliveryDTO,
  WebhookDeliveryFilters,
  WebhookDeliveryListResponse,
  WebhookEndpointDTO,
  WebhookEndpointFilters,
  WebhookEndpointListResponse,
} from '@/types/system';

const BASE = '/v1/system/webhooks';

function buildEndpointQuery(
  params: WebhookEndpointFilters | undefined
): string {
  const q = new URLSearchParams();
  if (!params) return '';
  if (params.status && params.status !== 'all') q.set('status', params.status);
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

function buildDeliveryQuery(
  params: WebhookDeliveryFilters | undefined
): string {
  const q = new URLSearchParams();
  if (!params) return '';
  if (params.status && params.status !== 'all') {
    if (Array.isArray(params.status)) {
      params.status.forEach(s => q.append('status', s));
    } else {
      q.set('status', params.status);
    }
  }
  if (params.eventType) {
    if (Array.isArray(params.eventType)) {
      params.eventType.forEach(e => q.append('eventType', e));
    } else {
      q.set('eventType', params.eventType);
    }
  }
  if (params.fromDate) q.set('fromDate', params.fromDate);
  if (params.toDate) q.set('toDate', params.toDate);
  if (params.httpStatus !== undefined)
    q.set('httpStatus', String(params.httpStatus));
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

export const webhooksService = {
  list(params?: WebhookEndpointFilters): Promise<WebhookEndpointListResponse> {
    return apiClient.get<WebhookEndpointListResponse>(
      `${BASE}${buildEndpointQuery(params)}`
    );
  },

  get(id: string): Promise<{ endpoint: WebhookEndpointDTO }> {
    return apiClient.get<{ endpoint: WebhookEndpointDTO }>(`${BASE}/${id}`);
  },

  create(body: CreateWebhookRequest): Promise<CreateWebhookResponse> {
    return apiClient.post<CreateWebhookResponse>(BASE, body);
  },

  update(
    id: string,
    body: UpdateWebhookRequest
  ): Promise<{ endpoint: WebhookEndpointDTO }> {
    return apiClient.patch<{ endpoint: WebhookEndpointDTO }>(
      `${BASE}/${id}`,
      body
    );
  },

  delete(id: string, actionPin: string): Promise<{ ok: true }> {
    return apiClient.delete<{ ok: true }>(`${BASE}/${id}`, {
      headers: { 'X-Action-Pin': actionPin },
    });
  },

  regenerateSecret(
    id: string,
    actionPin: string
  ): Promise<RegenerateWebhookSecretResponse> {
    return apiClient.post<RegenerateWebhookSecretResponse>(
      `${BASE}/${id}/regenerate-secret`,
      {},
      { headers: { 'X-Action-Pin': actionPin } }
    );
  },

  reactivate(
    id: string,
    actionPin: string
  ): Promise<{ endpoint: WebhookEndpointDTO }> {
    return apiClient.post<{ endpoint: WebhookEndpointDTO }>(
      `${BASE}/${id}/reactivate`,
      {},
      { headers: { 'X-Action-Pin': actionPin } }
    );
  },

  listDeliveries(
    id: string,
    params?: WebhookDeliveryFilters
  ): Promise<WebhookDeliveryListResponse> {
    return apiClient.get<WebhookDeliveryListResponse>(
      `${BASE}/${id}/deliveries${buildDeliveryQuery(params)}`
    );
  },

  reprocessDelivery(
    webhookId: string,
    deliveryId: string
  ): Promise<{ delivery: WebhookDeliveryDTO }> {
    return apiClient.post<{ delivery: WebhookDeliveryDTO }>(
      `${BASE}/${webhookId}/deliveries/${deliveryId}/reprocess`,
      {}
    );
  },

  reprocessDeliveriesBulk(
    webhookId: string,
    deliveryIds: string[]
  ): Promise<ReprocessBulkResponse> {
    return apiClient.post<ReprocessBulkResponse>(
      `${BASE}/${webhookId}/deliveries/reprocess-bulk`,
      { deliveryIds }
    );
  },

  ping(id: string): Promise<PingWebhookResponse> {
    return apiClient.post<PingWebhookResponse>(`${BASE}/${id}/ping`, {});
  },
};
