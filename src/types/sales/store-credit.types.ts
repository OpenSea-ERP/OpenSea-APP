// Store Credit Types

export type StoreCreditSource = 'RETURN' | 'MANUAL' | 'CAMPAIGN' | 'LOYALTY';

export interface StoreCreditBalanceResponse {
  balance: number;
}

export interface CreateStoreCreditRequest {
  customerId: string;
  amount: number;
  expiresAt?: string;
}

export interface StoreCreditDTO {
  id: string;
  customerId: string;
  amount: number;
  balance: number;
  source: StoreCreditSource;
  isActive: boolean;
  createdAt: string;
}
