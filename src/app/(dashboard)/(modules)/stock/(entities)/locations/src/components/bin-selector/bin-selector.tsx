'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronDown, X, Check, MapPin, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAvailableBins } from '../../api';
import { useZones } from '../../api/zones.queries';
import type { Bin } from '@/types/stock';

export interface BinSelectorProps {
  value?: string;
  onChange: (address: string | null, bin?: Bin) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  className?: string;
  /** Filter by single zone — shows only bins from this zone */
  zoneId?: string;
  /** Show bins from ALL zones in this warehouse, grouped by zone name */
  warehouseId?: string;
  onlyAvailable?: boolean;
  label?: string;
  helperText?: string;
  required?: boolean;
  excludeBinIds?: string[];
}

interface BinGroup {
  zoneName: string;
  zoneCode: string;
  bins: Bin[];
}

export function BinSelector({
  value,
  onChange,
  placeholder = 'Selecione um nicho',
  disabled = false,
  error = false,
  errorMessage,
  className,
  zoneId,
  warehouseId,
  onlyAvailable = false,
  label,
  helperText,
  required = false,
  excludeBinIds,
}: BinSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Single zone mode
  const { data: singleZoneBins = [], isLoading: isLoadingSingle } = useAvailableBins(
    !warehouseId ? zoneId : undefined
  );

  // Multi zone mode: fetch zones for the warehouse
  const { data: zones = [], isLoading: isLoadingZones } = useZones(
    warehouseId ?? ''
  );

  // Fetch bins for each zone when in warehouse mode
  const zoneIds = useMemo(
    () => (warehouseId ? zones.map(z => z.id) : []),
    [warehouseId, zones]
  );

  // We need to fetch available bins for each zone individually
  // Using a single combined query approach
  const zone0 = useAvailableBins(zoneIds[0]);
  const zone1 = useAvailableBins(zoneIds[1]);
  const zone2 = useAvailableBins(zoneIds[2]);
  const zone3 = useAvailableBins(zoneIds[3]);
  const zone4 = useAvailableBins(zoneIds[4]);
  const zone5 = useAvailableBins(zoneIds[5]);
  const zone6 = useAvailableBins(zoneIds[6]);
  const zone7 = useAvailableBins(zoneIds[7]);
  const zone8 = useAvailableBins(zoneIds[8]);
  const zone9 = useAvailableBins(zoneIds[9]);

  const multiZoneQueries = [zone0, zone1, zone2, zone3, zone4, zone5, zone6, zone7, zone8, zone9];
  const isLoadingMulti = warehouseId ? (
    isLoadingZones || multiZoneQueries.some((q, i) => i < zoneIds.length && q.isLoading)
  ) : false;

  const isLoading = warehouseId ? isLoadingMulti : isLoadingSingle;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Build grouped bins
  const groups = useMemo<BinGroup[]>(() => {
    const excludeSet = excludeBinIds && excludeBinIds.length > 0
      ? new Set(excludeBinIds)
      : null;

    const filterBins = (bins: Bin[]) => {
      let filtered = onlyAvailable ? bins.filter(b => !b.isBlocked) : bins;
      if (excludeSet) filtered = filtered.filter(b => !excludeSet.has(b.id));
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(b => b.address.toLowerCase().includes(q));
      }
      return filtered;
    };

    if (warehouseId) {
      // Multi zone mode
      const result: BinGroup[] = [];
      for (let i = 0; i < zoneIds.length && i < 10; i++) {
        const zone = zones[i];
        const bins = multiZoneQueries[i]?.data ?? [];
        if (!zone) continue;
        const filtered = filterBins(bins);
        if (filtered.length > 0 || !searchQuery) {
          result.push({
            zoneName: zone.name,
            zoneCode: zone.code,
            bins: filtered,
          });
        }
      }
      return result;
    }

    // Single zone mode
    const filtered = filterBins(singleZoneBins);
    return filtered.length > 0 || !searchQuery
      ? [{ zoneName: '', zoneCode: '', bins: filtered }]
      : [];
  }, [warehouseId, zones, zoneIds, multiZoneQueries, singleZoneBins, onlyAvailable, excludeBinIds, searchQuery]);

  const totalBins = groups.reduce((sum, g) => sum + g.bins.length, 0);

  const handleSelect = useCallback(
    (bin: Bin) => {
      if (bin.isBlocked) return;
      onChange(bin.address, bin);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange]
  );

  const renderBinRow = (bin: Bin) => {
    const isSelected = value === bin.address;
    const isBlocked = bin.isBlocked;
    const isEmpty = bin.currentOccupancy === 0;

    return (
      <button
        key={bin.id}
        type="button"
        onClick={() => handleSelect(bin)}
        disabled={isBlocked}
        className={cn(
          'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-colors',
          'hover:bg-accent focus:bg-accent focus:outline-none',
          isSelected && 'bg-accent',
          isBlocked && 'opacity-40 cursor-not-allowed',
        )}
      >
        <div
          className={cn(
            'h-2 w-2 rounded-full shrink-0',
            isBlocked ? 'bg-gray-400' : isEmpty ? 'bg-emerald-500' : 'bg-amber-500',
          )}
        />
        <span className="flex-1 text-xs font-mono font-medium text-foreground truncate">
          {bin.address}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {isBlocked ? (
            <Lock className="h-3 w-3" />
          ) : (
            `${bin.currentOccupancy}${bin.capacity ? `/${bin.capacity}` : ''}`
          )}
        </span>
        {isSelected && (
          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
        )}
      </button>
    );
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-sm font-medium leading-none">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal h-9',
              !value && 'text-muted-foreground',
              error && 'border-destructive focus:ring-destructive',
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {value ? (
                <span className="font-mono font-medium text-sm">{value}</span>
              ) : (
                <span className="text-sm">{placeholder}</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {value && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleClear(e as unknown as React.MouseEvent);
                  }}
                  className="hover:bg-muted rounded p-0.5"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-h-[300px] p-0 overflow-hidden"
          align="start"
          sideOffset={4}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value.toUpperCase())}
                  placeholder="Buscar nicho..."
                  className="h-8 pl-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* List */}
            <div
              className="overflow-y-auto max-h-[240px] p-1"
              onWheel={e => e.stopPropagation()}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : totalBins === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Nenhum nicho encontrado
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.zoneCode || '_single'}>
                    {/* Zone header (only in multi-zone mode) */}
                    {warehouseId && (
                      <div className="px-2.5 pt-2 pb-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                          {group.zoneName}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground/60">
                          {group.zoneCode}
                        </span>
                      </div>
                    )}
                    {group.bins.length === 0 ? (
                      <div className="px-2.5 py-1 text-[10px] text-muted-foreground/50 italic">
                        Nenhum nicho disponível
                      </div>
                    ) : (
                      group.bins.map(renderBinRow)
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {(helperText || errorMessage) && (
        <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
          {errorMessage || helperText}
        </p>
      )}
    </div>
  );
}
