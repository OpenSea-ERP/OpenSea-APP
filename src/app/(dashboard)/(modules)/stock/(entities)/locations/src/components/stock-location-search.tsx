'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, MapPin, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/core/hooks/use-debounce';
import { apiClient } from '@/lib/api-client';
import type { BinDetailResponse } from '@/types/stock';
import { useLocationSearch, useBinSuggestions, API_ENDPOINTS } from '../api';

export function StockLocationSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 300);

  const { data: searchData, isLoading: isSearchLoading } = useLocationSearch(debouncedQuery);
  const { data: suggestions, isLoading: isSuggestionsLoading } = useBinSuggestions(debouncedQuery);

  const isLoading = isSearchLoading || isSuggestionsLoading;
  const showDropdown = isOpen && query.length >= 2;

  const hasSuggestions = suggestions && suggestions.length > 0;
  const hasItems = searchData?.items && searchData.items.length > 0;
  const hasResults = hasSuggestions || hasItems;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = async (address: string) => {
    setIsOpen(false);
    setQuery('');
    try {
      // Get bin by address, then fetch detail to get warehouseId
      const binRes = await apiClient.get<{ bin: { id: string } }>(
        API_ENDPOINTS.bins.getByAddress(address)
      );
      const binId = binRes.bin.id;
      const detailRes = await apiClient.get<BinDetailResponse>(
        `${API_ENDPOINTS.bins.get(binId)}/detail`
      );
      router.push(`/stock/locations/${detailRes.warehouse.id}?zone=${detailRes.zone.id}&highlight=${binId}`);
    } catch {
      // Fallback: if we can't resolve, do nothing
    }
  };

  const handleItemClick = (item: {
    warehouse: { id: string };
    bin: { id: string; address: string } | null;
  }) => {
    setIsOpen(false);
    setQuery('');
    if (item.bin) {
      router.push(`/stock/locations/${item.warehouse.id}?highlight=${item.bin.id}`);
    } else {
      router.push(`/stock/locations/${item.warehouse.id}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Buscar por endereço, produto ou SKU..."
          className="h-11 pl-10 text-base"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {isLoading && !hasResults ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !hasResults ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          ) : (
            <div className="py-1">
              {/* Bin suggestions */}
              {hasSuggestions && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Endereços
                  </div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.address}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                      onClick={() => handleSuggestionClick(suggestion.address)}
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {suggestion.address}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs shrink-0',
                          suggestion.occupancyLevel === 'empty' && 'text-gray-500',
                          suggestion.occupancyLevel === 'low' && 'text-emerald-600',
                          suggestion.occupancyLevel === 'medium' && 'text-amber-600',
                          suggestion.occupancyLevel === 'high' && 'text-orange-600',
                          suggestion.occupancyLevel === 'full' && 'text-rose-600',
                          suggestion.occupancyLevel === 'blocked' && 'text-gray-500',
                        )}
                      >
                        {suggestion.itemCount} {suggestion.itemCount === 1 ? 'item' : 'itens'}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {/* Item search results */}
              {hasItems && (
                <div>
                  {hasSuggestions && <div className="border-t border-border my-1" />}
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Itens
                  </div>
                  {searchData.items.map((item) => (
                    <button
                      key={item.itemId}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                      onClick={() => handleItemClick(item)}
                    >
                      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate block">
                          {item.productName}
                          {item.variantName && (
                            <span className="text-muted-foreground"> — {item.variantName}</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.warehouse.code} &rsaquo; {item.zone.code}
                          {item.bin && (
                            <span className="font-mono"> &rsaquo; {item.bin.address}</span>
                          )}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {item.quantity} un
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
