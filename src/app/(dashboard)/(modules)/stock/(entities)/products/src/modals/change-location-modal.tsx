/**
 * ChangeLocationModal - Modal for changing item location (stock transfer)
 */

'use client';

import { getUnitAbbreviation } from '@/helpers/formatters';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Item } from '@/types/stock';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Loader2,
  MapPin,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { BinSelector } from '../components/bin-selector';

export interface ChangeLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: Item[];
  onConfirm: (newBinId: string, reason: string) => Promise<void>;
  /** When provided, "Voltar" calls this instead of just closing */
  onBack?: () => void;
}

export function ChangeLocationModal({
  open,
  onOpenChange,
  selectedItems,
  onConfirm,
  onBack,
}: ChangeLocationModalProps) {
  const [newBinId, setNewBinId] = useState('');
  const [newBinAddress, setNewBinAddress] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newBinId) return;

    setIsSubmitting(true);
    try {
      await onConfirm(newBinId, reason);
      onOpenChange(false);
      setNewBinId('');
      setNewBinAddress(null);
      setReason('');
    } catch (error) {
      logger.error(
        'Error changing location',
        error instanceof Error ? error : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setNewBinId('');
      setNewBinAddress(null);
      setReason('');
    }
  };

  // Get unique current locations
  const currentLocations = selectedItems.reduce((acc, item) => {
    const address =
      item.bin?.address || item.resolvedAddress || item.binId || 'N/A';
    if (!acc.includes(address)) acc.push(address);
    return acc;
  }, [] as string[]);

  const totalQuantity = selectedItems.reduce(
    (sum, item) => sum + item.currentQuantity,
    0
  );
  const unitAbbr = getUnitAbbreviation(selectedItems[0]?.templateUnitOfMeasure) || 'un';
  const formattedTotal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(totalQuantity);

  const itemName = selectedItems.length === 1
    ? [selectedItems[0].templateName, selectedItems[0].productName, selectedItems[0].variantName].filter(Boolean).join(' ') || 'Item selecionado'
    : `${selectedItems.length} itens selecionados`;
  const itemCode = selectedItems.length === 1
    ? selectedItems[0].fullCode || selectedItems[0].uniqueCode || ''
    : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" showCloseButton={false}>
        {/* Hero header */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-500/10 dark:to-sky-500/5 border-b border-border px-6 pt-6 pb-5">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-500/15 border border-sky-600/25 dark:border-sky-500/20 shrink-0">
                <ArrowRightLeft className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base">
                  Transferência de Estoque
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  {selectedItems.length === 1
                    ? 'Selecione o novo local para o item.'
                    : `Selecione o novo local para os ${selectedItems.length} itens.`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Item card */}
          <div className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-border">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 dark:bg-sky-500/15 mt-0.5">
              <Package className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <span className="text-sm font-mono font-medium text-foreground truncate block">
                {itemCode || itemName}
              </span>
              {itemCode && (
                <p className="text-xs text-muted-foreground truncate">
                  {itemName}
                </p>
              )}
            </div>
            <div className="bg-white dark:bg-white/5 border border-border rounded-lg px-3 py-1 text-center shrink-0 self-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">Quantidade</div>
              <div className="text-sm font-semibold text-foreground leading-tight">
                {formattedTotal} {unitAbbr}
              </div>
            </div>
          </div>

          {/* Movement: From → To */}
          <div className="flex items-center gap-3">
            <div className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-muted/30 text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">Origem</p>
              <p className="font-mono font-semibold text-sm">
                {currentLocations.length === 1
                  ? currentLocations[0] || '—'
                  : 'Múltiplas origens'}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
            <div
              className={cn(
                'flex-1 px-3 py-2.5 rounded-lg border text-center',
                newBinId
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10'
                  : 'border-dashed border-border'
              )}
            >
              <p className="text-[10px] text-muted-foreground mb-0.5">Destino</p>
              <p className="font-mono font-semibold text-sm">
                {newBinAddress || '—'}
              </p>
            </div>
          </div>

          {/* Destination selector */}
          <div className="space-y-2">
            <Label>Selecionar destino</Label>
            <BinSelector
              value={newBinId}
              onChange={(binId, address) => {
                setNewBinId(binId);
                setNewBinAddress(address ?? null);
              }}
              placeholder="Selecione o nicho de destino..."
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Observação (opcional)
            </Label>
            <Textarea
              id="reason"
              placeholder="Digite uma observação..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                handleClose();
              }
            }}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={handleSubmit} disabled={!newBinId || isSubmitting} className="gap-1.5">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
            Confirmar Transferência
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
