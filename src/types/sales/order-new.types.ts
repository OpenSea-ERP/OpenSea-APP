// Order Types (new pipeline-based system)

export type OrderType = 'QUOTE' | 'ORDER';
export type OrderChannel = 'PDV' | 'WEB' | 'WHATSAPP' | 'MARKETPLACE' | 'BID' | 'MANUAL' | 'API';
export type DeliveryMethod = 'PICKUP' | 'OWN_FLEET' | 'CARRIER' | 'PARTIAL';
export type PriceSourceType = 'CUSTOMER' | 'CAMPAIGN' | 'COUPON' | 'QUANTITY_TIER' | 'TABLE' | 'DEFAULT' | 'MANUAL';

export interface OrderDTO {
  id: string;
  tenantId: string;
  orderNumber: string;
  type: OrderType;
  customerId: string;
  contactId: string | null;
  pipelineId: string;
  stageId: string;
  channel: OrderChannel;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  priceTableId: string | null;
  paymentConditionId: string | null;
  creditUsed: number;
  paidAmount: number;
  remainingAmount: number;
  deliveryMethod: DeliveryMethod | null;
  needsApproval: boolean;
  assignedToUserId: string | null;
  notes: string | null;
  internalNotes: string | null;
  tags: string[];
  stageEnteredAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface OrderItemDTO {
  id: string;
  orderId: string;
  variantId: string | null;
  comboId: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountValue: number;
  subtotal: number;
  taxTotal: number;
  quantityDelivered: number;
  quantityReturned: number;
  priceSource: PriceSourceType;
  position: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateOrderRequest {
  type: OrderType;
  customerId: string;
  contactId?: string;
  pipelineId: string;
  stageId: string;
  channel: OrderChannel;
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  shippingTotal?: number;
  currency?: string;
  priceTableId?: string;
  paymentConditionId?: string;
  deliveryMethod?: DeliveryMethod;
  deliveryAddress?: Record<string, unknown>;
  sourceWarehouseId?: string;
  assignedToUserId?: string;
  dealId?: string;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  expiresAt?: string;
  items: Array<{
    variantId?: string;
    name: string;
    sku?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    discountValue?: number;
    notes?: string;
  }>;
}

export interface UpdateOrderRequest {
  contactId?: string | null;
  paymentConditionId?: string | null;
  deliveryMethod?: DeliveryMethod;
  assignedToUserId?: string | null;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  discountTotal?: number;
  taxTotal?: number;
  shippingTotal?: number;
  expiresAt?: string | null;
}

export interface ChangeOrderStageRequest {
  stageId: string;
}

export interface CancelOrderRequest {
  reason?: string;
}

export interface OrdersResponse {
  data: OrderDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface OrderResponse {
  order: OrderDTO;
  items: OrderItemDTO[];
}

export interface OrdersQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  channel?: string;
  stageId?: string;
  pipelineId?: string;
  customerId?: string;
  assignedToUserId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
