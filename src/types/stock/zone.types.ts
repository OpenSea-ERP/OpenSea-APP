// ============================================
// ZONE (Zona) TYPES
// ============================================

import type { ZoneLayout } from './layout.types';

export interface Zone {
  id: string;
  warehouseId: string;
  code: string; // "EST" - único dentro do warehouse
  name: string; // "Estoque"
  description?: string;

  // Configuração da estrutura física
  structure: ZoneStructure;

  // Layout visual customizado (opcional)
  layout?: ZoneLayout;

  // Metadados
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Estatísticas (calculadas)
  stats?: ZoneStats;
}

export interface ZoneStats {
  totalBins: number;
  occupiedBins: number;
  emptyBins: number;
  blockedBins: number;
  totalCapacity: number;
  occupancyPercentage: number;
}

// ============================================
// ZONE STRUCTURE (Configuração)
// ============================================

export interface ZoneStructure {
  // Dimensões (modo uniforme - para compatibilidade)
  aisles: number; // Quantidade de corredores (1-99)
  shelvesPerAisle: number; // Prateleiras por corredor (1-999)
  binsPerShelf: number; // Nichos por prateleira (1-26)

  // Configuração de corredores independentes (opcional)
  // Quando presente, cada corredor pode ter configuração diferente
  aisleConfigs?: AisleConfig[];

  // Padrão de código
  codePattern: CodePattern;

  // Dimensões físicas (para mapa 2D) - obrigatório
  dimensions: PhysicalDimensions;
}

export interface CodePattern {
  separator: '-' | '.' | ''; // Separador entre partes
  aisleDigits: 1 | 2; // 1 = "1", 2 = "01"
  shelfDigits: 2 | 3; // 2 = "01", 3 = "001"
  binLabeling: 'LETTERS' | 'NUMBERS'; // A,B,C ou 1,2,3
  binDirection: 'BOTTOM_UP' | 'TOP_DOWN'; // A=inferior ou A=superior
}

export interface PhysicalDimensions {
  aisleWidth: number; // Largura do corredor em cm
  aisleSpacing: number; // Espaçamento entre corredores em cm
  shelfWidth: number; // Largura da prateleira em cm
  shelfHeight: number; // Altura da prateleira em cm
  binHeight: number; // Altura de cada nicho em cm
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateZoneRequest {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateZoneRequest {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ConfigureZoneStructureRequest {
  structure: ZoneStructure;
  defaultCapacity?: number;
}

export interface ZoneResponse {
  zone: Zone;
}

export interface ZonesResponse {
  zones: Zone[];
}

export interface StructurePreviewResponse {
  totalBins: number;
  sampleAddresses: string[];
  firstAddress: string;
  lastAddress: string;
}

// ============================================
// Reconfiguration Preview Types
// ============================================

export interface ReconfigurationPreviewResponse {
  binsToPreserve: number;
  binsToCreate: number;
  binsToDeleteEmpty: number;
  binsToDeleteEmptyIds: string[];
  binsWithItems: Array<{
    binId: string;
    address: string;
    itemCount: number;
  }>;
  totalAffectedItems: number;
  addressUpdates: number;
  isFirstConfiguration: boolean;
  totalNewBins: number;
}

export interface ZoneItemStatsResponse {
  totalBins: number;
  activeBins: number;
  blockedBins: number;
  occupiedBins: number;
  totalItems: number;
  itemsInBlockedBins: number;
}

export interface ConfigureZoneStructureResponse {
  zone: Zone;
  binsCreated: number;
  binsPreserved: number;
  binsUpdated: number;
  binsDeleted: number;
  binsBlocked: number;
  itemsDetached: number;
  blockedBins: Array<{
    binId: string;
    address: string;
    itemCount: number;
  }>;
}

// ============================================
// Form Types
// ============================================

export interface ZoneFormData {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export const defaultZoneFormData: ZoneFormData = {
  code: '',
  name: '',
  description: '',
  isActive: true,
};

export interface ZoneStructureFormData {
  aisles: number;
  shelvesPerAisle: number;
  binsPerShelf: number;
  separator: '-' | '.' | '';
  aisleDigits: 1 | 2;
  shelfDigits: 2 | 3;
  binLabeling: 'LETTERS' | 'NUMBERS';
  binDirection: 'BOTTOM_UP' | 'TOP_DOWN';
}

export const defaultZoneStructureFormData: ZoneStructureFormData = {
  aisles: 1,
  shelvesPerAisle: 1,
  binsPerShelf: 1,
  separator: '-',
  aisleDigits: 1,
  shelfDigits: 2,
  binLabeling: 'LETTERS',
  binDirection: 'BOTTOM_UP',
};

// ============================================
// Aisle Configuration Types (for independent aisles)
// ============================================

export interface AisleConfig {
  aisleNumber: number; // Número do corredor (1, 2, 3...)
  shelvesCount: number; // Quantidade de prateleiras neste corredor
  binsPerShelf: number; // Nichos por prateleira neste corredor
}

export interface ZoneStructureWithAisles {
  aisles: AisleConfig[];
  codePattern: CodePattern;
  dimensions: PhysicalDimensions;
}

export const defaultAisleConfig: AisleConfig = {
  aisleNumber: 1,
  shelvesCount: 1,
  binsPerShelf: 1,
};

// ============================================
// Wizard Step Types
// ============================================

export type WizardStep = 'dimensions' | 'code-pattern' | 'preview' | 'confirm';

export interface WizardState {
  currentStep: WizardStep;
  zoneData: ZoneFormData;
  structureData: ZoneStructureFormData;
  isSubmitting: boolean;
  error: string | null;
}
