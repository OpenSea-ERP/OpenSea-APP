export interface MaterialReturn {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  reason: string | null;
  returnedById: string;
  returnedAt: string;
}
