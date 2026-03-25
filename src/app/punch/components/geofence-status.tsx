'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { punchApi } from '../api/punch.api';

interface GeofenceStatusProps {
  latitude: number | null;
  longitude: number | null;
  enabled: boolean;
  onValidation: (isValid: boolean) => void;
}

type ValidationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'valid'; zoneName: string }
  | { status: 'invalid'; distance?: number }
  | { status: 'error'; message: string };

export function GeofenceStatus({
  latitude,
  longitude,
  enabled,
  onValidation,
}: GeofenceStatusProps) {
  const [state, setState] = useState<ValidationState>({ status: 'idle' });
  const onValidationRef = useRef(onValidation);
  onValidationRef.current = onValidation;
  const lastCoordsRef = useRef<string | null>(null);

  const validate = useCallback(async (lat: number, lng: number) => {
    const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    if (lastCoordsRef.current === coordKey) return;
    lastCoordsRef.current = coordKey;

    setState({ status: 'loading' });

    try {
      const result = await punchApi.validateGeofence(lat, lng);
      if (result.isValid) {
        setState({
          status: 'valid',
          zoneName: result.zoneName ?? 'Zona autorizada',
        });
        onValidationRef.current(true);
      } else {
        setState({ status: 'invalid', distance: result.distance });
        onValidationRef.current(false);
      }
    } catch {
      setState({ status: 'error', message: 'Erro ao verificar geofence.' });
      onValidationRef.current(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      onValidationRef.current(true);
      return;
    }

    if (latitude !== null && longitude !== null) {
      validate(latitude, longitude);
    }
  }, [enabled, latitude, longitude, validate]);

  if (!enabled) return null;

  if (
    state.status === 'idle' ||
    (state.status !== 'loading' && latitude === null)
  ) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3">
        <Loader2 className="size-5 text-slate-400 animate-spin shrink-0" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aguardando localização para verificar geofence...
        </p>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3">
        <Loader2 className="size-5 text-slate-400 animate-spin shrink-0" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Verificando localização...
        </p>
      </div>
    );
  }

  if (state.status === 'valid') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl px-4 py-3',
          'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
        )}
      >
        <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Dentro da zona: {state.zoneName}
          </p>
        </div>
      </div>
    );
  }

  if (state.status === 'invalid') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl px-4 py-3',
          'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800'
        )}
      >
        <XCircle className="size-5 text-rose-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
            Fora da zona permitida
          </p>
          {state.distance !== undefined && (
            <p className="text-xs text-rose-600/70 dark:text-rose-400/70">
              Distância: {Math.round(state.distance)}m da zona mais próxima
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3',
        'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800'
      )}
    >
      <XCircle className="size-5 text-rose-500 shrink-0" />
      <p className="text-sm text-rose-700 dark:text-rose-300">
        {state.status === 'error' ? state.message : 'Erro desconhecido'}
      </p>
    </div>
  );
}
