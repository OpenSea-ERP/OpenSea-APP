// Inventory Session Types (mobile inventory checking)

export type InventorySessionMode = 'BIN' | 'ZONE' | 'PRODUCT';

export type InventorySessionStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type InventorySessionItemStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'MISSING'
  | 'EXTRA'
  | 'WRONG_BIN';

export type DivergenceResolution =
  | 'REGISTER_LOSS'
  | 'MOVED_TO_OTHER_BIN'
  | 'FORWARD_SUPERVISOR'
  | 'TRANSFER_TO_BIN'
  | 'KEEP_ORIGINAL'
  | 'UPDATE_LOCATION'
  | 'RETURN_TO_ORIGINAL';

export interface InventorySessionItem {
  id: string;
  sessionId: string;
  itemId: string;
  status: InventorySessionItemStatus;
  resolution?: DivergenceResolution;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
  item?: {
    id: string;
    sku?: string;
    barcode?: string;
    name?: string;
    variantName?: string;
    productName?: string;
    binLabel?: string;
    quantity?: number;
  };
}

export interface InventorySession {
  id: string;
  mode: InventorySessionMode;
  status: InventorySessionStatus;
  binId?: string;
  binLabel?: string;
  zoneId?: string;
  zoneName?: string;
  warehouseId?: string;
  warehouseName?: string;
  productIds?: string[];
  userId: string;
  userName?: string;
  totalItems: number;
  scannedItems: number;
  confirmedItems: number;
  divergentItems: number;
  startedAt: string;
  pausedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  items?: InventorySessionItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateInventorySessionRequest {
  mode: InventorySessionMode;
  binId?: string;
  zoneId?: string;
  warehouseId?: string;
  productIds?: string[];
}

export interface ScanInventoryItemRequest {
  code: string;
}

export interface ResolveInventoryDivergenceRequest {
  resolution: DivergenceResolution;
  notes?: string;
}

export interface InventorySessionResponse {
  session: InventorySession;
}

export interface InventorySessionsResponse {
  sessions: InventorySession[];
}

export interface ScanInventoryItemResponse {
  item: InventorySessionItem;
  status: InventorySessionItemStatus;
  message?: string;
}
