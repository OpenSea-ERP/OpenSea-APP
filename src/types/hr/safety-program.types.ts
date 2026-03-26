/**
 * Safety Program Types
 * Tipos para programas de segurança do trabalho (PCMSO, PGR, LTCAT, PPRA)
 */

export type SafetyProgramType = 'PPRA' | 'PCMSO' | 'PGR' | 'LTCAT' | 'PPP' | 'PCMAT' | 'SIPAT' | 'OTHER';

export type SafetyProgramStatus = 'ACTIVE' | 'EXPIRED' | 'DRAFT';

export type WorkplaceRiskCategory =
  | 'FISICO'
  | 'QUIMICO'
  | 'BIOLOGICO'
  | 'ERGONOMICO'
  | 'ACIDENTE';

export type WorkplaceRiskSeverity = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export interface SafetyProgram {
  id: string;
  tenantId: string;
  type: SafetyProgramType;
  name: string;
  validFrom: string;
  validUntil: string;
  responsibleName: string;
  responsibleRegistration: string;
  documentUrl?: string;
  status: SafetyProgramStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkplaceRisk {
  id: string;
  tenantId: string;
  safetyProgramId: string;
  name: string;
  category: WorkplaceRiskCategory;
  severity: WorkplaceRiskSeverity;
  source?: string;
  affectedArea?: string;
  controlMeasures?: string;
  epiRequired?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSafetyProgramData {
  type: SafetyProgramType;
  name: string;
  validFrom: string;
  validUntil: string;
  responsibleName: string;
  responsibleRegistration: string;
  documentUrl?: string;
  status?: SafetyProgramStatus;
  notes?: string;
}

export interface UpdateSafetyProgramData {
  type?: SafetyProgramType;
  name?: string;
  validFrom?: string;
  validUntil?: string;
  responsibleName?: string;
  responsibleRegistration?: string;
  documentUrl?: string;
  status?: SafetyProgramStatus;
  notes?: string;
}

export interface CreateWorkplaceRiskData {
  name: string;
  category: WorkplaceRiskCategory;
  severity: WorkplaceRiskSeverity;
  source?: string;
  affectedArea?: string;
  controlMeasures?: string;
  epiRequired?: string;
  isActive?: boolean;
}

export interface UpdateWorkplaceRiskData {
  name?: string;
  category?: WorkplaceRiskCategory;
  severity?: WorkplaceRiskSeverity;
  source?: string;
  affectedArea?: string;
  controlMeasures?: string;
  epiRequired?: string;
  isActive?: boolean;
}
