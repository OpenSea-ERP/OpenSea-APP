// Order Return Types

export type ReturnType = 'FULL_RETURN' | 'PARTIAL_RETURN' | 'EXCHANGE';
export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'RECEIVING' | 'RECEIVED' | 'CREDIT_ISSUED' | 'EXCHANGE_COMPLETED' | 'REJECTED' | 'CANCELLED';
export type ReturnReason = 'DEFECTIVE' | 'WRONG_ITEM' | 'CHANGED_MIND' | 'DAMAGED' | 'NOT_AS_DESCRIBED' | 'OTHER';
export type RefundMethod = 'SAME_METHOD' | 'STORE_CREDIT' | 'BANK_TRANSFER' | 'PIX';

export interface OrderReturnDTO {
  id: string;
  orderId: string;
  returnNumber: string;
  type: ReturnType;
  status: ReturnStatus;
  reason: ReturnReason;
  reasonDetails: string | null;
  refundMethod: RefundMethod | null;
  refundAmount: number;
  creditAmount: number;
  exchangeOrderId: string | null;
  requestedByUserId: string;
  approvedByUserId: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  receivedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateReturnRequest {
  orderId: string;
  type: ReturnType;
  reason: ReturnReason;
  reasonDetails?: string;
  refundMethod?: RefundMethod;
  refundAmount?: number;
  notes?: string;
}

export interface OrderReturnsResponse {
  data: OrderReturnDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
