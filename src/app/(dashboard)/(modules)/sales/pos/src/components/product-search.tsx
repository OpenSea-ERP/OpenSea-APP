'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useProductsPaginated } from '@/hooks/stock/use-products';
import type { Product } from '@/types/stock';
import { Search, Plus, Package } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PosCartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

interface ProductSearchProps {
  onAddToCart: (product: {
    id: string;
    name: string;
    sku: string;
    price: number;
  }) => void;
  className?: string;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getProductPrice(product: Product): number {
  if (product.variants && product.variants.length > 0) {
    return product.variants[0].price ?? 0;
  }
  return 0;
}

function getProductSku(product: Product): string {
  if (product.variants && product.variants.length > 0) {
    return product.variants[0].sku ?? product.fullCode ?? '';
  }
  return product.fullCode ?? '';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductSearch({
  onAddToCart,
  className,
  compact = false,
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading } = useProductsPaginated({
    search: debouncedSearch || undefined,
    limit: 20,
    page: 1,
    status: 'ACTIVE',
  });

  const products = data?.products ?? [];

  const handleAdd = useCallback(
    (product: Product) => {
      onAddToCart({
        id: product.id,
        name: product.name,
        sku: getProductSku(product),
        price: getProductPrice(product),
      });
    },
    [onAddToCart]
  );

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos por nome, SKU ou código..."
          className={compact ? 'pl-10 h-11 text-base' : 'pl-10 h-12 text-lg'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-3">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-3" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {debouncedSearch
              ? 'Nenhum produto encontrado para esta busca'
              : 'Digite para buscar produtos'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map(product => {
            const price = getProductPrice(product);
            const sku = getProductSku(product);
            return (
              <Card
                key={product.id}
                className="group relative overflow-hidden border border-border bg-white dark:bg-slate-800/60 p-3 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className="mb-2">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  {sku && (
                    <p className="text-xs text-muted-foreground truncate">
                      {sku}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(price)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleAdd(product)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
