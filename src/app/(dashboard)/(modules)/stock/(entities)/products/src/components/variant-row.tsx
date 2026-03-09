/**
 * VariantRow - Simplified variant display for two-column modal
 * Exibe: Cor | Nome + Referência + Badge | Atributos Visíveis | Itens | Quantidade | Preço | Edit
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
import { cn, formatCurrency } from '@/lib/utils';
import type { TemplateAttribute, Variant } from '@/types/stock';
import { Edit, Palette, Slash } from 'lucide-react';
import { useMemo } from 'react';

interface VariantRowProps {
  variant: Variant;
  itemsCount?: number;
  totalQuantity?: number;
  unitLabel?: string;
  isSelected?: boolean;
  onClick: () => void;
  onEdit?: (variant: Variant) => void;
  /** Atributos de variante do template (para exibir os visíveis) */
  variantAttributes?: Record<string, TemplateAttribute>;
}

export function VariantRow({
  variant,
  itemsCount = 0,
  totalQuantity = 0,
  unitLabel = 'un',
  isSelected = false,
  onClick,
  onEdit,
  variantAttributes,
}: VariantRowProps) {
  // Filtrar atributos visíveis (enableView = true)
  const visibleAttributes = useMemo(() => {
    if (!variantAttributes) return [];
    return Object.entries(variantAttributes)
      .filter(([, attr]) => attr.enableView === true)
      .map(([key, attr]) => ({
        key,
        label: attr.label || key,
        unitOfMeasure: attr.unitOfMeasure,
        value: variant.attributes?.[key],
      }));
  }, [variantAttributes, variant.attributes]);

  // Formatar valor do atributo
  const formatValue = (value: unknown, unitOfMeasure?: string): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    const strValue = String(value);
    return unitOfMeasure ? `${strValue} ${unitOfMeasure}` : strValue;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
        isSelected
          ? 'bg-linear-to-r from-violet-100 to-blue-100 dark:from-sky-500/20 dark:to-sky-500/20 border-emerald-500'
          : 'bg-linear-to-r from-violet-50 to-blue-50 dark:from-slate-800/50 dark:to-slate-800/50 hover:from-violet-100 hover:to-blue-100 dark:hover:from-slate-700/50 dark:hover:to-slate-700/50 border-border'
      )}
      onClick={onClick}
    >
      {/* Column 1: Cor */}
      <div className="shrink-0">
        {variant.colorHex ? (
          <div
            className="h-8 w-12 rounded border border-gray-200 dark:border-slate-700"
            style={{ backgroundColor: variant.colorHex }}
            title={variant.colorHex}
          />
        ) : (
          <div
            className="flex items-center gap-1 text-muted-foreground h-8 w-12 justify-center"
            title="Cor não definida"
          >
            <Palette className="h-4 w-4" />
            <Slash className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Column 2: Nome + Referência + Badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{variant.name}</p>
          {variant.outOfLine && (
            <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
              Fora de Linha
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {variant.reference ? `Ref: ${variant.reference}` : 'Sem referência'}
        </p>
      </div>

      {/* Colunas dinâmicas: Atributos Visíveis (label acima do valor) */}
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

      {/* Column 3: Items Count */}
      <div className="shrink-0 w-14 text-right">
        <p className="text-[10px] text-muted-foreground">itens</p>
        <span
          className={cn(
            'text-sm font-medium',
            itemsCount === 0 ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {itemsCount}
        </span>
      </div>

      {/* Column 4: Total Quantity */}
      <div className="shrink-0 w-20 text-right">
        <p className="text-[10px] text-muted-foreground">{unitLabel}</p>
        <span
          className={cn(
            'text-sm font-medium',
            totalQuantity === 0 ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {formatQuantity(totalQuantity)}
        </span>
      </div>

      {/* Column 5: Price */}
      <div className="shrink-0 text-right">
        <p className="text-[10px] text-muted-foreground">Preço (R$)</p>
        <Badge variant="secondary" className="font-mono text-foreground">
          {formatCurrency(variant.price)}
        </Badge>
      </div>

      {/* Column 6: Edit */}
      {onEdit && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={e => {
                  e.stopPropagation();
                  onEdit(variant);
                }}
                aria-label="Editar variante"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar variante</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
