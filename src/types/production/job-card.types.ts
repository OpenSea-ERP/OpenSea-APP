export type JobCardStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

export interface JobCard {
  id: string;
  productionOrderId: string;
  operationRoutingId: string;
  workstationId: string | null;
  status: JobCardStatus;
  quantityPlanned: number;
  quantityCompleted: number;
  quantityScrapped: number;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  barcode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobCardResponse {
  jobCard: JobCard;
}

export interface JobCardsResponse {
  jobCards: JobCard[];
}
