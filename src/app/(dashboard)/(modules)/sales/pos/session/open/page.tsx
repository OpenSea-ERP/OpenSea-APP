'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Numpad } from '@/components/ui/numpad';
import {
  useDeviceTerminal,
  useOpenPosSession,
  useCloseOrphanSession,
} from '@/hooks/sales';
import { ArrowLeft, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface OrphanInfo {
  sessionId: string;
}

function extractOrphan(err: unknown): OrphanInfo | null {
  if (typeof err !== 'object' || err === null) return null;
  const e = err as Record<string, unknown>;
  const data = (e.data ?? e.response) as Record<string, unknown> | undefined;
  if (!data) return null;
  const code = data.code as string | undefined;
  const orphanId = data.orphanSessionId as string | undefined;
  if (code === 'ORPHAN_SESSION_EXISTS' && orphanId) {
    return { sessionId: orphanId };
  }
  return null;
}

export default function PosSessionOpenPage() {
  const router = useRouter();
  const { terminal, isLoading } = useDeviceTerminal();
  const openSession = useOpenPosSession();
  const closeOrphan = useCloseOrphanSession();

  // Numpad uses cents (integer)
  const [amountCents, setAmountCents] = useState(0);
  const [orphan, setOrphan] = useState<OrphanInfo | null>(null);

  async function handleOpen() {
    if (!terminal) return;
    try {
      await openSession.mutateAsync({
        terminalId: terminal.id,
        openingBalance: amountCents / 100,
      });
      router.replace('/sales/pos');
    } catch (err: unknown) {
      const found = extractOrphan(err);
      if (found) setOrphan(found);
    }
  }

  async function handleCloseOrphan() {
    if (!orphan) return;
    await closeOrphan.mutateAsync(orphan.sessionId);
    setOrphan(null);
  }

  if (isLoading || !terminal) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:from-emerald-950/40 dark:via-slate-950 dark:to-sky-950/40 p-4">
      <div className="max-w-md mx-auto pt-6">
        <button
          type="button"
          onClick={() => router.push('/sales/pos')}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="rounded-2xl border border-border bg-white dark:bg-slate-800/60 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Abrir Caixa</h1>
              <p className="text-sm text-muted-foreground">
                Terminal: {terminal.terminalName}
              </p>
            </div>
          </div>

          {orphan && (
            <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/40 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Sessão anterior não foi fechada
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Existe uma sessão (ID: {orphan.sessionId.slice(0, 8)}...)
                    que ficou aberta. Confirme o fechamento para continuar.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={handleCloseOrphan}
                    disabled={closeOrphan.isPending}
                  >
                    {closeOrphan.isPending
                      ? 'Fechando...'
                      : 'Confirmar e fechar sessão anterior'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Troco inicial</Label>
              <div className="rounded-xl border border-border bg-slate-50 dark:bg-slate-900/40 px-4 py-5 text-center">
                <p className="text-3xl font-bold font-mono">
                  {formatCurrency(amountCents / 100)}
                </p>
              </div>
            </div>

            <Numpad
              onChange={value => setAmountCents(value)}
              value={amountCents}
            />

            <Button
              type="button"
              className="w-full h-12 text-base"
              onClick={handleOpen}
              disabled={openSession.isPending || !!orphan}
            >
              {openSession.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Abrindo...
                </>
              ) : (
                'Abrir Caixa'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
