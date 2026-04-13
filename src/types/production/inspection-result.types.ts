export type InspectionStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL';

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
