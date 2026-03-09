'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Algo deu errado
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ocorreu um erro inesperado. Tente novamente ou entre em contato com
            o suporte se o problema persistir.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Referência: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.assign('/')}>
            Voltar ao início
          </Button>
          <Button onClick={reset}>Tentar novamente</Button>
        </div>
      </div>
    </div>
  );
}
