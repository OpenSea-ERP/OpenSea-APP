'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Map, Search, ChevronDown, X, Check, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { SearchInput } from './search-input';
import { Suggestions, RecentSuggestions } from './suggestions';
import { MapPicker } from './map-picker';
import {
  useBinSuggestions,
  useBinByAddress,
  useAvailableBins,
} from '../../api';
import { useWarehouses } from '../../api/warehouses.queries';
import { useAllZones } from '../../api/zones.queries';
import type { Bin } from '@/types/stock';

export interface BinSelectorProps {
  /** Current value (bin address) */
  value?: string;
  /** Callback when value changes */
  onChange: (address: string | null, bin?: Bin) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Whether to show validation error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Additional class names */
  className?: string;
  /** Filter by zone ID */
  zoneId?: string;
  /** Show only available (not full) bins */
  onlyAvailable?: boolean;
  /** Label to display */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Whether field is required */
  required?: boolean;
}

// LocalStorage key for recent addresses
const RECENT_KEY = 'bin-selector-recent';
const MAX_RECENT = 5;

export function BinSelector({
  value,
  onChange,
  placeholder = 'Selecione uma localização',
  disabled = false,
  error = false,
  errorMessage,
  className,
  zoneId,
  onlyAvailable = false,
  label,
  helperText,
  required = false,
}: BinSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'map'>('search');
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);

  // Load recent addresses from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        setRecentAddresses(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // API queries
  const { data: suggestions = [], isLoading: loadingSuggestions } =
    useBinSuggestions(searchQuery.length >= 3 ? searchQuery : '');

  const { data: warehouses = [], isLoading: loadingWarehouses } =
    useWarehouses();
  const { data: zones = [], isLoading: loadingZones } = useAllZones();
  const { data: availableBins = [], isLoading: loadingBins } =
    useAvailableBins(zoneId);

  const { data: selectedBin } = useBinByAddress(value || '');

  // Add to recent addresses
  const addToRecent = useCallback((address: string) => {
    setRecentAddresses(prev => {
      const filtered = prev.filter(a => a !== address);
      const updated = [address, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  // Clear recent addresses
  const clearRecent = useCallback(() => {
    setRecentAddresses([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Handle selection
  const handleSelect = useCallback(
    (address: string) => {
      onChange(address);
      addToRecent(address);
      setSearchQuery('');
      setIsOpen(false);
    },
    [onChange, addToRecent]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    onChange(null);
    setSearchQuery('');
  }, [onChange]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    // The search is debounced in SearchInput
  }, []);

  // Filter bins by zone if specified
  const filteredBins = useMemo(() => {
    if (!zoneId) return availableBins;
    return availableBins.filter(b => {
      // Extract zone from address
      const parts = b.address.split('-');
      return parts.length >= 2; // Basic validation
    });
  }, [availableBins, zoneId]);

  const isLoading =
    loadingSuggestions || loadingWarehouses || loadingZones || loadingBins;

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* Trigger */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground',
              error && 'border-destructive focus:ring-destructive'
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              {value ? (
                <span className="font-mono font-medium">{value}</span>
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {value && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      handleClear();
                    }
                  }}
                  className="hover:bg-muted rounded p-0.5"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[400px] p-0" align="start">
          <Tabs
            value={activeTab}
            onValueChange={v => setActiveTab(v as 'search' | 'map')}
          >
            <div className="border-b px-3 py-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Buscar
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Mapa
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Search Tab */}
            <TabsContent value="search" className="m-0">
              <div className="p-3">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSearch={handleSearch}
                  onClear={() => setSearchQuery('')}
                  isLoading={loadingSuggestions}
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 3 ? (
                <Suggestions
                  suggestions={suggestions}
                  selectedAddress={value}
                  onSelect={handleSelect}
                  isLoading={loadingSuggestions}
                  emptyMessage="Nenhuma localização encontrada"
                />
              ) : (
                <>
                  {/* Recent addresses */}
                  {recentAddresses.length > 0 && (
                    <RecentSuggestions
                      recent={recentAddresses}
                      onSelect={handleSelect}
                      onClearRecent={clearRecent}
                      className="border-t"
                    />
                  )}

                  {/* Available bins suggestion */}
                  {onlyAvailable && filteredBins.length > 0 && (
                    <div className="p-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Nichos disponíveis
                      </p>
                      <Suggestions
                        suggestions={filteredBins.slice(0, 5)}
                        selectedAddress={value}
                        onSelect={handleSelect}
                        maxHeight={200}
                      />
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Map Tab */}
            <TabsContent value="map" className="m-0 p-3">
              <MapPicker
                warehouses={warehouses}
                zones={zones}
                bins={filteredBins}
                selectedAddress={value}
                onSelect={handleSelect}
                isLoading={loadingWarehouses || loadingZones || loadingBins}
              />
            </TabsContent>
          </Tabs>

          {/* Selected info */}
          {value && selectedBin && (
            <div className="p-3 border-t bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Selecionado:</span>
                  <Badge variant="secondary" className="font-mono">
                    {value}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {selectedBin.currentOccupancy} item(ns)
                </span>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Helper text or error */}
      {(helperText || errorMessage) && (
        <p
          className={cn(
            'text-xs',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {errorMessage || helperText}
        </p>
      )}
    </div>
  );
}
