import { financeNotificationsService } from '@/services/finance/finance-notifications.service';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useEffect } from 'react';

// ============================================================================
// Overdue summary hook (API-based)
// ============================================================================

export function useOverdueSummary() {
  return useQuery({
    queryKey: ['finance-overdue-summary'],
    queryFn: () => financeNotificationsService.getDashboard(),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// Daily summary hook (API-based)
// ============================================================================

export function useDailySummary() {
  return useQuery({
    queryKey: ['finance-daily-summary'],
    queryFn: async () => {
      const result = await financeNotificationsService.getDashboard();
      const d = result.dashboard;
      return {
        payableToday: d.upcomingPayable7Days,
        receivableToday: d.upcomingReceivable7Days,
        overdueCount: d.overduePayableCount + d.overdueReceivableCount,
        overdueTotal: d.overduePayable + d.overdueReceivable,
      };
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// Notification preferences (localStorage-based)
// ============================================================================

export interface NotificationPreferences {
  notifOverdue: boolean;
  notifDueSoon: boolean;
  notifDailySummary: boolean;
  notifDueDaysBefore: number;
}

const DEFAULT_PREFS: NotificationPreferences = {
  notifOverdue: true,
  notifDueSoon: true,
  notifDailySummary: true,
  notifDueDaysBefore: 3,
};

const STORAGE_KEY = 'finance_notification_preferences';

function loadPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
}

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const updatePreferences = useCallback(
    (updates: Partial<NotificationPreferences>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...updates };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  return useMemo(
    () => ({ prefs, updatePreferences }),
    [prefs, updatePreferences]
  );
}
