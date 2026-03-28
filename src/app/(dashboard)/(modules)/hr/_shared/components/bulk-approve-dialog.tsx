'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, Loader2 } from 'lucide-react';

interface BulkApproveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  entityLabel: string;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  progress?: { current: number; total: number };
}

export function BulkApproveDialog({
  isOpen,
  onClose,
  count,
  entityLabel,
  onConfirm,
  isPending,
  progress,
}: BulkApproveDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Aprovar em Lote
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPending && progress ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aprovando {progress.current} de {progress.total}...
              </span>
            ) : (
              <>
                Deseja aprovar{' '}
                <span className="font-semibold text-foreground">
                  {count} {entityLabel}
                </span>
                ? Esta ação não pode ser desfeita.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aprovando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Aprovar {count} {entityLabel}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
