// Price Table Types

import type { PaginatedQuery } from '../pagination';

export type PriceTableType =
  | 'DEFAULT'
  | 'RETAIL'
  | 'WHOLESALE'
  | 'REGIONAL'
  | 'CHANNEL'
  | 'CUSTOMER'
  | 'BID';

export const PRICE_TABLE_TYPE_LABELS: Record<PriceTableType, string> = {
  DEFAULT: 'Padrão',
  RETAIL: 'Varejo',
  WHOLESALE: 'Atacado',
  REGIONAL: 'Regional',
  CHANNEL: 'Canal',
  CUSTOMER: 'Cliente',
  BID: 'Licitação',
};

export interface PriceTable {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  type: PriceTableType;
  currency: string;
  priceIncludesTax: boolean;
  isDefault: boolean;
  priority: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PriceTableItem {
  id: string;
  priceTableId: string;
  tenantId: string;
  variantId: string;
  price: number;
  minQuantity: number;
  maxQuantity: number | null;
  costPrice: number | null;
  marginPercent: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePriceTableRequest {
  name: string;
  description?: string;
  type?: PriceTableType;
  currency?: string;
  priceIncludesTax?: boolean;
  isDefault?: boolean;
  priority?: number;
  isActive?: boolean;
  validFrom?: string;
  validUntil?: string;
}

export interface UpdatePriceTableRequest {
  name?: string;
  description?: string;
  type?: PriceTableType;
  currency?: string;
  priceIncludesTax?: boolean;
  isDefault?: boolean;
  priority?: number;
  isActive?: boolean;
  validFrom?: string;
  validUntil?: string;
}

export interface UpsertPriceTableItemRequest {
  items: Array<{
    variantId: string;
    price: number;
    minQuantity?: number;
    maxQuantity?: number;
    costPrice?: number;
    marginPercent?: number;
  }>;
}

export interface ResolvePriceRequest {
  variantId: string;
  customerId?: string;
  quantity?: number;
  priceTableId?: string;
}

export interface ResolvePriceResult {
  variantId: string;
  price: number;
  source: string;
  priceTableId: string | null;
  priceTableName: string | null;
  tiered: boolean;
}

export interface PriceTableResponse {
  priceTable: PriceTable;
}

export interface PaginatedPriceTablesResponse {
  priceTables: PriceTable[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PriceTableItemsResponse {
  items: PriceTableItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PriceTablesQuery extends PaginatedQuery {
  search?: string;
  type?: PriceTableType;
  isActive?: string;
}
