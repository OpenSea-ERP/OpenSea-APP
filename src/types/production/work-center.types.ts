export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkCenterRequest {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateWorkCenterRequest {
  code?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface WorkCenterResponse {
  workCenter: WorkCenter;
}

export interface WorkCentersResponse {
  workCenters: WorkCenter[];
}
