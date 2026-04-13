export interface MaterialIssue {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  batchNumber: string | null;
  issuedById: string;
  issuedAt: string;
  notes: string | null;
}
