export type DefectSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface DefectRecord {
  id: string;
  inspectionResultId: string | null;
  defectTypeId: string;
  operatorId: string | null;
  quantity: number;
  severity: DefectSeverity;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}
