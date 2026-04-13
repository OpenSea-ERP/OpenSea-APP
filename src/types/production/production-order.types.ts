export type ProductionOrderStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'FIRM'
  | 'RELEASED'
  | 'IN_PROCESS'
  | 'TECHNICALLY_COMPLETE'
  | 'CLOSED'
  | 'CANCELLED';

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  bomId: string;
  productId: string;
  salesOrderId: string | null;
  parentOrderId: string | null;
  status: ProductionOrderStatus;
  priority: number;
  quantityPlanned: number;
  quantityStarted: number;
  quantityCompleted: number;
  quantityScrapped: number;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  releasedAt: string | null;
  releasedById: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductionOrderRequest {
  bomId: string;
  productId: string;
  quantityPlanned: number;
  priority?: number;
  salesOrderId?: string;
  parentOrderId?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  notes?: string;
}

export interface UpdateProductionOrderRequest {
  priority?: number;
  quantityPlanned?: number;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  notes?: string | null;
}

export interface ProductionOrderResponse {
  productionOrder: ProductionOrder;
}

export interface ProductionOrdersResponse {
  productionOrders: ProductionOrder[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ProductionOrderStatusCount {
  DRAFT: number;
  PLANNED: number;
  FIRM: number;
  RELEASED: number;
  IN_PROCESS: number;
  TECHNICALLY_COMPLETE: number;
  CLOSED: number;
  CANCELLED: number;
}
