'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { MobileTopBar } from '@/components/mobile/mobile-top-bar';
import { apiClient } from '@/lib/api-client';
import { Package, Search, Check, Loader2, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColorPatternSwatch } from '@/components/shared/color-pattern-swatch';

// ============================================
// Types
// ============================================

export type VariantPattern =
  | 'SOLID'
  | 'STRIPED'
  | 'PLAID'
  | 'PRINTED'
  | 'GRADIENT'
  | 'JACQUARD'
  | null;

export interface VariantOption {
  id: string;
  name: string;
  productId: string;
  productName: string;
  templateId: string | null;
  templateName: string | null;
  manufacturerName: string | null;
  reference: string | null;
  colorHex: string | null;
  secondaryColorHex: string | null;
  pattern: VariantPattern;
  sku: string | null;
  /** Template · Produto · Variante */
  fullLabel: string;
  /** Fabricante · Referência (subtitle) */
  subtitle: string;
  /** All searchable text concatenated for fast word-by-word filtering */
  searchText: string;
}

export interface MobileVariantSelectorProps {
  value: VariantOption | null;
  onChange: (v: VariantOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

// ============================================
// Color Swatch — shows primary + secondary + pattern
// ============================================

function ColorSwatch({
  colorHex,
  secondaryColorHex,
  pattern,
  size = 'md',
}: {
  colorHex: string | null;
  secondaryColorHex?: string | null;
  pattern?: VariantPattern;
  size?: 'sm' | 'md';
}) {
  if (!colorHex) {
    return (
      <Package
        className={cn(
          'text-slate-400',
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
        )}
      />
    );
  }

  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const secondary = secondaryColorHex || colorHex;
  const pat = pattern || 'SOLID';

  const bgStyle = (): React.CSSProperties => {
    switch (pat) {
      case 'STRIPED':
        return {
          background: `repeating-linear-gradient(
            135deg,
            ${colorHex},
            ${colorHex} 3px,
            ${secondary} 3px,
            ${secondary} 6px
          )`,
        };
      case 'PLAID':
        return {
          background: `
            repeating-linear-gradient(0deg, ${secondary}40 0px, ${secondary}40 2px, transparent 2px, transparent 6px),
            repeating-linear-gradient(90deg, ${secondary}40 0px, ${secondary}40 2px, transparent 2px, transparent 6px),
            ${colorHex}`,
        };
      case 'GRADIENT':
        return {
          background: `linear-gradient(135deg, ${colorHex}, ${secondary})`,
        };
      case 'PRINTED':
        return {
          background: `
            radial-gradient(circle at 25% 25%, ${secondary} 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, ${secondary} 2px, transparent 2px),
            radial-gradient(circle at 50% 50%, ${secondary} 1.5px, transparent 1.5px),
            ${colorHex}`,
        };
      case 'JACQUARD':
        return {
          background: `
            repeating-conic-gradient(${colorHex} 0% 25%, ${secondary} 0% 50%) 50% / 8px 8px`,
        };
      case 'SOLID':
      default:
        if (secondaryColorHex && secondaryColorHex !== colorHex) {
          return {
            background: `linear-gradient(135deg, ${colorHex} 50%, ${secondaryColorHex} 50%)`,
          };
        }
        return { backgroundColor: colorHex };
    }
  };

  return (
    <div
      className={cn(dim, 'shrink-0 rounded-lg border border-white/15')}
      style={bgStyle()}
    />
  );
}

// ============================================
// Helper — fetch all paginated pages
// ============================================

async function fetchAllPages<T>(
  endpoint: string,
  dataKey: string
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  const limit = 100;
  while (true) {
    const response = await apiClient.get<Record<string, unknown>>(
      `${endpoint}?page=${page}&limit=${limit}`
    );
    const items = response[dataKey] as T[] | undefined;
    if (items && items.length > 0) allItems.push(...items);
    const meta = response.meta as { pages: number } | undefined;
    if (!meta || page >= meta.pages) break;
    page++;
  }
  return allItems;
}

// ============================================
// Hook — variant options with full data
// ============================================

export function useVariantOptions() {
  return useQuery({
    queryKey: ['mobile', 'variant-options'],
    queryFn: async (): Promise<VariantOption[]> => {
      const [variantsRes, productsRes] = await Promise.all([
        fetchAllPages<{
          id: string;
          name: string;
          productId: string;
          colorHex?: string;
          secondaryColorHex?: string;
          pattern?: string;
          sku?: string;
          reference?: string;
        }>('/v1/variants', 'variants'),
        fetchAllPages<{
          id: string;
          name: string;
          templateId?: string;
          template?: { id: string; name: string };
          manufacturer?: { id: string; name: string } | null;
        }>('/v1/products', 'products'),
      ]);

      const productMap = new Map(productsRes.map(p => [p.id, p]));

      return variantsRes.map(v => {
        const prod = productMap.get(v.productId);
        const templateName = prod?.template?.name ?? null;
        const templateId = prod?.templateId ?? prod?.template?.id ?? null;
        const productName = prod?.name ?? '';
        const manufacturerName = prod?.manufacturer?.name ?? null;
        const reference = v.reference || null;

        const fullLabel = [templateName, productName, v.name]
          .filter(Boolean)
          .join(' · ');

        const subtitleParts = [
          manufacturerName,
          reference ? `Ref: ${reference}` : null,
        ].filter(Boolean);
        const subtitle = subtitleParts.join(' · ');

        const searchText = [
          templateName,
          productName,
          v.name,
          manufacturerName,
          reference,
          v.sku,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return {
          id: v.id,
          name: v.name,
          productId: v.productId,
          productName,
          templateId,
          templateName,
          manufacturerName,
          reference,
          colorHex: v.colorHex || null,
          secondaryColorHex: v.secondaryColorHex || null,
          pattern: (v.pattern as VariantPattern) || null,
          sku: v.sku || null,
          fullLabel,
          subtitle,
          searchText,
        };
      });
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// Search helper — word-by-word partial matching
// ============================================

function matchesSearch(searchText: string, query: string): boolean {
  if (!query.trim()) return true;
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 0);
  return words.every(word => searchText.includes(word));
}

// ============================================
// Component
// ============================================

export function MobileVariantSelector({
  value,
  onChange,
  disabled,
  placeholder = 'Selecionar variante...',
}: MobileVariantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: options, isLoading } = useVariantOptions();

  const filtered = useMemo(() => {
    if (!options) return [];
    if (!search.trim()) return options;
    return options.filter(o => matchesSearch(o.searchText, search));
  }, [options, search]);

  // Closed state — button trigger
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
          value
            ? 'border-indigo-500/30 bg-indigo-500/5'
            : 'border-slate-700/50 bg-slate-800/60',
          disabled && 'opacity-50'
        )}
      >
        <ColorPatternSwatch
          colorHex={value?.colorHex}
          secondaryColorHex={value?.secondaryColorHex}
          pattern={value?.pattern}
          size="md"
        />
        <div className="min-w-0 flex-1">
          {value ? (
            <>
              <p className="truncate text-sm font-medium text-slate-100">
                {value.fullLabel}
              </p>
              {value.subtitle && (
                <p className="truncate text-[11px] text-slate-500">
                  {value.subtitle}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">{placeholder}</p>
          )}
        </div>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              onChange(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                e.preventDefault();
                onChange(null);
              }
            }}
            className="shrink-0 p-1 text-slate-500 active:text-slate-300"
          >
            <X className="h-4 w-4" />
          </span>
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
        )}
      </button>
    );
  }

  // Open state — fullscreen search (portal to body to escape transformed Drawer ancestor)
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950">
      <MobileTopBar
        title="Selecionar Variante"
        showBack
        rightContent={
          <button
            onClick={() => {
              setIsOpen(false);
              setSearch('');
            }}
            className="text-xs text-slate-400 active:text-slate-200"
          >
            Fechar
          </button>
        }
      />
      <div className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, fabricante, referência..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-base text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        {search.trim() && (
          <p className="mt-1.5 text-[11px] text-slate-600">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Nenhuma variante encontrada
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(opt => {
              const isSelected = value?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors active:bg-slate-700/60',
                    isSelected
                      ? 'bg-indigo-500/10 border border-indigo-500/30'
                      : 'bg-slate-800/40'
                  )}
                >
                  <ColorPatternSwatch
                    colorHex={opt.colorHex}
                    secondaryColorHex={opt.secondaryColorHex}
                    pattern={opt.pattern}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {opt.fullLabel}
                    </p>
                    {opt.subtitle && (
                      <p className="truncate text-[11px] text-slate-500">
                        {opt.subtitle}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-indigo-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
