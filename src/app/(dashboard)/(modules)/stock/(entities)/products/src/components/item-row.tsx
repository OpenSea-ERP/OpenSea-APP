/**
 * ItemRow - Item display with selection support
 * Exibe: Code + Copy + Print | Location | Atributos Visíveis | Qty | Saída
 * Suporta seleção com click, ctrl+click, shift+click
 * Items com qty=0 (saídos) mostram badge de motivo e não são interativos
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
import { Copy, LogOut, Printer } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { toast } from 'sonner';

/** Badge config para itens que saíram do estoque (qty=0) */
const EXIT_REASON_BADGE: Record<string, { label: string; className: string }> =
  {
    SALE: {
      label: 'Vendido',
      className:
        'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
    },
    SUPPLIER_RETURN: {
      label: 'Devolvido',
      className:
        'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
    },
    INTERNAL_USE: {
      label: 'Utilizado',
      className:
        'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    },
    LOSS: {
      label: 'Perdido',
      className:
        'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
    },
    PRODUCTION: {
      label: 'Utilizado',
      className:
        'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    },
    SAMPLE: {
      label: 'Amostra',
      className:
        'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
    },
  };

export interface ItemRowProps {
  item: Item;
  unitLabel?: string;
  /** Atributos de item do template (para exibir os visíveis) */
  itemAttributes?: Record<string, TemplateAttribute>;
  /** Se o item está selecionado */
  isSelected?: boolean;
  /** Callback ao clicar no item */
  onClick?: (e: React.MouseEvent) => void;
  /** Callback ao dar double-click no item */
  onDoubleClick?: () => void;
  /** Callback ao clicar no botão de impressão */
  onPrint?: (item: Item) => void;
  /** Callback ao clicar no botão de saída */
  onExit?: (item: Item) => void;
  /** Reason code da última saída (para badge de itens com qty=0) */
  lastExitReasonCode?: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  AVAILABLE: { label: 'Disponível', variant: 'default' },
  RESERVED: { label: 'Reservado', variant: 'secondary' },
  IN_TRANSIT: { label: 'Em Trânsito', variant: 'outline' },
  DAMAGED: { label: 'Danificado', variant: 'destructive' },
  EXPIRED: { label: 'Expirado', variant: 'destructive' },
  DISPOSED: { label: 'Descartado', variant: 'secondary' },
};

export function ItemRow({
  item,
  unitLabel = 'un',
  itemAttributes,
  isSelected = false,
  onClick,
  onDoubleClick,
  onPrint,
  onExit,
  lastExitReasonCode,
}: ItemRowProps) {
  // Item com qty=0 é considerado "saído" - sem ações e não selecionável
  const isExited = item.currentQuantity === 0;
  const exitBadge = isExited
    ? EXIT_REASON_BADGE[lastExitReasonCode || ''] || {
        label: 'Saiu',
        className:
          'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30',
      }
    : null;

  // Resolver endereço da localização: bin.address > resolvedAddress > binId > locationId
  const locationAddress =
    item.bin?.address || item.resolvedAddress || item.binId || item.locationId;

  // Resolver código do item: fullCode > uniqueCode > id (primeiros 8 chars)
  const itemCode = item.fullCode || item.uniqueCode || item.id.substring(0, 8);

  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.AVAILABLE;
  const showStatusBadge = item.status !== 'AVAILABLE';

  // Construir URL da localização
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
      return `/stock/locations/${warehouseId}/zones/${zoneId}?highlight=${binId}`;
    }
    return null;
  }, [item.bin]);

  // Filtrar atributos visíveis (enableView = true)
  const visibleAttributes = useMemo(() => {
    if (!itemAttributes) return [];
    return Object.entries(itemAttributes)
      .filter(([, attr]) => attr.enableView === true)
      .map(([key, attr]) => ({
        key,
        label: attr.label || key,
        unitOfMeasure: attr.unitOfMeasure,
        value: item.attributes?.[key],
      }));
  }, [itemAttributes, item.attributes]);

  // Formatar valor do atributo
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    return String(value);
  };

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
    e.stopPropagation(); // Não propagar para o onClick do row
  };

  const handlePrintClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPrint?.(item);
  };

  const handleExitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExit?.(item);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors select-none',
        isExited
          ? 'bg-muted/50 dark:bg-slate-800/30 border-border opacity-60 cursor-default'
          : isSelected
            ? 'bg-linear-to-r from-blue-100 to-violet-100 dark:from-sky-500/20 dark:to-sky-500/20 border-sky-500 cursor-pointer'
            : 'bg-linear-to-r from-blue-50 to-violet-50 dark:from-slate-800/50 dark:to-slate-800/50 hover:from-blue-100 hover:to-violet-100 dark:hover:from-slate-700/50 dark:hover:to-slate-700/50 border-border cursor-pointer'
      )}
      onClick={isExited ? undefined : onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Column 1: Code + Copy + Print + Status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-mono text-sm truncate">{itemCode}</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-6 w-6 opacity-50 hover:opacity-100"
                  onClick={handleCopyCode}
                  aria-label="Copiar código"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar código</TooltipContent>
            </Tooltip>
            {onPrint && !isExited && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-6 w-6 opacity-50 hover:opacity-100"
                    onClick={handlePrintClick}
                    aria-label="Imprimir etiqueta"
                  >
                    <Printer className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Imprimir etiqueta</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
        {isExited && exitBadge ? (
          <Badge
            variant="outline"
            className={cn('text-xs mt-1 border', exitBadge.className)}
          >
            {exitBadge.label}
          </Badge>
        ) : showStatusBadge ? (
          <Badge variant={statusConfig.variant} className="text-xs mt-1">
            {statusConfig.label}
          </Badge>
        ) : null}
      </div>

      {/* Column 2: Location */}
      <div className="shrink-0">
        <p className="text-[10px] text-muted-foreground">Localização</p>
        <div className="text-sm">
          {locationUrl ? (
            <Link
              href={locationUrl}
              target="_blank"
              onClick={handleLocationClick}
              className="font-mono text-blue-500 hover:text-blue-600 transition-colors"
            >
              {locationAddress || '—'}
            </Link>
          ) : (
            <span className="font-mono text-muted-foreground">
              {locationAddress || '—'}
            </span>
          )}
        </div>
      </div>

      {/* Colunas dinâmicas: Atributos Visíveis (label + valor em duas linhas) */}
      {visibleAttributes.length > 0 && (
        <TooltipProvider>
          <div className="flex items-center gap-3 shrink-0">
            {visibleAttributes.slice(0, 3).map(attr => (
              <div key={attr.key} className="text-center min-w-[60px]">
                <p className="text-[10px] text-muted-foreground truncate">
                  {attr.label}
                  {attr.unitOfMeasure && ` (${attr.unitOfMeasure})`}
                </p>
                <p className="text-xs font-medium truncate max-w-[80px]">
                  {formatValue(attr.value)}
                </p>
              </div>
            ))}
            {visibleAttributes.length > 3 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-muted"
                  >
                    +{visibleAttributes.length - 3}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="p-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {visibleAttributes.slice(3).map(attr => (
                      <div key={attr.key} className="text-left">
                        <p className="text-[10px] text-muted-foreground">
                          {attr.label}
                          {attr.unitOfMeasure && ` (${attr.unitOfMeasure})`}
                        </p>
                        <p className="text-xs font-medium">
                          {formatValue(attr.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      )}

      {/* Column 3: Quantity */}
      <div className="shrink-0 w-20 text-right">
        <p className="text-[10px] text-muted-foreground">{unitLabel}</p>
        <span
          className={cn(
            'text-sm font-medium',
            item.currentQuantity === 0
              ? 'text-muted-foreground'
              : 'text-foreground'
          )}
        >
          {formatQuantity(item.currentQuantity)}
        </span>
      </div>

      {/* Column 4: Exit */}
      {onExit && !isExited && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                onClick={handleExitClick}
                aria-label="Dar saída"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Dar saída</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
