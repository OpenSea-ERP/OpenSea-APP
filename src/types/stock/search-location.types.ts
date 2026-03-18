// ============================================
// LOCATION SEARCH TYPES
// ============================================

export interface LocationSearchResult {
  itemId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  bin: { id: string; address: string } | null;
  warehouse: { id: string; code: string; name: string };
  zone: { id: string; code: string; name: string };
}

export interface LocationSearchResponse {
  items: LocationSearchResult[];
}
