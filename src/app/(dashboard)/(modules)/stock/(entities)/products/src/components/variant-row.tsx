/**
 * VariantRow - Variant card for the management modal
 * Shows: Pattern preview | Name + items badge + Badges | Quantity (right)
 * No edit button (edit lives in variant header).
 * No SKU display (shown in variant header).
 */

'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatQuantity } from '@/helpers/formatters';
import { cn } from '@/lib/utils';
import type { Pattern, Variant } from '@/types/stock';
import { Palette, Slash } from 'lucide-react';

interface VariantRowProps {
  variant: Variant;
  itemsCount?: number;
  totalQuantity?: number;
  unitLabel?: string;
  isSelected?: boolean;
  onClick: () => void;
}

export function VariantRow({
  variant,
  itemsCount = 0,
  totalQuantity = 0,
  unitLabel = 'un',
  isSelected = false,
  onClick,
}: VariantRowProps) {
  const hasPattern = variant.pattern && variant.pattern !== ('none' as string);
  const hasColor = !!variant.colorHex;
  const hasVisual = hasPattern || hasColor;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all duration-200',
        isSelected
          ? 'bg-white dark:bg-white/10 shadow-sm ring-1 ring-blue-500/30 border-blue-500/50'
          : 'hover:bg-white/60 dark:hover:bg-white/[0.04] border-border/60'
      )}
      onClick={onClick}
    >
      {/* Pattern/Color preview */}
      <div className="shrink-0">
        {hasVisual ? (
          <div
            className="h-9 w-14 rounded-lg overflow-hidden"
            style={{
              ...getVariantPreviewStyle(variant),
              boxShadow: `inset 0 0 0 1px ${variant.colorHex || '#94a3b8'}30`,
            }}
          />
        ) : (
          <div
            className="flex items-center gap-0.5 text-muted-foreground h-9 w-14 justify-center rounded-lg bg-muted/50"
            title="Sem cor definida"
          >
            <Palette className="h-3.5 w-3.5" />
            <Slash className="h-2.5 w-2.5" />
          </div>
        )}
      </div>

      {/* Name + items badge + status badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{variant.name}</p>
          {/* Items count badge */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'shrink-0 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-semibold rounded-full',
                    itemsCount > 0
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {itemsCount}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {itemsCount === 0
                  ? 'Nenhum item em estoque'
                  : `${itemsCount} ${itemsCount === 1 ? 'item' : 'itens'} em estoque`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {variant.outOfLine && (
            <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-medium bg-orange-500/15 text-orange-600 dark:text-orange-400 rounded">
              FL
            </span>
          )}
          {!variant.isActive && (
            <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-medium bg-gray-500/15 text-gray-500 rounded">
              Inativo
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {variant.reference ? `Ref: ${variant.reference}` : 'Sem referência'}
        </p>
      </div>

      {/* Quantity (right) */}
      <div className="shrink-0 text-right">
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            totalQuantity === 0 ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {formatQuantity(totalQuantity)}
          <span className="text-[10px] font-normal text-muted-foreground">
            {unitLabel}
          </span>
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pattern preview helper
// ---------------------------------------------------------------------------

function getVariantPreviewStyle(variant: Variant): React.CSSProperties {
  const primary = variant.colorHex || '#cbd5e1';
  const secondary = variant.secondaryColorHex || '';
  const pattern = variant.pattern || '';
  const hasSecondary = !!secondary;
  const sec = secondary || '#94a3b8';

  switch (pattern) {
    case 'SOLID':
      if (hasSecondary) {
        return {
          background: `linear-gradient(135deg, ${primary} 50%, ${sec} 50%)`,
        };
      }
      return { background: primary };

    case 'STRIPED':
      return {
        background: `repeating-linear-gradient(45deg, ${primary}, ${primary} 4px, ${sec} 4px, ${sec} 8px)`,
      };

    case 'PLAID':
      return {
        background: `
          repeating-linear-gradient(0deg, ${sec}00 0px, ${sec}00 6px, ${sec}BB 6px, ${sec}BB 8px, ${sec}00 8px, ${sec}00 14px),
          repeating-linear-gradient(90deg, ${sec}00 0px, ${sec}00 6px, ${sec}BB 6px, ${sec}BB 8px, ${sec}00 8px, ${sec}00 14px),
          ${primary}`,
      };

    case 'PRINTED':
      return {
        background: `
          radial-gradient(circle 2px at 25% 30%, ${sec} 99%, transparent),
          radial-gradient(circle 1.5px at 60% 20%, ${sec} 99%, transparent),
          radial-gradient(circle 2px at 80% 60%, ${sec} 99%, transparent),
          radial-gradient(circle 1.5px at 40% 75%, ${sec} 99%, transparent),
          ${primary}`,
      };

    case 'GRADIENT':
      return {
        background: `linear-gradient(135deg, ${primary}, ${sec})`,
      };

    case 'JACQUARD':
      return {
        background: `repeating-conic-gradient(${primary} 0% 25%, ${sec} 0% 50%) 0 0 / 8px 8px`,
      };

    default:
      return { background: primary };
  }
}
