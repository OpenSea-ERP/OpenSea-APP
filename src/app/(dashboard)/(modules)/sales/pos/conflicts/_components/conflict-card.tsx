'use client';

import {
  AlertTriangle,
  ArrowRight,
  MonitorSmartphone,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type {
  PosOrderConflictEnriched,
  PosOrderConflictStatus,
} from '@/types/sales';

const STATUS_BADGE: Record<
  PosOrderConflictStatus,
  { label: string; className: string }
> = {
  PENDING_RESOLUTION: {
    label: 'Pendente',
    className:
      'border-amber-600/25 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  },
  AUTO_SUBSTITUTED: {
    label: 'Substituição automática',
    className:
      'border-sky-600/25 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
  },
  AUTO_ADJUSTED: {
    label: 'Ajuste automático',
    className:
      'border-sky-600/25 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
  },
  CANCELED_REFUNDED: {
    label: 'Cancelado com estorno',
    className:
      'border-rose-600/25 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
  },
  FORCED_ADJUSTMENT: {
    label: 'Ajuste manual forçado',
    className:
      'border-purple-600/25 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300',
  },
  ITEM_SUBSTITUTED_MANUAL: {
    label: 'Substituição manual',
    className:
      'border-emerald-600/25 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  EXPIRED: {
    label: 'Expirado',
    className:
      'border-gray-300 bg-gray-100 text-gray-600 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-gray-400',
  },
};

interface ConflictCardProps {
  conflict: PosOrderConflictEnriched;
  onSelect: () => void;
}

export function ConflictCard({ conflict, onSelect }: ConflictCardProps) {
  const status = STATUS_BADGE[conflict.status];
  const itemsCount = conflict.conflictDetails.length;

  return (
    <Card
      className="bg-white dark:bg-white/5 border border-border overflow-hidden py-0"
      data-testid={`conflict-card-${conflict.id}`}
    >
      <div className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-[16rem] space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(conflict.createdAt)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <MonitorSmartphone className="h-4 w-4" />
              {conflict.terminalName}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <User className="h-4 w-4" />
              {conflict.operatorName || 'Operador desconhecido'}
              {conflict.operatorShortId && (
                <>
                  {' '}
                  <span className="font-mono tracking-widest">
                    {conflict.operatorShortId}
                  </span>
                </>
              )}
            </span>
          </div>

          <p className="text-sm">
            <strong>{itemsCount}</strong> {itemsCount === 1 ? 'item' : 'itens'}{' '}
            em conflito · ID local{' '}
            <span className="font-mono text-xs">{conflict.saleLocalUuid}</span>
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSelect}
          data-testid={`conflict-card-${conflict.id}-open`}
        >
          Ver detalhes
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
