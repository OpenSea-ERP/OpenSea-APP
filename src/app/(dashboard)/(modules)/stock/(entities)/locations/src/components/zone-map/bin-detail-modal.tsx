'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useMediaQuery } from '@/hooks';
import {
  ArrowRightLeft,
  Check,
  Copy,
  Eye,
  Lock,
  Package,
  Printer,
  Tag,
  Unlock,
} from 'lucide-react';
import React from 'react';
import { useBinDetail } from '../../api';
import type { BinItem, BinOccupancy, Zone } from '@/types/stock';
import { formatBinPosition } from '../../utils';

interface BinDetailModalProps {
  bin: BinOccupancy | null;
  zone: Zone;
  isOpen: boolean;
  onClose: () => void;
  onBlock?: () => void;
  onUnblock?: () => void;
  onPrintLabel?: () => void;
  onViewItem?: (item: BinItem) => void;
  onPrintItemLabel?: (item: BinItem) => void;
  onMoveItem?: (item: BinItem) => void;
}

export function BinDetailModal({
  bin,
  zone,
  isOpen,
  onClose,
  onBlock,
  onUnblock,
  onPrintLabel,
  onViewItem,
  onPrintItemLabel,
  onMoveItem,
}: BinDetailModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [copied, setCopied] = React.useState(false);

  // Buscar detalhes completos do bin (com itens)
  const { data: binDetail, isLoading } = useBinDetail(bin?.id || '');

  const handleCopyAddress = () => {
    if (bin?.address) {
      navigator.clipboard.writeText(bin.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Formatar item: Código do Item - Produto Variante (quantidade unidade)
  const formatItemDisplay = (item: BinItem) => {
    const productVariant = item.variantName
      ? `${item.productName} ${item.variantName}`
      : item.productName;
    const unit = item.unitLabel || 'un';
    return `${item.itemCode} - ${productVariant} (${item.quantity} ${unit})`;
  };

  if (!bin) return null;

  const binDirection = zone.structure?.codePattern.binDirection || 'BOTTOM_UP';

  const content = (
    <div className="space-y-4">
      {/* Descrição do nicho */}
      <p className="text-sm text-muted-foreground">
        Corredor {bin.aisle} • Prateleira{' '}
        {bin.shelf.toString().padStart(2, '0')} • Nicho {bin.position} (
        {formatBinPosition(bin.position, binDirection)})
      </p>

      {/* Lista de itens */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : binDetail?.items && binDetail.items.length > 0 ? (
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {binDetail.items.map(item => (
              <div key={item.id} className="p-3 rounded-lg border bg-card">
                <p
                  className="text-sm font-medium mb-2 truncate"
                  title={formatItemDisplay(item)}
                >
                  {formatItemDisplay(item)}
                </p>
                <div className="flex items-center gap-2">
                  {onViewItem && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onViewItem(item)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Visualizar
                    </Button>
                  )}
                  {onPrintItemLabel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onPrintItemLabel(item)}
                    >
                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                      Etiqueta
                    </Button>
                  )}
                  {onMoveItem && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onMoveItem(item)}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                      Movimentar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhum item neste nicho
          </p>
        </div>
      )}

      {/* Ações do nicho */}
      {(onPrintLabel || onBlock || onUnblock) && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-2">
            {onPrintLabel && (
              <Button variant="outline" size="sm" onClick={onPrintLabel}>
                <Tag className="h-4 w-4 mr-2" />
                Etiqueta do Nicho
              </Button>
            )}

            {bin.isBlocked
              ? onUnblock && (
                  <Button variant="outline" size="sm" onClick={onUnblock}>
                    <Unlock className="h-4 w-4 mr-2" />
                    Desbloquear
                  </Button>
                )
              : onBlock && (
                  <Button variant="outline" size="sm" onClick={onBlock}>
                    <Lock className="h-4 w-4 mr-2" />
                    Bloquear
                  </Button>
                )}
          </div>
        </>
      )}
    </div>
  );

  const itemCountBadge =
    bin.itemCount > 0 ? (
      <Badge variant="secondary" className="ml-2">
        {bin.itemCount} {bin.itemCount === 1 ? 'item' : 'itens'}
      </Badge>
    ) : (
      <Badge variant="outline" className="ml-2 text-muted-foreground">
        vazio
      </Badge>
    );

  // Usar Drawer no mobile, Dialog no desktop
  if (!isDesktop) {
    return (
      <Drawer open={isOpen} onOpenChange={open => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center">
              <DrawerTitle className="font-mono">{bin.address}</DrawerTitle>
              {itemCountBadge}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-2"
                onClick={handleCopyAddress}
                aria-label="Copiar endereço"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </DrawerHeader>
          <div className="px-4 pb-6">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center">
            <DialogTitle className="font-mono">{bin.address}</DialogTitle>
            {itemCountBadge}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-2"
              onClick={handleCopyAddress}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
