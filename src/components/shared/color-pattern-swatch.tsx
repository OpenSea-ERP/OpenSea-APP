'use client';

/**
 * ColorPatternSwatch — Renderiza o quadrado/retângulo com a cor primária,
 * cor secundária e padrão (SOLID, STRIPED, PLAID, GRADIENT, PRINTED, JACQUARD)
 * de uma variante de produto. Componente compartilhado usado em:
 * - bin-detail-sheet (lista de itens dentro do nicho)
 * - mobile-variant-selector (seletor de variante)
 * - scan-result-sheet (resultado do scanner)
 * - transfer-flow (fluxo de transferência)
 *
 * Quando pattern é null/undefined, tratamos como SOLID — assim a cor secundária
 * é exibida em split mesmo sem pattern explícito.
 */

import { Package } from 'lucide-react';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export type VariantPattern =
  | 'SOLID'
  | 'STRIPED'
  | 'PLAID'
  | 'GRADIENT'
  | 'PRINTED'
  | 'JACQUARD'
  | null
  | undefined;

export interface ColorPatternSwatchProps {
  colorHex?: string | null;
  secondaryColorHex?: string | null;
  pattern?: VariantPattern | string | null;
  /** Tamanho preset; ou passe className para customizar */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  /** Ícone fallback quando não há cor */
  fallbackIcon?: React.ReactNode;
}

const SIZE_CLASSES: Record<
  NonNullable<ColorPatternSwatchProps['size']>,
  string
> = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
};

/**
 * Resolve o background CSS para uma combinação de cor + padrão.
 * Lógica copiada literalmente do variant-row.tsx (products) que é a referência
 * visual canônica do projeto. Diferença: aqui null/empty pattern são tratados
 * como SOLID, garantindo que a cor secundária apareça mesmo quando o pattern
 * não vem populado do backend.
 */
export function getColorPatternStyle(
  colorHex?: string | null,
  secondaryColorHex?: string | null,
  pattern?: VariantPattern | string | null
): CSSProperties | null {
  if (!colorHex) return null;

  const primary = colorHex;
  const secondary = secondaryColorHex || '';
  const hasSecondary = !!secondary;
  const sec = secondary || '#94a3b8';

  // Pattern null/undefined/empty → SOLID (assim a secundária ainda aparece em split)
  const pat = (pattern || 'SOLID') as string;

  switch (pat) {
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

export function ColorPatternSwatch({
  colorHex,
  secondaryColorHex,
  pattern,
  size = 'md',
  className,
  fallbackIcon,
}: ColorPatternSwatchProps) {
  const style = getColorPatternStyle(colorHex, secondaryColorHex, pattern);

  if (!style) {
    return (
      <div
        className={cn(
          SIZE_CLASSES[size],
          'shrink-0 rounded-lg flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/15',
          className
        )}
      >
        {fallbackIcon ?? (
          <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        'shrink-0 rounded-lg border border-black/10 dark:border-white/15',
        className
      )}
      style={style}
    />
  );
}
