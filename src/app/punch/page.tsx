'use client';

import { useAuth } from '@/contexts/auth-context';
import { useOfflinePunch } from '@/hooks/hr/use-offline-punch';
import { punchApi } from './api/punch.api';
import { BigPunchCTA } from './components/big-punch-cta';
import { GeofenceStatus } from './components/geofence-status';
import { GeoBadge, type GeoState } from './components/geo-badge';
import { JourneyTimer } from './components/journey-timer';
import { KioskEmployeeSelector } from './components/kiosk-employee-selector';
import { LiveClock } from './components/live-clock';
import { LocationDisplay } from './components/location-display';
import { PendingSyncBanner } from './components/pending-sync-banner';
import { PunchReceipt } from './components/punch-receipt';
import { PushConsentModal } from './components/push-consent-modal';
import { PWAInstallBanner } from './components/pwa-install-banner';
import { SelfieCapture } from './components/selfie-capture';
import { StreakCounter } from './components/streak-counter';
import { TodayHistory } from './components/today-history';
import {
  registerPunchServiceWorker,
  requestNotificationPermissionIfNeeded,
} from './utils/register-sw';
import { calculateStreak, filterToday, isWorkingNow } from './utils/streak';
import { useQuery } from '@tanstack/react-query';
import { Waves, WifiOff } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import type { TimeEntry } from '@/types/hr';

type PunchType = 'CLOCK_IN' | 'CLOCK_OUT';

interface PunchResult {
  entry: TimeEntry;
  type: PunchType;
  timestamp: Date;
}

interface KioskEmployee {
  id: string;
  name: string;
  photoUrl?: string;
}

function PunchPageContent() {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employeeId') ?? '';
  const employeeName = searchParams.get('name') ?? '';
  const isKioskMode = searchParams.get('mode') === 'kiosk';

  const { user, isAuthenticated } = useAuth();

  // State
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [punchResult, setPunchResult] = useState<PunchResult | null>(null);
  const [geofenceValid, setGeofenceValid] = useState<boolean | null>(null);
  const [kioskEmployee, setKioskEmployee] = useState<KioskEmployee | null>(
    null
  );
  // Phase 8 / Plan 08-03 — D-03: push consent modal pós-1ª batida.
  const [showPushConsent, setShowPushConsent] = useState(false);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);
  const kioskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    isOnline,
    pendingCount,
    isSyncing,
    isSubmitting,
    submitPunch,
    flushQueue,
  } = useOfflinePunch();

  /* ---------- PWA bootstrap ---------- */

  useEffect(() => {
    void registerPunchServiceWorker();
    void requestNotificationPermissionIfNeeded();
  }, []);

  // Phase 8 / Plan 08-03 — D-03: Web Push consent prompt opens ~1.5s after the
  // FIRST successful punch in the session. Skip when Notification.permission
  // is already 'granted'/'denied', when the user already saw the modal once
  // (localStorage 'push-consent-shown'), or when we're running in kiosk mode
  // (which is shared across employees and shouldn't subscribe to anyone's
  // push channel).
  useEffect(() => {
    if (!punchResult?.entry) return;
    if (isKioskMode) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    try {
      if (localStorage.getItem('push-consent-shown')) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => {
      setShowPushConsent(true);
      try {
        localStorage.setItem('push-consent-shown', Date.now().toString());
      } catch {
        /* localStorage unavailable — non-critical UX flag */
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [punchResult?.entry, isKioskMode]);

  // Native notification when a queued punch finishes syncing while user is here.
  const previousPendingRef = useRef(pendingCount);
  useEffect(() => {
    if (
      previousPendingRef.current > 0 &&
      pendingCount === 0 &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState !== 'visible'
    ) {
      try {
        new Notification('Batidas sincronizadas', {
          body: 'Todas as batidas pendentes foram enviadas com sucesso.',
          icon: '/icon-192.png',
          tag: 'opensea-punch-synced',
        });
      } catch {
        /* notifications unavailable */
      }
    }
    previousPendingRef.current = pendingCount;
  }, [pendingCount]);

  /* ---------- Kiosk auto-reset ---------- */

  useEffect(() => {
    if (!isKioskMode || !punchResult) return;

    kioskTimerRef.current = setTimeout(() => {
      handleReset();
    }, 10_000);

    return () => {
      if (kioskTimerRef.current) clearTimeout(kioskTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKioskMode, punchResult]);

  /* ---------- Punch configuration & today entries ---------- */

  const { data: config } = useQuery({
    queryKey: ['punch-config'],
    queryFn: () => punchApi.getConfig(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const resolvedEmployeeId = isKioskMode
    ? (kioskEmployee?.id ?? '')
    : employeeId || user?.id || '';

  const resolvedEmployeeName = isKioskMode
    ? (kioskEmployee?.name ?? '')
    : employeeName || user?.username || '';

  const todayParams = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoStart = today.toISOString().split('T')[0];
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const isoEnd = tomorrow.toISOString().split('T')[0];
    return { startDate: isoStart, endDate: isoEnd };
  }, []);

  const { data: todayEntriesPage } = useQuery({
    queryKey: [
      'punch-today-entries',
      resolvedEmployeeId,
      todayParams.startDate,
    ],
    queryFn: async () => {
      const { timeControlService } =
        await import('@/services/hr/time-control.service');
      return timeControlService.listTimeEntries({
        employeeId: resolvedEmployeeId,
        startDate: todayParams.startDate,
        endDate: todayParams.endDate,
        perPage: 50,
      });
    },
    enabled: !!resolvedEmployeeId,
    staleTime: 30 * 1000,
  });

  const { data: streakEntriesPage } = useQuery({
    queryKey: ['punch-streak-entries', resolvedEmployeeId],
    queryFn: async () => {
      const { timeControlService } =
        await import('@/services/hr/time-control.service');
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      return timeControlService.listTimeEntries({
        employeeId: resolvedEmployeeId,
        startDate: fromDate.toISOString().split('T')[0],
        perPage: 200,
      });
    },
    enabled: !!resolvedEmployeeId,
    staleTime: 5 * 60 * 1000,
  });

  const todayEntries = useMemo(
    () => filterToday(todayEntriesPage?.timeEntries ?? []),
    [todayEntriesPage]
  );
  const streak = useMemo(
    () => calculateStreak(streakEntriesPage?.timeEntries ?? []),
    [streakEntriesPage]
  );
  const isWorking = useMemo(() => isWorkingNow(todayEntries), [todayEntries]);

  /* ---------- Feature flags from config ---------- */

  const selfieRequired = config?.selfieRequired ?? false;
  const gpsRequired = config?.gpsRequired ?? false;
  const geofenceEnabled = config?.geofenceEnabled ?? false;

  const handleLocationReady = useCallback((lat: number, lng: number) => {
    locationRef.current = { lat, lng };
  }, []);

  const handleGeofenceValidation = useCallback((isValid: boolean) => {
    setGeofenceValid(isValid);
  }, []);

  /* ---------- Geo badge state ---------- */

  const geoState = useMemo<GeoState>(() => {
    if (!locationRef.current) return { kind: 'unknown' };
    if (!geofenceEnabled) return { kind: 'remote' };
    if (geofenceValid === true)
      return { kind: 'office', zoneName: 'escritório' };
    if (geofenceValid === false) return { kind: 'remote' };
    return { kind: 'unknown' };
  }, [geofenceEnabled, geofenceValid, locationRef.current?.lat]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- CTA preconditions ---------- */

  const canPunch =
    !!resolvedEmployeeId &&
    (!selfieRequired || !!selfieData) &&
    (!gpsRequired || !!locationRef.current) &&
    (!geofenceEnabled || geofenceValid === true) &&
    !isSubmitting;

  /* ---------- Submission ---------- */

  const handlePunch = useCallback(
    async (type: PunchType) => {
      if (!resolvedEmployeeId) {
        toast.error('Identificação do colaborador não encontrada.');
        return;
      }
      if (selfieRequired && !selfieData) {
        toast.error('Capture sua foto antes de registrar o ponto.');
        return;
      }
      if (gpsRequired && !locationRef.current) {
        toast.error('Localização GPS necessária para registrar o ponto.');
        return;
      }
      if (geofenceEnabled && geofenceValid !== true) {
        toast.error('Você precisa estar dentro da zona permitida.');
        return;
      }

      const label = type === 'CLOCK_IN' ? 'Entrada' : 'Saída';
      const outcome = await submitPunch({
        type,
        employeeId: resolvedEmployeeId,
        latitude: locationRef.current?.lat,
        longitude: locationRef.current?.lng,
        notes: selfieData ? 'Selfie capturada no registro' : undefined,
      });

      if (outcome.status === 'synced') {
        setPunchResult({
          entry: outcome.entry,
          type,
          timestamp: new Date(),
        });
        toast.success(`${label} registrada com sucesso!`);
      } else {
        toast.success(
          `${label} salva offline. Será sincronizada quando reconectar.`
        );
        setPunchResult({
          entry: {
            id: outcome.pending.id,
            tenantId: '',
            employeeId: resolvedEmployeeId,
            entryType: type,
            timestamp: outcome.pending.timestamp,
            latitude: locationRef.current?.lat,
            longitude: locationRef.current?.lng,
            createdAt: outcome.pending.createdAt,
          },
          type,
          timestamp: new Date(),
        });
      }
    },
    [
      resolvedEmployeeId,
      selfieRequired,
      selfieData,
      gpsRequired,
      geofenceEnabled,
      geofenceValid,
      submitPunch,
    ]
  );

  const handleReset = useCallback(() => {
    setPunchResult(null);
    setSelfieData(null);
    setGeofenceValid(null);
    if (isKioskMode) {
      setKioskEmployee(null);
    }
  }, [isKioskMode]);

  /* ---------- Guards ---------- */

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <Waves className="size-12 text-violet-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Acesso necessário</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Faça login para registrar seu ponto.
        </p>
      </div>
    );
  }

  if (!isKioskMode && !resolvedEmployeeId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <Waves className="size-12 text-violet-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Colaborador não identificado</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acesse esta página através do QR Code ou link fornecido pela empresa.
        </p>
      </div>
    );
  }

  /* ---------- Render ---------- */

  return (
    <div data-testid="punch-page" className="contents">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700/50">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
            <Waves className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
              OpenSea Ponto
              {isKioskMode && (
                <span className="ml-2 text-xs font-medium text-violet-500 dark:text-violet-400">
                  Quiosque
                </span>
              )}
            </h1>
            {resolvedEmployeeName && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                {resolvedEmployeeName}
                {isWorking && (
                  <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    em jornada
                  </span>
                )}
              </p>
            )}
          </div>
          {!isOnline && (
            <div className="flex items-center gap-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 px-2.5 py-1.5">
              <WifiOff className="size-3.5 text-rose-600 dark:text-rose-300" />
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Offline
              </span>
            </div>
          )}
        </div>
      </header>

      {/* PWA install banner — only renders on mobile + non-standalone */}
      <div className="mx-auto max-w-md px-4 pt-3">
        <PWAInstallBanner />
      </div>

      {/* Body */}
      <main className="mx-auto max-w-md space-y-4 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {punchResult ? (
          <PunchReceipt
            entry={punchResult.entry}
            type={punchResult.type}
            timestamp={punchResult.timestamp}
            employeeName={resolvedEmployeeName}
            latitude={locationRef.current?.lat}
            longitude={locationRef.current?.lng}
            selfieData={selfieData}
            onReset={handleReset}
          />
        ) : (
          <>
            {/* Pending sync banner */}
            <PendingSyncBanner
              isOnline={isOnline}
              pendingCount={pendingCount}
              isSyncing={isSyncing}
              onRetry={() => void flushQueue()}
            />

            {/* Kiosk: Employee Selector */}
            {isKioskMode && (
              <KioskEmployeeSelector
                selectedEmployee={kioskEmployee}
                onSelect={setKioskEmployee}
                onClear={() => setKioskEmployee(null)}
              />
            )}

            {/* Live clock */}
            <LiveClock />

            {/* Selfie (conditional) */}
            {selfieRequired && (
              <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                <SelfieCapture
                  onCapture={setSelfieData}
                  captured={selfieData ?? undefined}
                  onRetake={() => setSelfieData(null)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Hidden location/geofence drivers (UI surfaces in GeoBadge below) */}
            <div className="sr-only">
              <LocationDisplay onLocationReady={handleLocationReady} />
              <GeofenceStatus
                latitude={locationRef.current?.lat ?? null}
                longitude={locationRef.current?.lng ?? null}
                enabled={geofenceEnabled}
                onValidation={handleGeofenceValidation}
              />
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <GeoBadge state={geoState} />
                {streak > 0 && <StreakCounter days={streak} />}
              </div>

              <BigPunchCTA
                state={isWorking ? 'working' : 'idle'}
                disabled={!canPunch}
                isLoading={isSubmitting}
                onPunch={handlePunch}
              />

              {!canPunch && (
                <div className="space-y-1 text-center max-w-xs">
                  {selfieRequired && !selfieData && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Capture sua foto para liberar o registro.
                    </p>
                  )}
                  {gpsRequired && !locationRef.current && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Aguardando localização GPS...
                    </p>
                  )}
                  {geofenceEnabled && geofenceValid === false && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      Fora da zona permitida — não é possível registrar agora.
                    </p>
                  )}
                  {isKioskMode && !kioskEmployee && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Selecione um colaborador para registrar o ponto.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Journey timer */}
            <JourneyTimer todayEntries={todayEntries} isWorking={isWorking} />

            {/* History */}
            <TodayHistory entries={todayEntries} />
          </>
        )}
      </main>

      {/* Phase 8 / Plan 08-03 — D-03: push consent prompt pós-1ª batida */}
      <PushConsentModal
        open={showPushConsent}
        onClose={() => setShowPushConsent(false)}
        employeeName={resolvedEmployeeName || user?.username || undefined}
      />
    </div>
  );
}

export default function PunchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <div className="size-8 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
        </div>
      }
    >
      <PunchPageContent />
    </Suspense>
  );
}
