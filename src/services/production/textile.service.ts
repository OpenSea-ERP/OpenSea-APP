import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';

export interface TextileConfig {
  industryType: 'TEXTILE';
  enableSizeColorMatrix: boolean;
  enableBundleTracking: boolean;
  enableCutOrders: boolean;
  enablePersonalization: boolean;
  defaultSizes: string[];
  defaultBundleSize: number;
  fabricConsumptionUnit: 'METERS' | 'YARDS';
  defaultFabricWastePercentage: number;
  sizeConsumptionFactors: Record<string, number>;
}

export interface SizeColorMatrix {
  sizes: string[];
  colors: string[];
  quantities: Record<string, Record<string, number>>;
}

export interface CutPlanResult {
  productionOrderId: string;
  orderNumber: string;
  totalPieces: number;
  piecesPerSize: Array<{
    size: string;
    totalPieces: number;
    estimatedFabricMeters: number;
  }>;
  piecesPerColor: Array<{ color: string; totalPieces: number }>;
  totalEstimatedFabricMeters: number;
  wastePercentage: number;
  totalWithWaste: number;
  layersNeeded: number;
  matrix: SizeColorMatrix;
}

export interface BundleTicket {
  bundleNumber: number;
  size: string;
  color: string;
  quantity: number;
  barcode: string;
  productionOrderId: string;
  orderNumber: string;
}

export interface BundleTicketsResult {
  productionOrderId: string;
  orderNumber: string;
  bundleSize: number;
  totalBundles: number;
  totalPieces: number;
  bundles: BundleTicket[];
}

export const textileService = {
  async getConfig() {
    return apiClient.get<TextileConfig>(
      API_ENDPOINTS.PRODUCTION.TEXTILE.CONFIG
    );
  },
  async generateCutPlan(
    orderId: string,
    data: {
      matrix: SizeColorMatrix;
      baseFabricConsumptionPerPiece: number;
      wastePercentage?: number;
      spreadingTableWidthPieces?: number;
      sizeConsumptionFactors?: Record<string, number>;
    }
  ) {
    return apiClient.post<{ cutPlan: CutPlanResult }>(
      API_ENDPOINTS.PRODUCTION.TEXTILE.CUT_PLAN(orderId),
      data
    );
  },
  async generateBundleTickets(
    orderId: string,
    data: {
      bundleSize?: number;
      sizes: string[];
      colors: string[];
      quantities: Record<string, Record<string, number>>;
    }
  ) {
    return apiClient.post<{ result: BundleTicketsResult }>(
      API_ENDPOINTS.PRODUCTION.TEXTILE.BUNDLE_TICKETS(orderId),
      data
    );
  },
};
