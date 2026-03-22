export type AiFavoriteCategory =
  | 'SALES'
  | 'STOCK'
  | 'FINANCE'
  | 'HR'
  | 'CRM'
  | 'GENERAL';

export interface AiFavoriteQuery {
  id: string;
  tenantId: string;
  userId: string;
  query: string;
  shortcut: string | null;
  category: AiFavoriteCategory;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreateFavoriteRequest {
  query: string;
  shortcut?: string;
  category?: AiFavoriteCategory;
}
