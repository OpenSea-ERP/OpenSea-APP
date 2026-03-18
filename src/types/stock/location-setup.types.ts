// ============================================
// LOCATION SETUP TYPES (Quick Setup Wizard)
// ============================================

import type { Warehouse } from './warehouse.types';
import type { Zone } from './zone.types';

export interface LocationSetupRequest {
  warehouse: { code: string; name: string; description?: string };
  zones: Array<{
    code: string;
    name: string;
    structure?: {
      aisleConfigs: Array<{ shelvesPerAisle: number; binsPerShelf: number }>;
    };
  }>;
}

export interface LocationSetupResponse {
  warehouse: Warehouse & {
    zones: Array<Zone & { binCount: number }>;
  };
}
