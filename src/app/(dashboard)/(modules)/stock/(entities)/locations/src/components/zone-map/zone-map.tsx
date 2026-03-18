'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Filter,
  Loader2,
  RotateCcw,
  Search,
  Tag,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { toast } from 'sonner';
import { MoveItemModal } from '../../modals/move-item-modal';
import type { Bin, BinItem, BinOccupancy, Zone } from '@/types/stock';
import { AisleRow } from './aisle-row';
import { BinDetailModal } from './bin-detail-modal';
import { MapLegend } from './map-legend';

interface AisleConfig {
  aisleNumber: number;
  shelvesCount: number;
  binsPerShelf: number;
}

export interface ZoneMapProps {
  zone: Zone;
  bins: BinOccupancy[];
  isLoading?: boolean;
  onPrintLabels?: (binIds: string[]) => void;
  /** ID do bin a ser destacado (via URL param) */
  highlightBinId?: string;
  /** Callback para mover item - recebe itemId, endereço destino e quantidade */
  onMoveItem?: (
    itemId: string,
    targetBinAddress: string,
    quantity: number
  ) => Promise<void>;
}

export type ZoomLevel = 'compact' | 'normal' | 'expanded' | 'detailed';
type FilterMode = 'all' | 'empty' | 'occupied' | 'full' | 'blocked';

export function ZoneMap({
  zone,
  bins,
  isLoading,
  onPrintLabels,
  highlightBinId,
  onMoveItem,
}: ZoneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const structure = zone.structure;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('normal');
  const [selectedBin, setSelectedBin] = useState<BinOccupancy | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBins, setSelectedBins] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [moveItemData, setMoveItemData] = useState<{
    item: BinItem;
    bin: BinOccupancy;
  } | null>(null);

  // Agrupar bins por corredor e prateleira
  const binMatrix = useMemo(() => {
    const matrix: Map<string, BinOccupancy> = new Map();
    bins.forEach(bin => {
      const key = `${bin.aisle}-${bin.shelf}-${bin.position}`;
      matrix.set(key, bin);
    });
    return matrix;
  }, [bins]);

  // Filtrar bins baseado na busca, filtro e highlight externo (URL param)
  const highlightedBins = useMemo(() => {
    const highlighted = new Set<string>();

    // Highlight via URL param (ex: ?highlight=bin-id)
    if (highlightBinId) {
      highlighted.add(highlightBinId);
    }

    // Highlight via busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      bins.forEach(bin => {
        if (bin.address.toLowerCase().includes(query)) {
          highlighted.add(bin.id);
        }
      });
    }

    return highlighted;
  }, [bins, searchQuery, highlightBinId]);

  // Auto-scroll para o bin destacado via URL param
  useEffect(() => {
    if (highlightBinId && bins.length > 0 && containerRef.current) {
      // Aguardar o render do mapa
      const timer = setTimeout(() => {
        const binElement = document.querySelector(
          `[data-bin-id="${highlightBinId}"]`
        );
        if (binElement) {
          binElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightBinId, bins.length]);

  // Handlers
  const handleBinClick = useCallback(
    (bin: BinOccupancy) => {
      if (isSelectionMode) {
        setSelectedBins(prev => {
          const next = new Set(prev);
          if (next.has(bin.id)) {
            next.delete(bin.id);
          } else {
            next.add(bin.id);
          }
          return next;
        });
      } else {
        setSelectedBin(bin);
        setIsDetailModalOpen(true);
      }
    },
    [isSelectionMode]
  );

  const handleCloseDetail = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedBin(null);
  }, []);

  // Handlers para ações nos itens do modal
  const handleViewItem = useCallback((item: BinItem) => {
    // Navegar para a página de detalhes do item
    window.open(`/stock/items/${item.id}`, '_blank');
  }, []);

  const handlePrintItemLabel = useCallback((item: BinItem) => {
    // TODO: Implementar impressão de etiqueta do item
    toast.info(`Gerando etiqueta para ${item.itemCode}...`);
  }, []);

  const handleMoveItem = useCallback(
    (item: BinItem) => {
      if (!selectedBin) return;
      if (!onMoveItem) {
        toast.info(`Movimentar item ${item.itemCode}`);
        return;
      }
      setMoveItemData({ item, bin: selectedBin });
      setIsDetailModalOpen(false);
    },
    [selectedBin, onMoveItem]
  );

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => {
      if (prev === 'compact') return 'normal';
      if (prev === 'normal') return 'expanded';
      if (prev === 'expanded') return 'detailed';
      return prev;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      if (prev === 'detailed') return 'expanded';
      if (prev === 'expanded') return 'normal';
      if (prev === 'normal') return 'compact';
      return prev;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel('normal');
  }, []);

  const handlePrintSelected = useCallback(() => {
    if (onPrintLabels && selectedBins.size > 0) {
      onPrintLabels(Array.from(selectedBins));
    }
  }, [onPrintLabels, selectedBins]);

  const handleSelectAll = useCallback(() => {
    if (selectedBins.size === bins.length) {
      setSelectedBins(new Set());
    } else {
      setSelectedBins(new Set(bins.map(b => b.id)));
    }
  }, [bins, selectedBins.size]);

  // Inferir configurações dos corredores a partir dos bins reais
  const inferredAisleConfigs = useMemo(() => {
    if (bins.length === 0) return null;

    // Agrupar bins por corredor para descobrir a configuração real
    const aisleMap = new Map<
      number,
      { maxShelf: number; positions: Set<string> }
    >();

    bins.forEach(bin => {
      const current = aisleMap.get(bin.aisle) || {
        maxShelf: 0,
        positions: new Set<string>(),
      };
      current.maxShelf = Math.max(current.maxShelf, bin.shelf);
      current.positions.add(bin.position);
      aisleMap.set(bin.aisle, current);
    });

    // Converter para array de configs
    const configs: AisleConfig[] = [];
    aisleMap.forEach((data, aisleNumber) => {
      configs.push({
        aisleNumber,
        shelvesCount: data.maxShelf,
        binsPerShelf: data.positions.size,
      });
    });

    // Ordenar por número do corredor
    configs.sort((a, b) => a.aisleNumber - b.aisleNumber);

    return configs;
  }, [bins]);

  // Gerar dados dos corredores (suporta configurações independentes)
  const aisles = useMemo(() => {
    if (!structure) return [];

    // Prioridade: 1) aisleConfigs do backend, 2) inferido dos bins, 3) modo uniforme
    const aisleConfigs = structure.aisleConfigs ?? inferredAisleConfigs;
    const hasIndependentConfig = aisleConfigs && aisleConfigs.length > 0;

    if (hasIndependentConfig) {
      return aisleConfigs.map(config => ({
        number: config.aisleNumber,
        config, // Passar a configuração específica do corredor
        shelves: Array.from({ length: config.shelvesCount }, (_, j) => ({
          number: j + 1,
          bins: Array.from({ length: config.binsPerShelf }, (_, k) => {
            const position =
              structure.codePattern.binLabeling.toUpperCase() === 'LETTERS'
                ? String.fromCharCode(65 + k)
                : (k + 1).toString();
            const key = `${config.aisleNumber}-${j + 1}-${position}`;
            return binMatrix.get(key) || null;
          }),
        })),
      }));
    }

    // Fallback para modo uniforme (sem configurações independentes)
    return Array.from({ length: structure.aisles }, (_, i) => ({
      number: i + 1,
      config: undefined, // Sem configuração específica
      shelves: Array.from({ length: structure.shelvesPerAisle }, (_, j) => ({
        number: j + 1,
        bins: Array.from({ length: structure.binsPerShelf }, (_, k) => {
          const position =
            structure.codePattern.binLabeling.toUpperCase() === 'LETTERS'
              ? String.fromCharCode(65 + k)
              : (k + 1).toString();
          const key = `${i + 1}-${j + 1}-${position}`;
          return binMatrix.get(key) || null;
        }),
      })),
    }));
  }, [structure, binMatrix, inferredAisleConfigs]);

  if (!structure) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Estrutura não configurada
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Busca e Filtros */}
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar endereço..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filterMode}
            onValueChange={v => setFilterMode(v as FilterMode)}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="empty">Vazios</SelectItem>
              <SelectItem value="occupied">Ocupados</SelectItem>
              <SelectItem value="full">Cheios</SelectItem>
              <SelectItem value="blocked">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Zoom e Ações */}
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={handleZoomOut}
              disabled={zoomLevel === 'compact'}
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none border-x"
              onClick={handleResetZoom}
              aria-label="Resetar zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={handleZoomIn}
              disabled={zoomLevel === 'detailed'}
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Modo seleção */}
          <Button
            variant={isSelectionMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedBins(new Set());
            }}
          >
            <Tag className="h-4 w-4 mr-1" />
            {isSelectionMode ? 'Cancelar' : 'Selecionar'}
          </Button>

          {isSelectionMode && selectedBins.size > 0 && (
            <Button size="sm" onClick={handlePrintSelected}>
              Imprimir ({selectedBins.size})
            </Button>
          )}
        </div>
      </div>

      {/* Seleção em massa */}
      {isSelectionMode && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            {selectedBins.size === bins.length
              ? 'Desmarcar todos'
              : 'Selecionar todos'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedBins.size} de {bins.length} selecionados
          </span>
        </div>
      )}

      {/* Grid do Mapa */}
      <div
        ref={containerRef}
        className="relative overflow-auto border rounded-lg bg-muted/20"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="min-w-max p-4">
            {/* Corredores - cada um com sua própria numeração de prateleiras e zoom */}
            <div className="space-y-4">
              {aisles.map(aisle => (
                <AisleRow
                  key={aisle.number}
                  aisleNumber={aisle.number}
                  shelves={aisle.shelves}
                  structure={structure}
                  aisleConfig={aisle.config}
                  zoomLevel={zoomLevel}
                  filterMode={filterMode}
                  highlightedBins={highlightedBins}
                  selectedBins={selectedBins}
                  isSelectionMode={isSelectionMode}
                  onBinClick={handleBinClick}
                  enableIndividualZoom={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <MapLegend />

      {/* Modal de Detalhes */}
      <BinDetailModal
        bin={selectedBin}
        zone={zone}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        onViewItem={handleViewItem}
        onPrintItemLabel={handlePrintItemLabel}
        onMoveItem={handleMoveItem}
      />

      {/* Modal de Mover Item */}
      {moveItemData && onMoveItem && (
        <MoveItemModal
          open={!!moveItemData}
          onOpenChange={open => {
            if (!open) setMoveItemData(null);
          }}
          item={moveItemData.item}
          currentBin={
            {
              id: moveItemData.bin.id,
              zoneId: zone.id,
              address: moveItemData.bin.address,
              aisle: moveItemData.bin.aisle,
              shelf: moveItemData.bin.shelf,
              position: moveItemData.bin.position,
              currentOccupancy: moveItemData.bin.currentOccupancy,
              capacity: moveItemData.bin.capacity,
              isActive: true,
              isBlocked: moveItemData.bin.isBlocked,
              createdAt: '',
              updatedAt: '',
            } satisfies Bin
          }
          onMove={onMoveItem}
        />
      )}
    </div>
  );
}

export default ZoneMap;
