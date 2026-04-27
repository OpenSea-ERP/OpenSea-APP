/**
 * Webhook outbound types — Phase 11
 * Mirrors backend DTOs from src/mappers/system/webhook-{endpoint,delivery}/*-to-dto.ts
 *
 * Canonical source: OpenSea-API/src/http/schemas/system/webhooks/webhook-schemas.ts
 * - listWebhooksResponseSchema  → { items, total, count }
 * - listDeliveriesResponseSchema → { items, total, count }
 * - reprocessBulkResponseSchema → skipped* are string[] (delivery IDs), errors[].message
 * - listWebhooksQuerySchema / listDeliveriesQuerySchema → use offset/limit (NOT page)
 */

export type WebhookEndpointStatus = 'ACTIVE' | 'PAUSED' | 'AUTO_DISABLED';

export type WebhookEndpointAutoDisabledReason =
  | 'CONSECUTIVE_DEAD'
  | 'HTTP_410_GONE';

export type WebhookDeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED' | 'DEAD';

export type WebhookDeliveryErrorClass =
  | 'TIMEOUT'
  | 'NETWORK'
  | 'TLS'
  | 'HTTP_4XX'
  | 'HTTP_5XX'
  | 'REDIRECT_BLOCKED'
  | 'SSRF_BLOCKED'
  | 'DNS_FAIL';

export interface AttemptLog {
  attemptNumber: number;
  attemptedAt: string;
  httpStatus: number | null;
  errorClass: WebhookDeliveryErrorClass | null;
  errorMessage: string | null;
  durationMs: number | null;
  retryAfterSeconds: number | null;
}

export interface WebhookEndpointDTO {
  id: string;
  tenantId: string;
  url: string;
  description: string | null;
  apiVersion: string;
  subscribedEvents: string[];
  status: WebhookEndpointStatus;
  autoDisabledReason: WebhookEndpointAutoDisabledReason | null;
  autoDisabledAt: string | null;
  consecutiveDeadCount: number;
  /** Format: 'whsec_••••••••<last4>' — never cleartext after creation */
  secretMasked: string;
  secretCurrentCreatedAt: string;
  /** When secret rotation is active, this is the cut-off date for the previous secret */
  secretRotationActiveUntil: string | null;
  lastSuccessAt: string | null;
  lastDeliveryAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryDTO {
  id: string;
  tenantId: string;
  endpointId: string;
  eventId: string;
  eventType: string;
  status: WebhookDeliveryStatus;
  attemptCount: number;
  manualReprocessCount: number;
  lastManualReprocessAt: string | null;
  lastAttemptAt: string | null;
  lastHttpStatus: number | null;
  lastErrorClass: WebhookDeliveryErrorClass | null;
  lastErrorMessage: string | null;
  lastDurationMs: number | null;
  /** truncated to ~1KB by backend */
  responseBodyTruncated: string | null;
  lastRetryAfterSeconds: number | null;
  payloadHash: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateWebhookRequest {
  url: string;
  description?: string;
  apiVersion: string;
  subscribedEvents: string[];
}

export interface UpdateWebhookRequest {
  description?: string | null;
  /**
   * @deprecated Backend `updateWebhookBodySchema` does NOT accept `apiVersion`
   * (D-23 — versionamento imutável após criação). Field kept here for hypothetical
   * caller compatibility; UI must NOT send it. To change version, recreate webhook.
   */
  apiVersion?: string;
  subscribedEvents?: string[];
  status?: 'ACTIVE' | 'PAUSED';
}

export interface CreateWebhookResponse {
  endpoint: WebhookEndpointDTO;
  /** Cleartext secret — exposed UMA vez no body do POST. Never stored in localStorage. */
  secret: string;
}

export interface RegenerateWebhookSecretResponse {
  endpoint: WebhookEndpointDTO;
  /** Cleartext NEW secret — exposed UMA vez. Old secret remains valid for 7 days. */
  secret: string;
}

// Backend uses offset/limit, not page/limit. Frontend service computes offset from React Query pageParam.
export interface WebhookEndpointFilters {
  status?: WebhookEndpointStatus | 'all';
  search?: string;
  offset?: number;
  limit?: number;
}

// Backend uses offset/limit, not page/limit. Frontend service computes offset from React Query pageParam.
export interface WebhookDeliveryFilters {
  status?: WebhookDeliveryStatus | WebhookDeliveryStatus[] | 'all';
  eventType?: string | string[];
  /** ISO 8601 date or `YYYY-MM-DD` */
  fromDate?: string;
  /** ISO 8601 date or `YYYY-MM-DD` */
  toDate?: string;
  httpStatus?: number;
  offset?: number;
  limit?: number;
}

export interface WebhookEndpointListResponse {
  items: WebhookEndpointDTO[];
  total: number;
  count: {
    active: number;
    paused: number;
    autoDisabled: number;
    total: number;
  };
}

export interface WebhookDeliveryListResponse {
  items: WebhookDeliveryDTO[];
  total: number;
  count: {
    pending: number;
    delivered: number;
    failed: number;
    dead: number;
    total: number;
  };
}

export interface ReprocessBulkResponse {
  enqueued: number;
  skippedCooldown: string[];
  skippedCap: string[];
  skippedNotFound: string[];
  errors: Array<{ deliveryId: string; message: string }>;
}

export interface PingWebhookResponse {
  /** ID of the synthetic delivery that was enqueued */
  deliveryId: string;
}

/**
 * Available outbound events — V1 (Phase 11) exposes only `punch.*`.
 * Mirrors backend WEBHOOK_EVENT_ALLOWLIST.
 */
export const WEBHOOK_EVENT_TYPES = [
  'punch.time-entry.created',
  'punch.approval.requested',
  'punch.approval.resolved',
  'punch.device.paired',
  'punch.device.revoked',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export interface WebhookEventCatalogEntry {
  type: WebhookEventType;
  label: string;
  description: string;
}

/** Catalog with formal pt-BR copy for the multiselect chip selector (UI-SPEC §Passo 2) */
export const WEBHOOK_EVENT_CATALOG: WebhookEventCatalogEntry[] = [
  {
    type: 'punch.time-entry.created',
    label: 'Batida criada',
    description: 'Disparado quando uma nova batida de ponto é registrada.',
  },
  {
    type: 'punch.approval.requested',
    label: 'Aprovação solicitada',
    description:
      'Disparado quando uma batida fora de geofence ou exceção exige revisão do gestor.',
  },
  {
    type: 'punch.approval.resolved',
    label: 'Aprovação resolvida',
    description: 'Disparado quando o gestor aprova ou rejeita uma exceção.',
  },
  {
    type: 'punch.device.paired',
    label: 'Dispositivo pareado',
    description: 'Disparado quando um novo PunchDevice é pareado.',
  },
  {
    type: 'punch.device.revoked',
    label: 'Dispositivo revogado',
    description: 'Disparado quando o token de um PunchDevice é revogado.',
  },
];

export const WEBHOOK_API_VERSIONS = ['2026-04-27'] as const;
export type WebhookApiVersion = (typeof WEBHOOK_API_VERSIONS)[number];

export const WEBHOOK_TENANT_LIMIT = 50;
