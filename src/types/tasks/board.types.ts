// Board enums as union types
export type BoardType = 'PERSONAL' | 'TEAM';

export type BoardVisibility = 'PRIVATE' | 'SHARED';

export interface Board {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: BoardType;
  teamId: string | null;
  visibility: BoardVisibility;
  defaultView: string;
  ownerId: string;
  position: number;
  gradientId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  columns?: import('./column.types').Column[];
  labels?: import('./label.types').Label[];
  members?: import('./member.types').BoardMember[];
  _count?: {
    cards: number;
    members: number;
  };
}

export interface CreateBoardRequest {
  title: string;
  description?: string | null;
  type?: BoardType;
  teamId?: string | null;
  visibility?: BoardVisibility;
  defaultView?: string;
  gradientId?: string | null;
}

export interface UpdateBoardRequest {
  title?: string;
  description?: string | null;
  visibility?: BoardVisibility;
  defaultView?: string;
  gradientId?: string | null;
}

export interface BoardsQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: BoardType;
  teamId?: string;
  visibility?: BoardVisibility;
  includeArchived?: boolean;
}
