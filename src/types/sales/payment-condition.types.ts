// Payment Condition Types

export type PaymentConditionType =
  | 'CASH'
  | 'INSTALLMENT'
  | 'CUSTOM'
  | 'CREDIT_LIMIT';
export type InterestType = 'SIMPLE' | 'COMPOUND';
export type PaymentConditionApplicable = 'ALL' | 'RETAIL' | 'WHOLESALE' | 'BID';

export interface PaymentConditionDTO {
  id: string;
  name: string;
  description: string | null;
  type: PaymentConditionType;
  installments: number;
  firstDueDays: number;
  intervalDays: number;
  downPaymentPercent: number | null;
  interestRate: number | null;
  interestType: InterestType;
  penaltyRate: number | null;
  discountCash: number | null;
  applicableTo: PaymentConditionApplicable;
  minOrderValue: number | null;
  maxOrderValue: number | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreatePaymentConditionRequest {
  name: string;
  description?: string;
  type: PaymentConditionType;
  installments?: number;
  firstDueDays?: number;
  intervalDays?: number;
  downPaymentPercent?: number;
  interestRate?: number;
  interestType?: InterestType;
  penaltyRate?: number;
  discountCash?: number;
  applicableTo?: PaymentConditionApplicable;
  minOrderValue?: number;
  maxOrderValue?: number;
  isDefault?: boolean;
}

export interface UpdatePaymentConditionRequest {
  name?: string;
  description?: string;
  type?: PaymentConditionType;
  installments?: number;
  firstDueDays?: number;
  intervalDays?: number;
  downPaymentPercent?: number | null;
  interestRate?: number | null;
  interestType?: InterestType;
  penaltyRate?: number | null;
  discountCash?: number | null;
  applicableTo?: PaymentConditionApplicable;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  isActive?: boolean;
  isDefault?: boolean;
}

export const PAYMENT_CONDITION_TYPE_LABELS: Record<PaymentConditionType, string> = {
  CASH: 'A Vista',
  INSTALLMENT: 'Parcelado',
  CUSTOM: 'Personalizado',
  CREDIT_LIMIT: 'Limite de Credito',
};

export const INTEREST_TYPE_LABELS: Record<InterestType, string> = {
  SIMPLE: 'Simples',
  COMPOUND: 'Composto',
};

export const PAYMENT_CONDITION_APPLICABLE_LABELS: Record<PaymentConditionApplicable, string> = {
  ALL: 'Todos',
  RETAIL: 'Varejo',
  WHOLESALE: 'Atacado',
  BID: 'Licitacao',
};

export interface PaymentConditionsResponse {
  data: PaymentConditionDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
