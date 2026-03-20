# Email Professional Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the OpenSea email system into professional-grade with optimistic UI, notification deduplication, health indicators, and IMAP IDLE real-time sync.

**Architecture:** Four independent phases executed sequentially. Phase 1 (Optimistic UI) is frontend-only. Phase 2 (Notification Dedup) adds Redis suppressors in backend. Phase 3 (Health Indicators) adds a new endpoint + frontend UI. Phase 4 (IMAP IDLE) adds a persistent connection manager in the worker process.

**Tech Stack:** React Query (optimistic mutations), BullMQ, Redis (suppressors), ImapFlow (IDLE), Nodemailer (SMTP verify), Fastify

**Spec:** `docs/superpowers/specs/2026-03-17-email-professional-upgrade-design.md`

---

## Phase 1: Optimistic UI — Instant Actions

### Task 1.1: Optimistic Move Message

**Files:**

- Modify: `OpenSea-APP/src/hooks/email/use-email.ts` (useMoveMessage hook, ~line 499-515)

**Context:** Currently `useMoveMessage` does blanket `['email']` invalidation with no optimistic update. We need to follow the exact pattern from `useMarkMessageRead` (lines 358-420): cancel queries → snapshot → update cache → selective invalidation on success → restore on error.

- [ ] **Step 1: Add optimistic onMutate to useMoveMessage**

In `use-email.ts`, replace the current `useMoveMessage` hook. The new version must:

1. `onMutate`: Cancel outgoing queries, snapshot the current infinite query pages, remove the message from the list cache, update the detail cache's `folderId`, and adjust folder unread counts
2. `onError`: Restore the snapshot by invalidating `['email']`
3. `onSuccess`: Invalidate only `['email', 'folders']` and `['email', 'accounts']` (NOT messages)
4. `onSettled`: Clear selection if the moved message was selected

The cache structure for infinite queries is `{ pages: [{ data: EmailMessageListItem[], meta: {...} }] }`. Use `queryClient.setQueriesData` with the `['email', 'messages']` key prefix to filter out the moved message from all pages.

- [ ] **Step 2: Verify move works — test manually**

Run the frontend dev server. Navigate to email, select a message, move it to another folder. Verify:

- Message disappears instantly from list (no loading spinner)
- Folder unread counts update
- If you switch to the target folder, the message appears after next refetch
- If you disconnect the network and try to move, the message reappears with an error toast

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP && git add src/hooks/email/use-email.ts && git commit -m "feat(email): add optimistic update for move message action"
```

### Task 1.2: Optimistic Delete Message

**Files:**

- Modify: `OpenSea-APP/src/hooks/email/use-email.ts` (useDeleteMessage hook)

**Context:** Same pattern as Task 1.1. `useDeleteMessage` currently does blanket invalidation. The optimistic behavior is identical: remove message from list cache immediately.

- [ ] **Step 1: Add optimistic onMutate to useDeleteMessage**

Replace the current `useDeleteMessage` hook with optimistic cache updates:

1. `onMutate`: Cancel queries, snapshot, remove message from all infinite query pages, decrement unread count if message was unread
2. `onError`: Restore snapshot via `['email']` invalidation + error toast
3. `onSuccess`: Invalidate only `['email', 'folders']` and `['email', 'accounts']`

- [ ] **Step 2: Verify delete works — test manually**

Test both paths:

- Delete from non-trash folder → message should vanish instantly (moved to trash on server)
- Delete from trash folder → message should vanish instantly (permanently deleted on server)
- Network failure → message reappears with error toast

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP && git add src/hooks/email/use-email.ts && git commit -m "feat(email): add optimistic update for delete message action"
```

### Task 1.3: Optimistic Bulk Move and Bulk Delete

**Files:**

- Modify: `OpenSea-APP/src/hooks/email/use-email.ts` (useBulkMove, useBulkDelete hooks)

**Context:** Currently `useBulkMove` and `useBulkDelete` (lines 604-644) have NO optimistic updates. They use `runBulkQueue` for concurrency but don't update the cache. Add optimistic removal of all selected messages from the list before the bulk queue starts.

- [ ] **Step 1: Add optimistic onMutate to useBulkMove**

1. `onMutate`: Cancel queries, snapshot, remove ALL messages by ID from infinite query pages
2. `onError`: Restore snapshot
3. `onSuccess`: Conditional invalidation — if `result.failed.length > 0`, invalidate `['email']` (some failed, need full refresh); if all succeeded, invalidate only folders/accounts

- [ ] **Step 2: Add optimistic onMutate to useBulkDelete**

Same pattern as bulk move.

- [ ] **Step 3: Verify bulk operations — test manually**

Select 3+ messages, use bulk archive or bulk delete. All should vanish instantly. If some fail, they should reappear.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/hooks/email/use-email.ts && git commit -m "feat(email): add optimistic updates for bulk move and bulk delete"
```

### Task 1.4: Optimistic Send Email (Gmail-style)

**Files:**

- Modify: `OpenSea-APP/src/hooks/email/use-email.ts` (useSendMessage hook)
- Modify: `OpenSea-APP/src/components/email/email-compose-dialog.tsx` (close dialog immediately)

**Context:** Currently `useSendMessage` (lines 517-531) does blanket invalidation with no optimism. The compose dialog stays open until the mutation completes. We need to:

1. Close the dialog immediately when user clicks Send
2. Show a "Enviando..." toast
3. Preserve the email body in a ref so we can retry if SMTP fails
4. On failure, show error toast with "Retentar" action that reopens compose

- [ ] **Step 1: Create send retry state in useEmailPage**

In `use-email-page.ts`, add a `useRef` to store the last sent email data for retry purposes:

```typescript
const pendingSendRef = useRef<SendEmailMessageRequest | null>(null);
```

Add a callback `onRetrySend` that reopens the compose dialog with the preserved data.

- [ ] **Step 2: Update useSendMessage for fire-and-forget pattern**

In `use-email.ts`, update `useSendMessage`:

- Remove: waiting for mutation to complete before closing dialog
- `onMutate`: Store request data in pendingSendRef, show `toast.loading('Enviando email...')` with an ID
- `onSuccess`: Dismiss loading toast, show `toast.success('Email enviado')`, clear pendingSendRef, invalidate `['email', 'folders']`
- `onError`: Dismiss loading toast, show `toast.error('Falha ao enviar email', { action: { label: 'Retentar', onClick: onRetrySend } })`, keep pendingSendRef intact

- [ ] **Step 3: Update EmailComposeDialog to close immediately on send**

In `email-compose-dialog.tsx`, change the send handler:

- Call `mutation.mutate(data)` (fire-and-forget, NOT `mutateAsync`)
- Call `onClose()` immediately after mutate (don't wait for result)
- The dialog closes, the toast appears, user continues working

- [ ] **Step 4: Verify send flow — test manually**

1. Compose and send an email → dialog closes instantly, "Enviando..." toast appears
2. Wait for success → "Email enviado" toast replaces it
3. To test failure: temporarily break SMTP config → send → error toast with "Retentar" button → click retry → compose reopens with content

- [ ] **Step 5: Commit**

```bash
cd OpenSea-APP && git add src/hooks/email/use-email.ts src/hooks/email/use-email-page.ts src/components/email/email-compose-dialog.tsx && git commit -m "feat(email): gmail-style fire-and-forget email send with retry"
```

### Task 1.5: Optimistic Save Draft

**Files:**

- Modify: `OpenSea-APP/src/hooks/email/use-email.ts` (useSaveDraft hook)

**Context:** Currently `useSaveDraft` does blanket invalidation. Change to show immediate success toast and only invalidate folders.

- [ ] **Step 1: Update useSaveDraft**

- `onMutate`: Show `toast.success('Rascunho salvo')`
- `onSuccess`: Invalidate `['email', 'folders']` only
- `onError`: Show `toast.error('Falha ao salvar rascunho')`

- [ ] **Step 2: Commit**

```bash
cd OpenSea-APP && git add src/hooks/email/use-email.ts && git commit -m "feat(email): optimistic feedback for draft save"
```

---

## Phase 2: Notification Deduplication

### Task 2.1: Add Redis Suppressor Utility

**Files:**

- Create: `OpenSea-API/src/services/email/notification-suppressor.service.ts`

**Context:** We need a simple Redis-based suppressor service. Keys have TTL of 10 minutes and follow the pattern `email:suppress:{accountId}:{folder}:{identifier}`.

- [ ] **Step 1: Create NotificationSuppressorService**

```typescript
import { Redis } from 'ioredis';

const SUPPRESSOR_TTL_SECONDS = 600; // 10 minutes
const PREFIX = 'email:suppress';

export class NotificationSuppressorService {
  constructor(private redis: Redis) {}

  async suppress(
    accountId: string,
    folder: string,
    identifier: string
  ): Promise<void> {
    const key = `${PREFIX}:${accountId}:${folder}:${identifier}`;
    await this.redis.set(key, '1', 'EX', SUPPRESSOR_TTL_SECONDS);
  }

  async isSuppressed(
    accountId: string,
    folder: string,
    identifier: string
  ): Promise<boolean> {
    const key = `${PREFIX}:${accountId}:${folder}:${identifier}`;
    const result = await this.redis.get(key);
    if (result) {
      await this.redis.del(key); // consume the suppressor
      return true;
    }
    return false;
  }
}
```

- [ ] **Step 2: Create singleton getter**

Add a factory function `getNotificationSuppressor()` that returns a singleton instance using the existing Redis connection from the queue config (`src/lib/queue.ts`).

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add src/services/email/notification-suppressor.service.ts && git commit -m "feat(email): add Redis notification suppressor service"
```

### Task 2.2: Register Suppressors on User Actions

**Files:**

- Modify: `OpenSea-API/src/use-cases/email/messages/send-email-message.ts`
- Modify: `OpenSea-API/src/use-cases/email/messages/move-email-message.ts`
- Modify: `OpenSea-API/src/use-cases/email/messages/delete-email-message.ts`

**Context:** Each use case that creates or moves messages on the IMAP server should register a suppressor. The suppressor prevents the sync notification service from generating false "new email" notifications.

- [ ] **Step 1: Add suppressor to SendEmailMessageUseCase**

After the SMTP send succeeds, register a suppressor for the Sent folder:

```typescript
// After smtpClientService.send() succeeds:
const suppressor = getNotificationSuppressor();
await suppressor
  .suppress(account.id.toString(), 'SENT', messageIdHeader)
  .catch(() => {}); // fire-and-forget
```

- [ ] **Step 2: Add suppressor to MoveEmailMessageUseCase**

After `client.messageMove()` succeeds, register a suppressor for the target folder:

```typescript
const suppressor = getNotificationSuppressor();
await suppressor
  .suppress(
    account.id.toString(),
    targetFolder.id.toString(),
    message.remoteUid.toString()
  )
  .catch(() => {});
```

- [ ] **Step 3: Add suppressor to DeleteEmailMessageUseCase**

In `moveMessageToTrash()`, after moving to trash:

```typescript
const suppressor = getNotificationSuppressor();
await suppressor
  .suppress(
    account.id.toString(),
    trashFolder.id.toString(),
    message.remoteUid.toString()
  )
  .catch(() => {});
```

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/use-cases/email/messages/send-email-message.ts src/use-cases/email/messages/move-email-message.ts src/use-cases/email/messages/delete-email-message.ts && git commit -m "feat(email): register notification suppressors on user actions"
```

### Task 2.3: Check Suppressors During Sync & Restrict to INBOX

**Files:**

- Modify: `OpenSea-API/src/use-cases/email/sync/sync-email-account.ts`
- Modify: `OpenSea-API/src/use-cases/email/sync/email-sync-notification.service.ts`

**Context:** The sync account use case calls `notifyNewMessages()` after syncing. We need two changes:

1. Only trigger notifications for messages synced into INBOX folders (not Sent, Drafts, Trash, Spam)
2. Before creating notifications, check Redis suppressors for each new message

- [ ] **Step 1: Filter notifications to INBOX only in sync-email-account.ts**

In `sync-email-account.ts`, modify the notification trigger. Currently it passes `syncedMessages` count. Change it to only count messages synced into INBOX-type folders. Track which folder each message was synced to, and only pass INBOX messages to the notifier.

```typescript
// After syncing all folders, collect only INBOX messages:
const inboxMessages = folderResults
  .filter(r => r.folderType === 'INBOX')
  .flatMap(r => r.createdMessages);

if (inboxMessages.length > 0 && this.notificationService) {
  await this.notificationService.notifyNewMessages({
    tenantId: request.tenantId,
    accountId: account.id.toString(),
    accountAddress: account.address,
    ownerUserId: account.ownerUserId,
    syncedMessages: inboxMessages.length,
    messages: inboxMessages,
  });
}
```

- [ ] **Step 2: Add suppressor check in notification service**

In `email-sync-notification.service.ts`, before creating notifications for each message, check if a suppressor exists:

```typescript
const suppressor = getNotificationSuppressor();

// Filter out suppressed messages
const genuineMessages = [];
for (const msg of messages) {
  const isSuppressed = await suppressor.isSuppressed(
    accountId,
    'INBOX',
    msg.remoteUid.toString()
  );
  if (!isSuppressed) {
    genuineMessages.push(msg);
  }
}

// Use genuineMessages instead of messages for notification creation
```

- [ ] **Step 3: Verify — test manually**

1. Send an email → no "new email" notification should appear for the sent message
2. Move an email to another folder → no false notification
3. Receive a genuine email from external sender → notification appears correctly

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/use-cases/email/sync/sync-email-account.ts src/use-cases/email/sync/email-sync-notification.service.ts && git commit -m "feat(email): deduplicate notifications — only genuine inbox emails trigger alerts"
```

---

## Phase 3: Health Indicators

### Task 3.1: Backend Health Check Endpoint

**Files:**

- Create: `OpenSea-API/src/use-cases/email/accounts/check-email-account-health.ts`
- Create: `OpenSea-API/src/http/controllers/email/accounts/v1-check-email-account-health.controller.ts`
- Create: `OpenSea-API/src/http/schemas/email/accounts/check-email-account-health.schema.ts`
- Modify: `OpenSea-API/src/http/controllers/email/accounts/routes.ts`

**Context:** New endpoint `GET /v1/email/accounts/:id/health` that tests IMAP, SMTP, and worker status in parallel. Returns a structured health report.

- [ ] **Step 1: Create the response schema**

In `check-email-account-health.schema.ts`:

```typescript
export const checkEmailAccountHealthResponseSchema = {
  type: 'object',
  properties: {
    imap: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['connected', 'error'] },
        latencyMs: { type: 'number', nullable: true },
        error: { type: 'string', nullable: true },
      },
    },
    smtp: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['connected', 'error'] },
        latencyMs: { type: 'number', nullable: true },
        error: { type: 'string', nullable: true },
      },
    },
    worker: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'stale', 'error'] },
        lastSyncAt: { type: 'string', nullable: true },
        lastJobState: { type: 'string', nullable: true },
        error: { type: 'string', nullable: true },
      },
    },
  },
};
```

- [ ] **Step 2: Create the use case**

In `check-email-account-health.ts`:

- Accept `{ tenantId, userId, accountId }`
- Verify ownership/access (same pattern as test-email-connection.ts)
- Decrypt credentials
- Run IMAP test, SMTP test, and worker status check **in parallel** via `Promise.allSettled`
- IMAP test: `createImapClient()` → `connect()` → `list()` → `logout()`, measure latency
- SMTP test: `nodemailer.createTransport()` → `verify()`, measure latency
- Worker status: Query BullMQ for job `email-sync-${accountId}` — get state and timestamp
- Return structured health report (never throws — always returns status for all 3)

- [ ] **Step 3: Create the controller**

Standard Fastify controller pattern. GET endpoint, params `{ id }`, returns 200 with health report.

- [ ] **Step 4: Register the route**

In `routes.ts`, add:

```typescript
app.get(
  '/v1/email/accounts/:id/health',
  {
    onRequest: [
      verifyJwt,
      verifyTenant,
      createModuleMiddleware('EMAIL'),
      verifyPermission('email.accounts.read'),
    ],
    schema: {
      params: idParamsSchema,
      response: { 200: checkEmailAccountHealthResponseSchema },
    },
  },
  checkEmailAccountHealthController
);
```

- [ ] **Step 5: Verify — test via curl/Swagger**

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3333/v1/email/accounts/$ACCOUNT_ID/health
```

Expected: `{ imap: { status: 'connected', latencyMs: 120 }, smtp: { status: 'connected', latencyMs: 85 }, worker: { status: 'active', lastSyncAt: '...' } }`

- [ ] **Step 6: Commit**

```bash
cd OpenSea-API && git add src/use-cases/email/accounts/check-email-account-health.ts src/http/controllers/email/accounts/v1-check-email-account-health.controller.ts src/http/schemas/email/accounts/check-email-account-health.schema.ts src/http/controllers/email/accounts/routes.ts && git commit -m "feat(email): add account health check endpoint (IMAP/SMTP/Worker)"
```

### Task 3.2: Frontend Health Hook and Types

**Files:**

- Modify: `OpenSea-APP/src/types/email/email-account.types.ts`
- Modify: `OpenSea-APP/src/services/email/email.service.ts`
- Modify: `OpenSea-APP/src/hooks/email/use-email.ts`
- Modify: `OpenSea-APP/src/config/api.ts`

**Context:** Add the type, service method, and React Query hook for the health endpoint.

- [ ] **Step 1: Add health types**

In `email-account.types.ts`, add:

```typescript
export interface EmailServiceHealth {
  status: 'connected' | 'error';
  latencyMs: number | null;
  error: string | null;
}

export interface EmailWorkerHealth {
  status: 'active' | 'stale' | 'error';
  lastSyncAt: string | null;
  lastJobState: string | null;
  error: string | null;
}

export interface EmailAccountHealth {
  imap: EmailServiceHealth;
  smtp: EmailServiceHealth;
  worker: EmailWorkerHealth;
}
```

- [ ] **Step 2: Add API config and service method**

In `api.ts`, add `HEALTH: '/v1/email/accounts/:id/health'` to the EMAIL.ACCOUNTS section.

In `email.service.ts`, add:

```typescript
checkHealth(accountId: string): Promise<EmailAccountHealth> {
  return apiClient.get(API.EMAIL.ACCOUNTS.HEALTH.replace(':id', accountId));
}
```

- [ ] **Step 3: Add React Query hook**

In `use-email.ts`, add:

```typescript
export function useEmailAccountHealth(accountId: string | null) {
  return useQuery({
    queryKey: ['email', 'health', accountId],
    queryFn: () => emailService.checkHealth(accountId!),
    enabled: !!accountId,
    staleTime: 60_000, // 1 minute
    refetchInterval: 5 * 60_000, // 5 minutes for sidebar polling
    retry: 1,
  });
}
```

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/types/email/email-account.types.ts src/services/email/email.service.ts src/hooks/email/use-email.ts src/config/api.ts && git commit -m "feat(email): add health check types, service, and hook"
```

### Task 3.3: Connection Tab — Health Cards UI

**Files:**

- Modify: `OpenSea-APP/src/components/email/email-account-edit-dialog.tsx` (Connection tab section)

**Context:** The Connection tab in the account edit dialog currently shows IMAP/SMTP host/port fields and a single "Testar Conexão" button. We need to add three health status cards above the connection fields.

- [ ] **Step 1: Create health card subcomponent**

Inside the email-account-edit-dialog file (or as a new file `email-health-cards.tsx` in the same directory), create a `HealthCards` component that:

- Accepts `accountId: string` prop
- Uses `useEmailAccountHealth(accountId)` hook
- Renders 3 horizontal cards in a grid (responsive: 1 col mobile, 3 col desktop)

Each card shows:

- **Icon**: Server icon for IMAP, Send icon for SMTP, RefreshCw icon for Worker (from lucide-react)
- **Title**: "IMAP", "SMTP", "Worker Sync"
- **Status badge**:
  - Connected/Active: emerald-500 dot + "Conectado"/"Ativo" text in emerald
  - Error: rose-500 dot + "Falha" text in rose
  - Checking: amber-500 pulsing dot + "Verificando..." text in amber
- **Detail line**:
  - IMAP/SMTP: latency in ms (e.g., "120ms") or error message
  - Worker: "Último sync há X min" or "Sem sync recente" or error
- **Individual "Testar" button** (outline, sm size) that triggers a targeted refetch

Add a "Testar Todos" button above the cards that calls `refetch()` on the health query.

**Visual styling** (following project patterns):

- Cards use `border rounded-lg p-4` with subtle bg (`bg-muted/30`)
- Status dot: `h-2 w-2 rounded-full` with the appropriate color
- Pulse animation for checking state: `animate-pulse`
- Dark mode: follow the dual-theme toggle chip pattern (`-500/8` bg + `-300` text)

- [ ] **Step 2: Integrate HealthCards into Connection tab**

In the account edit dialog, add `<HealthCards accountId={account.id} />` at the top of the Connection tab, before the existing IMAP/SMTP fields.

- [ ] **Step 3: Verify — test visually**

Open an email account's settings → Connection tab. Verify:

- Three cards appear with current status
- "Testar Todos" triggers loading state on all 3
- Connected accounts show green status with latency
- If you break IMAP config → card shows red with error message

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/components/email/ && git commit -m "feat(email): add health status cards to account connection tab"
```

### Task 3.4: Sidebar — Conditional Health Alert

**Files:**

- Modify: `OpenSea-APP/src/components/email/email-sidebar.tsx`

**Context:** The sidebar shows email accounts with unread counts. When any service is unhealthy, we need to show an amber warning icon next to the account name. The challenge: we need health data for ALL accounts, not just one.

- [ ] **Step 1: Add multi-account health polling**

Create a hook `useEmailAccountsHealth(accountIds: string[])` that queries health for all accounts. Use `useQueries` from React Query to run parallel health checks:

```typescript
const healthQueries = useQueries({
  queries: accountIds.map(id => ({
    queryKey: ['email', 'health', id],
    queryFn: () => emailService.checkHealth(id),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
    enabled: !!id,
  })),
});
```

Return a `Map<accountId, EmailAccountHealth>` for easy lookup.

- [ ] **Step 2: Add alert icon to sidebar account items**

In the sidebar, next to each account name:

- Check if health data exists for this account
- If ANY service has error status → show `AlertTriangle` icon (amber-500, size 14)
- Wrap the icon in a `Tooltip` with descriptive text:
  - "IMAP: Falha na conexão" / "SMTP: Falha na conexão" / "Worker: Sem sync há mais de 30 min"
  - Combine multiple failures: "IMAP: Falha na conexão • Worker: Sem sync"
- If all healthy → show nothing (clean sidebar)
- Click on the alert icon → call `onEditAccount(accountId)` to open settings on Connection tab

- [ ] **Step 3: Verify — test visually**

1. All accounts healthy → no icons in sidebar (clean)
2. Break one account's IMAP password → amber alert appears next to that account
3. Hover over alert → tooltip shows "IMAP: Falha na conexão"
4. Click alert → opens account edit dialog on Connection tab

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/components/email/email-sidebar.tsx src/hooks/email/use-email.ts && git commit -m "feat(email): add conditional health alerts in email sidebar"
```

---

## Phase 4: IMAP IDLE — Real-Time Sync

### Task 4.1: Create IDLE Manager Service

**Files:**

- Create: `OpenSea-API/src/services/email/imap-idle-manager.ts`

**Context:** A new service that maintains persistent IMAP IDLE connections (one per active account) to receive push notifications when new emails arrive. Uses ImapFlow's built-in IDLE support.

- [ ] **Step 1: Create the IdleManager class**

```typescript
import { ImapFlow } from 'imapflow';

interface IdleEntry {
  client: ImapFlow;
  accountId: string;
  tenantId: string;
  state: 'connecting' | 'idle' | 'syncing' | 'degraded';
  retries: number;
  heartbeatTimer: NodeJS.Timeout | null;
}

const MAX_RETRIES = 3;
const HEARTBEAT_INTERVAL_MS = 29 * 60 * 1000; // 29 minutes (RFC 2177)
const BACKOFF_SCHEDULE = [5000, 10000, 30000, 60000]; // 5s, 10s, 30s, 60s

export class ImapIdleManager {
  private entries = new Map<string, IdleEntry>();
  private stopped = false;

  async startMonitoring(account: {
    id: string;
    tenantId: string;
    imapConfig: ImapPoolConfig;
  }): Promise<void>;
  async stopMonitoring(accountId: string): Promise<void>;
  async stopAll(): Promise<void>;
  getStatus(
    accountId: string
  ): 'idle' | 'syncing' | 'degraded' | 'disconnected';
}
```

Key implementation details:

- `startMonitoring()`: Creates ImapFlow client, connects, opens INBOX, enters IDLE
- Listen to `exists` event → triggers incremental sync via `queueEmailSync()`
- `heartbeat()`: Every 29 min, exits and re-enters IDLE (ImapFlow natively handles IDLE refresh, but we add explicit heartbeat as safety net)
- On connection drop: auto-reconnect with backoff schedule
- After `MAX_RETRIES` failures: mark as `degraded`, stop trying (scheduler fallback handles it)
- `stopAll()`: Gracefully logout all connections (called during worker shutdown)

- [ ] **Step 2: Add singleton getter**

```typescript
let instance: ImapIdleManager | null = null;

export function getImapIdleManager(): ImapIdleManager {
  if (!instance) {
    instance = new ImapIdleManager();
  }
  return instance;
}
```

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add src/services/email/imap-idle-manager.ts && git commit -m "feat(email): create IMAP IDLE manager for real-time inbox monitoring"
```

### Task 4.2: Integrate IDLE Manager into Worker Lifecycle

**Files:**

- Modify: `OpenSea-API/src/workers/index.ts`
- Modify: `OpenSea-API/src/workers/email-sync-scheduler.ts`

**Context:** The worker process needs to start IDLE monitoring for all active accounts on boot, and gracefully stop on shutdown. The scheduler interval changes from 5 to 15 minutes (deep sync fallback).

- [ ] **Step 1: Start IDLE manager in worker index**

In `startAllWorkers()`, after starting workers and scheduler:

```typescript
// Start IDLE monitoring for all active accounts
const idleManager = getImapIdleManager();
const tenantIds = await getDistinctActiveTenantIds(); // reuse from scheduler
for (const tenantId of tenantIds) {
  const accounts = await emailAccountsRepository.listActive(tenantId);
  for (const account of accounts) {
    const secret = await credentialCipher.decrypt(account.encryptedSecret);
    await idleManager
      .startMonitoring({
        id: account.id.toString(),
        tenantId,
        imapConfig: {
          host: account.imapHost,
          port: account.imapPort,
          secure: account.imapSecure,
          auth: { user: account.username, pass: secret },
          tls: { rejectUnauthorized: account.tlsVerify },
        },
      })
      .catch(err =>
        logger.error(`Failed to start IDLE for account ${account.id}:`, err)
      );
  }
}
```

In `gracefulShutdown()`, add:

```typescript
const idleManager = getImapIdleManager();
await idleManager.stopAll();
```

- [ ] **Step 2: Change scheduler interval from 5min to 15min**

In `email-sync-scheduler.ts`, change:

```typescript
const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes (deep sync, IDLE handles INBOX in real-time)
```

- [ ] **Step 3: Verify — check worker logs**

Start the worker process. Check logs for:

- "IDLE started for account [id]" messages on boot
- When sending a test email to a monitored account → sync triggers within 1-3 seconds (vs 5 min before)
- Scheduler still runs every 15 min for deep sync of all folders

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/workers/index.ts src/workers/email-sync-scheduler.ts && git commit -m "feat(email): integrate IDLE manager into worker lifecycle, adjust scheduler to 15min"
```

### Task 4.3: IDLE Manager — Account Lifecycle Events

**Files:**

- Modify: `OpenSea-API/src/use-cases/email/accounts/create-email-account.ts`
- Modify: `OpenSea-API/src/use-cases/email/accounts/update-email-account.ts`
- Modify: `OpenSea-API/src/use-cases/email/accounts/delete-email-account.ts`

**Context:** When accounts are created, updated (credentials changed), or deleted, the IDLE manager needs to be notified to start/restart/stop monitoring.

- [ ] **Step 1: Start IDLE on account creation**

In `create-email-account.ts`, after successful creation:

```typescript
// Fire-and-forget: start IDLE monitoring for new account
getImapIdleManager()
  .startMonitoring({
    id: account.id.toString(),
    tenantId: request.tenantId,
    imapConfig: {
      /* ... */
    },
  })
  .catch(() => {}); // non-critical, scheduler will pick it up
```

- [ ] **Step 2: Restart IDLE on credential update**

In `update-email-account.ts`, when connection fields change (host, port, credentials):

```typescript
// Restart IDLE with new credentials
const idleManager = getImapIdleManager();
await idleManager.stopMonitoring(accountId).catch(() => {});
await idleManager
  .startMonitoring({
    /* new config */
  })
  .catch(() => {});
```

- [ ] **Step 3: Stop IDLE on account deletion**

In `delete-email-account.ts`, before deletion:

```typescript
await getImapIdleManager()
  .stopMonitoring(accountId)
  .catch(() => {});
```

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/use-cases/email/accounts/create-email-account.ts src/use-cases/email/accounts/update-email-account.ts src/use-cases/email/accounts/delete-email-account.ts && git commit -m "feat(email): sync IDLE manager with account lifecycle events"
```

### Task 4.4: Expose IDLE Status in Health Check

**Files:**

- Modify: `OpenSea-API/src/use-cases/email/accounts/check-email-account-health.ts`

**Context:** The health endpoint (Task 3.1) should include IDLE status in the worker health section. This gives the user visibility into whether real-time sync is active.

- [ ] **Step 1: Add IDLE status to worker health**

In the health check use case, enhance the worker section:

```typescript
const idleManager = getImapIdleManager();
const idleStatus = idleManager.getStatus(accountId);

// Worker health now includes:
worker: {
  status: /* existing logic */,
  lastSyncAt: /* existing */,
  lastJobState: /* existing */,
  idleStatus: idleStatus, // 'idle' | 'syncing' | 'degraded' | 'disconnected'
  error: /* existing */,
}
```

- [ ] **Step 2: Update frontend types and health card**

In `email-account.types.ts`, add `idleStatus` to `EmailWorkerHealth`.
In the Worker health card (Task 3.3), show IDLE status:

- `idle` → "Tempo real ativo" (green badge)
- `syncing` → "Sincronizando..." (amber)
- `degraded` → "Modo degradado (polling)" (amber warning)
- `disconnected` → "Desconectado" (rose)

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add src/use-cases/email/accounts/check-email-account-health.ts
cd ../OpenSea-APP && git add src/types/email/email-account.types.ts src/components/email/
git commit -m "feat(email): expose IDLE status in health check endpoint and UI"
```

### Task 4.5: Reduce Frontend Polling (IDLE makes it less critical)

**Files:**

- Modify: `OpenSea-APP/src/hooks/email/use-email.ts`

**Context:** With IMAP IDLE delivering near-instant sync, the frontend `refetchInterval` on messages can be relaxed slightly. The 60s auto-refetch becomes a fallback rather than the primary sync mechanism.

- [ ] **Step 1: Adjust refetchInterval**

In `useEmailMessages()`:

```typescript
refetchInterval: 30_000, // 30s (was 60s) — acts as fallback, IDLE provides real-time
```

Note: We're actually reducing to 30s (not increasing) because with IDLE, new data arrives faster, and the polling just confirms it. The 30s interval ensures the UI stays fresh even if IDLE has a momentary gap.

- [ ] **Step 2: Commit**

```bash
cd OpenSea-APP && git add src/hooks/email/use-email.ts && git commit -m "feat(email): adjust message polling interval for IDLE-first architecture"
```

---

## Final Verification Checklist

After all 4 phases are complete:

- [ ] **Optimistic UI**: Move, delete, archive, send, draft — all instant with rollback on error
- [ ] **Notifications**: Only genuine INBOX emails trigger notifications. User actions (send, move, delete) are suppressed
- [ ] **Health Indicators**: Three cards in Connection tab showing IMAP/SMTP/Worker status. Sidebar shows amber alert only when unhealthy
- [ ] **IMAP IDLE**: New emails arrive in ~1-3s. Scheduler runs every 15min as fallback. IDLE status visible in health check
- [ ] **No regressions**: Existing mark-read, toggle-flag, bulk operations still work correctly
