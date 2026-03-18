'use client';

import React, { useState, useCallback } from 'react';
import {
  ArrowRight,
  Package,
  MapPin,
  AlertTriangle,
  Loader2,
  MoveRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { BinSelector } from '../components/bin-selector';
import type { BinItem, Bin } from '@/types/stock';

export interface MoveItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BinItem;
  currentBin: Bin;
  onMove: (
    itemId: string,
    targetBinAddress: string,
    quantity: number
  ) => Promise<void>;
}

export function MoveItemModal({
  open,
  onOpenChange,
  item,
  currentBin,
  onMove,
}: MoveItemModalProps) {
  const [targetAddress, setTargetAddress] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(item.quantity);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate quantity
  const isValidQuantity = quantity > 0 && quantity <= item.quantity;
  const isPartialMove = quantity < item.quantity;

  // Handle move
  const handleMove = useCallback(async () => {
    if (!targetAddress || !isValidQuantity) return;

    // Can't move to same bin
    if (targetAddress === currentBin.address) {
      setError('Não é possível mover para a mesma localização');
      return;
    }

    setIsMoving(true);
    setError(null);

    try {
      await onMove(item.id, targetAddress, quantity);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover item');
    } finally {
      setIsMoving(false);
    }
  }, [
    targetAddress,
    quantity,
    isValidQuantity,
    currentBin.address,
    item.id,
    onMove,
    onOpenChange,
  ]);

  // Handle target change
  const handleTargetChange = useCallback((address: string | null) => {
    setTargetAddress(address);
    setError(null);
  }, []);

  // Reset state when modal closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setTargetAddress(null);
        setQuantity(item.quantity);
        setError(null);
      }
      onOpenChange(newOpen);
    },
    [item.quantity, onOpenChange]
  );

  const canMove =
    targetAddress && isValidQuantity && targetAddress !== currentBin.address;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoveRight className="h-5 w-5" />
            Mover Item
          </DialogTitle>
          <DialogDescription>
            Mova este item para outra localização
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Item info */}
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.productName}</div>
              {item.variantName && (
                <div className="text-sm text-muted-foreground truncate">
                  {item.variantName}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-mono text-xs">
                  {item.sku}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Qtd: <strong>{item.quantity}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Movement visualization */}
          <div className="flex items-center gap-4">
            {/* From */}
            <div className="flex-1 p-3 border rounded-lg text-center">
              <div className="text-xs text-muted-foreground mb-1">De</div>
              <div className="font-mono font-medium text-lg">
                {currentBin.address}
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

            {/* To */}
            <div
              className={cn(
                'flex-1 p-3 border rounded-lg text-center',
                targetAddress ? 'border-primary bg-primary/5' : 'border-dashed'
              )}
            >
              <div className="text-xs text-muted-foreground mb-1">Para</div>
              <div className="font-mono font-medium text-lg">
                {targetAddress || '???'}
              </div>
            </div>
          </div>

          <Separator />

          {/* Target bin selector */}
          <BinSelector
            label="Localização de destino"
            value={targetAddress || undefined}
            onChange={handleTargetChange}
            placeholder="Selecione a localização de destino"
            onlyAvailable
            required
            error={!!error && !targetAddress}
          />

          {/* Quantity (for partial moves) */}
          {item.quantity > 1 && (
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantidade a mover
                <span className="text-muted-foreground font-normal ml-1">
                  (máx: {item.quantity})
                </span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={item.quantity}
                value={quantity}
                onChange={e =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className={cn(!isValidQuantity && 'border-destructive')}
              />
              {isPartialMove && (
                <p className="text-xs text-muted-foreground">
                  {item.quantity - quantity} unidade(s) permanecerá(ão) em{' '}
                  <span className="font-mono">{currentBin.address}</span>
                </p>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Same bin warning */}
          {targetAddress === currentBin.address && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                O item já está nesta localização
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isMoving}
          >
            Cancelar
          </Button>
          <Button onClick={handleMove} disabled={!canMove || isMoving}>
            {isMoving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Movendo...
              </>
            ) : (
              <>
                <MoveRight className="h-4 w-4 mr-2" />
                Mover {quantity > 1 ? `${quantity} unidades` : 'item'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
