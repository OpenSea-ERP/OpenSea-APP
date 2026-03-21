// POS Terminal
export type PosTerminalMode =
  | 'FAST_CHECKOUT'
  | 'CONSULTIVE'
  | 'SELF_SERVICE'
  | 'EXTERNAL';
export type PosCashierMode = 'INTEGRATED' | 'SEPARATED';

export interface PosTerminal {
  id: string;
  tenantId: string;
  name: string;
  deviceId: string;
  mode: PosTerminalMode;
  cashierMode: PosCashierMode;
  acceptsPendingOrders: boolean;
  warehouseId: string;
  defaultPriceTableId: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  lastOnlineAt: string | null;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreatePosTerminalRequest {
  name: string;
  deviceId: string;
  mode: PosTerminalMode;
  cashierMode?: PosCashierMode;
  acceptsPendingOrders?: boolean;
  warehouseId: string;
  defaultPriceTableId?: string;
  settings?: Record<string, unknown>;
}

export interface UpdatePosTerminalRequest {
  name?: string;
  deviceId?: string;
  mode?: PosTerminalMode;
  cashierMode?: PosCashierMode;
  acceptsPendingOrders?: boolean;
  warehouseId?: string;
  defaultPriceTableId?: string | null;
  isActive?: boolean;
  settings?: Record<string, unknown> | null;
}

export interface PosTerminalsResponse {
  data: PosTerminal[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface PosTerminalsQuery {
  page?: number;
  limit?: number;
  search?: string;
  mode?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// POS Session
export type PosSessionStatus = 'OPEN' | 'CLOSED' | 'SUSPENDED';

export interface PosSession {
  id: string;
  tenantId: string;
  terminalId: string;
  operatorUserId: string;
  status: PosSessionStatus;
  openedAt: string;
  closedAt: string | null;
  openingBalance: number;
  closingBalance: number | null;
  expectedBalance: number | null;
  difference: number | null;
  closingBreakdown: Record<string, unknown> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface OpenPosSessionRequest {
  terminalId: string;
  openingBalance: number;
}

export interface ClosePosSessionRequest {
  closingBalance: number;
  closingBreakdown?: {
    cash?: number;
    creditCard?: number;
    debitCard?: number;
    pix?: number;
    checks?: number;
    other?: number;
  };
  notes?: string;
}

// POS Transaction
export type PosTransactionStatus =
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'PENDING_SYNC';
export type PosPaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PIX'
  | 'BOLETO'
  | 'STORE_CREDIT'
  | 'VOUCHER'
  | 'PAYMENT_LINK'
  | 'NFC'
  | 'CHECK'
  | 'OTHER';

export interface PosTransaction {
  id: string;
  tenantId: string;
  sessionId: string;
  orderId: string;
  transactionNumber: number;
  status: PosTransactionStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  changeAmount: number;
  customerId: string | null;
  customerName: string | null;
  customerDocument: string | null;
  syncedAt: string | null;
  createdAt: string;
}

export interface PosTransactionPayment {
  id: string;
  transactionId: string;
  method: PosPaymentMethod;
  amount: number;
  receivedAmount: number | null;
  changeAmount: number | null;
  installments: number;
  authCode: string | null;
  nsu: string | null;
  createdAt: string;
}

export interface PaymentInput {
  method: PosPaymentMethod;
  amount: number;
  receivedAmount?: number;
  changeAmount?: number;
  installments?: number;
  authCode?: string;
  nsu?: string;
  pixTxId?: string;
  notes?: string;
}

export interface CreatePosTransactionRequest {
  sessionId: string;
  orderId: string;
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  grandTotal: number;
  changeAmount?: number;
  customerId?: string;
  customerName?: string;
  customerDocument?: string;
  payments: PaymentInput[];
}

// Cash Movement
export type PosCashMovementType = 'WITHDRAWAL' | 'SUPPLY';

export interface PosCashMovement {
  id: string;
  sessionId: string;
  type: string;
  amount: number;
  reason: string | null;
  performedByUserId: string;
  authorizedByUserId: string | null;
  createdAt: string;
}

export interface CreatePosCashMovementRequest {
  sessionId: string;
  type: PosCashMovementType;
  amount: number;
  reason?: string;
}
