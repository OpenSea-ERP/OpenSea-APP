export type DefectSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface DefectType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  severity: DefectSeverity;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDefectTypeRequest {
  code: string;
  name: string;
  description?: string;
  severity: DefectSeverity;
  isActive?: boolean;
}

export interface UpdateDefectTypeRequest {
  name?: string;
  description?: string | null;
  severity?: DefectSeverity;
  isActive?: boolean;
}

export interface DefectTypeResponse {
  defectType: DefectType;
}

export interface DefectTypesResponse {
  defectTypes: DefectType[];
}
