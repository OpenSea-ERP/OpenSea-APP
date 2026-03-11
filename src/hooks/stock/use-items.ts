import { itemMovementsService, itemsService } from '@/services/stock';
import type {
  ItemMovementsQuery,
  ItemsQuery,
  RegisterItemEntryRequest,
  RegisterItemExitRequest,
  TransferItemRequest,
} from '@/types/stock';
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';

const QUERY_KEYS = {
  ITEMS: ['items'],
  ITEMS_PAGINATED: (query?: ItemsQuery) => ['items', 'paginated', query],
  ITEM: (id: string) => ['items', id],
  MOVEMENTS: ['item-movements'],
  MOVEMENTS_FILTERED: (query: ItemMovementsQuery) => ['item-movements', query],
} as const;

// GET /v1/items - Lista todos os itens (legacy)
export function useItems() {
  return useQuery({
    queryKey: QUERY_KEYS.ITEMS,
    queryFn: () => itemsService.listItems(),
    staleTime: 30_000,
  });
}

// GET /v1/items - Lista itens com paginação e filtros
export function useItemsPaginated(query?: ItemsQuery) {
  return useQuery({
    queryKey: QUERY_KEYS.ITEMS_PAGINATED(query),
    queryFn: () => itemsService.list(query),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
}

// GET /v1/items?variantId=:variantId - Lista itens de uma variante
export function useVariantItems(variantId: string) {
  return useQuery({
    queryKey: ['items', 'variant', variantId],
    queryFn: () => itemsService.listItems(variantId),
    enabled: !!variantId,
  });
}

// GET /v1/items/:itemId - Busca um item específico
export function useItem(itemId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ITEM(itemId),
    queryFn: () => itemsService.getItem(itemId),
    enabled: !!itemId,
  });
}

// POST /v1/items/entry - Registra entrada de item
export function useRegisterItemEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterItemEntryRequest) =>
      itemsService.registerEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITEMS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MOVEMENTS });
    },
  });
}

// POST /v1/items/exit - Registra saída de item
export function useRegisterItemExit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterItemExitRequest) =>
      itemsService.registerExit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITEMS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MOVEMENTS });
    },
  });
}

// POST /v1/items/transfer - Transfere item entre localizações
export function useTransferItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransferItemRequest) => itemsService.transferItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITEMS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MOVEMENTS });
    },
  });
}

// GET /v1/item-movements - Lista movimentações de itens
export function useItemMovements(query?: ItemMovementsQuery) {
  return useQuery({
    queryKey: query
      ? QUERY_KEYS.MOVEMENTS_FILTERED(query)
      : QUERY_KEYS.MOVEMENTS,
    queryFn: () => itemMovementsService.listMovements(query),
    staleTime: 30_000,
  });
}
