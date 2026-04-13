import { apiClient } from '@/lib/api-client';

export interface MaterialReservation {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantityReserved: number;
  quantityIssued: number;
  status: 'RESERVED' | 'PARTIALLY_ISSUED' | 'FULLY_ISSUED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export const materialReservationsService = {
  async list(productionOrderId: string) {
    return apiClient.get<{ materialReservations: MaterialReservation[] }>(
      `/v1/production/material-reservations?productionOrderId=${productionOrderId}`,
    );
  },
  async create(data: {
    productionOrderId: string;
    materialId: string;
    warehouseId: string;
    quantityReserved: number;
  }) {
    return apiClient.post<{ materialReservation: MaterialReservation }>(
      '/v1/production/material-reservations',
      data,
    );
  },
  async cancel(id: string) {
    return apiClient.post<{ materialReservation: MaterialReservation }>(
      `/v1/production/material-reservations/${id}/cancel`,
    );
  },
};
