'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PdvOrder, PdvOrderItem } from '@/types/sales';
import {
  useAddOrderItem,
  useCreatePdvOrder,
  usePdvOrder,
  useRemoveOrderItem,
  useSendToCashier,
  useUpdateOrderItemQuantity,
} from '@/hooks/sales/use-pdv';

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'opensea:pdv:activeOrderId';
const BATCH_DELAY_MS = 200;

// =============================================================================
// CartDataContext — changes frequently (order, items, loading)
// =============================================================================

interface CartData {
  activeOrder: PdvOrder | null;
  items: PdvOrderItem[];
  itemCount: number;
  isLoading: boolean;
}

const CartDataContext = createContext<CartData>({
  activeOrder: null,
  items: [],
  itemCount: 0,
  isLoading: false,
});

// =============================================================================
// CartActionsContext — stable references (functions)
// =============================================================================

interface CartActions {
  addItem(variantId: string, quantity?: number): Promise<void>;
  updateItemQuantity(itemId: string, quantity: number): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  sendToCashier(): Promise<void>;
  switchCart(orderId: string): void;
  newCart(): Promise<void>;
  clearCart(): void;
}

const CartActionsContext = createContext<CartActions>({
  addItem: async () => {},
  updateItemQuantity: async () => {},
  removeItem: async () => {},
  sendToCashier: async () => {},
  switchCart: () => {},
  newCart: async () => {},
  clearCart: () => {},
});

// =============================================================================
// Provider
// =============================================================================

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  // Lazy fetch — only queries if activeOrderId exists
  const {
    data: orderData,
    isLoading,
    refetch,
  } = usePdvOrder(activeOrderId);

  const activeOrder = orderData?.order ?? null;

  // If the fetched order is no longer DRAFT, clear it
  useEffect(() => {
    if (
      activeOrder &&
      activeOrder.status !== 'DRAFT'
    ) {
      setActiveOrderId(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeOrder]);

  // Sync localStorage when activeOrderId changes
  useEffect(() => {
    if (activeOrderId) {
      localStorage.setItem(STORAGE_KEY, activeOrderId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeOrderId]);

  // Mutations
  const createPdvOrder = useCreatePdvOrder();
  const addOrderItem = useAddOrderItem();
  const removeOrderItem = useRemoveOrderItem();
  const updateItemQty = useUpdateOrderItemQuantity();
  const sendToCashierMutation = useSendToCashier();

  // Batching: accumulate addItem calls within BATCH_DELAY_MS window
  const batchQueueRef = useRef<
    Array<{ variantId: string; quantity: number; resolve: () => void; reject: (err: unknown) => void }>
  >([]);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushBatch = useCallback(async () => {
    const queue = [...batchQueueRef.current];
    batchQueueRef.current = [];

    if (!activeOrderId || queue.length === 0) {
      for (const item of queue) item.reject(new Error('Sem carrinho ativo'));
      return;
    }

    // Merge same variantId entries
    const merged = new Map<string, { quantity: number; entries: typeof queue }>();
    for (const entry of queue) {
      const existing = merged.get(entry.variantId);
      if (existing) {
        existing.quantity += entry.quantity;
        existing.entries.push(entry);
      } else {
        merged.set(entry.variantId, {
          quantity: entry.quantity,
          entries: [entry],
        });
      }
    }

    // Execute merged requests sequentially to respect version/OCC
    for (const [variantId, { quantity, entries }] of merged) {
      try {
        await addOrderItem.mutateAsync({
          orderId: activeOrderId,
          data: { variantId, quantity },
        });
        for (const e of entries) e.resolve();
      } catch (err) {
        for (const e of entries) e.reject(err);
      }
    }
  }, [activeOrderId, addOrderItem]);

  // ---- Actions (stable via useCallback) ----

  const addItem = useCallback(
    (variantId: string, quantity = 1): Promise<void> => {
      return new Promise((resolve, reject) => {
        batchQueueRef.current.push({ variantId, quantity, resolve, reject });

        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = setTimeout(() => {
          batchTimerRef.current = null;
          flushBatch();
        }, BATCH_DELAY_MS);
      });
    },
    [flushBatch]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!activeOrderId) return;
      await updateItemQty.mutateAsync({
        orderId: activeOrderId,
        itemId,
        quantity,
      });
    },
    [activeOrderId, updateItemQty]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!activeOrderId) return;
      await removeOrderItem.mutateAsync({
        orderId: activeOrderId,
        itemId,
      });
    },
    [activeOrderId, removeOrderItem]
  );

  const sendToCashier = useCallback(async () => {
    if (!activeOrderId) return;
    await sendToCashierMutation.mutateAsync(activeOrderId);
    setActiveOrderId(null);
  }, [activeOrderId, sendToCashierMutation]);

  const switchCart = useCallback(
    (orderId: string) => {
      setActiveOrderId(orderId);
      refetch();
    },
    [refetch]
  );

  const newCart = useCallback(async () => {
    const result = await createPdvOrder.mutateAsync(undefined);
    setActiveOrderId(result.order.id);
  }, [createPdvOrder]);

  const clearCart = useCallback(() => {
    setActiveOrderId(null);
  }, []);

  // ---- Context values ----

  const dataValue = useMemo<CartData>(
    () => ({
      activeOrder,
      items: activeOrder?.items ?? [],
      itemCount: activeOrder?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
      isLoading,
    }),
    [activeOrder, isLoading]
  );

  const actionsValue = useMemo<CartActions>(
    () => ({
      addItem,
      updateItemQuantity,
      removeItem,
      sendToCashier,
      switchCart,
      newCart,
      clearCart,
    }),
    [
      addItem,
      updateItemQuantity,
      removeItem,
      sendToCashier,
      switchCart,
      newCart,
      clearCart,
    ]
  );

  return (
    <CartDataContext.Provider value={dataValue}>
      <CartActionsContext.Provider value={actionsValue}>
        {children}
      </CartActionsContext.Provider>
    </CartDataContext.Provider>
  );
}

// =============================================================================
// Hooks
// =============================================================================

export function useCartData(): CartData {
  return useContext(CartDataContext);
}

export function useCartActions(): CartActions {
  return useContext(CartActionsContext);
}
