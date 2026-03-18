'use client';

import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Warehouse, Zone, ZoneStructure } from '@/types/stock';

interface LabelBinRangeSelectorProps {
  warehouses: Warehouse[];
  zones: Zone[];
  selectedWarehouseId: string | null;
  selectedZoneId: string | null;
  selectAllAisles: boolean;
  selectedAisles: number[];
  selectAllShelves: boolean;
  shelfFrom: number;
  shelfTo: number;
  selectedBins: string[];
  onWarehouseChange: (id: string | null) => void;
  onZoneChange: (id: string | null) => void;
  onAislesChange: (aisles: number[], selectAll: boolean) => void;
  onShelvesChange: (from: number, to: number, selectAll: boolean) => void;
  onBinsChange: (bins: string[]) => void;
}

export function LabelBinRangeSelector({
  warehouses,
  zones,
  selectedWarehouseId,
  selectedZoneId,
  selectAllAisles,
  selectedAisles,
  selectAllShelves,
  shelfFrom,
  shelfTo,
  selectedBins,
  onWarehouseChange,
  onZoneChange,
  onAislesChange,
  onShelvesChange,
  onBinsChange,
}: LabelBinRangeSelectorProps) {
  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);
  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const structure = selectedZone?.structure;

  // Filtrar zonas pelo armazém selecionado
  const filteredZones = useMemo(() => {
    if (!selectedWarehouseId) return [];
    return zones.filter(z => z.warehouseId === selectedWarehouseId);
  }, [zones, selectedWarehouseId]);

  // Calcular total de etiquetas
  const totalLabels = useMemo(() => {
    if (!structure) return 0;

    const aisleCount = selectAllAisles
      ? structure.aisles
      : selectedAisles.length;
    const shelfCount = selectAllShelves
      ? structure.shelvesPerAisle
      : Math.max(0, shelfTo - shelfFrom + 1);
    const binCount = selectedBins.length;

    return aisleCount * shelfCount * binCount;
  }, [
    structure,
    selectAllAisles,
    selectedAisles,
    selectAllShelves,
    shelfFrom,
    shelfTo,
    selectedBins,
  ]);

  // Gerar array de corredores disponíveis
  const availableAisles = useMemo(() => {
    if (!structure) return [];
    return Array.from({ length: structure.aisles }, (_, i) => i + 1);
  }, [structure]);

  // Gerar array de bins disponíveis
  const availableBins = useMemo(() => {
    if (!structure) return [];
    if (structure.codePattern.binLabeling.toUpperCase() === 'LETTERS') {
      return Array.from({ length: structure.binsPerShelf }, (_, i) =>
        String.fromCharCode(65 + i)
      );
    }
    return Array.from({ length: structure.binsPerShelf }, (_, i) =>
      (i + 1).toString()
    );
  }, [structure]);

  const handleToggleAisle = (aisle: number) => {
    if (selectAllAisles) {
      // Mudar para seleção individual
      onAislesChange(
        availableAisles.filter(a => a !== aisle),
        false
      );
    } else {
      const newSelected = selectedAisles.includes(aisle)
        ? selectedAisles.filter(a => a !== aisle)
        : [...selectedAisles, aisle];
      onAislesChange(newSelected, false);
    }
  };

  const handleToggleAllAisles = () => {
    if (selectAllAisles) {
      onAislesChange([], false);
    } else {
      onAislesChange(availableAisles, true);
    }
  };

  const handleToggleBin = (bin: string) => {
    const newSelected = selectedBins.includes(bin)
      ? selectedBins.filter(b => b !== bin)
      : [...selectedBins, bin];
    onBinsChange(newSelected);
  };

  const handleToggleAllBins = () => {
    if (selectedBins.length === availableBins.length) {
      onBinsChange([]);
    } else {
      onBinsChange(availableBins);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Seleção de Localizações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Armazém e Zona */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Armazém</Label>
            <Select
              value={selectedWarehouseId || ''}
              onValueChange={value => {
                onWarehouseChange(value || null);
                onZoneChange(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um armazém" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Zona</Label>
            <Select
              value={selectedZoneId || ''}
              onValueChange={value => onZoneChange(value || null)}
              disabled={!selectedWarehouseId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma zona" />
              </SelectTrigger>
              <SelectContent>
                {filteredZones.map(zone => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.code} - {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Corredores */}
        {structure && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Corredores</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="all-aisles"
                    checked={selectAllAisles}
                    onCheckedChange={handleToggleAllAisles}
                  />
                  <Label
                    htmlFor="all-aisles"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Todos ({structure.aisles})
                  </Label>
                </div>
              </div>

              {!selectAllAisles && (
                <div className="flex flex-wrap gap-2">
                  {availableAisles.map(aisle => (
                    <Button
                      key={aisle}
                      variant={
                        selectedAisles.includes(aisle) ? 'default' : 'outline'
                      }
                      size="sm"
                      className="h-8 w-10"
                      onClick={() => handleToggleAisle(aisle)}
                    >
                      {aisle}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Prateleiras */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Prateleiras</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="all-shelves"
                    checked={selectAllShelves}
                    onCheckedChange={checked => {
                      if (checked) {
                        onShelvesChange(1, structure.shelvesPerAisle, true);
                      } else {
                        onShelvesChange(shelfFrom, shelfTo, false);
                      }
                    }}
                  />
                  <Label
                    htmlFor="all-shelves"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Todas ({structure.shelvesPerAisle})
                  </Label>
                </div>
              </div>

              {!selectAllShelves && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">De:</Label>
                    <Input
                      type="number"
                      value={shelfFrom}
                      onChange={e =>
                        onShelvesChange(
                          Math.max(1, parseInt(e.target.value) || 1),
                          shelfTo,
                          false
                        )
                      }
                      min={1}
                      max={structure.shelvesPerAisle}
                      className="w-20 h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">
                      Até:
                    </Label>
                    <Input
                      type="number"
                      value={shelfTo}
                      onChange={e =>
                        onShelvesChange(
                          shelfFrom,
                          Math.min(
                            structure.shelvesPerAisle,
                            parseInt(e.target.value) ||
                              structure.shelvesPerAisle
                          ),
                          false
                        )
                      }
                      min={1}
                      max={structure.shelvesPerAisle}
                      className="w-20 h-8"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Nichos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Nichos</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={handleToggleAllBins}
                >
                  {selectedBins.length === availableBins.length
                    ? 'Desmarcar todos'
                    : 'Marcar todos'}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableBins.map(bin => (
                  <Button
                    key={bin}
                    variant={selectedBins.includes(bin) ? 'default' : 'outline'}
                    size="sm"
                    className="h-10 w-10"
                    onClick={() => handleToggleBin(bin)}
                  >
                    {bin}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Resumo */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total de etiquetas
            </span>
            <Badge variant="secondary" className="text-lg font-bold px-3">
              {totalLabels.toLocaleString()}
            </Badge>
          </div>
          {structure && (
            <p className="text-xs text-muted-foreground mt-2">
              {selectAllAisles ? structure.aisles : selectedAisles.length}{' '}
              corredor(es) ×{' '}
              {selectAllShelves
                ? structure.shelvesPerAisle
                : Math.max(0, shelfTo - shelfFrom + 1)}{' '}
              prateleira(s) × {selectedBins.length} nicho(s)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
