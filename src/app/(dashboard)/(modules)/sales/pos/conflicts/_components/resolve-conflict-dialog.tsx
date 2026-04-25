'use client';

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
import { useResolveConflict } from '@/hooks/sales/use-pos-conflicts';
import type { ResolveConflictAction } from '@/types/sales';

const ACTION_LABELS: Record<ResolveConflictAction, string> = {
  CANCEL_AND_REFUND: 'Cancelar venda e estornar',
  FORCE_ADJUSTMENT: 'Forçar ajuste com discrepância',
  SUBSTITUTE_ITEM: 'Substituir manualmente',
};

const ACTION_DESCRIPTIONS: Record<ResolveConflictAction, string> = {
  CANCEL_AND_REFUND:
    'Cancela o pedido associado e estorna o pagamento. Use quando não há solução possível.',
  FORCE_ADJUSTMENT:
    'Confirma a baixa de estoque mesmo com discrepância. O sistema registra a divergência para conferência posterior.',
  SUBSTITUTE_ITEM:
    'Permite informar IDs de itens alternativos. A venda é registrada com os itens substitutos.',
};

interface ResolveConflictDialogProps {
  conflictId: string;
  action: ResolveConflictAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved?: () => void;
}

export function ResolveConflictDialog({
  conflictId,
  action,
  open,
  onOpenChange,
  onResolved,
}: ResolveConflictDialogProps) {
  const [notes, setNotes] = useState('');
  const [substituteItems, setSubstituteItems] = useState('');
  const resolve = useResolveConflict();

  const handleSubmit = () => {
    const substituteItemIds =
      action === 'SUBSTITUTE_ITEM'
        ? substituteItems
            .split(/[\n,]+/)
            .map(s => s.trim())
            .filter(Boolean)
        : undefined;

    resolve.mutate(
      {
        id: conflictId,
        payload: {
          action,
          notes: notes.trim() || undefined,
          substituteItemIds,
        },
      },
      {
        onSuccess: () => {
          setNotes('');
          setSubstituteItems('');
          onOpenChange(false);
          onResolved?.();
        },
      }
    );
  };

  const isInvalid =
    action === 'SUBSTITUTE_ITEM' &&
    substituteItems
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean).length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        data-testid="resolve-conflict-dialog"
      >
        <DialogHeader>
          <DialogTitle>{ACTION_LABELS[action]}</DialogTitle>
          <DialogDescription>{ACTION_DESCRIPTIONS[action]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {action === 'SUBSTITUTE_ITEM' && (
            <div className="space-y-1.5">
              <Label htmlFor="substitute-items">
                IDs dos itens substitutos
              </Label>
              <Textarea
                id="substitute-items"
                value={substituteItems}
                onChange={e => setSubstituteItems(e.target.value)}
                placeholder="Cole os UUIDs dos itens substitutos, um por linha ou separados por vírgula."
                rows={4}
                data-testid="resolve-substitute-items"
              />
              <p className="text-xs text-muted-foreground">
                Informe pelo menos um item. Os IDs devem corresponder a itens da
                mesma zona do terminal.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="resolve-notes">
              Observações (opcional, registradas em auditoria)
            </Label>
            <Textarea
              id="resolve-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex.: cliente concordou com substituição."
              rows={3}
              maxLength={2000}
              data-testid="resolve-notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={resolve.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={resolve.isPending || isInvalid}
            data-testid="resolve-conflict-confirm"
          >
            {resolve.isPending ? 'Resolvendo…' : 'Confirmar resolução'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
