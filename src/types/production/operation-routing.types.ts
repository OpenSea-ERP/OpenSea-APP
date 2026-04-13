export interface OperationRouting {
  id: string;
  bomId: string;
  workstationId: string | null;
  sequence: number;
  operationName: string;
  description: string | null;
  setupTime: number;
  executionTime: number;
  waitTime: number;
  moveTime: number;
  isQualityCheck: boolean;
  isOptional: boolean;
  skillRequired: string | null;
  instructions: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperationRoutingRequest {
  workstationId?: string;
  sequence: number;
  operationName: string;
  description?: string;
  setupTime?: number;
  executionTime: number;
  waitTime?: number;
  moveTime?: number;
  isQualityCheck?: boolean;
  isOptional?: boolean;
  skillRequired?: string;
  instructions?: string;
  imageUrl?: string;
}

export interface UpdateOperationRoutingRequest
  extends Partial<CreateOperationRoutingRequest> {}

export interface OperationRoutingResponse {
  operationRouting: OperationRouting;
}

export interface OperationRoutingsResponse {
  operationRoutings: OperationRouting[];
}
