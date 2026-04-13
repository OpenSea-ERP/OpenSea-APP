'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Numpad } from '@/components/ui/numpad';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  useDeviceTerminal,
  useClosePosSession,
  usePosSessionSummary,
} from '@/hooks/sales';
import {
  ArrowLeft,
  Lock,
  Loader2,
  TrendingUp,
  TrendingDown,
  Banknote,
  CreditCard,
  QrCode,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const METHOD_LABELS: Record<string, { label: string; icon: typeof Banknote }> =
  {
    CASH: { label: 'Dinheiro', icon: Banknote },
    CREDIT_CARD: { label: 'Cartão Crédito', icon: CreditCard },
    DEBIT_CARD: { label: 'Cartão Débito', icon: CreditCard },
    PIX: { label: 'PIX', icon: QrCode },
    BOLETO: { label: 'Boleto', icon: Wallet },
    STORE_CREDIT: { label: 'Crédito Loja', icon: Wallet },
    VOUCHER: { label: 'Voucher', icon: Wallet },
    CHECK: { label: 'Cheque', icon: Wallet },
    OTHER: { label: 'Outro', icon: Wallet },
  };

export default function PosSessionClosePage() {
  const router = useRouter();
  const { terminal, currentSession, isLoading } = useDeviceTerminal();
  const closeSession = useClosePosSession();

  const [closingCents, setClosingCents] = useState(0);
  const [notes, setNotes] = useState('');
  const [closeResult, setCloseResult] = useState<{
    expectedBalance: number;
    closingBalance: number;
    difference: number;
  } | null>(null);

  const { data: summary, isLoading: summaryLoading } = usePosSessionSummary(
    currentSession?.id
  );

  async function handleClose() {
    if (!currentSession) return;
    const closingBalance = closingCents / 100;
    const result = await closeSession.mutateAsync({
      sessionId: currentSession.id,
      terminalId: terminal?.id,
      data: {
        closingBalance,
        notes: notes.trim() || undefined,
      },
    });

    // Show reconciliation result
    const session = result?.session;
    if (session) {
      setCloseResult({
        expectedBalance: session.expectedBalance ?? 0,
        closingBalance: session.closingBalance ?? closingBalance,
        difference: session.difference ?? 0,
      });
    } else {
      // Fallback with local calculation
      const expected = summary?.expectedCashBalance ?? 0;
      setCloseResult({
        expectedBalance: expected,
        closingBalance,
        difference: closingBalance - expected,
      });
    }
  }

  if (isLoading || !terminal || !currentSession) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // After closing — show reconciliation result
  if (closeResult) {
    const diff = closeResult.difference;
    const isExact = Math.abs(diff) < 0.01;
    const isOver = diff > 0.01;

    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-rose-950/40 dark:via-slate-950 dark:to-amber-950/40 p-4">
        <div className="max-w-md mx-auto pt-12">
          <div className="rounded-2xl border border-border bg-white dark:bg-slate-800/60 shadow-sm p-6 space-y-6 text-center">
            <div
              className={cn(
                'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
                isExact
                  ? 'bg-emerald-50 dark:bg-emerald-500/10'
                  : 'bg-amber-50 dark:bg-amber-500/10'
              )}
            >
              {isExact ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              )}
            </div>

            <div>
              <h1 className="text-xl font-bold">Caixa Fechado</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {terminal.terminalName}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 p-3">
                <span className="text-sm text-muted-foreground">
                  Saldo esperado
                </span>
                <span className="font-mono font-semibold">
                  {formatCurrency(closeResult.expectedBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 p-3">
                <span className="text-sm text-muted-foreground">
                  Saldo informado
                </span>
                <span className="font-mono font-semibold">
                  {formatCurrency(closeResult.closingBalance)}
                </span>
              </div>
              <div
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3',
                  isExact
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-500/10'
                    : isOver
                      ? 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-500/10'
                      : 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-500/10'
                )}
              >
                <span className="text-sm font-medium">
                  {isExact
                    ? 'Caixa conferido'
                    : isOver
                      ? 'Sobra de caixa'
                      : 'Falta de caixa'}
                </span>
                <span
                  className={cn(
                    'font-mono font-bold text-lg',
                    isExact
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : isOver
                        ? 'text-sky-700 dark:text-sky-300'
                        : 'text-rose-700 dark:text-rose-300'
                  )}
                >
                  {isExact
                    ? formatCurrency(0)
                    : `${isOver ? '+' : ''}${formatCurrency(diff)}`}
                </span>
              </div>
            </div>

            <Button
              onClick={() => router.replace('/sales/pos')}
              className="w-full h-12 text-base"
            >
              Concluir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-rose-950/40 dark:via-slate-950 dark:to-amber-950/40 p-4">
      <div className="max-w-md mx-auto pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="rounded-2xl border border-border bg-white dark:bg-slate-800/60 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10">
              <Lock className="h-6 w-6 text-rose-600 dark:text-rose-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Fechar Caixa</h1>
              <p className="text-sm text-muted-foreground">
                Terminal: {terminal.terminalName}
              </p>
            </div>
          </div>

          {/* Session Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 p-3">
              <p className="text-muted-foreground">Troco inicial</p>
              <p className="font-mono font-semibold">
                {formatCurrency(currentSession.openingBalance)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 p-3">
              <p className="text-muted-foreground">Aberta em</p>
              <p className="font-semibold">
                {new Date(currentSession.openedAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Session Summary */}
          {summaryLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : summary ? (
            <div className="space-y-3">
              {/* Sales stats */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Resumo da sessão</span>
                <Badge variant="secondary">
                  {summary.transactionCount} venda(s)
                </Badge>
              </div>

              {/* Payment breakdown */}
              {summary.paymentBreakdown.length > 0 && (
                <div className="space-y-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Recebimentos por método
                  </p>
                  {summary.paymentBreakdown.map(item => {
                    const config = METHOD_LABELS[item.method] ?? {
                      label: item.method,
                      icon: Wallet,
                    };
                    const Icon = config.icon;
                    return (
                      <div
                        key={item.method}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {config.label}
                          <span className="text-xs text-muted-foreground">
                            ({item.count}x)
                          </span>
                        </span>
                        <span className="font-mono text-sm font-semibold">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t border-border pt-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Total vendas</span>
                    <span className="font-mono text-sm font-bold">
                      {formatCurrency(summary.totalSales)}
                    </span>
                  </div>
                </div>
              )}

              {/* Movements */}
              {(summary.totalSupplies > 0 || summary.totalWithdrawals > 0) && (
                <div className="space-y-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Movimentações de caixa
                  </p>
                  {summary.totalSupplies > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <ArrowDownCircle className="h-3.5 w-3.5" />
                        Suprimentos
                      </span>
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                        +{formatCurrency(summary.totalSupplies)}
                      </span>
                    </div>
                  )}
                  {summary.totalWithdrawals > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                        Sangrias
                      </span>
                      <span className="font-mono font-semibold text-rose-700 dark:text-rose-300">
                        -{formatCurrency(summary.totalWithdrawals)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Expected cash */}
              <div className="flex items-center justify-between rounded-lg border-2 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-500/10 p-3">
                <span className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-300">
                  <Banknote className="h-4 w-4" />
                  Saldo esperado (dinheiro)
                </span>
                <span className="font-mono text-lg font-bold text-violet-700 dark:text-violet-300">
                  {formatCurrency(summary.expectedCashBalance)}
                </span>
              </div>

              {summary.cancelledCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {summary.cancelledCount} venda(s) cancelada(s) nesta sessão
                </p>
              )}
            </div>
          ) : null}

          {/* Closing Balance Input */}
          <div className="space-y-2">
            <Label>Saldo de fechamento</Label>
            <div className="rounded-xl border border-border bg-slate-50 dark:bg-slate-900/40 px-4 py-5 text-center">
              <p className="text-3xl font-bold font-mono">
                {formatCurrency(closingCents / 100)}
              </p>
            </div>
          </div>

          <Numpad value={closingCents} onChange={setClosingCents} />

          {/* Difference preview */}
          {summary && closingCents > 0 && (
            <DifferencePreview
              expected={summary.expectedCashBalance}
              closing={closingCents / 100}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas sobre o fechamento..."
              rows={3}
            />
          </div>

          <Button
            type="button"
            variant="destructive"
            className="w-full h-12 text-base"
            onClick={handleClose}
            disabled={closeSession.isPending}
          >
            {closeSession.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fechando...
              </>
            ) : (
              'Confirmar Fechamento'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DifferencePreview({
  expected,
  closing,
}: {
  expected: number;
  closing: number;
}) {
  const diff = closing - expected;
  const isExact = Math.abs(diff) < 0.01;
  const isOver = diff > 0.01;

  if (isExact) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        <span>Saldo confere com o esperado</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
        isOver
          ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300'
          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
      )}
    >
      {isOver ? (
        <TrendingUp className="h-4 w-4" />
      ) : (
        <TrendingDown className="h-4 w-4" />
      )}
      <span>
        {isOver ? 'Sobra' : 'Falta'} de{' '}
        <strong>{formatCurrency(Math.abs(diff))}</strong>
      </span>
    </div>
  );
}
