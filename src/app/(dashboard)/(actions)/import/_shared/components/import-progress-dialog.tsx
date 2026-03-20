'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Package,
} from 'lucide-react';
import type { ImportProgress } from '../types';
import { cn } from '@/lib/utils';

interface ImportProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: ImportProgress;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onClose: () => void;
  entityLabel: string;
}

export function ImportProgressDialog({
  open,
  onOpenChange,
  progress,
  onCancel,
  onClose,
  entityLabel,
}: ImportProgressDialogProps) {
  const progressPercentage =
    progress.total > 0
      ? Math.round((progress.processed / progress.total) * 100)
      : 0;

  const isProcessing =
    progress.status === 'importing' || progress.status === 'validating';
  const isPaused = progress.status === 'paused';
  const isFinished =
    progress.status === 'completed' ||
    progress.status === 'failed' ||
    progress.status === 'cancelled';
  const canClose = !isProcessing && !isPaused;

  const getStatusText = () => {
    switch (progress.status) {
      case 'idle':
        return 'Preparando...';
      case 'validating':
        return 'Validando dados...';
      case 'validated':
        return 'Dados validados';
      case 'importing':
        return `Importando item ${progress.processed} de ${progress.total}...`;
      case 'paused':
        return 'Importação pausada';
      case 'completed':
        return 'Importação concluída';
      case 'failed':
        return 'Importação falhou';
      case 'cancelled':
        return 'Importação cancelada';
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'paused':
        return <Package className="w-5 h-5 text-amber-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  // Elapsed time
  const elapsed = progress.startedAt
    ? Math.round(
        ((progress.completedAt
          ? new Date(progress.completedAt).getTime()
          : Date.now()) -
          new Date(progress.startedAt).getTime()) /
          1000
      )
    : 0;
  const elapsedStr =
    elapsed >= 60
      ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
      : `${elapsed}s`;

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        onPointerDownOutside={e => !canClose && e.preventDefault()}
        onEscapeKeyDown={e => !canClose && e.preventDefault()}
      >
        {/* Header — compact */}
        <div className="px-5 pt-4 pb-3">
          <DialogTitle className="flex items-center gap-2.5 text-base">
            {getStatusIcon()}
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{getStatusText()}</div>
              {!isFinished && (
                <div className="text-xs text-muted-foreground font-normal mt-0.5">
                  {entityLabel} — {elapsedStr} decorridos
                </div>
              )}
            </div>
            {isFinished && (
              <span className="text-xs text-muted-foreground font-normal">
                {elapsedStr}
              </span>
            )}
          </DialogTitle>
        </div>

        {/* Progress bar — prominent like Windows */}
        <div className="px-5 pb-4">
          <Progress
            value={progressPercentage}
            className={cn(
              'h-3 rounded-full',
              progress.status === 'completed' && '[&>div]:bg-emerald-500',
              progress.status === 'failed' && '[&>div]:bg-rose-500',
              progress.status === 'cancelled' && '[&>div]:bg-amber-500'
            )}
          />
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>{progressPercentage}% concluído</span>
            <span>
              {progress.processed} de {progress.total}
            </span>
          </div>
        </div>

        {/* Errors preview — only if errors exist, compact */}
        {progress.errors.length > 0 && (
          <div className="px-5 pb-3">
            <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-2.5 max-h-24 overflow-y-auto">
              {progress.errors.slice(0, 5).map((error, index) => (
                <div
                  key={index}
                  className="text-xs text-rose-700 dark:text-rose-300 py-0.5"
                >
                  <span className="font-medium">Linha {error.row}:</span>{' '}
                  {error.message}
                </div>
              ))}
              {progress.errors.length > 5 && (
                <div className="text-xs text-rose-500 font-medium pt-1">
                  ...e mais {progress.errors.length - 5} erros
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer — stats + action */}
        <div className="px-5 py-3 border-t bg-muted/30 flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium">{progress.successful}</span>
              <span className="text-muted-foreground">sucesso</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="font-medium">{progress.failed}</span>
              <span className="text-muted-foreground">erros</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="font-medium">
                {progress.total - progress.processed}
              </span>
              <span className="text-muted-foreground">restantes</span>
            </span>
          </div>

          {/* Action button */}
          {(isProcessing || isPaused) && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950/30"
              onClick={onCancel}
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Cancelar
            </Button>
          )}
          {canClose && (
            <Button size="sm" className="h-8 px-3" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
