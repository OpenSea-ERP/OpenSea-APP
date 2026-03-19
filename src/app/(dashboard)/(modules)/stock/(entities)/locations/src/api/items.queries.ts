// ============================================
// ITEMS API - MOVIMENTAÇÃO
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QUERY_KEYS, API_ENDPOINTS } from './keys';

// ============================================
// QUERY KEYS
// ============================================

export const ITEM_QUERY_KEYS = {
  items: ['items'] as const,
  item: (id: string) => ['items', id] as const,
  itemsByVariant: (variantId: string) =>
    ['items', 'by-variant', variantId] as const,
  itemsByProduct: (productId: string) =>
    ['items', 'by-product', productId] as const,
  movements: ['item-movements'] as const,
  reservations: ['item-reservations'] as const,
  reservation: (id: string) => ['item-reservations', id] as const,
};

// ============================================
// TYPES
// ============================================

export interface StockItem {
  id: string;
  variantId: string;
  productId: string;
  binId: string;
  quantity: number;
  lotNumber?: string;
  serialNumber?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemsResponse {
  items: StockItem[];
  total: number;
}

export interface ItemResponse {
  item: StockItem;
}

export interface TransferItemRequest {
  itemId: string;
  destinationBinId: string;
  reasonCode?: string;
  notes?: string;
}

export interface TransferItemResponse {
  success: boolean;
  transfer: {
    id: string;
    itemId: string;
    fromBinId: string;
    toBinId: string;
    quantity: number;
    reason?: string;
    createdAt: string;
  };
}

export interface ItemEntryRequest {
  variantId: string;
  binId: string;
  quantity: number;
  lotNumber?: string;
  serialNumber?: string;
  expirationDate?: string;
  reason?: string;
}

export interface ItemExitRequest {
  itemId: string;
  quantity: number;
  reason?: string;
}

export interface ItemMovement {
  id: string;
  itemId: string;
  type: 'entry' | 'exit' | 'transfer';
  fromBinId?: string;
  toBinId?: string;
  quantity: number;
  reason?: string;
  userId: string;
  createdAt: string;
}

export interface ItemMovementsResponse {
  movements: ItemMovement[];
  total: number;
}

// ============================================
// QUERIES
// ============================================

/**
 * Hook para listar itens
 */
export function useItems(params?: {
  binId?: string;
  variantId?: string;
  productId?: string;
}) {
  return useQuery({
    queryKey: [...ITEM_QUERY_KEYS.items, params],
    queryFn: async () => {
      const response = await apiClient.get<ItemsResponse>(
        API_ENDPOINTS.items.list,
        {
          params,
        }
      );
      return response;
    },
  });
}

/**
 * Hook para obter um item por ID
 */
export function useItem(id: string) {
  return useQuery({
    queryKey: ITEM_QUERY_KEYS.item(id),
    queryFn: async () => {
      const response = await apiClient.get<ItemResponse>(
        API_ENDPOINTS.items.get(id)
      );
      return response.item;
    },
    enabled: !!id,
  });
}

/**
 * Hook para obter itens de uma variante
 */
export function useItemsByVariant(variantId: string) {
  return useQuery({
    queryKey: ITEM_QUERY_KEYS.itemsByVariant(variantId),
    queryFn: async () => {
      const response = await apiClient.get<ItemsResponse>(
        API_ENDPOINTS.items.byVariant(variantId)
      );
      return response;
    },
    enabled: !!variantId,
  });
}

/**
 * Hook para obter itens de um produto
 */
export function useItemsByProduct(productId: string) {
  return useQuery({
    queryKey: ITEM_QUERY_KEYS.itemsByProduct(productId),
    queryFn: async () => {
      const response = await apiClient.get<ItemsResponse>(
        API_ENDPOINTS.items.byProduct(productId)
      );
      return response;
    },
    enabled: !!productId,
  });
}

/**
 * Hook para listar movimentações
 */
export function useItemMovements(params?: { itemId?: string; binId?: string }) {
  return useQuery({
    queryKey: [...ITEM_QUERY_KEYS.movements, params],
    queryFn: async () => {
      const response = await apiClient.get<ItemMovementsResponse>(
        API_ENDPOINTS.itemMovements.list,
        { params }
      );
      return response;
    },
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Hook para entrada de item (recebimento)
 */
export function useItemEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ItemEntryRequest) => {
      const response = await apiClient.post<ItemResponse>(
        API_ENDPOINTS.items.entry,
        data
      );
      return response;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ITEM_QUERY_KEYS.items });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bin(variables.binId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.binDetail(variables.binId),
      });
      queryClient.invalidateQueries({
        predicate: query => query.queryKey.includes('occupancy'),
      });
    },
  });
}

/**
 * Hook para saída de item
 */
export function useItemExit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ItemExitRequest) => {
      const response = await apiClient.post<{ success: boolean }>(
        API_ENDPOINTS.items.exit,
        data
      );
      return response;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ITEM_QUERY_KEYS.items });
      queryClient.invalidateQueries({
        queryKey: ITEM_QUERY_KEYS.item(variables.itemId),
      });
      queryClient.invalidateQueries({
        predicate: query => query.queryKey.includes('occupancy'),
      });
    },
  });
}

/**
 * Hook para transferir item entre bins
 */
export function useTransferItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransferItemRequest) => {
      const response = await apiClient.post<TransferItemResponse>(
        API_ENDPOINTS.items.transfer,
        data
      );
      return response;
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bin(variables.destinationBinId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.binDetail(variables.destinationBinId),
      });
      queryClient.invalidateQueries({ queryKey: ITEM_QUERY_KEYS.items });
      queryClient.invalidateQueries({ queryKey: ITEM_QUERY_KEYS.movements });
      queryClient.invalidateQueries({
        predicate: query =>
          query.queryKey.includes('occupancy') ||
          query.queryKey.includes('detail') ||
          query.queryKey.includes('bins'),
      });
    },
  });
}

// Alias para compatibilidade
export const useMoveItem = useTransferItem;
