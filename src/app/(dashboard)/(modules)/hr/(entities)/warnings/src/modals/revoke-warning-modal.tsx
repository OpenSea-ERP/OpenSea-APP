/**
 * Revoke Warning Modal
 * Modal para revogar advertência com motivo obrigatório
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRevokeWarning } from '../api';

interface RevokeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  warningId: string | null;
}

export function RevokeWarningModal({
  isOpen,
  onClose,
  warningId,
}: RevokeWarningModalProps) {
  const [revokeReason, setRevokeReason] = useState('');
  const revokeWarning = useRevokeWarning();

  const handleClose = () => {
    setRevokeReason('');
    onClose();
  };

  const handleRevoke = async () => {
    if (!warningId) return;
    if (!revokeReason || revokeReason.length < 10) {
      toast.error('O motivo da revogação deve ter no mínimo 10 caracteres');
      return;
    }

    try {
      await revokeWarning.mutateAsync({
        id: warningId,
        data: { revokeReason },
      });
      handleClose();
    } catch {
      // toast handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-rose-500" />
            Revogar Advertência
          </DialogTitle>
          <DialogDescription>
            Informe o motivo da revogação. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Motivo da Revogação <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              placeholder="Explique o motivo da revogação (mín. 10 caracteres)"
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              rows={4}
            />
            {revokeReason.length > 0 && revokeReason.length < 10 && (
              <p className="text-xs text-rose-500">
                Mínimo de 10 caracteres ({revokeReason.length}/10)
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={
              revokeWarning.isPending ||
              !revokeReason ||
              revokeReason.length < 10
            }
          >
            {revokeWarning.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Revogando...
              </span>
            ) : (
              'Revogar Advertência'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
