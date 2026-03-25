'use client';

import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { LogIn, LogOut, Waves, WifiOff } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { punchApi, type PunchRequest } from './api/punch.api';
import { usePunchClockIn, usePunchClockOut } from './api/mutations';
import { GeofenceStatus } from './components/geofence-status';
import { KioskEmployeeSelector } from './components/kiosk-employee-selector';
import { LiveClock } from './components/live-clock';
import { LocationDisplay } from './components/location-display';
import { OfflineIndicator } from './components/offline-indicator';
import { PunchReceipt } from './components/punch-receipt';
import { SelfieCapture } from './components/selfie-capture';
import { offlineQueue } from './utils/offline-queue';
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
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [kioskEmployee, setKioskEmployee] = useState<KioskEmployee | null>(
    null
  );
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);
  const kioskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Online/offline detection
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPendingCount(offlineQueue.count);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when back online
  useEffect(() => {
    if (!isOnline) return;

    const pending = offlineQueue.getAll();
    if (pending.length === 0) return;

    setSyncing(true);
    let syncedCount = 0;

    const syncNext = async () => {
      const items = offlineQueue.getAll();
      if (items.length === 0) {
        setSyncing(false);
        setPendingCount(0);
        if (syncedCount > 0) {
          toast.success(
            `${syncedCount} registro(s) sincronizado(s) com sucesso.`
          );
        }
        return;
      }

      const item = items[0];
      try {
        const request: PunchRequest = {
          employeeId: item.employeeId,
          latitude: item.latitude,
          longitude: item.longitude,
          notes: item.photoData
            ? 'Selfie capturada no registro (offline)'
            : undefined,
        };

        if (item.type === 'CLOCK_IN') {
          await punchApi.clockIn(request);
        } else {
          await punchApi.clockOut(request);
        }

        offlineQueue.remove(item.id);
        syncedCount++;
        setPendingCount(offlineQueue.count);
        await syncNext();
      } catch {
        setSyncing(false);
        toast.error('Erro ao sincronizar registros. Tentaremos novamente.');
      }
    };

    syncNext();
  }, [isOnline]);

  // Kiosk auto-reset
  useEffect(() => {
    if (!isKioskMode || !punchResult) return;

    kioskTimerRef.current = setTimeout(() => {
      handleReset();
    }, 10_000);

    return () => {
      if (kioskTimerRef.current) clearTimeout(kioskTimerRef.current);
    };
  }, [isKioskMode, punchResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch punch configuration
  const { data: config } = useQuery({
    queryKey: ['punch-config'],
    queryFn: () => punchApi.getConfig(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Mutations
  const clockIn = usePunchClockIn();
  const clockOut = usePunchClockOut();

  const isLoading = clockIn.isPending || clockOut.isPending;

  // Resolve employee ID based on mode
  const resolvedEmployeeId = isKioskMode
    ? (kioskEmployee?.id ?? '')
    : employeeId || user?.id || '';

  const resolvedEmployeeName = isKioskMode
    ? (kioskEmployee?.name ?? '')
    : employeeName || user?.username || '';

  // Feature flags from config (defaults: selfie required, gps optional, geofence off)
  const selfieRequired = config?.selfieRequired ?? true;
  const gpsRequired = config?.gpsRequired ?? false;
  const geofenceEnabled = config?.geofenceEnabled ?? false;

  const handleLocationReady = useCallback((lat: number, lng: number) => {
    locationRef.current = { lat, lng };
  }, []);

  const handleGeofenceValidation = useCallback((isValid: boolean) => {
    setGeofenceValid(isValid);
  }, []);

  // Determine if punch buttons should be disabled
  const canPunch =
    !!resolvedEmployeeId &&
    (!selfieRequired || !!selfieData) &&
    (!gpsRequired || !!locationRef.current) &&
    (!geofenceEnabled || geofenceValid === true) &&
    !isLoading;

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

      // Offline mode: save to queue
      if (!isOnline) {
        const offlinePunch = {
          id: crypto.randomUUID(),
          employeeId: resolvedEmployeeId,
          type,
          timestamp: new Date().toISOString(),
          latitude: locationRef.current?.lat,
          longitude: locationRef.current?.lng,
          photoData: selfieData ?? undefined,
          createdAt: new Date().toISOString(),
        };

        offlineQueue.add(offlinePunch);
        setPendingCount(offlineQueue.count);

        toast.success(
          `${label} salva offline. Será sincronizada quando houver conexão.`
        );

        // Show a simplified result for offline
        setPunchResult({
          entry: {
            id: offlinePunch.id,
            tenantId: '',
            employeeId: resolvedEmployeeId,
            entryType: type,
            timestamp: offlinePunch.timestamp,
            latitude: locationRef.current?.lat,
            longitude: locationRef.current?.lng,
            createdAt: offlinePunch.createdAt,
          },
          type,
          timestamp: new Date(),
        });
        return;
      }

      // Online mode: send to API
      const mutation = type === 'CLOCK_IN' ? clockIn : clockOut;

      try {
        const entry = await mutation.mutateAsync({
          employeeId: resolvedEmployeeId,
          latitude: locationRef.current?.lat,
          longitude: locationRef.current?.lng,
          notes: selfieData ? 'Selfie capturada no registro' : undefined,
        });

        setPunchResult({
          entry,
          type,
          timestamp: new Date(),
        });

        toast.success(`${label} registrada com sucesso!`);
      } catch {
        toast.error(`Erro ao registrar ${label.toLowerCase()}.`);
      }
    },
    [
      resolvedEmployeeId,
      selfieRequired,
      selfieData,
      gpsRequired,
      geofenceEnabled,
      geofenceValid,
      isOnline,
      clockIn,
      clockOut,
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

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <Waves className="size-12 text-violet-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Acesso Necessário</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Faça login para registrar seu ponto.
        </p>
      </div>
    );
  }

  // No employee ID (and not kiosk mode)
  if (!isKioskMode && !resolvedEmployeeId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <Waves className="size-12 text-violet-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Colaborador Não Identificado</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acesse esta página através do QR Code ou link fornecido pela empresa.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700/50">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
            <Waves className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold">
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
              </p>
            )}
          </div>
          {/* Offline badge */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5">
              <WifiOff className="size-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-500">
                Offline
              </span>
            </div>
          )}
          {/* Pending sync badge */}
          {pendingCount > 0 && isOnline && (
            <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {pendingCount}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-lg space-y-4 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {/* Offline indicator */}
        <OfflineIndicator
          isOnline={isOnline}
          pendingCount={pendingCount}
          syncing={syncing}
        />

        {punchResult ? (
          /* Enhanced Receipt */
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
          /* Punch Form */
          <div className="space-y-4">
            {/* Kiosk: Employee Selector */}
            {isKioskMode && (
              <KioskEmployeeSelector
                selectedEmployee={kioskEmployee}
                onSelect={setKioskEmployee}
                onClear={() => setKioskEmployee(null)}
              />
            )}

            {/* Selfie (conditionally shown) */}
            {selfieRequired && (
              <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-lg">
                <SelfieCapture
                  onCapture={setSelfieData}
                  captured={selfieData ?? undefined}
                  onRetake={() => setSelfieData(null)}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Location */}
            <LocationDisplay onLocationReady={handleLocationReady} />

            {/* Geofence Status */}
            <GeofenceStatus
              latitude={locationRef.current?.lat ?? null}
              longitude={locationRef.current?.lng ?? null}
              enabled={geofenceEnabled}
              onValidation={handleGeofenceValidation}
            />

            {/* Clock */}
            <LiveClock />

            {/* Punch Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePunch('CLOCK_IN')}
                disabled={!canPunch}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-2xl h-16',
                  'bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base',
                  'active:scale-[0.97] transition-all shadow-sm',
                  'disabled:opacity-50 disabled:pointer-events-none'
                )}
              >
                <LogIn className="size-5" />
                <span>Entrada</span>
              </button>
              <button
                type="button"
                onClick={() => handlePunch('CLOCK_OUT')}
                disabled={!canPunch}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-2xl h-16',
                  'bg-rose-500 hover:bg-rose-600 text-white font-bold text-base',
                  'active:scale-[0.97] transition-all shadow-sm',
                  'disabled:opacity-50 disabled:pointer-events-none'
                )}
              >
                <LogOut className="size-5" />
                <span>Saída</span>
              </button>
            </div>

            {/* Helper texts */}
            {selfieRequired && !selfieData && (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                Capture sua foto para habilitar o registro de ponto.
              </p>
            )}

            {gpsRequired && !locationRef.current && (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                Aguardando localização GPS...
              </p>
            )}

            {geofenceEnabled && geofenceValid === false && (
              <p className="text-center text-xs text-rose-400 dark:text-rose-500">
                Registro bloqueado: fora da zona permitida.
              </p>
            )}

            {isKioskMode && !kioskEmployee && (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                Selecione um colaborador para registrar o ponto.
              </p>
            )}

            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="size-4 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Registrando ponto...
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
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
