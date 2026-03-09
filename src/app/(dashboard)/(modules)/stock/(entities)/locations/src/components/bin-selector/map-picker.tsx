'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronRight, MapPin, Warehouse, Grid3X3, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  Warehouse as WarehouseType,
  Zone,
  Bin,
  OccupancyLevel,
} from '../../types';

export interface MapPickerProps {
  warehouses: WarehouseType[];
  zones: Zone[];
  bins: Bin[];
  selectedAddress?: string;
  onSelect: (address: string) => void;
  isLoading?: boolean;
  className?: string;
}

// Colors based on occupancy level
const OCCUPANCY_COLORS: Record<OccupancyLevel, string> = {
  empty:
    'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600',
  low: 'bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-700',
  medium:
    'bg-yellow-200 dark:bg-yellow-800 hover:bg-yellow-300 dark:hover:bg-yellow-700',
  high: 'bg-orange-200 dark:bg-orange-800 hover:bg-orange-300 dark:hover:bg-orange-700',
  full: 'bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700',
  blocked: 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-50',
};

function getOccupancyLevel(bin: Bin): OccupancyLevel {
  if (bin.isBlocked) return 'blocked';
  if (!bin.capacity || bin.capacity === 0) {
    return bin.currentOccupancy === 0 ? 'empty' : 'low';
  }
  const percentage = (bin.currentOccupancy / bin.capacity) * 100;
  if (percentage === 0) return 'empty';
  if (percentage < 50) return 'low';
  if (percentage < 80) return 'medium';
  if (percentage < 95) return 'high';
  return 'full';
}

export function MapPicker({
  warehouses,
  zones,
  bins,
  selectedAddress,
  onSelect,
  isLoading = false,
  className,
}: MapPickerProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(
    null
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedAisle, setSelectedAisle] = useState<number | null>(null);

  // Filtered zones for selected warehouse
  const filteredZones = useMemo(() => {
    if (!selectedWarehouseId) return [];
    return zones.filter(z => z.warehouseId === selectedWarehouseId);
  }, [zones, selectedWarehouseId]);

  // Selected warehouse/zone data
  const selectedWarehouse = useMemo(
    () => warehouses.find(w => w.id === selectedWarehouseId),
    [warehouses, selectedWarehouseId]
  );

  const selectedZone = useMemo(
    () => zones.find(z => z.id === selectedZoneId),
    [zones, selectedZoneId]
  );

  // Get unique aisles for selected zone
  const aisles = useMemo(() => {
    if (!selectedZone?.structure) return [];
    return Array.from(
      { length: selectedZone.structure.aisles },
      (_, i) => i + 1
    );
  }, [selectedZone]);

  // Filter bins for selected aisle
  const filteredBins = useMemo(() => {
    if (!selectedAisle) return [];
    return bins.filter(b => b.aisle === selectedAisle);
  }, [bins, selectedAisle]);

  // Group bins by shelf
  const binsByShelf = useMemo(() => {
    const grouped: Record<number, Bin[]> = {};
    filteredBins.forEach(bin => {
      if (!grouped[bin.shelf]) {
        grouped[bin.shelf] = [];
      }
      grouped[bin.shelf].push(bin);
    });
    // Sort shelves and bins within each shelf
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([shelf, shelfBins]) => ({
        shelf: Number(shelf),
        bins: shelfBins.sort((a, b) => a.position.localeCompare(b.position)),
      }));
  }, [filteredBins]);

  // Handle warehouse change
  const handleWarehouseChange = useCallback((id: string) => {
    setSelectedWarehouseId(id);
    setSelectedZoneId(null);
    setSelectedAisle(null);
  }, []);

  // Handle zone change
  const handleZoneChange = useCallback((id: string) => {
    setSelectedZoneId(id);
    setSelectedAisle(null);
  }, []);

  // Handle aisle change
  const handleAisleChange = useCallback((aisle: number) => {
    setSelectedAisle(aisle);
  }, []);

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    const parts: string[] = [];
    if (selectedWarehouse) parts.push(selectedWarehouse.code);
    if (selectedZone) parts.push(selectedZone.code);
    if (selectedAisle) parts.push(`Corredor ${selectedAisle}`);
    return parts;
  }, [selectedWarehouse, selectedZone, selectedAisle]);

  if (isLoading) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-full" />
          <div className="h-10 bg-muted rounded w-full" />
          <div className="h-32 bg-muted rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {breadcrumb.map((part, index) => (
            <React.Fragment key={part}>
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              <span className="font-medium">{part}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Selection dropdowns */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Warehouse */}
        <div className="space-y-1">
          <label htmlFor="map-warehouse" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Warehouse className="h-3 w-3" />
            Armazém
          </label>
          <Select
            value={selectedWarehouseId || ''}
            onValueChange={handleWarehouseChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map(w => (
                <SelectItem key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zone */}
        <div className="space-y-1">
          <label htmlFor="map-zone" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Grid3X3 className="h-3 w-3" />
            Zona
          </label>
          <Select
            value={selectedZoneId || ''}
            onValueChange={handleZoneChange}
            disabled={!selectedWarehouseId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {filteredZones.map(z => (
                <SelectItem key={z.id} value={z.id}>
                  {z.code} - {z.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aisle */}
        <div className="space-y-1">
          <label htmlFor="map-aisle" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" />
            Corredor
          </label>
          <Select
            value={selectedAisle?.toString() || ''}
            onValueChange={v => handleAisleChange(Number(v))}
            disabled={!selectedZoneId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {aisles.map(a => (
                <SelectItem key={a} value={a.toString()}>
                  Corredor {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bin grid */}
      {selectedAisle && (
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted/50">
            <h4 className="text-sm font-medium">
              Selecione um nicho - Corredor {selectedAisle}
            </h4>
            <p className="text-xs text-muted-foreground">
              {filteredBins.length} nichos disponíveis
            </p>
          </div>

          <ScrollArea className="max-h-[300px]">
            <div className="p-3 space-y-4">
              {binsByShelf.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum nicho encontrado neste corredor
                </p>
              ) : (
                binsByShelf.map(({ shelf, bins: shelfBins }) => (
                  <div key={shelf} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Prateleira {String(shelf).padStart(2, '0')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({shelfBins.length} nichos)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {shelfBins.map(bin => {
                        const level = getOccupancyLevel(bin);
                        const isSelected = selectedAddress === bin.address;
                        const isBlocked = bin.isBlocked;

                        return (
                          <Button
                            key={bin.id}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => !isBlocked && onSelect(bin.address)}
                            disabled={isBlocked}
                            className={cn(
                              'h-10 w-10 p-0 font-mono font-bold',
                              OCCUPANCY_COLORS[level],
                              isSelected && 'ring-2 ring-primary ring-offset-2'
                            )}
                            title={`${bin.address} - ${bin.currentOccupancy} itens`}
                          >
                            {bin.position}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Legend */}
          <div className="p-3 border-t bg-muted/30">
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                <span>Vazio</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-800" />
                <span>Baixa</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-800" />
                <span>Média</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-200 dark:bg-orange-800" />
                <span>Alta</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-200 dark:bg-red-800" />
                <span>Cheio</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-400 dark:bg-gray-600" />
                <span>Bloqueado</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedAisle && selectedZoneId && (
        <div className="text-center py-8 text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Selecione um corredor para ver os nichos</p>
        </div>
      )}

      {!selectedZoneId && selectedWarehouseId && (
        <div className="text-center py-8 text-muted-foreground">
          <Grid3X3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Selecione uma zona para continuar</p>
        </div>
      )}

      {!selectedWarehouseId && (
        <div className="text-center py-8 text-muted-foreground">
          <Warehouse className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Selecione um armazém para começar</p>
        </div>
      )}
    </div>
  );
}
