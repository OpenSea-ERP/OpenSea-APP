/**
 * Permission code constants — Phase 11 Webhooks (4-level RBAC).
 *
 * 4-níveis: `{module}.{group}.{resource}.{action}` — ADR-031.
 * Espelha o backend `PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.*`.
 *
 * Admin-only (D-10): apenas grupos admin recebem estes códigos via backfill.
 */

export const SYSTEM_WEBHOOKS_PERMISSIONS = {
  ACCESS: 'system.webhooks.endpoints.access',
  REGISTER: 'system.webhooks.endpoints.register',
  MODIFY: 'system.webhooks.endpoints.modify',
  REMOVE: 'system.webhooks.endpoints.remove',
  ADMIN: 'system.webhooks.endpoints.admin',
} as const;

export type SystemWebhooksPermission =
  (typeof SYSTEM_WEBHOOKS_PERMISSIONS)[keyof typeof SYSTEM_WEBHOOKS_PERMISSIONS];
