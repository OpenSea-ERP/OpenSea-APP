'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AuthError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Erro na autenticação
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ocorreu um erro durante o processo de autenticação. Tente novamente.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.location.assign('/login')}
          >
            Voltar ao login
          </Button>
          <Button onClick={reset}>Tentar novamente</Button>
        </div>
      </div>
    </div>
  );
}
