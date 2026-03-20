# Email Professional Upgrade — Design Spec

## Overview

Transform the OpenSea email system from functional to professional-grade by addressing four areas: optimistic UI, notification deduplication, health indicators, and IMAP IDLE real-time sync.

## 1. Optimistic UI — Instant Actions

### Problem

Move, delete, archive, and send actions block the UI waiting for IMAP server response (~2-5s). Users perceive the system as slow.

### Solution

Apply optimistic updates (already used for markRead/toggleFlag) to all remaining actions.

### Actions

| Action     | UI Behavior                                      | Rollback on Error                                   |
| ---------- | ------------------------------------------------ | --------------------------------------------------- |
| Move       | Email vanishes from list, folder counters update | Email reappears in original list + error toast      |
| Delete     | Email vanishes from list                         | Email reappears + error toast                       |
| Archive    | Email vanishes from list                         | Email reappears + error toast                       |
| Send       | Dialog closes, toast "Enviando..."               | Error toast + "Retentar" button with body preserved |
| Save Draft | Toast "Rascunho salvo", no loading               | Error toast                                         |

### Technical Pattern

```
onMutate:
  1. Cancel outgoing queries
  2. Snapshot current cache
  3. Remove message from list cache (for move/delete/archive)
  4. Update folder unread counts optimistically

onError:
  1. Restore snapshot
  2. Show descriptive error toast

onSuccess:
  1. Selective invalidation (only affected folders, not everything)
```

### Send Email Specifics

- Compose dialog closes immediately
- Email body preserved in temporary zustand/ref state
- If SMTP fails: toast with "Retentar" action that reopens compose with preserved content
- If succeeds: clear temporary state, show "Email enviado" toast

## 2. Notification Deduplication

### Problem

User actions (send, move, delete, save draft) create or move messages on the IMAP server. The next sync cycle detects these as "new messages" and generates false notifications.

### Solution

Two-layer approach:

**Layer 1 — Folder-based rule (catches 90%):**
Only INBOX folder generates "new email" notifications. Sent, Drafts, Trash, Spam folders never trigger notifications.

**Layer 2 — Redis suppressors (catches edge cases):**
When user performs an action that creates/moves messages:

| User Action  | Suppressor Registered                                 |
| ------------ | ----------------------------------------------------- |
| Send email   | `suppress:{accountId}:sent:{messageId}` TTL 10min     |
| Save draft   | `suppress:{accountId}:drafts:{messageId}` TTL 10min   |
| Move email   | `suppress:{accountId}:{targetFolder}:{uid}` TTL 10min |
| Delete email | `suppress:{accountId}:trash:{uid}` TTL 10min          |

During sync, before generating notifications, check for matching suppressors. If found, skip notification and delete suppressor.

### Why Redis

- Ephemeral by nature (TTL auto-expires)
- Fast lookup during sync
- Already running for BullMQ

## 3. Health Indicators

### Problem

Users have no visibility into whether their email connections are working. They only discover problems when emails stop arriving.

### Solution

**Connection Settings Tab (detailed):**
Three horizontal cards in the Connection tab of account settings:

- **IMAP Card**: icon + "Conectado"/"Falha"/"Verificando..." + latency + "Testar" button
- **SMTP Card**: icon + status + latency + "Testar" button
- **Worker Card**: icon + "Último sync há X min" / "Falha no sync" + job state

Color scheme:

- Connected: emerald (green)
- Error: rose (red)
- Checking: amber with pulse animation

A "Testar Todos" button runs all 3 checks in parallel.

**Sidebar (conditional alert):**

- All healthy → nothing shown (clean)
- Any service failing → amber AlertTriangle icon next to account name
- Tooltip on hover: descriptive message ("IMAP: Falha na conexão")
- Click → opens account settings on Connection tab

### Backend

New endpoint: `GET /v1/email/accounts/:id/health`

- Tests IMAP connection (connect + authenticate + list)
- Tests SMTP connection (nodemailer.verify())
- Checks worker status (last sync job state + timestamp from BullMQ)
- Returns all 3 statuses in parallel
- React Query: staleTime 60s, sidebar polls every 5min

## 4. IMAP IDLE — Real-Time Sync

### Problem

5-minute polling means users wait up to 5 minutes to see new emails.

### Solution

IMAP IDLE connections (RFC 2177) for push notifications from mail servers.

### Architecture

```
Worker Process
├── IDLE Manager (NEW)
│   ├── Account 1 → IDLE connection on INBOX → onExists → incremental sync
│   ├── Account 2 → IDLE connection on INBOX → onExists → incremental sync
│   └── Account N → ...
├── Scheduler (ADJUSTED: 5min → 15min)
│   └── Deep sync all folders (fallback)
└── BullMQ Workers (unchanged)
```

### IDLE Manager Details

- One persistent IMAP connection per active account monitoring INBOX
- On `exists` event → trigger incremental sync (only new UIDs)
- Heartbeat every 29 minutes (RFC 2177 recommends refresh before 30min)
- Auto-reconnect with backoff: 5s → 10s → 30s → 60s
- After 3 failed reconnections → mark account as "degraded" (falls back to polling), register in health status
- Map<accountId, { client: ImapFlow, retries: number, state: 'idle'|'syncing'|'degraded' }>

### Scheduler Change

- Interval increases from 5min to 15min
- Now serves as deep sync (all folders) + fallback for degraded accounts
- IDLE handles INBOX in real-time

### Limitations

- IDLE monitors INBOX only (IMAP spec: 1 folder per connection)
- Other folders sync via 15min scheduler
- 5-20 concurrent IDLE connections is sustainable for Node.js

## Implementation Order

1. **Optimistic UI** — highest perceived impact, frontend-only changes
2. **Notification Deduplication** — fixes real user irritation
3. **Health Indicators** — new endpoint + frontend UI
4. **IMAP IDLE** — most complex, biggest technical improvement

## What Does NOT Change

- Email layout (already excellent)
- Connection pool + circuit breaker (already robust)
- Credential encryption with key rotation (already secure)
- Permission model (already complete)
- Worker thread isolation (deferred to future iteration)
