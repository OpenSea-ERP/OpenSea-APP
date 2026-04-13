export type InspectionStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL';

export interface InspectionPlan {
  id: string;
  operationRoutingId: string;
  inspectionType: string;
  description: string | null;
  sampleSize: number;
  aqlLevel: string | null;
  instructions: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionResult {
  id: string;
  inspectionPlanId: string;
  productionOrderId: string;
  inspectedById: string;
  inspectedAt: string;
  sampleSize: number;
  defectsFound: number;
  status: InspectionStatus;
  notes: string | null;
  createdAt: string;
}

export interface InspectionPlanResponse { inspectionPlan: InspectionPlan; }
export interface InspectionPlansResponse { inspectionPlans: InspectionPlan[]; }
