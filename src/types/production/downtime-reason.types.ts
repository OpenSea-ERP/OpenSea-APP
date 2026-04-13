export type DowntimeCategory =
  | 'MACHINE'
  | 'MATERIAL'
  | 'QUALITY'
  | 'SETUP'
  | 'PLANNING'
  | 'MAINTENANCE'
  | 'OTHER';

export interface DowntimeReason {
  id: string;
  code: string;
  name: string;
  category: DowntimeCategory;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDowntimeReasonRequest {
  code: string;
  name: string;
  category: DowntimeCategory;
  isActive?: boolean;
}

export interface UpdateDowntimeReasonRequest {
  name?: string;
  category?: DowntimeCategory;
  isActive?: boolean;
}

export interface DowntimeReasonResponse {
  downtimeReason: DowntimeReason;
}

export interface DowntimeReasonsResponse {
  downtimeReasons: DowntimeReason[];
}
