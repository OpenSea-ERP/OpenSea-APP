// Blueprint Types (Process Blueprints / Modelos de Processo)

export type BlueprintStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export const BLUEPRINT_STATUS_LABELS: Record<BlueprintStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  DRAFT: 'Rascunho',
};

export interface BlueprintStageFieldRule {
  fieldName: string;
  isRequired: boolean;
  validationType?: 'NOT_EMPTY' | 'MIN_LENGTH' | 'REGEX' | 'CUSTOM';
  validationValue?: string;
  errorMessage?: string;
}

export interface BlueprintStageRule {
  id: string;
  blueprintId: string;
  stageId: string;
  stageName: string;
  position: number;
  requiredFields: BlueprintStageFieldRule[];
  autoActions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Blueprint {
  id: string;
  name: string;
  description?: string;
  pipelineId: string;
  pipelineName?: string;
  status: BlueprintStatus;
  stageRules: BlueprintStageRule[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBlueprintRequest {
  name: string;
  description?: string;
  pipelineId: string;
  stageRules?: Array<{
    stageId: string;
    requiredFields: BlueprintStageFieldRule[];
    autoActions?: string[];
  }>;
}

export interface UpdateBlueprintRequest {
  name?: string;
  description?: string;
  status?: BlueprintStatus;
  stageRules?: Array<{
    stageId: string;
    requiredFields: BlueprintStageFieldRule[];
    autoActions?: string[];
  }>;
}

export interface BlueprintResponse {
  blueprint: Blueprint;
}

export interface BlueprintsResponse {
  blueprints: Blueprint[];
}

export interface BlueprintsQuery {
  search?: string;
  pipelineId?: string;
  status?: BlueprintStatus;
}
