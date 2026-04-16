'use client';

import { cn } from '@/lib/utils';
import { Clock, Loader2, LogIn, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type PunchType = 'CLOCK_IN' | 'CLOCK_OUT';

interface BigPunchCTAProps {
  /** Whether the user is currently inside a working session. */
  state: 'idle' | 'working';
  /** Disabled while pre-conditions (selfie, geofence) are not satisfied. */
  disabled: boolean;
  /** True while a request is in flight. */
  isLoading: boolean;
  /** Triggered on tap. Receives the appropriate punch type. */
  onPunch: (type: PunchType) => void;
}

/**
 * Big touch-friendly CTA used as the focal point of the punch PWA.
 * Mobile: 280-320px. Desktop: 480px. Animated tap (scale + ripple).
 */
export function BigPunchCTA({
  state,
  disabled,
  isLoading,
  onPunch,
}: BigPunchCTAProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (ripples.length === 0) return;
    const timeout = setTimeout(() => setRipples([]), 700);
    return () => clearTimeout(timeout);
  }, [ripples]);

  const isWorking = state === 'working';
  const punchType: PunchType = isWorking ? 'CLOCK_OUT' : 'CLOCK_IN';
  const Icon = isLoading ? Loader2 : isWorking ? LogOut : LogIn;
  const primaryLabel = isWorking ? 'Saída' : 'Bater Ponto';
  const secondaryLabel = isWorking
    ? 'Encerrar jornada'
    : 'Iniciar jornada de hoje';

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (disabled || isLoading) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setRipples(prev => [
      ...prev,
      {
        id: Date.now(),
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
    ]);
    if (
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    ) {
      navigator.vibrate(20);
    }
    onPunch(punchType);
  }

  return (
    <div className="flex flex-col items-center gap-3" data-testid="punch-cta-wrapper">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        data-testid="punch-cta"
        data-punch-type={punchType}
        aria-label={`${primaryLabel} — ${secondaryLabel}`}
        className={cn(
          'relative overflow-hidden rounded-full',
          'size-72 sm:size-80 md:size-96',
          'flex flex-col items-center justify-center gap-3',
          'text-white font-bold text-3xl sm:text-4xl tracking-tight',
          'shadow-xl transition-transform duration-150',
          'active:scale-[0.97]',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-4',
          'focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900',
          isWorking
            ? 'bg-gradient-to-br from-rose-500 via-rose-500 to-rose-600 focus-visible:ring-rose-300'
            : 'bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600 focus-visible:ring-emerald-300'
        )}
      >
        {/* Concentric pulse ring while idle */}
        {!isLoading && !disabled && (
          <span
            aria-hidden
            className={cn(
              'absolute inset-0 rounded-full pointer-events-none',
              'animate-ping opacity-30',
              isWorking ? 'bg-rose-400' : 'bg-emerald-400'
            )}
            style={{ animationDuration: '2.4s' }}
          />
        )}

        {/* Tap ripples */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            aria-hidden
            className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
            style={{
              left: ripple.x - 40,
              top: ripple.y - 40,
              width: 80,
              height: 80,
            }}
          />
        ))}

        <Icon
          className={cn(
            'size-20 sm:size-24 drop-shadow-md',
            isLoading && 'animate-spin'
          )}
        />
        <span className="drop-shadow-md">{primaryLabel}</span>
        <span className="text-sm font-medium opacity-90 flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {secondaryLabel}
        </span>
      </button>
    </div>
  );
}
