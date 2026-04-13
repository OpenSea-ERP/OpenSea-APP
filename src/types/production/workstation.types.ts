export interface Workstation {
  id: string;
  workstationTypeId: string;
  workCenterId: string | null;
  code: string;
  name: string;
  description: string | null;
  capacityPerDay: number;
  costPerHour: number | null;
  setupTimeDefault: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkstationRequest {
  workstationTypeId: string;
  workCenterId?: string;
  code: string;
  name: string;
  description?: string;
  capacityPerDay?: number;
  costPerHour?: number;
  setupTimeDefault?: number;
  isActive?: boolean;
}

export interface UpdateWorkstationRequest {
  workstationTypeId?: string;
  workCenterId?: string | null;
  code?: string;
  name?: string;
  description?: string | null;
  capacityPerDay?: number;
  costPerHour?: number | null;
  setupTimeDefault?: number;
  isActive?: boolean;
}

export interface WorkstationResponse {
  workstation: Workstation;
}

export interface WorkstationsResponse {
  workstations: Workstation[];
}
