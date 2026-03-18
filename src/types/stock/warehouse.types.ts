// ============================================
// WAREHOUSE (Armazém) TYPES
// ============================================

export interface Warehouse {
  id: string;
  code: string; // "FAB" - único, 2-5 chars
  name: string; // "Fábrica Principal"
  description?: string;
  address?: string; // Endereço físico

  // Metadados
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Estatísticas (calculadas)
  stats?: WarehouseStats;
}

export interface WarehouseStats {
  totalZones: number;
  totalBins: number;
  occupiedBins: number;
  occupancyPercentage: number;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  description?: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateWarehouseRequest {
  code?: string;
  name?: string;
  description?: string;
  address?: string;
  isActive?: boolean;
}

export interface WarehouseResponse {
  warehouse: Warehouse;
}

export interface WarehousesResponse {
  warehouses: Warehouse[];
}

// ============================================
// Form Types
// ============================================

export interface WarehouseFormData {
  code: string;
  name: string;
  description: string;
  address: string;
  isActive: boolean;
}

export const defaultWarehouseFormData: WarehouseFormData = {
  code: '',
  name: '',
  description: '',
  address: '',
  isActive: true,
};

// ============================================
// LEGACY TYPES (deprecated)
// ============================================

export type LocationType =
  | 'WAREHOUSE'
  | 'ZONE'
  | 'AISLE'
  | 'RACK'
  | 'SHELF'
  | 'BIN'
  | 'FLOOR'
  | 'ROOM'
  | 'OTHER';

/** @deprecated Use Warehouse -> Zone -> Bin hierarchy instead */
export interface Location {
  id: string;
  code: string;
  name?: string;
  type: LocationType;
  locationType?: string; // Campo da API
  parentId?: string;
  capacity?: number;
  currentOccupancy?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/** @deprecated Use Warehouse -> Zone -> Bin hierarchy instead */
export interface ApiLocation {
  id: string;
  code: string;
  titulo?: string; // Campo da API
  type: string; // Campo da API
  parentId?: string;
  capacity?: number;
  currentOccupancy?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/** @deprecated Use Warehouse -> Zone -> Bin hierarchy instead */
export interface CreateLocationRequest {
  titulo?: string;
  type?: LocationType;
  parentId?: string;
  capacity?: number;
  currentOccupancy?: number;
  isActive?: boolean;
}

/** @deprecated Use Warehouse -> Zone -> Bin hierarchy instead */
export interface UpdateLocationRequest {
  titulo?: string;
  type?: LocationType;
  parentId?: string;
  capacity?: number;
  currentOccupancy?: number;
  isActive?: boolean;
}

export interface LocationsResponse {
  locations: ApiLocation[];
}

export interface LocationResponse {
  location: ApiLocation;
}
