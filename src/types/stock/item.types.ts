// Item & Movement Types

import type { PaginationMeta, PaginatedQuery } from '../pagination';
import type { Variant } from './variant.types';
import type { Location } from './warehouse.types';

export type ItemStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_TRANSIT'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'DISPOSED';

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  AVAILABLE: 'Disponível',
  RESERVED: 'Reservado',
  IN_TRANSIT: 'Em Trânsito',
  DAMAGED: 'Danificado',
  EXPIRED: 'Expirado',
  DISPOSED: 'Descartado',
};
export type MovementType =
  | 'PURCHASE'
  | 'CUSTOMER_RETURN'
  | 'SALE'
  | 'PRODUCTION'
  | 'SAMPLE'
  | 'LOSS'
  | 'SUPPLIER_RETURN'
  | 'TRANSFER'
  | 'INVENTORY_ADJUSTMENT'
  | 'ZONE_RECONFIGURE';

export type EntryMovementType = 'PURCHASE' | 'CUSTOMER_RETURN';

export type ExitMovementType =
  | 'SALE'
  | 'PRODUCTION'
  | 'SAMPLE'
  | 'LOSS'
  | 'SUPPLIER_RETURN';

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  PURCHASE: 'Compra',
  CUSTOMER_RETURN: 'Devolução de Cliente',
  SALE: 'Venda',
  PRODUCTION: 'Utilização',
  SAMPLE: 'Amostra',
  LOSS: 'Perda',
  SUPPLIER_RETURN: 'Devolução a Fornecedor',
  TRANSFER: 'Transferência',
  INVENTORY_ADJUSTMENT: 'Ajuste de Inventário',
  ZONE_RECONFIGURE: 'Reconfiguração',
};

export const STOCK_INCREASE_TYPES: MovementType[] = [
  'PURCHASE',
  'CUSTOMER_RETURN',
];
export const STOCK_DECREASE_TYPES: MovementType[] = [
  'SALE',
  'PRODUCTION',
  'SAMPLE',
  'LOSS',
  'SUPPLIER_RETURN',
];

export function isStockIncrease(type: MovementType): boolean {
  return STOCK_INCREASE_TYPES.includes(type);
}

export function isStockDecrease(type: MovementType): boolean {
  return STOCK_DECREASE_TYPES.includes(type);
}
export type MovementStatus =
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Item {
  id: string;
  variantId: string;
  binId?: string; // ID da bin onde o item esta armazenado
  locationId?: string; // @deprecated - use binId (mantido para retrocompatibilidade)
  resolvedAddress?: string; // Endereco resolvido da bin (ex: "FAB-EST-102-B")
  lastKnownAddress?: string | null; // Ultimo endereco conhecido (persistido mesmo quando bin e removido)
  uniqueCode?: string;
  fullCode?: string;
  sequentialCode?: number;
  initialQuantity: number;
  currentQuantity: number;
  unitCost?: number;
  totalCost?: number;
  status: ItemStatus;
  entryDate: string;
  attributes: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  // Campos desnormalizados do produto/variante
  productCode: string;
  productName: string;
  variantSku: string;
  variantName: string;
  // Campos do template e atributos (para listagem enriquecida)
  templateId?: string;
  templateName?: string;
  templateUnitOfMeasure?: string;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  variantColorHex?: string;
  manufacturerName?: string;
  productId?: string;
  // Relacao expandida (opcional)
  bin?: {
    id: string;
    address: string;
    zone: {
      id: string;
      warehouseId: string;
      code: string;
      name: string;
    };
  };
}

// Item Label Data (presenter endpoint response)
export interface ItemLabelData {
  item: {
    id: string;
    uniqueCode: string | null;
    fullCode: string;
    sequentialCode: number;
    currentQuantity: number;
    initialQuantity: number;
    unitCost: number | null;
    status: string;
    entryDate: string;
    resolvedAddress: string | null;
    lastKnownAddress: string | null;
    batchNumber: string | null;
    manufacturingDate: string | null;
    expiryDate: string | null;
    barcode: string;
    eanCode: string;
    attributes: Record<string, unknown>;
  };
  variant: {
    id: string;
    name: string;
    sku: string | null;
    fullCode: string | null;
    price: number;
    costPrice: number | null;
    barcode: string | null;
    reference: string | null;
    colorHex: string | null;
    attributes: Record<string, unknown>;
  };
  product: {
    id: string;
    name: string;
    fullCode: string | null;
    description: string | null;
    attributes: Record<string, unknown>;
  };
  manufacturer: {
    id: string;
    name: string;
    legalName: string | null;
    cnpj: string | null;
    country: string;
  } | null;
  supplier: {
    id: string;
    name: string;
    cnpj: string | null;
  } | null;
  template: {
    id: string;
    name: string;
    unitOfMeasure: string;
    productAttributes: Record<string, unknown> | null;
    variantAttributes: Record<string, unknown> | null;
    itemAttributes: Record<string, unknown> | null;
  };
  location: {
    binId: string;
    binAddress: string;
    zoneId: string;
    zoneCode: string;
    zoneName: string;
    warehouseId: string;
    warehouseCode: string;
    warehouseName: string;
  } | null;
  tenant: {
    id: string;
    name: string;
  };
}

export interface ItemLabelDataResponse {
  labelData: ItemLabelData[];
}

export interface RegisterItemEntryRequest {
  variantId: string;
  binId?: string;
  quantity: number;
  movementType?: EntryMovementType;
  uniqueCode?: string;
  unitCost?: number;
  attributes?: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  notes?: string;
}

export interface RegisterItemExitRequest {
  itemId: string;
  quantity: number;
  movementType: ExitMovementType;
  reasonCode?: string;
  destinationRef?: string;
  notes?: string;
}

export interface TransferItemRequest {
  itemId: string;
  destinationBinId: string;
  reasonCode?: string;
  notes?: string;
}

export interface BatchTransferItemsRequest {
  itemIds: string[];
  destinationBinId: string;
  notes?: string;
}

export interface BatchTransferResponse {
  transferred: number;
  movements: ItemMovement[];
}

export interface LocationHistoryEntry {
  id: string;
  date: string;
  type: string;
  from: string | null;
  to: string | null;
  userId: string;
  notes: string | null;
}

export interface LocationHistoryResponse {
  data: LocationHistoryEntry[];
}

export interface ItemsResponse {
  items: Item[];
}

export interface ItemResponse {
  item: Item;
}

export interface ItemEntryResponse {
  item: Item;
  movement: ItemMovement;
}

export interface ItemExitResponse {
  item: Item;
  movement: ItemMovement;
}

export interface ItemTransferResponse {
  item: Item;
  movement: ItemMovement;
}

// Item Movement Types
export interface ItemMovement {
  id: string;
  itemId: string;
  userId: string;
  quantity: number;
  quantityBefore?: number | null;
  quantityAfter?: number | null;
  movementType: MovementType;
  reasonCode?: string | null;
  originRef?: string | null;
  destinationRef?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
  approvedBy?: string | null;
  salesOrderId?: string | null;
  createdAt: string;
  user?: { id: string; name: string } | null;
}

export interface ItemMovementsQuery {
  itemId?: string;
  userId?: string;
  movementType?: MovementType;
  salesOrderId?: string;
  batchNumber?: string;
  pendingApproval?: boolean;
}

export interface ItemMovementsResponse {
  movements: ItemMovement[];
}

// Extended Item Types

export interface ItemExtended extends Item {
  volumeId?: string;
  categoryId?: string;
  lastMovementAt?: string;
  variant?: Variant;
  location?: Location;
}

// Extended Movement Types (Approval Workflow)

export interface ItemMovementExtended extends ItemMovement {
  status: MovementStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  unitCost?: number;
  unitPrice?: number;
  volumeId?: string;
  periodKey?: string; // YYYY-MM format for analytics
  // Invoice fields (Nota Fiscal)
  invoiceNumber?: string;
  invoiceAccessKey?: string;
  invoiceSeries?: string;
  invoiceDate?: string;
  invoiceDescription?: string;
  // Relations
  item?: Item;
  user?: { id: string; name: string };
  approver?: { id: string; name: string };
}

export interface RegisterItemEntryExtendedRequest
  extends RegisterItemEntryRequest {
  unitCost?: number;
  purchaseOrderId?: string;
  generateLabel?: boolean;
  // Invoice fields
  invoiceNumber?: string;
  invoiceAccessKey?: string;
  invoiceSeries?: string;
  invoiceDate?: string;
  invoiceDescription?: string;
}

export interface RegisterItemExitExtendedRequest
  extends RegisterItemExitRequest {
  unitPrice?: number;
  volumeId?: string;
  requiresApproval?: boolean;
}

export interface BatchEntryRequest {
  items: RegisterItemEntryExtendedRequest[];
  commonData?: {
    locationId?: string;
    purchaseOrderId?: string;
    invoiceNumber?: string;
    invoiceAccessKey?: string;
    invoiceSeries?: string;
    invoiceDate?: string;
  };
}

export interface BatchTransferRequest {
  items: Array<{
    itemId: string;
    destinationLocationId: string;
  }>;
  notes?: string;
}

export interface MovementApprovalRequest {
  movementId: string;
  notes?: string;
}

export interface MovementRejectionRequest {
  movementId: string;
  reason: string;
}

export interface BatchApprovalRequest {
  movementIds: string[];
  notes?: string;
}

export interface MovementHistoryQuery {
  productId?: string;
  variantId?: string;
  itemId?: string;
  locationId?: string;
  movementType?: MovementType;
  status?: MovementStatus;
  startDate?: string;
  endDate?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface MovementHistoryResponse {
  movements: ItemMovementExtended[];
  pagination: PaginationMeta;
}

export interface PendingApprovalsResponse {
  movements: ItemMovementExtended[];
  total: number;
}

export interface ItemsQuery extends PaginatedQuery {
  variantId?: string;
  locationId?: string;
  warehouseId?: string;
  status?: ItemStatus;
  volumeId?: string;
  search?: string;
}

export interface PaginatedItemsResponse {
  items: ItemExtended[];
  pagination: PaginationMeta;
}
