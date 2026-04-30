# Emporion WS Events — Plan 02: OpenSea-APP (admin panel)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `/devices/pos-terminals` listing reactive to backend events (`terminal.synced`, `terminal.unpaired`, `terminal.paired`) via the new Socket.IO `/admin/pos` namespace, and replace the existing revoke button with the fluxo 4b (detects open session, prompts force) using `VerifyActionPinModal` per project security rules.

**Architecture:** New `useAdminPosSocket` hook wraps the existing `useSocket` pattern but connects to `/admin/pos`. New `useTerminalEvents` hook patches React Query cache reactively. New `useRevokeDevice` mutation calls `DELETE /v1/pos/terminals/:id/device?force=` and surfaces 409 via a dedicated confirmation dialog. Two Playwright E2E specs cover the realtime flow and the revoke flow.

**Tech Stack:** Next.js 16, React 19, Socket.IO Client, TanStack Query, TypeScript 5, Playwright.

**Depends on:** Plan 01 backend deployed. Hook URLs and event names match `OpenSea-API/src/lib/websocket/admin-pos-namespace.ts`.

**Related spec:** `OpenSea-API/docs/superpowers/specs/2026-04-29-emporion-ws-events-design.md`.

---

## File structure

### Created

```
src/types/sales/pos-terminal-events.types.ts
src/hooks/sales/use-admin-pos-socket.ts
src/hooks/sales/use-admin-pos-socket.spec.ts
src/hooks/sales/use-terminal-events.ts
src/hooks/sales/use-terminal-events.spec.tsx
src/hooks/sales/use-revoke-device.ts
src/services/sales/revoke-device.service.ts
src/app/(dashboard)/(actions)/devices/pos-terminals/_components/force-revoke-dialog.tsx
e2e/pos-terminals-realtime.spec.ts
e2e/pos-terminals-revoke-flow.spec.ts
```

### Modified

```
src/types/sales/index.ts                                                        # re-export pos-terminal-events
src/hooks/sales/index.ts                                                        # add new hooks
src/app/(dashboard)/(actions)/devices/pos-terminals/page.tsx                    # wire useTerminalEvents + new revoke flow
```

---

## Task 1: Add event types

**Files:**

- Create: `src/types/sales/pos-terminal-events.types.ts`
- Modify: `src/types/sales/index.ts`

- [ ] **Step 1: Create the types file**

```ts
// src/types/sales/pos-terminal-events.types.ts

export interface TerminalSyncedEvent {
  terminalId: string;
  lastCatalogSyncAt: string;
  pendingSales: number;
  conflictSales: number;
}

export type TerminalUnpairReason =
  | 'admin-revoked'
  | 'self-reset'
  | 'force-revoked';

export interface TerminalUnpairedEvent {
  terminalId: string;
  terminalName: string;
  reason: TerminalUnpairReason;
}

export interface TerminalPairedEvent {
  terminalId: string;
  terminalName: string;
}
```

- [ ] **Step 2: Re-export from barrel**

In `src/types/sales/index.ts`, append:

```ts
export * from './pos-terminal-events.types';
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/sales/pos-terminal-events.types.ts src/types/sales/index.ts
git commit -m "feat(types): pos-terminal events (synced/unpaired/paired)"
```

---

## Task 2: `useAdminPosSocket` hook

**Files:**

- Create: `src/hooks/sales/use-admin-pos-socket.ts`
- Create: `src/hooks/sales/use-admin-pos-socket.spec.ts`

- [ ] **Step 1: Write failing test**

```tsx
// src/hooks/sales/use-admin-pos-socket.spec.ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminPosSocket } from './use-admin-pos-socket';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));
vi.mock('@/contexts/tenant-context', () => ({
  useTenant: () => ({ currentTenant: { id: 'tn-1' } }),
}));
vi.mock('@/config/api', () => ({
  apiConfig: { baseURL: 'http://localhost:3333' },
}));

describe('useAdminPosSocket', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'fake-jwt'),
      },
      configurable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockSocket.connected = false;
  });

  it('connects to /admin/pos with auth token from localStorage', async () => {
    const { io } = await import('socket.io-client');
    renderHook(() => useAdminPosSocket());

    expect(io).toHaveBeenCalledWith(
      'http://localhost:3333/admin/pos',
      expect.objectContaining({
        auth: { token: 'fake-jwt' },
        transports: ['websocket', 'polling'],
      })
    );
  });

  it('subscribes via on() and unsubscribes on cleanup', () => {
    const handler = vi.fn();
    const { result, unmount } = renderHook(() => useAdminPosSocket());

    act(() => {
      result.current.on('terminal.synced', handler);
    });
    expect(mockSocket.on).toHaveBeenCalledWith('terminal.synced', handler);

    unmount();
    expect(mockSocket.off).toHaveBeenCalledWith('terminal.synced', handler);
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npx vitest run src/hooks/sales/use-admin-pos-socket.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement hook**

```ts
// src/hooks/sales/use-admin-pos-socket.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { apiConfig } from '@/config/api';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';

let globalAdminPosSocket: Socket | null = null;
let refCount = 0;

interface AdminPosSocketHandle {
  isConnected: boolean;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
}

export function useAdminPosSocket(): AdminPosSocketHandle {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef<
    Array<{ event: string; handler: (...args: unknown[]) => void }>
  >([]);

  useEffect(() => {
    if (!user || !currentTenant?.id) return;

    const token =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('auth_token')
        : null;
    if (!token) return;

    if (!globalAdminPosSocket) {
      globalAdminPosSocket = io(`${apiConfig.baseURL}/admin/pos`, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        transports: ['websocket', 'polling'],
      });
    }

    refCount++;
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    globalAdminPosSocket.on('connect', onConnect);
    globalAdminPosSocket.on('disconnect', onDisconnect);
    if (globalAdminPosSocket.connected) setIsConnected(true);

    return () => {
      // Unsubscribe local handlers attached via .on()
      for (const h of handlersRef.current) {
        globalAdminPosSocket?.off(h.event, h.handler);
      }
      handlersRef.current = [];
      globalAdminPosSocket?.off('connect', onConnect);
      globalAdminPosSocket?.off('disconnect', onDisconnect);
      refCount--;
      if (refCount <= 0 && globalAdminPosSocket) {
        globalAdminPosSocket.disconnect();
        globalAdminPosSocket = null;
        refCount = 0;
      }
    };
  }, [user, currentTenant?.id]);

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      if (!globalAdminPosSocket) return;
      globalAdminPosSocket.on(event, handler);
      handlersRef.current.push({ event, handler });
    },
    []
  );

  return { isConnected, on };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/hooks/sales/use-admin-pos-socket.spec.ts`
Expected: 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/sales/use-admin-pos-socket.ts src/hooks/sales/use-admin-pos-socket.spec.ts
git commit -m "feat(hooks): useAdminPosSocket — Socket.IO /admin/pos client with refcount"
```

---

## Task 3: `useTerminalEvents` hook (cache patching)

**Files:**

- Create: `src/hooks/sales/use-terminal-events.ts`
- Create: `src/hooks/sales/use-terminal-events.spec.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/hooks/sales/use-terminal-events.spec.tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTerminalEvents } from './use-terminal-events';
import type { PosTerminal } from '@/types/sales';

const mockOn =
  vi.fn<(event: string, handler: (...args: unknown[]) => void) => void>();
let registered: Record<string, (...args: unknown[]) => void> = {};

vi.mock('./use-admin-pos-socket', () => ({
  useAdminPosSocket: () => ({
    isConnected: true,
    on: (event: string, handler: (...args: unknown[]) => void) => {
      mockOn(event, handler);
      registered[event] = handler;
    },
  }),
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  qc.setQueryData<PosTerminal[]>(
    ['pos-terminals'],
    [
      {
        id: 't1',
        terminalName: 'Caixa 01',
        lastCatalogSyncAt: null,
        pendingSales: 0,
      } as PosTerminal,
      {
        id: 't2',
        terminalName: 'Caixa 02',
        lastCatalogSyncAt: null,
        pendingSales: 0,
      } as PosTerminal,
    ]
  );
  return {
    qc,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

describe('useTerminalEvents', () => {
  beforeEach(() => {
    registered = {};
    mockOn.mockClear();
  });

  it('subscribes to terminal.synced/unpaired/paired', () => {
    const { Wrapper } = makeWrapper();
    renderHook(() => useTerminalEvents(), { wrapper: Wrapper });

    expect(Object.keys(registered).sort()).toEqual([
      'terminal.paired',
      'terminal.synced',
      'terminal.unpaired',
    ]);
  });

  it('terminal.synced patches the matching row in the cache', () => {
    const { qc, Wrapper } = makeWrapper();
    renderHook(() => useTerminalEvents(), { wrapper: Wrapper });

    act(() => {
      registered['terminal.synced']({
        terminalId: 't1',
        lastCatalogSyncAt: '2026-04-29T12:00:00.000Z',
        pendingSales: 5,
        conflictSales: 0,
      });
    });

    const list = qc.getQueryData<PosTerminal[]>(['pos-terminals']);
    expect(list?.[0].lastCatalogSyncAt).toBe('2026-04-29T12:00:00.000Z');
    expect(list?.[0].pendingSales).toBe(5);
    expect(list?.[1].pendingSales).toBe(0);
  });

  it('terminal.unpaired invalidates and shows toast', async () => {
    const { qc, Wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const { toast } = await import('sonner');
    renderHook(() => useTerminalEvents(), { wrapper: Wrapper });

    act(() => {
      registered['terminal.unpaired']({
        terminalId: 't1',
        terminalName: 'Caixa 01',
        reason: 'admin-revoked',
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pos-terminals'] });
    expect(toast.info).toHaveBeenCalledWith(
      expect.stringContaining('Caixa 01')
    );
  });

  it('terminal.paired invalidates the cache', () => {
    const { qc, Wrapper } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useTerminalEvents(), { wrapper: Wrapper });

    act(() => {
      registered['terminal.paired']({
        terminalId: 't3',
        terminalName: 'Caixa 03',
      });
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: ['pos-terminals'] });
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npx vitest run src/hooks/sales/use-terminal-events.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement hook**

```ts
// src/hooks/sales/use-terminal-events.ts
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  PosTerminal,
  TerminalSyncedEvent,
  TerminalUnpairedEvent,
  TerminalPairedEvent,
} from '@/types/sales';
import { useAdminPosSocket } from './use-admin-pos-socket';

export function useTerminalEvents(): void {
  const queryClient = useQueryClient();
  const { on } = useAdminPosSocket();

  useEffect(() => {
    const onSynced = (raw: unknown) => {
      const e = raw as TerminalSyncedEvent;
      queryClient.setQueryData<PosTerminal[]>(['pos-terminals'], old =>
        old
          ? old.map(t =>
              t.id === e.terminalId
                ? {
                    ...t,
                    lastCatalogSyncAt: e.lastCatalogSyncAt,
                    pendingSales: e.pendingSales,
                  }
                : t
            )
          : old
      );
    };

    const onUnpaired = (raw: unknown) => {
      const e = raw as TerminalUnpairedEvent;
      queryClient.invalidateQueries({ queryKey: ['pos-terminals'] });
      toast.info(`Terminal "${e.terminalName}" foi desvinculado`);
    };

    const onPaired = (_raw: unknown) => {
      const _e = _raw as TerminalPairedEvent;
      queryClient.invalidateQueries({ queryKey: ['pos-terminals'] });
    };

    on('terminal.synced', onSynced);
    on('terminal.unpaired', onUnpaired);
    on('terminal.paired', onPaired);
    // Cleanup is handled inside useAdminPosSocket via handlersRef.
  }, [queryClient, on]);
}
```

Note: `PosTerminal` type may not currently include `lastCatalogSyncAt` and `pendingSales` fields. If the types diff, extend `src/types/sales/pos-terminal.types.ts` to include them as optional.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/hooks/sales/use-terminal-events.spec.tsx`
Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/sales/use-terminal-events.ts src/hooks/sales/use-terminal-events.spec.tsx \
        src/types/sales/pos-terminal.types.ts
git commit -m "feat(hooks): useTerminalEvents — reactive cache patching for pos-terminals page"
```

---

## Task 4: `revoke-device` service + `useRevokeDevice` mutation

**Files:**

- Create: `src/services/sales/revoke-device.service.ts`
- Create: `src/hooks/sales/use-revoke-device.ts`

- [ ] **Step 1: Implement service**

```ts
// src/services/sales/revoke-device.service.ts
import { apiClient } from '@/lib/api-client';

export interface RevokeDeviceResponse {
  status: 'revoked' | 'already-revoked';
  reason?: 'admin-revoked' | 'force-revoked';
  abandonedSessionId?: string;
}

export interface RevokeDeviceConflict {
  status: 409;
  requiresForce: true;
  openSessionId: string;
}

export async function revokeDevice(
  terminalId: string,
  options: { force?: boolean } = {}
): Promise<RevokeDeviceResponse> {
  const force = options.force ? '?force=true' : '';
  const { data } = await apiClient.delete<RevokeDeviceResponse>(
    `/v1/pos/terminals/${terminalId}/device${force}`
  );
  return data;
}
```

The 409 case is bubbled as an Axios error — the caller (mutation) inspects `error.response?.status === 409 && error.response.data?.requiresForce` to branch into the force flow.

- [ ] **Step 2: Implement mutation hook**

```ts
// src/hooks/sales/use-revoke-device.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revokeDevice } from '@/services/sales/revoke-device.service';

export function useRevokeDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { terminalId: string; force?: boolean }) =>
      revokeDevice(input.terminalId, { force: input.force }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-terminals'] });
    },
  });
}
```

- [ ] **Step 3: Add to barrel `src/hooks/sales/index.ts`**

```ts
export { useAdminPosSocket } from './use-admin-pos-socket';
export { useTerminalEvents } from './use-terminal-events';
export { useRevokeDevice } from './use-revoke-device';
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/services/sales/revoke-device.service.ts src/hooks/sales/use-revoke-device.ts src/hooks/sales/index.ts
git commit -m "feat(hooks): useRevokeDevice mutation + service"
```

---

## Task 5: `<ForceRevokeDialog>` component (force flow with PIN)

**Files:**

- Create: `src/app/(dashboard)/(actions)/devices/pos-terminals/_components/force-revoke-dialog.tsx`

- [ ] **Step 1: Implement the dialog**

```tsx
// src/app/(dashboard)/(actions)/devices/pos-terminals/_components/force-revoke-dialog.tsx
'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { useState } from 'react';

interface ForceRevokeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terminalName: string;
  openSessionId: string;
  onConfirm: () => Promise<void>;
}

export function ForceRevokeDialog({
  open,
  onOpenChange,
  terminalName,
  openSessionId,
  onConfirm,
}: ForceRevokeDialogProps) {
  const [showPin, setShowPin] = useState(false);

  return (
    <>
      <Dialog open={open && !showPin} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-rose-500" />
              Sessão de caixa aberta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p>
              O terminal <strong>{terminalName}</strong> tem uma sessão de caixa
              em aberto (<code className="text-xs">{openSessionId}</code>).
            </p>
            <p className="text-sm text-muted-foreground">
              Forçar revogação descartará vendas pendentes deste device. Esta
              ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => setShowPin(true)}>
              Forçar revogação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VerifyActionPinModal
        isOpen={showPin}
        onClose={() => setShowPin(false)}
        onSuccess={async () => {
          setShowPin(false);
          await onConfirm();
          onOpenChange(false);
        }}
        title="Confirmar revogação forçada"
        description="Digite seu PIN de ação para descartar a sessão aberta e revogar o terminal."
      />
    </>
  );
}
```

- [ ] **Step 2: Visual smoke check**

Run: `npm run dev` and navigate to `/devices/pos-terminals`. (Dialog won't render until wired in Task 6.) For now, just confirm the file compiles via `npx tsc --noEmit`.

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/(actions)/devices/pos-terminals/_components/force-revoke-dialog.tsx
git commit -m "feat(ui): ForceRevokeDialog — open-session warning + PIN gate"
```

---

## Task 6: Wire reactive events + new revoke flow into the page

**Files:**

- Modify: `src/app/(dashboard)/(actions)/devices/pos-terminals/page.tsx`

- [ ] **Step 1: Read the current page**

Run `cat src/app/(dashboard)/(actions)/devices/pos-terminals/page.tsx | head -200` to identify where the existing revoke handler lives. Locate the call to `useUnpairDevice` (or whichever existing mutation revokes) and the JSX that triggers it.

- [ ] **Step 2: Replace the revoke flow + add useTerminalEvents**

Add at the top:

```ts
import { useTerminalEvents, useRevokeDevice } from '@/hooks/sales';
import { ForceRevokeDialog } from './_components/force-revoke-dialog';
import { toast } from 'sonner';
```

Inside the component, near other hooks:

```ts
useTerminalEvents();
const revokeDevice = useRevokeDevice();

const [forceRevokeState, setForceRevokeState] = useState<{
  open: boolean;
  terminal: { id: string; name: string } | null;
  openSessionId: string | null;
}>({ open: false, terminal: null, openSessionId: null });

const [pinModalState, setPinModalState] = useState<{
  open: boolean;
  terminal: { id: string; name: string } | null;
}>({ open: false, terminal: null });
```

Replace the existing `handleUnpair` (or equivalent) with:

```ts
const handleRevoke = (terminal: PosTerminal) => {
  setPinModalState({
    open: true,
    terminal: { id: terminal.id, name: terminal.terminalName },
  });
};

const handleRevokeConfirmed = async () => {
  if (!pinModalState.terminal) return;
  const { id, name } = pinModalState.terminal;
  setPinModalState({ open: false, terminal: null });

  try {
    await revokeDevice.mutateAsync({ terminalId: id });
    toast.success(`Terminal "${name}" revogado`);
  } catch (err: unknown) {
    const e = err as {
      response?: {
        status?: number;
        data?: { requiresForce?: boolean; openSessionId?: string };
      };
    };
    if (
      e.response?.status === 409 &&
      e.response.data?.requiresForce &&
      e.response.data.openSessionId
    ) {
      setForceRevokeState({
        open: true,
        terminal: { id, name },
        openSessionId: e.response.data.openSessionId,
      });
    } else {
      toast.error('Falha ao revogar terminal');
    }
  }
};

const handleForceRevoke = async () => {
  if (!forceRevokeState.terminal) return;
  const { id, name } = forceRevokeState.terminal;
  try {
    await revokeDevice.mutateAsync({ terminalId: id, force: true });
    toast.success(`Terminal "${name}" revogado (sessão descartada)`);
  } catch {
    toast.error('Falha ao forçar revogação');
  } finally {
    setForceRevokeState({ open: false, terminal: null, openSessionId: null });
  }
};
```

Wire `handleRevoke` to the existing menu item / button that previously invoked unpair (look for the `Link2Off` icon or "Desvincular" label).

At the bottom of the JSX (alongside other modals), add:

```tsx
<VerifyActionPinModal
  isOpen={pinModalState.open}
  onClose={() => setPinModalState({ open: false, terminal: null })}
  onSuccess={handleRevokeConfirmed}
  title="Confirmar revogação"
  description={`Digite seu PIN de ação para revogar o terminal "${pinModalState.terminal?.name ?? ''}".`}
/>;

{
  forceRevokeState.terminal && forceRevokeState.openSessionId && (
    <ForceRevokeDialog
      open={forceRevokeState.open}
      onOpenChange={open => setForceRevokeState(s => ({ ...s, open }))}
      terminalName={forceRevokeState.terminal.name}
      openSessionId={forceRevokeState.openSessionId}
      onConfirm={handleForceRevoke}
    />
  );
}
```

If the existing page already imports `useUnpairDevice` from `@/hooks/sales`, **leave it in place** — `useUnpairDevice` may still serve a different code path (e.g., admin-side unpair without revoke semantics). The new `useRevokeDevice` is additive.

- [ ] **Step 3: Add `data-testid` attrs for E2E**

In the page, find the row rendering and add:

```tsx
<div data-testid={`pos-terminal-row-${terminal.id}`}>
  ...
  <span data-testid={`pos-terminal-last-sync-${terminal.id}`}>
    {terminal.lastCatalogSyncAt
      ? formatDistanceToNow(new Date(terminal.lastCatalogSyncAt), {
          addSuffix: true,
          locale: ptBR,
        })
      : 'Nunca'}
  </span>
  ...
</div>
```

And on the dropdown menu items (look for "Desvincular"):

```tsx
<DropdownMenuItem
  onClick={() => handleRevoke(terminal)}
  data-testid={`pos-terminal-revoke-${terminal.id}`}
  className="text-rose-600"
>
  <Link2Off className="mr-2 size-4" />
  Revogar device
</DropdownMenuItem>
```

- [ ] **Step 4: Manual smoke check**

Run: `npm run dev`. Navigate to `/devices/pos-terminals`. With backend running and a paired terminal:

1. Trigger a sync from Emporion → row updates without refresh.
2. Click revoke on a terminal → PIN modal → enter PIN → terminal disappears (and toast appears).

If sessions exist, the 409 path produces the ForceRevokeDialog.

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/(actions)/devices/pos-terminals/page.tsx
git commit -m "feat(devices/pos-terminals): wire useTerminalEvents + revoke flow 4b"
```

---

## Task 7: Playwright E2E — realtime sync update

**Files:**

- Create: `e2e/pos-terminals-realtime.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
// e2e/pos-terminals-realtime.spec.ts
import { test, expect } from '@playwright/test';
import { io as ioClient } from 'socket.io-client';

test.describe('/devices/pos-terminals — realtime sync update', () => {
  test('atualiza linha do terminal quando backend emite terminal.synced', async ({
    page,
    baseURL,
  }) => {
    // Login as admin (assumes existing helper or seed)
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('admin@teste.com');
    await page.getByLabel('Senha').fill('Teste@123');
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('/');

    // Select tenant
    await page.getByRole('button', { name: /empresa demo/i }).click();
    await page.waitForURL('**/dashboard**');

    await page.goto('/devices/pos-terminals');
    await expect(page.getByTestId(/^pos-terminal-row-/)).toHaveCount(1, {
      timeout: 10_000,
    });

    // Capture the test terminal id from a known fixture
    const row = page.getByTestId(/^pos-terminal-row-/).first();
    const testIdAttr = await row.getAttribute('data-testid');
    const terminalId = testIdAttr!.replace('pos-terminal-row-', '');

    // Read current "last sync" cell
    const before = await page
      .getByTestId(`pos-terminal-last-sync-${terminalId}`)
      .textContent();

    // Emit terminal.synced via a backend test endpoint (or direct admin Socket.IO)
    // Easier path: hit the same backend endpoint Emporion uses (POST /v1/pos/sync/notify)
    // with a deviceToken seeded for this terminal.
    const token = process.env.E2E_DEVICE_TOKEN;
    expect(token, 'E2E_DEVICE_TOKEN must be set').toBeTruthy();

    const newSyncAt = new Date().toISOString();
    const resp = await fetch(
      `${baseURL?.replace(/\/$/, '')}/v1/pos/sync/notify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastCatalogSyncAt: newSyncAt,
          pendingSales: 0,
          conflictSales: 0,
        }),
      }
    );
    expect(resp.status).toBe(200);

    // Wait for the cell to update reactively (no manual refresh!)
    await expect(async () => {
      const after = await page
        .getByTestId(`pos-terminal-last-sync-${terminalId}`)
        .textContent();
      expect(after).not.toBe(before);
    }).toPass({ timeout: 5_000 });
  });
});
```

- [ ] **Step 2: Document E2E setup**

Create `e2e/README-pos-terminals.md` with:

```md
## E2E pos-terminals setup

These specs require:

- Backend running on `BASE_URL` with seed data (admin@teste.com / Teste@123, "Empresa Demo" tenant).
- A pre-paired POS terminal with a stored device token, exported via `E2E_DEVICE_TOKEN` env var.

To seed:

1. Start backend: `cd OpenSea-API && npm run dev`
2. Seed db: `npx prisma db seed`
3. Pair a test terminal via the admin UI or seed: capture the deviceToken from the response.
4. Export: `export E2E_DEVICE_TOKEN=<token>`
5. Run: `npm run test:e2e -- pos-terminals-realtime.spec.ts`
```

- [ ] **Step 3: Run E2E**

Pre-req: backend + seed data + paired terminal token.

Run: `E2E_DEVICE_TOKEN=<token> npm run test:e2e -- e2e/pos-terminals-realtime.spec.ts`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add e2e/pos-terminals-realtime.spec.ts e2e/README-pos-terminals.md
git commit -m "test(e2e): pos-terminals realtime sync update via terminal.synced WS"
```

---

## Task 8: Playwright E2E — revoke flow with force

**Files:**

- Create: `e2e/pos-terminals-revoke-flow.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
// e2e/pos-terminals-revoke-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('/devices/pos-terminals — revoke flow 4b', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('admin@teste.com');
    await page.getByLabel('Senha').fill('Teste@123');
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('/');
    await page.getByRole('button', { name: /empresa demo/i }).click();
    await page.waitForURL('**/dashboard**');
  });

  test('revoga terminal sem sessão aberta', async ({ page, baseURL }) => {
    const terminalId = process.env.E2E_TERMINAL_NO_SESSION_ID;
    expect(terminalId, 'E2E_TERMINAL_NO_SESSION_ID must be set').toBeTruthy();

    await page.goto('/devices/pos-terminals');
    await expect(
      page.getByTestId(`pos-terminal-row-${terminalId}`)
    ).toBeVisible({ timeout: 10_000 });

    await page
      .getByTestId(`pos-terminal-row-${terminalId}`)
      .getByRole('button', { name: /more/i })
      .click();
    await page.getByTestId(`pos-terminal-revoke-${terminalId}`).click();

    // VerifyActionPinModal opens
    await page.getByLabel('PIN').fill(process.env.E2E_ADMIN_PIN ?? '1234');
    await page.getByRole('button', { name: /confirmar/i }).click();

    await expect(page.getByText(/revogado/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId(`pos-terminal-row-${terminalId}`)).toBeHidden(
      { timeout: 5_000 }
    );
  });

  test('mostra force-revoke dialog quando sessão aberta', async ({
    page,
    baseURL,
  }) => {
    const terminalId = process.env.E2E_TERMINAL_OPEN_SESSION_ID;
    expect(terminalId, 'E2E_TERMINAL_OPEN_SESSION_ID must be set').toBeTruthy();

    await page.goto('/devices/pos-terminals');
    await expect(
      page.getByTestId(`pos-terminal-row-${terminalId}`)
    ).toBeVisible({ timeout: 10_000 });

    await page
      .getByTestId(`pos-terminal-row-${terminalId}`)
      .getByRole('button', { name: /more/i })
      .click();
    await page.getByTestId(`pos-terminal-revoke-${terminalId}`).click();

    await page.getByLabel('PIN').fill(process.env.E2E_ADMIN_PIN ?? '1234');
    await page.getByRole('button', { name: /confirmar/i }).click();

    // ForceRevokeDialog appears
    await expect(
      page.getByRole('heading', { name: /sessão de caixa aberta/i })
    ).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /forçar revogação/i }).click();

    // Second PIN modal
    await page.getByLabel('PIN').fill(process.env.E2E_ADMIN_PIN ?? '1234');
    await page.getByRole('button', { name: /confirmar/i }).click();

    await expect(page.getByText(/sessão descartada/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByTestId(`pos-terminal-row-${terminalId}`)).toBeHidden(
      { timeout: 5_000 }
    );
  });
});
```

- [ ] **Step 2: Document required env**

Append to `e2e/README-pos-terminals.md`:

```md
For the revoke flow spec, also export:

- `E2E_TERMINAL_NO_SESSION_ID` — id of a paired terminal with no open session
- `E2E_TERMINAL_OPEN_SESSION_ID` — id of a paired terminal with an open session
- `E2E_ADMIN_PIN` — admin user's action PIN (default `1234`)
```

- [ ] **Step 3: Run E2E**

Pre-req: two terminals seeded as described.

Run: `npm run test:e2e -- e2e/pos-terminals-revoke-flow.spec.ts`
Expected: 2 tests passing.

- [ ] **Step 4: Commit**

```bash
git add e2e/pos-terminals-revoke-flow.spec.ts e2e/README-pos-terminals.md
git commit -m "test(e2e): pos-terminals revoke flow (no-session + force=true paths)"
```

---

## Self-review

Spec coverage:

| Spec section           | Tasks      |
| ---------------------- | ---------- |
| §7.1 useTerminalEvents | 1, 2, 3, 6 |
| §7.2 revoke flow 4b    | 4, 5, 6    |
| §10.3 Playwright E2E   | 7, 8       |

Critical assumptions to verify during execution:

- `apiConfig.baseURL` resolves to the same origin as the backend running `/admin/pos`. If APP and API are on different hosts in dev, set `NEXT_PUBLIC_API_URL`.
- The `auth_token` localStorage key matches the project's existing auth token storage. If the app uses a cookie or different key, adjust in `useAdminPosSocket`.
- `VerifyActionPinModal` props (`isOpen`, `onClose`, `onSuccess`, `title`, `description`) match its current API. If it differs (e.g., `open` instead of `isOpen`), adjust uses in Tasks 5 and 6.
- The existing pos-terminals page may already render rows differently than the example. Adapt the testid attrs to the existing structure rather than rewriting the rendering.

Per project rule: **all destructive actions use `VerifyActionPinModal`**. The revoke flow respects this twice — once before the initial DELETE and once before the force=true override.

---

**End of Plan 02.** After Tasks 1–8, run:

```bash
npm run lint
npx tsc --noEmit
npm run test:e2e -- e2e/pos-terminals-realtime.spec.ts e2e/pos-terminals-revoke-flow.spec.ts
```

Expected: green. APP now reactive to backend events from Plan 01.
