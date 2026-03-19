/**
 * ItemRow - Item card for the management modal
 * Clean card design with status indicator, code, location, quantity, and hover actions.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatQuantity } from '@/helpers/formatters';
import { cn } from '@/lib/utils';
import type { Item, TemplateAttribute } from '@/types/stock';
import { Copy, LogOut, MapPin, Printer } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { toast } from 'sonner';

const EXIT_REASON_BADGE: Record<string, { label: string; className: string }> =
  {
    SALE: {
      label: 'Vendido',
      className:
        'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    },
    SUPPLIER_RETURN: {
      label: 'Devolvido',
      className:
        'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    },
    INTERNAL_USE: {
      label: 'Utilizado',
      className:
        'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    },
    LOSS: {
      label: 'Perdido',
      className:
        'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    },
    PRODUCTION: {
      label: 'Utilizado',
      className:
        'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    },
    SAMPLE: {
      label: 'Amostra',
      className:
        'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
    },
  };

const STATUS_INDICATOR: Record<string, { color: string; label: string }> = {
  AVAILABLE: { color: 'bg-emerald-500', label: 'Disponível' },
  RESERVED: { color: 'bg-amber-500', label: 'Reservado' },
  IN_TRANSIT: { color: 'bg-blue-500', label: 'Em Trânsito' },
  DAMAGED: { color: 'bg-rose-500', label: 'Danificado' },
  EXPIRED: { color: 'bg-rose-500', label: 'Expirado' },
  DISPOSED: { color: 'bg-gray-400', label: 'Descartado' },
};

export interface ItemRowProps {
  item: Item;
  unitLabel?: string;
  itemAttributes?: Record<string, TemplateAttribute>;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  onPrint?: (item: Item) => void;
  onExit?: (item: Item) => void;
  lastExitReasonCode?: string;
}

export function ItemRow({
  item,
  unitLabel = 'un',
  isSelected = false,
  onClick,
  onDoubleClick,
  onPrint,
  onExit,
  lastExitReasonCode,
}: ItemRowProps) {
  const isExited = item.currentQuantity === 0;
  const exitBadge = isExited
    ? EXIT_REASON_BADGE[lastExitReasonCode || ''] || {
        label: 'Saiu',
        className:
          'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30',
      }
    : null;

  const locationAddress =
    item.bin?.address || item.resolvedAddress || item.binId || item.locationId;
  const itemCode = item.fullCode || item.uniqueCode || item.id.substring(0, 8);
  const statusInfo =
    STATUS_INDICATOR[item.status] || STATUS_INDICATOR.AVAILABLE;
  const showStatus = item.status !== 'AVAILABLE';

  const locationUrl = useMemo(() => {
    if (
      item.bin?.id &&
      item.bin?.zone?.id &&
      item.bin?.zone?.warehouseId &&
      typeof item.bin.zone.warehouseId === 'string' &&
      item.bin.zone.warehouseId.length === 36
    ) {
      const { warehouseId, id: zoneId } = item.bin.zone;
      const binId = item.bin.id;
      return `/stock/locations/${warehouseId}?zone=${zoneId}&highlight=${binId}&item=${item.id}`;
    }
    return null;
  }, [item.bin]);

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(itemCode);
      toast.success('Código copiado!');
    } catch {
      toast.error('Erro ao copiar código');
    }
  };

  const handleLocationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 select-none',
        isExited
          ? 'bg-muted/30 border-border/40 opacity-50 cursor-default'
          : isSelected
            ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500/40 cursor-pointer'
            : 'hover:bg-muted/40 border-border/60 cursor-pointer'
      )}
      onClick={isExited ? undefined : onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Status indicator dot */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'shrink-0 w-2 h-2 rounded-full',
                isExited ? 'bg-gray-300 dark:bg-gray-600' : statusInfo.color
              )}
            />
          </TooltipTrigger>
          <TooltipContent>
            {isExited ? exitBadge?.label : statusInfo.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Code + location */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-medium truncate">
            {itemCode}
          </span>
          {isExited && exitBadge && (
            <Badge
              variant="outline"
              className={cn('text-[9px] h-4 px-1 border', exitBadge.className)}
            >
              {exitBadge.label}
            </Badge>
          )}
          {showStatus && !isExited && (
            <Badge variant="outline" className="text-[9px] h-4 px-1">
              {statusInfo.label}
            </Badge>
          )}
        </div>
        {locationAddress && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
            {locationUrl ? (
              <Link
                href={locationUrl}
                target="_blank"
                onClick={handleLocationClick}
                className="text-[11px] font-mono text-blue-500 hover:text-blue-600 truncate"
              >
                {locationAddress}
              </Link>
            ) : (
              <span className="text-[11px] font-mono text-muted-foreground truncate">
                {locationAddress}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="shrink-0 text-right">
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            isExited ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {formatQuantity(item.currentQuantity)}
          <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
            {unitLabel}
          </span>
        </span>
      </div>

      {/* Hover actions */}
      {!isExited && (
        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopyCode}
                  aria-label="Copiar código"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar código</TooltipContent>
            </Tooltip>

            {onPrint && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={e => {
                      e.stopPropagation();
                      onPrint(item);
                    }}
                    aria-label="Imprimir etiqueta"
                  >
                    <Printer className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Imprimir etiqueta</TooltipContent>
              </Tooltip>
            )}

            {onExit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    onClick={e => {
                      e.stopPropagation();
                      onExit(item);
                    }}
                    aria-label="Dar saída"
                  >
                    <LogOut className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dar saída</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
