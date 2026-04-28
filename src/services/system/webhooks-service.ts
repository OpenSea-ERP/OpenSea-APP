/**
 * Webhooks (outbound) service — Phase 11
 * Cliente axios para os 11 endpoints REST `/v1/system/webhooks/*` (Plan 11-02).
 *
 * PIN-gated mutations (delete, regenerate-secret, reactivate) recebem
 * `actionPinToken` (JWT scope=action-pin emitido após VerifyActionPinModal)
 * e enviam via header `x-action-pin-token` (Plan 11-02 Task 4 / verifyActionPin
 * middleware @ src/http/middlewares/verify-action-pin.ts).
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
  if (typeof params.offset === 'number') q.set('offset', String(params.offset));
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
  if (params.createdAfter) q.set('createdAfter', params.createdAfter);
  if (params.createdBefore) q.set('createdBefore', params.createdBefore);
  if (params.httpStatus !== undefined)
    q.set('httpStatus', String(params.httpStatus));
  if (typeof params.offset === 'number') q.set('offset', String(params.offset));
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

  delete(id: string, actionPinToken: string): Promise<{ ok: true }> {
    return apiClient.delete<{ ok: true }>(`${BASE}/${id}`, {
      headers: { 'x-action-pin-token': actionPinToken },
    });
  },

  regenerateSecret(
    id: string,
    actionPinToken: string
  ): Promise<RegenerateWebhookSecretResponse> {
    return apiClient.post<RegenerateWebhookSecretResponse>(
      `${BASE}/${id}/regenerate-secret`,
      {},
      { headers: { 'x-action-pin-token': actionPinToken } }
    );
  },

  reactivate(
    id: string,
    actionPinToken: string
  ): Promise<{ endpoint: WebhookEndpointDTO }> {
    return apiClient.post<{ endpoint: WebhookEndpointDTO }>(
      `${BASE}/${id}/reactivate`,
      {},
      { headers: { 'x-action-pin-token': actionPinToken } }
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
