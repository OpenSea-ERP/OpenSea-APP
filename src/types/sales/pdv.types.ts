// =============================================================================
// PDV (Point of Sale) Types
// =============================================================================

export type PdvOrderStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface PdvOrder {
  id: string;
  orderNumber: string;
  saleCode: string | null;
  status: PdvOrderStatus;
  channel: 'PDV';
  customerId: string;
  customerName?: string;
  assignedToUserId: string | null;
  assignedToName?: string;
  cashierUserId: string | null;
  posSessionId: string | null;
  claimedByUserId: string | null;
  claimedAt: string | null;
  version: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  items: PdvOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PdvOrderItem {
  id: string;
  variantId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountValue: number;
  subtotal: number;
}

export interface CashierQueueItem {
  id: string;
  saleCode: string;
  customerName: string;
  assignedToName: string;
  grandTotal: number;
  claimedByUserId: string | null;
  claimedAt: string | null;
  createdAt: string;
  itemCount: number;
}

export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PIX'
  | 'BOLETO'
  | 'STORE_CREDIT'
  | 'VOUCHER'
  | 'PAYMENT_LINK'
  | 'OTHER';

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  receivedAmount?: number;
  installments?: number;
  authCode?: string;
  nsu?: string;
  pixTxId?: string;
  notes?: string;
}

export type TerminalMode =
  | 'FAST_CHECKOUT'
  | 'CONSULTIVE'
  | 'SELF_SERVICE'
  | 'EXTERNAL';

export interface ReceivePaymentRequest {
  terminalMode: TerminalMode;
  posSessionId?: string;
  payments: PaymentInput[];
}

export interface ReceivePaymentResponse {
  order: PdvOrder;
  transaction: {
    id: string;
    transactionNumber: number;
    changeAmount: number;
  };
}

export interface CreatePdvOrderRequest {
  customerId?: string;
  terminalId?: string;
}

export interface AddOrderItemRequest {
  variantId: string;
  quantity?: number;
}

export interface CashierQueueQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CashierQueueResponse {
  orders: CashierQueueItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface MyDraftsQuery {
  page?: number;
  limit?: number;
}

export interface MyDraftsResponse {
  orders: PdvOrder[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
