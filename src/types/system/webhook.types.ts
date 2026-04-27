/**
 * Webhook outbound types — Phase 11
 * Mirrors backend DTOs from src/mappers/system/webhook-{endpoint,delivery}/*-to-dto.ts
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
  lastErrorMessageSanitized: string | null;
  lastDurationMs: number | null;
  /** truncated to ~1KB by backend */
  lastResponseBody: string | null;
  lastRetryAfterSeconds: number | null;
  /** Format: 'v1=a3b1c...' — masked after first 8 hex chars */
  signatureMasked: string | null;
  attempts: AttemptLog[];
  createdAt: string;
}

export interface CreateWebhookRequest {
  url: string;
  description?: string;
  apiVersion: string;
  subscribedEvents: string[];
}

export interface UpdateWebhookRequest {
  description?: string | null;
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

export interface WebhookEndpointFilters {
  status?: WebhookEndpointStatus | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface WebhookDeliveryFilters {
  status?: WebhookDeliveryStatus | WebhookDeliveryStatus[] | 'all';
  eventType?: string | string[];
  /** ISO 8601 date or `YYYY-MM-DD` */
  fromDate?: string;
  /** ISO 8601 date or `YYYY-MM-DD` */
  toDate?: string;
  httpStatus?: number;
  page?: number;
  limit?: number;
}

export interface WebhookEndpointListMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  count?: {
    active: number;
    paused: number;
    autoDisabled: number;
    total: number;
  };
}

export interface WebhookEndpointListResponse {
  data: WebhookEndpointDTO[];
  meta: WebhookEndpointListMeta;
}

export interface WebhookDeliveryListMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface WebhookDeliveryListResponse {
  data: WebhookDeliveryDTO[];
  meta: WebhookDeliveryListMeta;
}

export interface ReprocessBulkResponse {
  enqueued: number;
  skippedCooldown: number;
  skippedCap: number;
  skippedNotFound: number;
  errors: Array<{ deliveryId: string; reason: string }>;
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
