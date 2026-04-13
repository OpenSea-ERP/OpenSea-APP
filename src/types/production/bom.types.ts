export type BomStatus = 'DRAFT' | 'ACTIVE' | 'OBSOLETE';

export interface Bom {
  id: string;
  productId: string;
  version: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  validFrom: string;
  validUntil: string | null;
  status: BomStatus;
  baseQuantity: number;
  createdById: string;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BomItem {
  id: string;
  bomId: string;
  materialId: string;
  sequence: number;
  quantity: number;
  unit: string;
  wastagePercent: number;
  isOptional: boolean;
  substituteForId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBomRequest {
  productId: string;
  name: string;
  description?: string;
  version?: number;
  isDefault?: boolean;
  baseQuantity?: number;
}

export interface UpdateBomRequest {
  name?: string;
  description?: string | null;
  isDefault?: boolean;
  baseQuantity?: number;
  validUntil?: string | null;
}

export interface CreateBomItemRequest {
  materialId: string;
  sequence?: number;
  quantity: number;
  unit: string;
  wastagePercent?: number;
  isOptional?: boolean;
  substituteForId?: string;
  notes?: string;
}

export interface UpdateBomItemRequest {
  materialId?: string;
  sequence?: number;
  quantity?: number;
  unit?: string;
  wastagePercent?: number;
  isOptional?: boolean;
  substituteForId?: string | null;
  notes?: string | null;
}

export interface BomResponse {
  bom: Bom;
}

export interface BomsResponse {
  boms: Bom[];
}

export interface BomItemResponse {
  bomItem: BomItem;
}

export interface BomItemsResponse {
  bomItems: BomItem[];
}
