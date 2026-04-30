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

/**
 * Connects to the backend `/admin/pos` Socket.IO namespace and exposes a
 * lightweight `on(event, handler)` subscription helper. Handlers registered
 * via the returned `on()` are tracked per-hook-instance so they get cleaned
 * up automatically when the consumer unmounts. The underlying socket is
 * shared (refcounted) across consumers so multiple admin pages don't open
 * duplicate connections.
 */
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

    const localHandlers = handlersRef.current;

    return () => {
      // Unsubscribe local handlers attached via .on()
      for (const h of localHandlers) {
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
