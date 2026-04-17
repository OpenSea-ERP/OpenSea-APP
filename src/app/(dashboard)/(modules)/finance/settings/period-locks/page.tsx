/**
 * Period Locks — Fechamento Contábil por mês.
 *
 * Grid calendar (12 meses × anos recentes) em que o usuário trava ou libera
 * um período. Quando um período está travado, tentativas de criar, editar ou
 * excluir lançamentos cujo dueDate cai nele retornam 400 na API.
 */

'use client';

import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  usePeriodLocks,
  useCreatePeriodLock,
  useReleasePeriodLock,
} from '@/hooks/finance/use-period-locks';
import { usePermissions } from '@/hooks/use-permissions';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { MONTH_LABELS_PT_BR } from '@/constants/months';
import { cn } from '@/lib/utils';
import { Lock, LockOpen, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - 4 + i);

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PeriodLocksPage() {
  const { hasPermission } = usePermissions();
  const canLock = hasPermission(FINANCE_PERMISSIONS.PERIOD_LOCKS.REGISTER);
  const canRelease = hasPermission(FINANCE_PERMISSIONS.PERIOD_LOCKS.REMOVE);

  const [year, setYear] = useState(currentYear);
  const [lockDialog, setLockDialog] = useState<{ month: number } | null>(null);
  const [reason, setReason] = useState('');
  const [releaseTarget, setReleaseTarget] = useState<string | null>(null);

  const { data, isLoading } = usePeriodLocks(year);
  const createMutation = useCreatePeriodLock();
  const releaseMutation = useReleasePeriodLock();

  const activeLockByMonth = new Map<number, string>();
  const lockRecords = data?.locks ?? [];
  for (const lock of lockRecords) {
    if (lock.releasedAt === null) activeLockByMonth.set(lock.month, lock.id);
  }

  async function handleCreate() {
    if (!lockDialog) return;
    try {
      await createMutation.mutateAsync({
        year,
        month: lockDialog.month,
        reason: reason.trim() || undefined,
      });
      toast.success(
        `Período ${String(lockDialog.month).padStart(2, '0')}/${year} travado.`
      );
      setLockDialog(null);
      setReason('');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao travar período.';
      toast.error(msg);
    }
  }

  async function handleRelease() {
    if (!releaseTarget) return;
    try {
      await releaseMutation.mutateAsync(releaseTarget);
      toast.success('Período liberado.');
      setReleaseTarget(null);
    } catch {
      toast.error('Erro ao liberar período.');
    }
  }

  return (
    <PageLayout data-testid="period-locks-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Configurações', href: '/finance/settings' },
            { label: 'Fechamento Contábil' },
          ]}
          hasPermission={hasPermission}
        />

        <Header
          title="Fechamento Contábil"
          description="Trave um período contábil para impedir inclusão, edição ou exclusão de lançamentos daquela competência. A liberação da trava fica registrada em auditoria."
        />
      </PageHeader>

      <PageBody>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="space-y-2">
                <Label htmlFor="lock-year">Exercício</Label>
                <Select
                  value={String(year)}
                  onValueChange={v => setYear(Number(v))}
                >
                  <SelectTrigger id="lock-year" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map(y => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground ml-auto">
                {isLoading
                  ? 'Carregando...'
                  : `${activeLockByMonth.size} de 12 meses travados`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Grid 12 meses */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {MONTH_LABELS_PT_BR.map((label, idx) => {
            const month = idx + 1;
            const lockId = activeLockByMonth.get(month);
            const locked = !!lockId;
            return (
              <button
                key={month}
                type="button"
                onClick={() => {
                  if (locked && canRelease) setReleaseTarget(lockId!);
                  else if (!locked && canLock) setLockDialog({ month });
                }}
                className={cn(
                  'rounded-xl border p-4 text-left transition-all cursor-pointer',
                  locked
                    ? 'border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/8 hover:bg-rose-100 dark:hover:bg-rose-500/12'
                    : 'border-border hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5'
                )}
                data-testid={`period-lock-${year}-${String(month).padStart(2, '0')}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {label}/{String(year).slice(-2)}
                  </span>
                  {locked ? (
                    <Lock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <LockOpen className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p
                  className={cn(
                    'mt-2 text-[11px]',
                    locked
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-muted-foreground'
                  )}
                >
                  {locked ? 'Fechado' : 'Aberto'}
                </p>
              </button>
            );
          })}
        </div>

        {/* Audit trail */}
        {lockRecords.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ShieldOff className="h-4 w-4 text-muted-foreground" />
                Histórico do exercício
              </h3>
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {lockRecords.map(lock => {
                  const label = `${MONTH_LABELS_PT_BR[lock.month - 1]}/${lock.year}`;
                  const isActive = lock.releasedAt === null;
                  return (
                    <div
                      key={lock.id}
                      className={cn(
                        'rounded-lg border p-3 flex items-start gap-3',
                        isActive
                          ? 'border-rose-200 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-500/5'
                          : 'border-border bg-muted/20'
                      )}
                    >
                      {isActive ? (
                        <Lock className="h-4 w-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                      ) : (
                        <LockOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {isActive ? 'Fechado' : 'Aberto'}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Trava criada em {formatDateTime(lock.lockedAt)} por{' '}
                          {lock.lockedBy}
                          {lock.reason && ` · Motivo: ${lock.reason}`}
                        </p>
                        {lock.releasedAt && (
                          <p className="text-[11px] text-muted-foreground">
                            Liberado em {formatDateTime(lock.releasedAt)}
                            {lock.releasedBy && ` por ${lock.releasedBy}`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lock dialog */}
        <Dialog
          open={!!lockDialog}
          onOpenChange={open => !open && setLockDialog(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Travar{' '}
                {lockDialog ? MONTH_LABELS_PT_BR[lockDialog.month - 1] : ''}/
                {year}
              </DialogTitle>
              <DialogDescription>
                Uma vez travado, não será possível criar, editar ou excluir
                lançamentos cujo vencimento esteja nesse mês. Você pode liberar
                o período novamente quando necessário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="lock-reason">Motivo (opcional)</Label>
              <Input
                id="lock-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ex: Fechamento contábil enviado ao contador"
                maxLength={500}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setLockDialog(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Travando...' : 'Travar período'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Release PIN */}
        <VerifyActionPinModal
          isOpen={!!releaseTarget}
          onClose={() => setReleaseTarget(null)}
          onSuccess={handleRelease}
          title="Liberar período"
          description="Digite seu PIN de ação para liberar o período. Isso permitirá novamente a edição dos lançamentos dessa competência."
        />
      </PageBody>
    </PageLayout>
  );
}
