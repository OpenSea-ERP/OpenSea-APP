'use client';

import React, { useState, useCallback } from 'react';
import { Lock, Unlock, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Bin } from '@/types/stock';

export interface BlockBinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bin: Bin;
  onBlock: (binId: string, reason?: string) => Promise<void>;
  onUnblock: (binId: string) => Promise<void>;
}

export function BlockBinModal({
  open,
  onOpenChange,
  bin,
  onBlock,
  onUnblock,
}: BlockBinModalProps) {
  const [reason, setReason] = useState(bin.blockReason || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);

  const isBlocked = bin.isBlocked;
  const hasItems = bin.currentOccupancy > 0;

  // Handle block
  const handleBlock = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onBlock(bin.id, reason.trim() || undefined);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao bloquear localização'
      );
    } finally {
      setIsLoading(false);
    }
  }, [bin.id, reason, onBlock, onOpenChange]);

  // Handle unblock
  const handleUnblock = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onUnblock(bin.id);
      setShowUnblockConfirm(false);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao desbloquear localização'
      );
    } finally {
      setIsLoading(false);
    }
  }, [bin.id, onUnblock, onOpenChange]);

  // Reset state when modal closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setReason(bin.blockReason || '');
        setError(null);
      }
      onOpenChange(newOpen);
    },
    [bin.blockReason, onOpenChange]
  );

  if (isBlocked) {
    // Unblock mode
    return (
      <>
        <Dialog
          open={open && !showUnblockConfirm}
          onOpenChange={handleOpenChange}
        >
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-500" />
                Localização Bloqueada
              </DialogTitle>
              <DialogDescription>
                Esta localização está bloqueada e não pode receber novos itens
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Bin info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-mono font-medium text-lg">
                    {bin.address}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {bin.currentOccupancy} item(ns)
                  </div>
                </div>
                <Badge variant="destructive">Bloqueado</Badge>
              </div>

              {/* Block reason */}
              {bin.blockReason && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Motivo do bloqueio
                  </Label>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {bin.blockReason}
                  </div>
                </div>
              )}

              {/* Warning about items */}
              {hasItems && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Esta localização possui {bin.currentOccupancy} item(ns). Ao
                    desbloquear, ela poderá receber novos itens novamente.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Fechar
              </Button>
              <Button
                variant="default"
                onClick={() => setShowUnblockConfirm(true)}
                disabled={isLoading}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Desbloquear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unblock confirmation */}
        <AlertDialog
          open={showUnblockConfirm}
          onOpenChange={setShowUnblockConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desbloquear localização?</AlertDialogTitle>
              <AlertDialogDescription>
                A localização{' '}
                <strong className="font-mono">{bin.address}</strong> será
                desbloqueada e poderá receber novos itens.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleUnblock} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Desbloqueando...
                  </>
                ) : (
                  'Desbloquear'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Block mode
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Bloquear Localização
          </DialogTitle>
          <DialogDescription>
            Bloqueie esta localização para impedir novos armazenamentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bin info */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="font-mono font-medium text-lg">{bin.address}</div>
              <div className="text-sm text-muted-foreground">
                {bin.currentOccupancy} item(ns)
              </div>
            </div>
            <Badge variant="outline">Ativo</Badge>
          </div>

          {/* Warning about items */}
          {hasItems && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta localização possui {bin.currentOccupancy} item(ns). Os
                itens permanecerão no local, mas não será possível adicionar
                novos.
              </AlertDescription>
            </Alert>
          )}

          {/* Block reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do bloqueio (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Manutenção, Inventário, Danos estruturais..."
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleBlock}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Bloqueando...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Bloquear
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
