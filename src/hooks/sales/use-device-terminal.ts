'use client';

import { useMyDevice } from './use-pos';

const DEVICE_TOKEN_KEY = 'pos_device_token';

/**
 * Hook que encapsula todo o estado do device PDV.
 * Lê o token do localStorage e busca o estado completo do terminal pareado.
 */
export function useDeviceTerminal() {
  const hasToken =
    typeof window !== 'undefined' &&
    !!window.localStorage.getItem(DEVICE_TOKEN_KEY);

  const { data, isLoading, error, refetch } = useMyDevice();

  const terminal = data?.terminal ?? null;
  const currentSession = data?.currentSession ?? null;
  const isPaired = hasToken && !!terminal;
  const requiresSession = terminal?.requiresSession ?? false;

  return {
    isPaired,
    terminal,
    currentSession,
    isLoading: hasToken && isLoading,
    error,
    refetch,
    needsPairing: !hasToken,
    needsSession: isPaired && requiresSession && !currentSession,
    isReady: isPaired && (!requiresSession || !!currentSession),
    mode: terminal?.mode ?? null,
  };
}

export function clearDeviceToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(DEVICE_TOKEN_KEY);
  }
}
