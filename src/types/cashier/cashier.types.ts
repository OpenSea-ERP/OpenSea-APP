export type PixChargeStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface PixChargeDTO {
  id: string;
  tenantId: string;
  txId: string;
  location: string;
  pixCopiaECola: string;
  amount: number;
  status: PixChargeStatus;
  payerName?: string;
  payerCpfCnpj?: string;
  endToEndId?: string;
  expiresAt?: string;
  paidAt?: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export interface PixChargesQuery {
  page?: number;
  limit?: number;
  status?: PixChargeStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PixChargesResponse {
  charges: PixChargeDTO[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface CreatePixChargeRequest {
  amount: number;
  description?: string;
  expirationSeconds?: number;
}

export interface CashierCreatePixChargeResponse {
  charge: PixChargeDTO;
}
