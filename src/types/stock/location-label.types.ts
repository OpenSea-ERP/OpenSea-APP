// ============================================
// LOCATION LABEL (Etiqueta de Localização) TYPES
// ============================================

export type LabelFormat = 'qr' | 'barcode';
export type LabelSize = 'small' | 'medium' | 'large';

export interface LabelConfig {
  format: LabelFormat;
  size: LabelSize;
  showWarehouseName: boolean;
  showZoneName: boolean;
  showFullPath: boolean;
}

export const defaultLabelConfig: LabelConfig = {
  format: 'qr',
  size: 'medium',
  showWarehouseName: false,
  showZoneName: true,
  showFullPath: false,
};

// ============================================
// Label Dimensions (em mm)
// ============================================

export const LABEL_SIZES: Record<LabelSize, { width: number; height: number }> =
  {
    small: { width: 30, height: 20 },
    medium: { width: 50, height: 30 },
    large: { width: 70, height: 40 },
  };

// ============================================
// Label Data (para geração)
// ============================================

export interface LabelData {
  address: string; // FAB-EST-102-B
  warehouseCode: string; // FAB
  warehouseName?: string; // Fábrica Principal
  zoneCode: string; // EST
  zoneName?: string; // Estoque
  fullPath?: string; // Corredor 1 > Prat. 02 > Nicho B
}

// ============================================
// API Request/Response Types
// ============================================

export interface GenerateLabelsRequest {
  binIds?: string[];
  binAddresses?: string[];
  filters?: LabelFilters;
  config: LabelConfig;
}

export interface LabelFilters {
  warehouseId?: string;
  zoneId?: string;
  aisles?: number[];
  shelfRange?: { from: number; to: number };
  bins?: string[]; // ['A', 'B', 'C']
}

export interface GenerateLabelsResponse {
  pdfUrl: string;
  labelCount: number;
  pageCount: number;
}

export interface LabelPreviewResponse {
  imageUrl: string; // Base64 ou URL
  labelData: LabelData;
}

// ============================================
// Label Selection State (UI)
// ============================================

export interface LabelSelectionState {
  warehouseId: string | null;
  zoneId: string | null;
  selectAllAisles: boolean;
  selectedAisles: number[];
  selectAllShelves: boolean;
  shelfFrom: number;
  shelfTo: number;
  selectedBins: string[]; // ['A', 'B', 'C', 'D']
  config: LabelConfig;
}

export const defaultLabelSelectionState: LabelSelectionState = {
  warehouseId: null,
  zoneId: null,
  selectAllAisles: true,
  selectedAisles: [],
  selectAllShelves: true,
  shelfFrom: 1,
  shelfTo: 50,
  selectedBins: ['A', 'B', 'C', 'D'],
  config: defaultLabelConfig,
};

// ============================================
// PDF Generation Types
// ============================================

export interface PDFPageConfig {
  pageSize: 'A4' | 'LETTER';
  orientation: 'portrait' | 'landscape';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  labelsPerRow: number;
  labelsPerColumn: number;
  labelGapX: number;
  labelGapY: number;
}

export const defaultPDFPageConfig: PDFPageConfig = {
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
};

// ============================================
// Item Label Types (para etiquetas de itens)
// ============================================

export interface LocationItemLabelData extends LabelData {
  sku: string;
  productName: string;
  variantName?: string;
  quantity: number;
  batchNumber?: string;
  expirationDate?: string;
}

export interface LocationItemLabelConfig extends LabelConfig {
  showSku: boolean;
  showProductName: boolean;
  showQuantity: boolean;
  showBatchNumber: boolean;
  showExpirationDate: boolean;
}

export const defaultLocationItemLabelConfig: LocationItemLabelConfig = {
  ...defaultLabelConfig,
  showSku: true,
  showProductName: true,
  showQuantity: true,
  showBatchNumber: false,
  showExpirationDate: false,
};
