// Variant Types

import type { PaginationMeta, PaginatedQuery } from '../pagination';

export type Pattern =
  | 'SOLID'
  | 'STRIPED'
  | 'PLAID'
  | 'PRINTED'
  | 'GRADIENT'
  | 'JACQUARD';

export const PATTERN_LABELS: Record<Pattern, string> = {
  SOLID: 'Sólido',
  STRIPED: 'Listrado',
  PLAID: 'Xadrez',
  PRINTED: 'Estampado',
  GRADIENT: 'Degradê',
  JACQUARD: 'Jacquard',
};

export interface Variant {
  id: string;
  productId: string;
  sku?: string;
  fullCode?: string;
  sequentialCode?: number;
  name: string;
  price: number;
  attributes: Record<string, unknown>;
  costPrice?: number;
  profitMargin?: number;
  barcode?: string;
  qrCode?: string;
  eanCode?: string;
  upcCode?: string;
  colorHex?: string;
  colorPantone?: string;
  secondaryColorHex?: string | null;
  secondaryColorPantone?: string | null;
  pattern?: Pattern | null;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  reference?: string;
  similars?: unknown[];
  outOfLine: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface CreateVariantRequest {
  productId: string;
  sku?: string; // Opcional - sera auto-gerado se nao fornecido (max: 100)
  name: string; // Obrigatorio (1-255 chars)
  price?: number; // Opcional, default 0 (nonnegative)
  attributes?: Record<string, unknown>;
  costPrice?: number; // Positive
  profitMargin?: number;
  barcode?: string; // Max: 100
  qrCode?: string; // Max: 100
  eanCode?: string; // Max: 100
  upcCode?: string; // Max: 100
  reference?: string; // Max: 128
  colorHex?: string; // Max: 7 (hex color)
  colorPantone?: string; // Max: 50
  secondaryColorHex?: string; // Max: 7
  secondaryColorPantone?: string; // Max: 50
  pattern?: Pattern;
  minStock?: number; // Int, min: 0
  maxStock?: number; // Int, min: 0
  reorderPoint?: number; // Int, min: 0
  reorderQuantity?: number; // Int, min: 0
  outOfLine?: boolean; // Optional, default false
  isActive?: boolean; // Optional, default true
  similars?: unknown[]; // Array of unknown
}

export interface UpdateVariantRequest {
  sku?: string; // Max: 100
  name?: string; // 1-255 chars
  price?: number; // Nonnegative
  attributes?: Record<string, unknown>;
  costPrice?: number; // Positive
  profitMargin?: number;
  barcode?: string; // Max: 100
  qrCode?: string; // Max: 100
  eanCode?: string; // Max: 100
  upcCode?: string; // Max: 100
  colorHex?: string; // Max: 7
  colorPantone?: string; // Max: 50
  secondaryColorHex?: string; // Max: 7
  secondaryColorPantone?: string; // Max: 50
  pattern?: Pattern;
  minStock?: number; // Int, min: 0
  maxStock?: number; // Int, min: 0
  reorderPoint?: number; // Int, min: 0
  reorderQuantity?: number; // Int, min: 0
  reference?: string; // Max: 128
  similars?: unknown[];
  outOfLine?: boolean; // Optional, default false
  isActive?: boolean; // Optional, default true
}

export interface VariantsResponse {
  variants: Variant[];
}

export interface VariantResponse {
  variant: Variant;
}

export interface VariantsQuery extends PaginatedQuery {
  productId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  hasStock?: boolean;
}

// Extended Variant Types (Cost Management)

export interface VariantWithCost extends Variant {
  averageCost?: number;
  lastCost?: number;
  totalCostValue?: number;
  totalQuantity?: number;
}

export interface VariantStockSummary {
  variantId: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  averageCost?: number;
  totalValue?: number;
}

export interface PaginatedVariantsResponse {
  variants: VariantWithCost[];
  pagination: PaginationMeta;
}
