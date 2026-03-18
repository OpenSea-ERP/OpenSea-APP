/**
 * BinSelector - Enhanced location selector with search and hierarchy
 * Shows warehouse > zone > bin structure with search functionality
 */

'use client';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useAllBins,
  useWarehouses,
  useAllZones,
} from '@/app/(dashboard)/(modules)/stock/(entities)/locations/src/api';
import type { Bin } from '@/types/stock';
import {
  Check,
  ChevronsUpDown,
  MapPin,
  Warehouse,
  Grid3X3,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface BinSelectorProps {
  value: string;
  onChange: (binId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface EnrichedBin extends Bin {
  warehouseCode?: string;
  warehouseName?: string;
  zoneCode?: string;
  zoneName?: string;
  displayLabel: string;
  searchText: string;
}

export function BinSelector({
  value,
  onChange,
  placeholder = 'Selecione a localização...',
  disabled = false,
  className,
}: BinSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch data
  const { data: bins, isLoading: isLoadingBins } = useAllBins({
    enabled: open,
  });
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { data: zones, isLoading: isLoadingZones } = useAllZones();

  const isLoading = isLoadingBins || isLoadingWarehouses || isLoadingZones;

  // Create maps for quick lookup
  const warehouseMap = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    warehouses?.forEach(w => map.set(w.id, { code: w.code, name: w.name }));
    return map;
  }, [warehouses]);

  const zoneMap = useMemo(() => {
    const map = new Map<
      string,
      { code: string; name: string; warehouseId: string }
    >();
    zones?.forEach(z =>
      map.set(z.id, { code: z.code, name: z.name, warehouseId: z.warehouseId })
    );
    return map;
  }, [zones]);

  // Enrich bins with warehouse and zone info
  const enrichedBins = useMemo<EnrichedBin[]>(() => {
    if (!bins) return [];

    return bins.map(bin => {
      const zone = zoneMap.get(bin.zoneId);
      const warehouse = zone ? warehouseMap.get(zone.warehouseId) : undefined;

      const displayLabel = bin.address;
      const searchText = [
        bin.address,
        warehouse?.code,
        warehouse?.name,
        zone?.code,
        zone?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return {
        ...bin,
        warehouseCode: warehouse?.code,
        warehouseName: warehouse?.name,
        zoneCode: zone?.code,
        zoneName: zone?.name,
        displayLabel,
        searchText,
      };
    });
  }, [bins, zoneMap, warehouseMap]);

  // Filter bins by search
  const filteredBins = useMemo(() => {
    if (!search) return enrichedBins;

    const q = search.toLowerCase();
    return enrichedBins.filter(bin => bin.searchText.includes(q));
  }, [enrichedBins, search]);

  // Group bins by warehouse > zone
  const groupedBins = useMemo(() => {
    const groups = new Map<
      string,
      { warehouse: string; zone: string; bins: EnrichedBin[] }
    >();

    filteredBins.forEach(bin => {
      const key = `${bin.warehouseCode || 'N/A'}-${bin.zoneCode || 'N/A'}`;
      if (!groups.has(key)) {
        groups.set(key, {
          warehouse: bin.warehouseName || bin.warehouseCode || 'Sem Armazém',
          zone: bin.zoneName || bin.zoneCode || 'Sem Zona',
          bins: [],
        });
      }
      groups.get(key)!.bins.push(bin);
    });

    return Array.from(groups.entries()).map(([key, group]) => ({
      key,
      ...group,
    }));
  }, [filteredBins]);

  // Get selected bin info
  const selectedBin = useMemo(() => {
    return enrichedBins.find(bin => bin.id === value);
  }, [enrichedBins, value]);

  const handleSelect = useCallback(
    (binId: string) => {
      onChange(binId);
      setOpen(false);
      setSearch('');
    },
    [onChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="bin-selector-list"
          disabled={disabled}
          className={cn(
            'flex h-12 w-full items-center justify-between rounded-(--input-radius) px-4 text-base',
            'bg-(--input-bg)',
            'border border-[rgb(var(--color-border))]',
            'text-[rgb(var(--color-foreground))]',
            'transition-all duration-(--transition-normal)',
            'focus:outline-none focus:border-[rgb(var(--color-border-focus))]',
            'focus:ring-[3px] focus:ring-[rgb(var(--color-ring)/0.5)]',
            'disabled:pointer-events-none disabled:opacity-(--state-disabled-opacity) disabled:bg-[rgb(var(--color-background-muted))]',
            className
          )}
        >
          {selectedBin ? (
            <div className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{selectedBin.address}</span>
              {selectedBin.warehouseCode && (
                <span className="text-xs text-muted-foreground">
                  ({selectedBin.warehouseCode}/{selectedBin.zoneCode})
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por endereço, armazém ou zona..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList id="bin-selector-list">
            {isLoading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : filteredBins.length === 0 ? (
              <CommandEmpty>
                {search
                  ? 'Nenhuma localização encontrada.'
                  : 'Nenhum bin disponível.'}
              </CommandEmpty>
            ) : (
              groupedBins.map(group => (
                <CommandGroup
                  key={group.key}
                  heading={
                    <div className="flex items-center gap-2 text-xs">
                      <Warehouse className="h-3 w-3" />
                      <span>{group.warehouse}</span>
                      <span className="text-muted-foreground">›</span>
                      <Grid3X3 className="h-3 w-3" />
                      <span>{group.zone}</span>
                    </div>
                  }
                >
                  {group.bins.map(bin => (
                    <CommandItem
                      key={bin.id}
                      value={bin.id}
                      onSelect={() => handleSelect(bin.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === bin.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{bin.address}</span>
                      </div>
                      {bin.capacity && (
                        <span className="text-xs text-muted-foreground">
                          {bin.currentOccupancy}/{bin.capacity}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
