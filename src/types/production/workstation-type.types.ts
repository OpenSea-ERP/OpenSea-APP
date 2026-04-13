export interface WorkstationType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkstationTypeRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export interface UpdateWorkstationTypeRequest {
  name?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean;
}

export interface WorkstationTypeResponse {
  workstationType: WorkstationType;
}

export interface WorkstationTypesResponse {
  workstationTypes: WorkstationType[];
}
