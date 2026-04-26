'use client';

import { useEffect, useState } from 'react';
import { usePairingCode } from '@/hooks/sales';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PairingCodeDisplayProps {
  terminalId: string;
  className?: string;
}

export function PairingCodeDisplay({
  terminalId,
  className,
}: PairingCodeDisplayProps) {
  const { data, isLoading, refetch } = usePairingCode(terminalId);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!data?.expiresAt) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
      if (remaining === 0) {
        refetch();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data?.expiresAt, refetch]);

  return (
    <div
      className={cn(
        'rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-4 py-3',
        className
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-violet-700 dark:text-violet-300 font-medium mb-1">
        Código de pareamento
      </p>
      {isLoading || !data ? (
        <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Gerando...</span>
        </div>
      ) : (
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-2xl font-bold text-violet-700 dark:text-violet-200 tracking-widest">
            {data.code}
          </p>
          <p className="text-xs text-violet-700 dark:text-violet-300 whitespace-nowrap">
            Expira em{' '}
            <span className="font-mono font-semibold">{secondsLeft}s</span>
          </p>
        </div>
      )}
    </div>
  );
}
