'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  PackageX,
  Repeat,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { usePermissions } from '@/hooks/use-permissions';
import { usePosConflict } from '@/hooks/sales/use-pos-conflicts';
import { formatDate } from '@/lib/utils';
import type {
  ConflictDetail,
  PosOrderConflictReason,
  ResolveConflictAction,
} from '@/types/sales';
import { ResolveConflictDialog } from './resolve-conflict-dialog';

const REASON_LABELS: Record<PosOrderConflictReason, string> = {
  INSUFFICIENT_STOCK: 'Estoque insuficiente',
  FRACTIONAL_NOT_ALLOWED: 'Venda fracionada não permitida',
  BELOW_MIN_FRACTIONAL_SALE: 'Quantidade abaixo do mínimo fracionado',
  ITEM_NOT_FOUND: 'Item não encontrado',
};

interface ConflictDetailsPanelProps {
  conflictId: string | null;
  onClose: () => void;
}

export function ConflictDetailsPanel({
  conflictId,
  onClose,
}: ConflictDetailsPanelProps) {
  const open = !!conflictId;
  const { data, isLoading, error } = usePosConflict(conflictId);
  const conflict = data?.conflict;
  const [resolveAction, setResolveAction] =
    useState<ResolveConflictAction | null>(null);

  const { hasPermission } = usePermissions();
  const canResolve = hasPermission('sales.pos.conflicts-resolve');

  return (
    <Sheet
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto"
        data-testid="conflict-details-panel"
      >
        <SheetHeader>
          <SheetTitle>Detalhes do conflito</SheetTitle>
          <SheetDescription>
            Informações completas sobre o conflito de venda e ações disponíveis
            para resolução.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !conflict ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            <strong>Erro:</strong>{' '}
            {error instanceof Error
              ? error.message
              : 'Conflito não encontrado.'}
          </div>
        ) : (
          <div className="space-y-6 py-2">
            <div className="grid gap-3 rounded-lg border border-border bg-white p-4 dark:bg-white/5">
              <Row label="Terminal" value={conflict.terminalName} />
              <Row
                label="Operador"
                value={
                  <span>
                    {conflict.operatorName || '—'}{' '}
                    {conflict.operatorShortId && (
                      <span className="font-mono tracking-widest text-xs text-muted-foreground">
                        {conflict.operatorShortId}
                      </span>
                    )}
                  </span>
                }
              />
              <Row
                label="ID local da venda"
                value={
                  <span className="font-mono text-xs">
                    {conflict.saleLocalUuid}
                  </span>
                }
              />
              <Row label="Criado em" value={formatDate(conflict.createdAt)} />
              {conflict.resolvedAt && (
                <Row
                  label="Resolvido em"
                  value={formatDate(conflict.resolvedAt)}
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-semibold">Itens em conflito</h3>
              </div>
              <ul className="space-y-2">
                {conflict.conflictDetails.map((detail, idx) => (
                  <ConflictDetailRow key={idx} detail={detail} />
                ))}
              </ul>
            </div>

            {conflict.status === 'PENDING_RESOLUTION' && canResolve && (
              <div className="space-y-2">
                <h3 className="text-base font-semibold">Ações de resolução</h3>
                <p className="text-sm text-muted-foreground">
                  Escolha uma ação. Toda resolução é registrada em auditoria.
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setResolveAction('CANCEL_AND_REFUND')}
                    data-testid="conflict-action-cancel"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar e estornar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setResolveAction('FORCE_ADJUSTMENT')}
                    data-testid="conflict-action-force"
                  >
                    <PackageX className="h-4 w-4" />
                    Forçar ajuste
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setResolveAction('SUBSTITUTE_ITEM')}
                    data-testid="conflict-action-substitute"
                  >
                    <Repeat className="h-4 w-4" />
                    Substituir item
                  </Button>
                </div>
              </div>
            )}

            {conflict.status === 'PENDING_RESOLUTION' && !canResolve && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Você não tem a permissão{' '}
                <code className="font-mono">sales.pos.conflicts-resolve</code>{' '}
                para resolver este conflito. Solicite ao administrador.
              </div>
            )}

            {conflict.status !== 'PENDING_RESOLUTION' && (
              <div className="space-y-2">
                <h3 className="text-base font-semibold">
                  Resolução já registrada
                </h3>
                <Badge variant="outline">{conflict.status}</Badge>
                {conflict.resolvedByUserId && (
                  <p className="text-sm text-muted-foreground">
                    Resolvido pelo usuário{' '}
                    <span className="font-mono">
                      {conflict.resolvedByUserId}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {conflict && resolveAction && (
          <ResolveConflictDialog
            conflictId={conflict.id}
            action={resolveAction}
            open
            onOpenChange={isOpen => {
              if (!isOpen) setResolveAction(null);
            }}
            onResolved={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

function ConflictDetailRow({ detail }: { detail: ConflictDetail }) {
  return (
    <li className="rounded-lg border border-border bg-white p-3 text-sm dark:bg-white/5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Badge variant="outline">{REASON_LABELS[detail.reason]}</Badge>
        <span className="text-xs text-muted-foreground">
          item <span className="font-mono">{detail.itemId.slice(0, 8)}…</span>
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">
            {detail.requestedQuantity}
          </strong>{' '}
          solicitado
        </span>
        <span>
          <strong className="text-foreground">
            {detail.availableQuantity}
          </strong>{' '}
          disponível
        </span>
        <span>
          <strong className="text-foreground">{detail.shortage}</strong> em
          falta
        </span>
      </div>
    </li>
  );
}
