'use client';

/**
 * OpenSea OS - Reject Request Modal (HR)
 *
 * Modal para rejeitar uma solicitacao com justificativa.
 */

import { useState } from 'react';
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
import { XCircle } from 'lucide-react';
import { useRejectRequest } from '../api';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | null;
}

export function RejectModal({ isOpen, onClose, requestId }: RejectModalProps) {
  const [reason, setReason] = useState('');

  const rejectRequest = useRejectRequest({
    onSuccess: () => {
      setReason('');
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requestId || reason.length < 10) return;

    rejectRequest.mutate({ id: requestId, reason });
  }

  const isValid = reason.length >= 10;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setReason('');
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-rose-500 to-rose-600 p-2 rounded-lg">
              <XCircle className="h-5 w-5" />
            </div>
            Rejeitar Solicitação
          </DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeição. Mínimo de 10 caracteres.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Motivo da Rejeição</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              rows={4}
              required
              minLength={10}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/10 caracteres mínimos
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReason('');
                onClose();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isValid || rejectRequest.isPending}
            >
              {rejectRequest.isPending ? 'Rejeitando...' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RejectModal;
