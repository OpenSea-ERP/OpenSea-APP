'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';
import { toast } from 'sonner';

import {
  ProductSearch,
  type PosCartItem,
} from '../src/components/product-search';
import { QuickCart } from '../src/components/quick-cart';
import { PaymentPanel } from '../src/components/payment-panel';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BalcaoRapidoPage() {
  const router = useRouter();

  // Cart state
  const [cart, setCart] = useState<PosCartItem[]>([]);

  // Cart helpers
  const handleAddToCart = useCallback(
    (product: { id: string; name: string; sku: string; price: number }) => {
      setCart(prev => {
        const existing = prev.find(item => item.productId === product.id);
        if (existing) {
          return prev.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [
          ...prev,
          {
            id: `cart-${Date.now()}-${product.id}`,
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unitPrice: product.price,
            quantity: 1,
          },
        ];
      });
    },
    []
  );

  const handleUpdateQuantity = useCallback((itemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const total = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const handleFinalize = useCallback((_method: 'CASH' | 'CARD' | 'PIX') => {
    toast.success('Venda registrada com sucesso!');
    setCart([]);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Left — Search & Cart (60%) */}
      <div className="flex-[3] flex flex-col border-r border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-white dark:bg-slate-800/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/sales/pos')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-sky-500" />
            <h1 className="font-bold text-base">Balcão Rápido</h1>
          </div>
        </div>

        {/* Product Search */}
        <div className="p-4 flex-shrink-0">
          <ProductSearch onAddToCart={handleAddToCart} compact />
        </div>

        {/* Quick Cart */}
        <div className="flex-1 min-h-0 px-4 pb-4">
          <QuickCart
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            className="h-full"
          />
        </div>
      </div>

      {/* Right — Payment (40%) */}
      <div className="flex-[2] bg-white dark:bg-slate-800/60 p-6 overflow-y-auto">
        <PaymentPanel
          total={total}
          onFinalize={handleFinalize}
          disabled={cart.length === 0}
        />
      </div>
    </div>
  );
}
