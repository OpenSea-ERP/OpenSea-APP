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

  const items = bin.itemCount;

  if (items === 0) return 'empty';

  if (!bin.capacity || bin.capacity === 0) {
    return 'low';
  }

  const percentage = (items / bin.capacity) * 100;

  if (percentage < 34) return 'low';
  if (percentage < 67) return 'medium';
  if (percentage < 100) return 'high';
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
  itemCode: string;
  sku: string;
  productId?: string | null;
  templateName?: string | null;
  productName: string;
  manufacturerName?: string | null;
  variantName?: string | null;
  variantReference?: string | null;
  colorHex?: string | null;
  secondaryColorHex?: string | null;
  pattern?: string | null;
  quantity: number;
  unitLabel?: string | null;
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
