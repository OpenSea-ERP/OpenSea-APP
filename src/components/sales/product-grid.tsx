'use client';

import * as React from 'react';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/config/api';
import { categoriesService } from '@/services/stock/categories.service';
import { ordersService } from '@/services/sales/orders.service';
import { Skeleton } from '@/components/ui/skeleton';

interface MetaShape {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// =============================================================================
// TYPES
// =============================================================================

export interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  imageUrl: string | null;
  categoryName: string | null;
  stockQuantity: number;
}

interface ProductGridProps {
  onAddToCart: (variant: ProductVariant) => void;
  className?: string;
}

interface VariantListResponse {
  variants: Array<{
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    price: number;
    imageUrl?: string | null;
    categoryName?: string | null;
    stockQuantity?: number;
    product?: {
      categoryId?: string;
      category?: { name: string } | null;
      images?: Array<{ url: string }>;
    };
  }>;
  meta: MetaShape;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 300;
const BARCODE_KEYSTROKE_THRESHOLD_MS = 50;
const BARCODE_SETTLE_MS = 100;

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Smart debounce that detects barcode scanner input vs manual typing.
 * - Barcode scanner: keystrokes arrive < 50ms apart. Accumulates the full
 *   string and emits once after a 100ms gap (scanner finished).
 * - Manual typing: keystrokes > 50ms apart. Uses standard 300ms debounce.
 */
function useSmartDebouncedSearch(value: string) {
  const [debounced, setDebounced] = React.useState(value);
  const lastKeystrokeRef = React.useRef(0);
  const isScanningRef = React.useRef(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const now = Date.now();
    const gap = now - lastKeystrokeRef.current;
    lastKeystrokeRef.current = now;

    // Detect scanning mode: rapid keystrokes < 50ms apart
    if (gap < BARCODE_KEYSTROKE_THRESHOLD_MS && value.length > 1) {
      isScanningRef.current = true;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    if (isScanningRef.current) {
      // Scanner mode: wait for input to settle (100ms gap = scanner done)
      timerRef.current = setTimeout(() => {
        setDebounced(value);
        isScanningRef.current = false;
      }, BARCODE_SETTLE_MS);
    } else {
      // Manual typing: standard 300ms debounce
      timerRef.current = setTimeout(() => {
        setDebounced(value);
      }, DEBOUNCE_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  return debounced;
}

function useBarcodeDetection(onBarcode: (barcode: string) => void) {
  const bufferRef = React.useRef('');
  const lastKeystrokeRef = React.useRef(0);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      // Only capture if no input is focused (search input handles itself)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const now = Date.now();
      const timeSinceLast = now - lastKeystrokeRef.current;

      if (e.key === 'Enter' && bufferRef.current.length > 3) {
        onBarcode(bufferRef.current);
        bufferRef.current = '';
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      if (e.key.length === 1) {
        if (timeSinceLast > BARCODE_KEYSTROKE_THRESHOLD_MS * 3) {
          bufferRef.current = '';
        }
        bufferRef.current += e.key;
        lastKeystrokeRef.current = now;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 200);
      }
    },
    [onBarcode]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// =============================================================================
// PRODUCT GRID COMPONENT
// =============================================================================

function ProductGrid({ onAddToCart, className }: ProductGridProps) {
  const [searchInput, setSearchInput] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    string | null
  >(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const debouncedSearch = useSmartDebouncedSearch(searchInput);

  const { mutateAsync: scanVariantByCode, isPending: isScanningCode } =
    useMutation({
      mutationFn: (code: string) => ordersService.scanVariantByCode(code),
    });

  // Barcode scanner detection
  useBarcodeDetection(
    React.useCallback(
      (barcode: string) => {
        setSearchInput(barcode);

        void (async () => {
          try {
            const result = await scanVariantByCode(barcode);

            onAddToCart({
              id: result.variant.id,
              name: result.variant.name,
              sku: result.variant.sku,
              barcode: result.variant.barcode,
              price: result.variant.price,
              imageUrl: null,
              categoryName: null,
              stockQuantity: 0,
            });

            setSearchInput('');
            toast.success(`Produto ${result.variant.name} adicionado.`);
          } catch {
            // Fallback: keep scanner code in search input for local filtering.
          }
        })();
      },
      [onAddToCart, scanVariantByCode]
    )
  );

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: async () => {
      const response = await categoriesService.listCategories();
      return response.categories;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch variants with infinite scroll
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['pos-variants', debouncedSearch, selectedCategoryId],
      queryFn: async ({ pageParam = 1 }) => {
        const params: Record<string, string> = {
          page: String(pageParam),
          limit: String(PAGE_SIZE),
          hasStock: 'true',
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedCategoryId) params.categoryId = selectedCategoryId;

        return apiClient.get<VariantListResponse>(API_ENDPOINTS.VARIANTS.LIST, {
          params,
        });
      },
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        const currentPage = (lastPageParam as number) ?? 1;
        if (currentPage < (lastPage.meta?.pages ?? 1)) {
          return currentPage + 1;
        }
        return undefined;
      },
      initialPageParam: 1,
    });

  // IntersectionObserver for infinite scroll
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten variants
  const variants = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page =>
      page.variants.map(
        (v): ProductVariant => ({
          id: v.id,
          name: v.name,
          sku: v.sku ?? null,
          barcode: v.barcode ?? null,
          price: v.price,
          imageUrl: v.imageUrl ?? v.product?.images?.[0]?.url ?? null,
          categoryName: v.categoryName ?? v.product?.category?.name ?? null,
          stockQuantity: v.stockQuantity ?? 0,
        })
      )
    );
  }, [data]);

  const categories = categoriesData ?? [];

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Buscar produto, SKU ou código de barras..."
          className={cn(
            'h-14 w-full rounded-xl border border-zinc-200 bg-white pl-11 pr-4 text-base',
            'placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20',
            'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-violet-400'
          )}
        />
      </div>
      {isScanningCode && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Validando código escaneado...
        </p>
      )}

      {/* Category Chips */}
      {categories.length > 0 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          <CategoryChip
            label="Todos"
            isSelected={selectedCategoryId === null}
            onClick={() => setSelectedCategoryId(null)}
          />
          {categories.map(cat => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              isSelected={selectedCategoryId === cat.id}
              onClick={() =>
                setSelectedCategoryId(
                  selectedCategoryId === cat.id ? null : cat.id
                )
              }
            />
          ))}
        </div>
      )}

      {/* Product Grid */}
      {isLoading ? (
        <ProductGridSkeleton />
      ) : variants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <Search className="mb-3 size-10 opacity-50" />
          <p className="text-base font-medium">Nenhum produto encontrado</p>
          <p className="text-sm">Tente buscar com outro termo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {variants.map(variant => (
            <ProductTile
              key={variant.id}
              variant={variant}
              onTap={onAddToCart}
            />
          ))}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="col-span-full h-1" />

          {/* Loading more */}
          {isFetchingNextPage && (
            <div className="col-span-full flex justify-center py-4">
              <div className="size-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function CategoryChip({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150',
        'min-h-10 select-none active:scale-95',
        isSelected
          ? 'bg-violet-600 text-white shadow-sm'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
      )}
    >
      {label}
    </button>
  );
}

function ProductTile({
  variant,
  onTap,
}: {
  variant: ProductVariant;
  onTap: (variant: ProductVariant) => void;
}) {
  const categoryInitial = variant.categoryName?.[0]?.toUpperCase() ?? 'P';

  // Color based on category name hash
  const placeholderColors = [
    'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  ];
  const colorIndex =
    (variant.categoryName ?? '').length % placeholderColors.length;
  const placeholderColor = placeholderColors[colorIndex];

  return (
    <button
      type="button"
      onClick={() => onTap(variant)}
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm',
        'cursor-pointer select-none transition-all duration-150',
        'hover:shadow-md active:scale-95',
        'dark:border-zinc-700 dark:bg-zinc-900'
      )}
    >
      {/* Image / Placeholder */}
      {variant.imageUrl ? (
        <div className="aspect-square w-full overflow-hidden bg-zinc-50 dark:bg-zinc-800">
          <img
            src={variant.imageUrl}
            alt={variant.name}
            className="size-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex aspect-square w-full items-center justify-center text-3xl font-bold',
            placeholderColor
          )}
        >
          {categoryInitial}
        </div>
      )}

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="line-clamp-2 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {variant.name}
        </span>
        <span className="text-left text-base font-bold text-violet-600 dark:text-violet-400">
          {formatCurrency(variant.price)}
        </span>
        {variant.stockQuantity <= 5 && variant.stockQuantity > 0 && (
          <span className="text-left text-xs text-amber-600 dark:text-amber-400">
            Restam {variant.stockQuantity}
          </span>
        )}
        {variant.stockQuantity === 0 && (
          <span className="text-left text-xs text-rose-600 dark:text-rose-400">
            Sem estoque
          </span>
        )}
      </div>
    </button>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
        >
          <Skeleton className="aspect-square w-full" />
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { ProductGrid, type ProductGridProps };
