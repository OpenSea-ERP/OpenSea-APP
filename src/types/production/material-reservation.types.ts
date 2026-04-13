export type MaterialReservationStatus =
  | 'RESERVED'
  | 'PARTIALLY_ISSUED'
  | 'FULLY_ISSUED'
  | 'CANCELLED';

export interface MaterialReservation {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantityReserved: number;
  quantityIssued: number;
  status: MaterialReservationStatus;
  createdAt: string;
  updatedAt: string;
}
