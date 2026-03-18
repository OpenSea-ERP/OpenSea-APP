'use client';

import { logger } from '@/lib/logger';
import React, { useState, useMemo, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import {
  Printer,
  FileDown,
  Loader2,
  AlertCircle,
  Tags,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { LabelBinRangeSelector } from './label-bin-range-selector';
import { LabelFormatOptions } from './label-format-options';
import { LabelPreview } from './label-preview';
import { LabelPDFDocument, prepareLabelData } from './label-pdf-document';
import type {
  LabelConfig,
  LabelData,
  LabelSelectionState,
  Warehouse,
  Zone,
  defaultLabelConfig,
} from '@/types/stock';

// ============================================
// Types
// ============================================

export interface LabelGeneratorProps {
  warehouses: Warehouse[];
  zones: Zone[];
  className?: string;
}

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  error: string | null;
}

// ============================================
// Componente Principal
// ============================================

export function LabelGenerator({
  warehouses,
  zones,
  className,
}: LabelGeneratorProps) {
  // Selection state
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [selectAllAisles, setSelectAllAisles] = useState(true);
  const [selectedAisles, setSelectedAisles] = useState<number[]>([]);
  const [selectAllShelves, setSelectAllShelves] = useState(true);
  const [shelfFrom, setShelfFrom] = useState(1);
  const [shelfTo, setShelfTo] = useState(50);
  const [selectedBins, setSelectedBins] = useState<string[]>([
    'A',
    'B',
    'C',
    'D',
  ]);
  const [config, setConfig] = useState<LabelConfig>({
    format: 'qr',
    size: 'medium',
    showWarehouseName: false,
    showZoneName: true,
    showFullPath: false,
  });

  // Generation state
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    error: null,
  });

  // Filtered zones based on selected warehouse
  const filteredZones = useMemo(() => {
    if (!warehouseId) return [];
    return zones.filter(z => z.warehouseId === warehouseId);
  }, [zones, warehouseId]);

  // Selected warehouse and zone data
  const selectedWarehouse = useMemo(
    () => warehouses.find(w => w.id === warehouseId),
    [warehouses, warehouseId]
  );

  const selectedZone = useMemo(
    () => zones.find(z => z.id === zoneId),
    [zones, zoneId]
  );

  const structure = selectedZone?.structure;

  // Calculate total labels
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

  // Sample data for preview
  const sampleLabelData: LabelData = useMemo(() => {
    const warehouseCode = selectedWarehouse?.code || 'WH';
    const zoneCode = selectedZone?.code || 'ZN';
    const separator = structure?.codePattern?.separator || '-';
    const aisleDigits = structure?.codePattern?.aisleDigits || 2;
    const shelfDigits = structure?.codePattern?.shelfDigits || 2;

    const aisleNum = String(
      selectAllAisles ? 1 : selectedAisles[0] || 1
    ).padStart(aisleDigits, '0');
    const shelfNum = String(shelfFrom).padStart(shelfDigits, '0');
    const bin = selectedBins[0] || 'A';

    const address = `${warehouseCode}${separator}${zoneCode}${separator}${aisleNum}${shelfNum}${separator}${bin}`;

    return {
      address,
      warehouseCode,
      warehouseName: selectedWarehouse?.name,
      zoneCode,
      zoneName: selectedZone?.name,
      fullPath: `Corredor ${aisleNum} → Prat. ${shelfNum} → Nicho ${bin}`,
    };
  }, [
    selectedWarehouse,
    selectedZone,
    structure,
    selectAllAisles,
    selectedAisles,
    shelfFrom,
    selectedBins,
  ]);

  // Handlers
  const handleWarehouseChange = useCallback((id: string | null) => {
    setWarehouseId(id);
    setZoneId(null);
    setSelectAllAisles(true);
    setSelectedAisles([]);
  }, []);

  const handleZoneChange = useCallback(
    (id: string | null) => {
      setZoneId(id);
      setSelectAllAisles(true);
      setSelectedAisles([]);
      setSelectAllShelves(true);

      // Update shelf range based on new zone
      const zone = zones.find(z => z.id === id);
      if (zone?.structure) {
        setShelfTo(zone.structure.shelvesPerAisle);
        // Update bins based on zone structure
        const binCount = zone.structure.binsPerShelf;
        const binLabeling =
          zone.structure.codePattern?.binLabeling || 'LETTERS';
        if (binLabeling.toUpperCase() === 'LETTERS') {
          setSelectedBins(
            Array.from({ length: binCount }, (_, i) =>
              String.fromCharCode(65 + i)
            )
          );
        } else {
          setSelectedBins(
            Array.from({ length: binCount }, (_, i) => (i + 1).toString())
          );
        }
      }
    },
    [zones]
  );

  const handleAislesChange = useCallback(
    (aisles: number[], selectAll: boolean) => {
      setSelectedAisles(aisles);
      setSelectAllAisles(selectAll);
    },
    []
  );

  const handleShelvesChange = useCallback(
    (from: number, to: number, selectAll: boolean) => {
      setShelfFrom(from);
      setShelfTo(to);
      setSelectAllShelves(selectAll);
    },
    []
  );

  const handleBinsChange = useCallback((bins: string[]) => {
    setSelectedBins(bins);
  }, []);

  // Generate labels data
  const generateLabelsData = useCallback((): LabelData[] => {
    if (!structure || !selectedWarehouse || !selectedZone) return [];

    const labels: LabelData[] = [];
    const separator = structure.codePattern?.separator || '-';
    const aisleDigits = structure.codePattern?.aisleDigits || 2;
    const shelfDigits = structure.codePattern?.shelfDigits || 2;

    const aisles = selectAllAisles
      ? Array.from({ length: structure.aisles }, (_, i) => i + 1)
      : selectedAisles;

    const shelfStart = selectAllShelves ? 1 : shelfFrom;
    const shelfEnd = selectAllShelves ? structure.shelvesPerAisle : shelfTo;

    for (const aisleNum of aisles) {
      for (let shelf = shelfStart; shelf <= shelfEnd; shelf++) {
        for (const bin of selectedBins) {
          const aisleStr = String(aisleNum).padStart(aisleDigits, '0');
          const shelfStr = String(shelf).padStart(shelfDigits, '0');

          labels.push({
            address: `${selectedWarehouse.code}${separator}${selectedZone.code}${separator}${aisleStr}${shelfStr}${separator}${bin}`,
            warehouseCode: selectedWarehouse.code,
            warehouseName: selectedWarehouse.name,
            zoneCode: selectedZone.code,
            zoneName: selectedZone.name,
            fullPath: `Corredor ${aisleStr} → Prat. ${shelfStr} → Nicho ${bin}`,
          });
        }
      }
    }

    return labels;
  }, [
    structure,
    selectedWarehouse,
    selectedZone,
    selectAllAisles,
    selectedAisles,
    selectAllShelves,
    shelfFrom,
    shelfTo,
    selectedBins,
  ]);

  // Generate and download PDF
  const handleGeneratePDF = useCallback(async () => {
    setGenerationState({ isGenerating: true, progress: 0, error: null });

    try {
      // Generate labels data
      const labelsData = generateLabelsData();
      if (labelsData.length === 0) {
        throw new Error('Nenhuma etiqueta para gerar');
      }

      setGenerationState(prev => ({ ...prev, progress: 20 }));

      // Prepare labels with QR/Barcode data URLs
      const preparedLabels = await prepareLabelData(labelsData, config);
      setGenerationState(prev => ({ ...prev, progress: 60 }));

      // Generate PDF
      const pdfDoc = (
        <LabelPDFDocument labels={preparedLabels} config={config} />
      );

      const blob = await pdf(pdfDoc).toBlob();
      setGenerationState(prev => ({ ...prev, progress: 90 }));

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `etiquetas-${selectedWarehouse?.code || 'labels'}-${selectedZone?.code || ''}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setGenerationState({ isGenerating: false, progress: 100, error: null });
    } catch (err) {
      logger.error(
        'Error generating PDF',
        err instanceof Error ? err : undefined
      );
      setGenerationState({
        isGenerating: false,
        progress: 0,
        error: err instanceof Error ? err.message : 'Erro ao gerar PDF',
      });
    }
  }, [generateLabelsData, config, selectedWarehouse, selectedZone]);

  // Print directly (opens PDF in new tab)
  const handlePrint = useCallback(async () => {
    setGenerationState({ isGenerating: true, progress: 0, error: null });

    try {
      const labelsData = generateLabelsData();
      if (labelsData.length === 0) {
        throw new Error('Nenhuma etiqueta para gerar');
      }

      setGenerationState(prev => ({ ...prev, progress: 20 }));

      const preparedLabels = await prepareLabelData(labelsData, config);
      setGenerationState(prev => ({ ...prev, progress: 60 }));

      const pdfDoc = (
        <LabelPDFDocument labels={preparedLabels} config={config} />
      );

      const blob = await pdf(pdfDoc).toBlob();
      setGenerationState(prev => ({ ...prev, progress: 90 }));

      // Open in new tab for printing
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      setGenerationState({ isGenerating: false, progress: 100, error: null });
    } catch (err) {
      logger.error('Error printing', err instanceof Error ? err : undefined);
      setGenerationState({
        isGenerating: false,
        progress: 0,
        error: err instanceof Error ? err.message : 'Erro ao imprimir',
      });
    }
  }, [generateLabelsData, config]);

  const canGenerate =
    zoneId && totalLabels > 0 && !generationState.isGenerating;

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Selection */}
        <div className="lg:col-span-2 space-y-6">
          <LabelBinRangeSelector
            warehouses={warehouses}
            zones={filteredZones}
            selectedWarehouseId={warehouseId}
            selectedZoneId={zoneId}
            selectAllAisles={selectAllAisles}
            selectedAisles={selectedAisles}
            selectAllShelves={selectAllShelves}
            shelfFrom={shelfFrom}
            shelfTo={shelfTo}
            selectedBins={selectedBins}
            onWarehouseChange={handleWarehouseChange}
            onZoneChange={handleZoneChange}
            onAislesChange={handleAislesChange}
            onShelvesChange={handleShelvesChange}
            onBinsChange={handleBinsChange}
          />

          <LabelFormatOptions config={config} onChange={setConfig} />
        </div>

        {/* Right Column - Preview & Actions */}
        <div className="space-y-6">
          <LabelPreview config={config} sampleData={sampleLabelData} />

          {/* Label Count */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Tags className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Total de Etiquetas
              </span>
            </div>
            <div className="text-3xl font-bold">
              {totalLabels.toLocaleString('pt-BR')}
            </div>
            {totalLabels > 500 && (
              <p className="text-xs text-muted-foreground mt-2">
                A geração pode levar alguns segundos
              </p>
            )}
          </div>

          {/* Error Alert */}
          {generationState.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generationState.error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleGeneratePDF}
              disabled={!canGenerate}
              className="w-full"
              size="lg"
            >
              {generationState.isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando... {generationState.progress}%
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Baixar PDF
                </>
              )}
            </Button>

            <Button
              onClick={handlePrint}
              disabled={!canGenerate}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>

          {/* Info */}
          {!zoneId && (
            <p className="text-sm text-muted-foreground text-center">
              Selecione um armazém e uma zona para gerar etiquetas
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
