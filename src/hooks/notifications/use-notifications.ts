/**
 * useNotifications — React Query hooks for the notification system.
 *
 * Polls the backend every 30 seconds so users see new notifications
 * without a full page reload. Mutations use optimistic updates to
 * give instant feedback while the API call is in flight.
 *
 * Also includes a background auto-sync that triggers email sync
 * every 2 minutes so new emails are detected without manual action.
 */

import { API_ENDPOINTS } from '@/config/api';
import { useTenant } from '@/contexts/tenant-context';
import { apiClient } from '@/lib/api-client';
import type {
  BackendNotification,
  NotificationFilters,
  NotificationListResponse,
} from '@/types/admin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/notifications/notifications.service';

// ── Query keys ─────────────────────────────────────────────────────
const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (filters?: NotificationFilters) =>
    [...NOTIFICATION_KEYS.all, 'list', filters ?? {}] as const,
};

const POLLING_INTERVAL = 30_000; // 30 seconds
const AUTO_SYNC_INTERVAL = 120_000; // 2 minutes

// ── Queries ────────────────────────────────────────────────────────

export function useNotificationsList(filters?: NotificationFilters) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(filters),
    queryFn: () => listNotifications(filters),
    refetchInterval: POLLING_INTERVAL,
    // Keep stale data visible while refetching in the background
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
}

/** Convenience hook that returns just the unread count for the bell badge */
export function useUnreadNotificationCount() {
  const { data } = useNotificationsList({ limit: 1, isRead: false });
  return data?.total ?? 0;
}

// ── Background auto-sync ──────────────────────────────────────────

/**
 * Silently triggers email sync every AUTO_SYNC_INTERVAL ms so the
 * notification polling picks up new emails without manual action.
 * Runs fire-and-forget — errors are swallowed silently.
 *
 * Uses a syncInProgress guard to prevent overlapping calls and
 * iterates accounts sequentially to reduce IMAP connection pressure.
 */
let syncInProgress = false;

async function triggerSilentEmailSync() {
  if (syncInProgress) return;
  syncInProgress = true;

  try {
    const res = await apiClient.get<{ data: { id: string }[] }>(
      API_ENDPOINTS.EMAIL.ACCOUNTS.LIST
    );
    const accounts = res.data ?? [];
    if (accounts.length === 0) return;

    // Sync accounts sequentially to reduce IMAP connection pressure
    for (const a of accounts) {
      try {
        await apiClient.post(API_ENDPOINTS.EMAIL.ACCOUNTS.SYNC(a.id));
      } catch {
        // Swallow per-account errors — continue with next
      }
    }
  } catch {
    // Swallow — this is a background convenience, not critical
  } finally {
    syncInProgress = false;
  }
}

/**
 * Hook that runs a silent email sync at a regular interval.
 * Call this once in the notifications panel / layout component.
 */
export function useAutoEmailSync() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();

  useEffect(() => {
    // Skip email sync if no tenant is selected (avoids 403 errors)
    if (!currentTenant) return;

    // Run once on mount (after a short delay to avoid racing with initial load)
    const initialTimer = setTimeout(async () => {
      await triggerSilentEmailSync();
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    }, 5_000);

    // Then repeat at the configured interval
    intervalRef.current = setInterval(async () => {
      await triggerSilentEmailSync();
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    }, AUTO_SYNC_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [queryClient, currentTenant]);
}

// ── Mutations ──────────────────────────────────────────────────────

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });

      // Optimistic update across all list caches
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATION_KEYS.all },
        old => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n: BackendNotification) =>
              n.id === id
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            ),
          };
        }
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });

      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATION_KEYS.all },
        old => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n: BackendNotification) => ({
              ...n,
              isRead: true,
              readAt: n.readAt ?? new Date().toISOString(),
            })),
          };
        }
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });

      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATION_KEYS.all },
        old => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.filter(
              (n: BackendNotification) => n.id !== id
            ),
            total: Math.max(0, old.total - 1),
          };
        }
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

// ── Force check (sync emails + refetch) ───────────────────────────

/**
 * Triggers email sync for all active accounts, waits a few seconds
 * for the sync to complete, then refetches notifications.
 * Used by the "Verificar notificações" button.
 */
export function useForceNotificationCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // 1. Get all email accounts
      const res = await apiClient.get<{ data: { id: string }[] }>(
        API_ENDPOINTS.EMAIL.ACCOUNTS.LIST
      );
      const accounts = res.data ?? [];

      // 2. Trigger sync for each account
      await Promise.allSettled(
        accounts.map(a =>
          apiClient.post(API_ENDPOINTS.EMAIL.ACCOUNTS.SYNC(a.id))
        )
      );

      // 3. Small delay to let inline sync complete
      await new Promise(resolve => setTimeout(resolve, 2_000));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}
