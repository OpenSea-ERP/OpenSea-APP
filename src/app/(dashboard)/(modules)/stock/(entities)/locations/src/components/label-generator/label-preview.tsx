'use client';

import { logger } from '@/lib/logger';
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  LabelConfig,
  LabelData,
  LabelSize,
  LABEL_SIZES,
} from '@/types/stock';

interface LabelPreviewProps {
  config: LabelConfig;
  sampleData?: LabelData;
  className?: string;
}

const LABEL_DIMENSIONS: Record<LabelSize, { width: number; height: number }> = {
  small: { width: 120, height: 80 },
  medium: { width: 200, height: 120 },
  large: { width: 280, height: 160 },
};

const defaultSampleData: LabelData = {
  address: 'FAB-EST-102-B',
  warehouseCode: 'FAB',
  warehouseName: 'Fábrica Principal',
  zoneCode: 'EST',
  zoneName: 'Estoque',
  fullPath: 'Corredor 1 → Prat. 02 → Nicho B',
};

export function LabelPreview({
  config,
  sampleData = defaultSampleData,
  className,
}: LabelPreviewProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const dimensions = LABEL_DIMENSIONS[config.size];

  // Generate QR Code
  useEffect(() => {
    if (config.format === 'qr') {
      QRCode.toDataURL(sampleData.address, {
        width: dimensions.width * 0.4,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err =>
          logger.error('QR Code error', err instanceof Error ? err : undefined)
        );
    }
  }, [config.format, sampleData.address, dimensions.width]);

  // Generate Barcode
  useEffect(() => {
    if (config.format === 'barcode' && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, sampleData.address, {
          format: 'CODE128',
          width: 1.5,
          height: dimensions.height * 0.35,
          displayValue: false,
          margin: 0,
        });
      } catch (err) {
        logger.error('Barcode error', err instanceof Error ? err : undefined);
      }
    }
  }, [config.format, sampleData.address, dimensions.height]);

  // Calculate font sizes based on label size
  const fontSizes = {
    small: { code: 10, secondary: 7, path: 6 },
    medium: { code: 14, secondary: 9, path: 8 },
    large: { code: 18, secondary: 11, path: 10 },
  };
  const fonts = fontSizes[config.size];

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Prévia da Etiqueta</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div
          className={cn(
            'bg-white border-2 border-dashed border-muted-foreground/30 rounded-lg',
            'flex flex-col items-center justify-center p-2 transition-all'
          )}
          style={{
            width: dimensions.width,
            height: dimensions.height,
          }}
        >
          {/* Code Image (QR or Barcode) */}
          <div className="flex-shrink-0 mb-1">
            {config.format === 'qr' ? (
              qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  style={{
                    width: dimensions.width * 0.35,
                    height: dimensions.width * 0.35,
                  }}
                />
              ) : (
                <div
                  className="bg-muted animate-pulse"
                  style={{
                    width: dimensions.width * 0.35,
                    height: dimensions.width * 0.35,
                  }}
                />
              )
            ) : (
              <svg ref={barcodeRef} />
            )}
          </div>

          {/* Address Code */}
          <div
            className="font-mono font-bold text-black text-center"
            style={{ fontSize: fonts.code }}
          >
            {sampleData.address}
          </div>

          {/* Optional Info */}
          <div className="flex flex-col items-center gap-0.5 mt-0.5 text-center">
            {config.showWarehouseName && sampleData.warehouseName && (
              <div
                className="text-gray-600 truncate max-w-full"
                style={{ fontSize: fonts.secondary }}
              >
                {sampleData.warehouseName}
              </div>
            )}
            {config.showZoneName && sampleData.zoneName && (
              <div
                className="text-gray-500 truncate max-w-full"
                style={{ fontSize: fonts.secondary }}
              >
                {sampleData.zoneName}
              </div>
            )}
            {config.showFullPath && sampleData.fullPath && (
              <div
                className="text-gray-400 truncate max-w-full"
                style={{ fontSize: fonts.path }}
              >
                {sampleData.fullPath}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Componente para múltiplas labels (para PDF)
// ============================================

interface LabelForPDFProps {
  data: LabelData;
  config: LabelConfig;
  qrDataUrl?: string;
}

export function LabelForPDF({ data, config, qrDataUrl }: LabelForPDFProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const dimensions = LABEL_DIMENSIONS[config.size];
  const fonts = {
    small: { code: 10, secondary: 7, path: 6 },
    medium: { code: 14, secondary: 9, path: 8 },
    large: { code: 18, secondary: 11, path: 10 },
  }[config.size];

  useEffect(() => {
    if (config.format === 'barcode' && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, data.address, {
          format: 'CODE128',
          width: 1.5,
          height: dimensions.height * 0.35,
          displayValue: false,
          margin: 0,
        });
      } catch (err) {
        logger.error('Barcode error', err instanceof Error ? err : undefined);
      }
    }
  }, [config.format, data.address, dimensions.height]);

  return (
    <div
      className="bg-white flex flex-col items-center justify-center p-1"
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      <div className="flex-shrink-0 mb-1">
        {config.format === 'qr' && qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR Code"
            style={{
              width: dimensions.width * 0.35,
              height: dimensions.width * 0.35,
            }}
          />
        ) : (
          <svg ref={barcodeRef} />
        )}
      </div>

      <div
        className="font-mono font-bold text-black text-center"
        style={{ fontSize: fonts.code }}
      >
        {data.address}
      </div>

      <div className="flex flex-col items-center gap-0.5 mt-0.5 text-center">
        {config.showWarehouseName && data.warehouseName && (
          <div
            className="text-gray-600 truncate max-w-full"
            style={{ fontSize: fonts.secondary }}
          >
            {data.warehouseName}
          </div>
        )}
        {config.showZoneName && data.zoneName && (
          <div
            className="text-gray-500 truncate max-w-full"
            style={{ fontSize: fonts.secondary }}
          >
            {data.zoneName}
          </div>
        )}
        {config.showFullPath && data.fullPath && (
          <div
            className="text-gray-400 truncate max-w-full"
            style={{ fontSize: fonts.path }}
          >
            {data.fullPath}
          </div>
        )}
      </div>
    </div>
  );
}
