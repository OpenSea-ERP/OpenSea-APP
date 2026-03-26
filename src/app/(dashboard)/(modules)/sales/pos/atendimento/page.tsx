'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

import {
  ProductSearch,
  type PosCartItem,
} from '../src/components/product-search';
import { Cart } from '../src/components/cart';
import {
  CustomerSelector,
  type SelectedCustomer,
} from '../src/components/customer-selector';
import {
  CheckoutDialog,
  type PaymentMethod,
} from '../src/components/checkout-dialog';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AtendimentoAssistidoPage() {
  const router = useRouter();

  // Cart state
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Customer state
  const [selectedCustomer, setSelectedCustomer] =
    useState<SelectedCustomer | null>(null);

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

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    setCheckoutOpen(true);
  }, [cart.length]);

  const handleConfirmPayment = useCallback(
    (_method: PaymentMethod, _condition: string) => {
      // MVP: just clear and show toast
      toast.success('Venda registrada com sucesso!');
      setCart([]);
      setDiscount(0);
      setSelectedCustomer(null);
      setCheckoutOpen(false);
    },
    []
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar — Customer & Cart */}
      <div className="w-[350px] shrink-0 bg-white dark:bg-slate-800/60 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/sales/pos')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-violet-500" />
              <h1 className="font-bold text-base">Atendimento Assistido</h1>
            </div>
          </div>
        </div>

        {/* Customer Selector */}
        <div className="p-4 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Cliente
          </p>
          <CustomerSelector
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
          />
        </div>

        {/* Cart */}
        <div className="flex-1 min-h-0 p-4">
          <Cart
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            discount={discount}
            onDiscountChange={setDiscount}
            onCheckout={handleCheckout}
            className="h-full"
          />
        </div>
      </div>

      {/* Main area — Product Search */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <ProductSearch onAddToCart={handleAddToCart} />
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        total={total}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
}
