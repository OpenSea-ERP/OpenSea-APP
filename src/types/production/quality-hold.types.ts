export type QualityHoldStatus = 'ACTIVE' | 'RELEASED' | 'SCRAPPED';

export interface QualityHold {
  id: string;
  productionOrderId: string;
  reason: string;
  status: QualityHoldStatus;
  holdById: string;
  holdAt: string;
  releasedById: string | null;
  releasedAt: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QualityHoldResponse { qualityHold: QualityHold; }
export interface QualityHoldsResponse { qualityHolds: QualityHold[]; }
