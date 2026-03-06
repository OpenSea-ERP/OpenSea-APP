export type CalendarType = 'PERSONAL' | 'TEAM' | 'SYSTEM';

export interface CalendarAccess {
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManage: boolean;
}

export interface Calendar {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  color: string | null;
  type: CalendarType;
  ownerId: string | null;
  ownerName: string | null;
  ownerColor: string | null;
  systemModule: string | null;
  isDefault: boolean;
  access: CalendarAccess;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamCalendarData {
  teamId: string;
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCalendarData {
  name?: string;
  description?: string;
  color?: string;
}

export interface TeamCalendarPermissions {
  ownerCanRead?: boolean;
  ownerCanCreate?: boolean;
  ownerCanEdit?: boolean;
  ownerCanDelete?: boolean;
  ownerCanShare?: boolean;
  ownerCanManage?: boolean;
  adminCanRead?: boolean;
  adminCanCreate?: boolean;
  adminCanEdit?: boolean;
  adminCanDelete?: boolean;
  adminCanShare?: boolean;
  adminCanManage?: boolean;
  memberCanRead?: boolean;
  memberCanCreate?: boolean;
  memberCanEdit?: boolean;
  memberCanDelete?: boolean;
  memberCanShare?: boolean;
  memberCanManage?: boolean;
}
