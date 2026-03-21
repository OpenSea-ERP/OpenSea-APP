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
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{
              backgroundColor: 'var(--central-card-bg)',
              border: '1px solid var(--central-border)',
            }}
          >
            !
          </div>
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--central-text)' }}
          >
            Erro no painel administrativo
          </h2>
          <p
            className="text-sm"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            Ocorreu um erro ao carregar esta secao do Central. Tente novamente.
          </p>
          {error.digest && (
            <p
              className="text-xs font-mono"
              style={{ color: 'var(--central-text-muted)' }}
            >
              Referencia: {error.digest}
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
