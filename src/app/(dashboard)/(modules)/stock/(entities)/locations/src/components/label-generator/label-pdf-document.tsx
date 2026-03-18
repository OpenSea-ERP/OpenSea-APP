'use client';

import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import type {
  LabelConfig,
  LabelData,
  LabelSize,
  PDFPageConfig,
} from '@/types/stock';

// Register a monospace font for better code display
Font.register({
  family: 'Roboto Mono',
  src: 'https://fonts.gstatic.com/s/robotomono/v23/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3vq_ROW4.ttf',
});

// ============================================
// PDF Styles
// ============================================

const LABEL_DIMENSIONS: Record<LabelSize, { width: number; height: number }> = {
  small: { width: 85, height: 57 }, // ~30x20mm em pontos
  medium: { width: 142, height: 85 }, // ~50x30mm em pontos
  large: { width: 198, height: 113 }, // ~70x40mm em pontos
};

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    backgroundColor: '#ffffff',
  },
  labelContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1pt dashed #cccccc',
    padding: 4,
  },
  codeImage: {
    objectFit: 'contain',
  },
  address: {
    fontFamily: 'Roboto Mono',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
  },
  secondaryText: {
    textAlign: 'center',
    color: '#666666',
  },
  pathText: {
    textAlign: 'center',
    color: '#999999',
  },
});

// ============================================
// Label Component for PDF
// ============================================

interface PDFLabelProps {
  data: LabelData;
  config: LabelConfig;
  qrDataUrl?: string;
  barcodeDataUrl?: string;
}

function PDFLabel({ data, config, qrDataUrl, barcodeDataUrl }: PDFLabelProps) {
  const dimensions = LABEL_DIMENSIONS[config.size];

  // Font sizes based on label size
  const fontSizes = {
    small: { code: 7, secondary: 5, path: 4 },
    medium: { code: 10, secondary: 7, path: 6 },
    large: { code: 14, secondary: 9, path: 8 },
  };
  const fonts = fontSizes[config.size];

  // Image sizes
  const imageSize = {
    small: { qr: 30, barcode: { width: 60, height: 20 } },
    medium: { qr: 50, barcode: { width: 100, height: 30 } },
    large: { qr: 70, barcode: { width: 140, height: 40 } },
  };
  const imgSize = imageSize[config.size];

  return (
    <View
      style={[
        styles.labelContainer,
        { width: dimensions.width, height: dimensions.height },
      ]}
    >
      {/* QR Code or Barcode */}
      {config.format === 'qr' && qrDataUrl && (
        // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not HTML img
        <Image
          src={qrDataUrl}
          style={[
            styles.codeImage,
            { width: imgSize.qr, height: imgSize.qr, marginBottom: 2 },
          ]}
        />
      )}
      {config.format === 'barcode' && barcodeDataUrl && (
        // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not HTML img
        <Image
          src={barcodeDataUrl}
          style={[
            styles.codeImage,
            {
              width: imgSize.barcode.width,
              height: imgSize.barcode.height,
              marginBottom: 2,
            },
          ]}
        />
      )}

      {/* Address */}
      <Text style={[styles.address, { fontSize: fonts.code }]}>
        {data.address}
      </Text>

      {/* Optional Info */}
      {config.showWarehouseName && data.warehouseName && (
        <Text style={[styles.secondaryText, { fontSize: fonts.secondary }]}>
          {data.warehouseName}
        </Text>
      )}
      {config.showZoneName && data.zoneName && (
        <Text style={[styles.secondaryText, { fontSize: fonts.secondary }]}>
          {data.zoneName}
        </Text>
      )}
      {config.showFullPath && data.fullPath && (
        <Text style={[styles.pathText, { fontSize: fonts.path }]}>
          {data.fullPath}
        </Text>
      )}
    </View>
  );
}

// ============================================
// Main PDF Document
// ============================================

interface LabelPDFDocumentProps {
  labels: Array<{
    data: LabelData;
    qrDataUrl?: string;
    barcodeDataUrl?: string;
  }>;
  config: LabelConfig;
  pageConfig?: PDFPageConfig;
}

export function LabelPDFDocument({
  labels,
  config,
  pageConfig = {
    pageSize: 'A4',
    orientation: 'portrait',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    labelsPerRow: 4,
    labelsPerColumn: 10,
    labelGapX: 2,
    labelGapY: 2,
  },
}: LabelPDFDocumentProps) {
  const labelsPerPage = pageConfig.labelsPerRow * pageConfig.labelsPerColumn;
  const pageCount = Math.ceil(labels.length / labelsPerPage);
  const pages = Array.from({ length: pageCount }, (_, i) =>
    labels.slice(i * labelsPerPage, (i + 1) * labelsPerPage)
  );

  return (
    <Document>
      {pages.map((pageLabels, pageIndex) => (
        <Page
          key={pageIndex}
          size={pageConfig.pageSize as 'A4' | 'LETTER'}
          orientation={pageConfig.orientation}
          style={[
            styles.page,
            {
              paddingTop: pageConfig.marginTop,
              paddingBottom: pageConfig.marginBottom,
              paddingLeft: pageConfig.marginLeft,
              paddingRight: pageConfig.marginRight,
              gap: pageConfig.labelGapY,
            },
          ]}
        >
          {pageLabels.map((label, labelIndex) => (
            <View
              key={labelIndex}
              style={{
                marginRight: pageConfig.labelGapX,
                marginBottom: pageConfig.labelGapY,
              }}
            >
              <PDFLabel
                data={label.data}
                config={config}
                qrDataUrl={label.qrDataUrl}
                barcodeDataUrl={label.barcodeDataUrl}
              />
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}

// ============================================
// Utility functions para gerar data URLs
// ============================================

export async function generateQRDataUrl(
  text: string,
  size: number = 100
): Promise<string> {
  const QRCode = await import('qrcode');
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

export async function generateBarcodeDataUrl(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    try {
      const JsBarcode = require('jsbarcode');
      JsBarcode(canvas, text, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: false,
        margin: 0,
      });
      resolve(canvas.toDataURL('image/png'));
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================
// Função para preparar labels com data URLs
// ============================================

export async function prepareLabelData(
  labelsData: LabelData[],
  config: LabelConfig
): Promise<
  Array<{
    data: LabelData;
    qrDataUrl?: string;
    barcodeDataUrl?: string;
  }>
> {
  const prepared = await Promise.all(
    labelsData.map(async data => {
      const result: {
        data: LabelData;
        qrDataUrl?: string;
        barcodeDataUrl?: string;
      } = { data };

      if (config.format === 'qr') {
        result.qrDataUrl = await generateQRDataUrl(data.address, 150);
      } else {
        result.barcodeDataUrl = await generateBarcodeDataUrl(data.address);
      }

      return result;
    })
  );

  return prepared;
}
