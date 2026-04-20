'use client';

/**
 * OpenSea OS - RotateQrConfirmDialog
 *
 * Single-employee QR rotation confirmation. AlertDialog-only (no PIN gate —
 * per UI-SPEC §Destructive the blast radius of a single rotation is low).
 * Bulk rotation uses `RotateQrBulkDialog` + `VerifyActionPinModal` instead.
 *
 * Copy is locked verbatim to UI-SPEC §Copywriting §/hr/crachas:
 *   Title: "Rotacionar QR de {employeeName}?"
 *   Body:  "O crachá atual deixará de funcionar imediatamente. O novo QR
 *          aparecerá na próxima emissão."
 *   Primary: "Rotacionar"
 *   Cancel:  "Cancelar"
 */

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
import { Loader2, RefreshCw } from 'lucide-react';

export interface RotateQrConfirmDialogProps {
  isOpen: boolean;
  employeeName: string;
  isRotating?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RotateQrConfirmDialog({
  isOpen,
  employeeName,
  isRotating,
  onClose,
  onConfirm,
}: RotateQrConfirmDialogProps) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={next => {
        if (!next && !isRotating) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Rotacionar QR de {employeeName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            O crachá atual deixará de funcionar imediatamente. O novo QR
            aparecerá na próxima emissão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRotating}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={event => {
              // Prevent the default close-on-click behaviour so the dialog
              // stays open while the mutation runs.
              event.preventDefault();
              onConfirm();
            }}
            disabled={isRotating}
            className="gap-2"
          >
            {isRotating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Rotacionar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
