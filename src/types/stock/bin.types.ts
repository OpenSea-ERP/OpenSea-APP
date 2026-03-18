// ============================================
// BIN (Nicho) TYPES
// ============================================

export interface Bin {
  id: string;
  zoneId: string;

  // Endereço completo - índice único
  address: string; // "FAB-EST-102-B"

  // Posição (derivada do address, mas indexada para queries)
  aisle: number; // 1
  shelf: number; // 2
  position: string; // "B"

  // Capacidade e ocupação
  capacity?: number; // Capacidade máxima (opcional)
  currentOccupancy: number; // Quantidade de itens

  // Status
  isActive: boolean;
  isBlocked: boolean; // Bloqueado temporariamente
  blockReason?: string;

  // Metadados
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Bin Occupancy (para visualização no mapa)
// ============================================

export interface BinOccupancy {
  id: string;
  address: string;
  aisle: number;
  shelf: number;
  position: string;
  currentOccupancy: number;
  capacity?: number;
  isBlocked: boolean;
  itemCount: number;
}

export type OccupancyLevel =
  | 'empty'
  | 'low'
  | 'medium'
  | 'high'
  | 'full'
  | 'blocked';

export function getOccupancyLevel(bin: BinOccupancy): OccupancyLevel {
  if (bin.isBlocked) return 'blocked';
  if (!bin.capacity || bin.capacity === 0) {
    return bin.currentOccupancy === 0 ? 'empty' : 'low';
  }

  const percentage = (bin.currentOccupancy / bin.capacity) * 100;

  if (percentage === 0) return 'empty';
  if (percentage < 50) return 'low';
  if (percentage < 80) return 'medium';
  if (percentage < 95) return 'high';
  return 'full';
}

// ============================================
// API Request/Response Types
// ============================================

export interface UpdateBinRequest {
  capacity?: number;
  isActive?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
}

export interface BinResponse {
  bin: Bin;
}

export interface BinsResponse {
  bins: Bin[];
}

export interface BinOccupancyResponse {
  bins: BinOccupancy[];
  stats: {
    total: number;
    empty: number;
    occupied: number;
    blocked: number;
    occupancyPercentage: number;
  };
}

export interface BinSearchResponse {
  bins: Bin[];
  total: number;
}

export interface BinSuggestion {
  address: string;
  occupancyLevel: OccupancyLevel;
  itemCount: number;
}

export interface BinSuggestionsResponse {
  suggestions: BinSuggestion[];
}

// ============================================
// Address Components (parsed)
// ============================================

export interface AddressComponents {
  warehouseCode: string;
  zoneCode: string;
  aisle: number;
  shelf: number;
  bin: string;
  isValid?: boolean;
}

// ============================================
// Item in Bin (para modal de detalhes)
// ============================================

export interface BinItem {
  id: string;
  itemCode: string; // Código único do item (ex: ITEM-MK1WUPO5-OGKG)
  sku: string; // SKU da variante (ex: VERDE-CLARO)
  productName: string;
  variantName?: string | null;
  quantity: number;
  unitLabel?: string;
  addedAt: string | Date;
}

export interface BinDetailResponse {
  bin: Bin;
  items: BinItem[];
  zone: {
    id: string;
    code: string;
    name: string;
  };
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
}
