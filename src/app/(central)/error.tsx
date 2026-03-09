'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function CentralError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CentralError]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Erro no painel administrativo
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ocorreu um erro ao carregar esta seção do Central. Tente novamente.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Referência: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.location.assign('/central')}
          >
            Voltar ao Central
          </Button>
          <Button onClick={reset}>Tentar novamente</Button>
        </div>
      </div>
    </div>
  );
}
