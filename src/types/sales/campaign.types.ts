// Campaign Types

import type { PaginatedQuery } from '../pagination';

export type CampaignType =
  | 'PERCENTAGE'
  | 'FIXED_VALUE'
  | 'BUY_X_GET_Y'
  | 'BUY_X_GET_DISCOUNT'
  | 'FREE_SHIPPING'
  | 'BUNDLE_PRICE';

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ENDED'
  | 'ARCHIVED';

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  PERCENTAGE: 'Percentual',
  FIXED_VALUE: 'Valor Fixo',
  BUY_X_GET_Y: 'Compre X Leve Y',
  BUY_X_GET_DISCOUNT: 'Compre X com Desconto',
  FREE_SHIPPING: 'Frete Gratis',
  BUNDLE_PRICE: 'Preco Pacote',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendada',
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  ENDED: 'Encerrada',
  ARCHIVED: 'Arquivada',
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  DRAFT:
    'border-gray-300 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300',
  SCHEDULED:
    'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300',
  ACTIVE:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  PAUSED:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  ENDED:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  ARCHIVED:
    'border-gray-300 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400',
};

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  channels: string[];
  targetAudience: Record<string, unknown> | null;
  priority: number;
  stackable: boolean;
  maxUsageTotal: number | null;
  maxUsagePerCustomer: number | null;
  usageCount: number;
  aiGenerated: boolean;
  aiReason: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  type: CampaignType;
  startDate: string;
  endDate: string;
  channels?: string[];
  targetAudience?: Record<string, unknown>;
  priority?: number;
  stackable?: boolean;
  maxUsageTotal?: number;
  maxUsagePerCustomer?: number;
  rules?: Array<{
    ruleType: string;
    operator: string;
    value: string;
    value2?: string;
  }>;
  products?: Array<{
    variantId?: string;
    categoryId?: string;
    discountType: string;
    discountValue: number;
    maxDiscount?: number;
  }>;
}

export type UpdateCampaignRequest = Partial<CreateCampaignRequest>;

export interface CampaignResponse {
  campaign: Campaign;
}

export interface PaginatedCampaignsResponse {
  campaigns: Campaign[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CampaignsQuery extends PaginatedQuery {
  search?: string;
  type?: CampaignType;
  status?: CampaignStatus;
}
