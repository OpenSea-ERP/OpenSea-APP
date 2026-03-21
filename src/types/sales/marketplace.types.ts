// Marketplace Integration Types

export type MarketplaceType = 'MERCADO_LIVRE' | 'SHOPEE' | 'AMAZON' | 'MAGALU' | 'TIKTOK_SHOP' | 'AMERICANAS' | 'ALIEXPRESS' | 'CASAS_BAHIA' | 'SHEIN' | 'CUSTOM';
export type MarketplaceConnectionStatus = 'ACTIVE' | 'PAUSED' | 'DISCONNECTED' | 'ERROR';
export type MarketplaceFulfillmentType = 'SELF' | 'MARKETPLACE' | 'HYBRID';
export type MarketplaceListingStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'PAUSED' | 'ERROR' | 'OUT_OF_STOCK' | 'BLOCKED' | 'DELETED';
export type MarketplaceOrderStatus = 'RECEIVED' | 'ACKNOWLEDGED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'DISPUTE';
export type MarketplacePaymentType = 'SALE' | 'REFUND' | 'COMMISSION' | 'SHIPPING_FEE' | 'AD_CHARGE' | 'FULFILLMENT_FEE' | 'ADJUSTMENT' | 'TRANSFER';
export type MarketplacePaymentStatus = 'PENDING' | 'SETTLED' | 'DISPUTED' | 'CANCELLED';

export interface MarketplaceConnectionDTO {
  id: string;
  marketplace: MarketplaceType;
  name: string;
  status: MarketplaceConnectionStatus;
  sellerId?: string;
  sellerName?: string;
  syncProducts: boolean;
  syncPrices: boolean;
  syncStock: boolean;
  syncOrders: boolean;
  syncMessages: boolean;
  syncIntervalMin: number;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSyncError?: string;
  priceTableId?: string;
  commissionPercent?: number;
  autoCalcPrice: boolean;
  priceMultiplier: number;
  fulfillmentType: MarketplaceFulfillmentType;
  defaultWarehouseId?: string;
  webhookUrl?: string;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface MarketplaceListingDTO {
  id: string;
  connectionId: string;
  variantId: string;
  parentListingId?: string;
  externalListingId: string;
  externalProductId?: string;
  externalUrl?: string;
  status: MarketplaceListingStatus;
  statusReason?: string;
  publishedPrice?: number;
  compareAtPrice?: number;
  commissionAmount?: number;
  netPrice?: number;
  publishedStock: number;
  fulfillmentStock: number;
  externalCategoryId?: string;
  externalCategoryPath?: string;
  totalSold: number;
  totalRevenue: number;
  averageRating?: number;
  reviewCount: number;
  buyBoxOwner: boolean;
  healthScore?: number;
  hasActiveAd: boolean;
  adSpend: number;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MarketplaceOrderDTO {
  id: string;
  connectionId: string;
  externalOrderId: string;
  externalOrderUrl?: string;
  status: MarketplaceOrderStatus;
  marketplaceStatus?: string;
  buyerName: string;
  buyerDocument?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  customerId?: string;
  subtotal: number;
  shippingCost: number;
  marketplaceFee: number;
  netAmount: number;
  currency: string;
  shippingMethod?: string;
  trackingCode?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  deliveryAddress: Record<string, unknown>;
  orderId?: string;
  notes?: string;
  receivedAt: string;
  acknowledgedAt?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MarketplacePaymentDTO {
  id: string;
  connectionId: string;
  externalPaymentId?: string;
  type: MarketplacePaymentType;
  description?: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  marketplaceOrderId?: string;
  installmentNumber?: number;
  settlementDate?: string;
  status: MarketplacePaymentStatus;
  financeEntryId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface MarketplaceReconciliationDTO {
  connectionId: string;
  connectionName: string;
  marketplace: string;
  totalGross: number;
  totalFees: number;
  totalNet: number;
  pendingCount: number;
  settledCount: number;
}

// Request types
export interface CreateMarketplaceConnectionRequest {
  marketplace: MarketplaceType;
  name: string;
  sellerId?: string;
  sellerName?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  apiKey?: string;
  apiSecret?: string;
  syncProducts?: boolean;
  syncPrices?: boolean;
  syncStock?: boolean;
  syncOrders?: boolean;
  syncMessages?: boolean;
  syncIntervalMin?: number;
  priceTableId?: string;
  commissionPercent?: number;
  autoCalcPrice?: boolean;
  priceMultiplier?: number;
  fulfillmentType?: MarketplaceFulfillmentType;
  defaultWarehouseId?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateMarketplaceConnectionRequest {
  name?: string;
  status?: MarketplaceConnectionStatus;
  sellerName?: string;
  syncProducts?: boolean;
  syncPrices?: boolean;
  syncStock?: boolean;
  syncOrders?: boolean;
  syncMessages?: boolean;
  syncIntervalMin?: number;
  commissionPercent?: number;
  autoCalcPrice?: boolean;
  priceMultiplier?: number;
  fulfillmentType?: MarketplaceFulfillmentType;
  settings?: Record<string, unknown>;
}

export interface PublishMarketplaceListingRequest {
  variantId: string;
  externalListingId: string;
  externalProductId?: string;
  externalUrl?: string;
  publishedPrice?: number;
  compareAtPrice?: number;
  publishedStock?: number;
  externalCategoryId?: string;
  externalCategoryPath?: string;
}

// Response types
export interface MarketplaceConnectionsResponse {
  connections: MarketplaceConnectionDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface MarketplaceListingsResponse {
  listings: MarketplaceListingDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface MarketplaceOrdersResponse {
  orders: MarketplaceOrderDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface MarketplacePaymentsResponse {
  payments: MarketplacePaymentDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
