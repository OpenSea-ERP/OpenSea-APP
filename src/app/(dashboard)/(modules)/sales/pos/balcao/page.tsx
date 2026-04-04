'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Zap } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CartProvider, useCartData, useCartActions } from '@/providers/cart-provider';
import { ProductGrid } from '@/components/sales/product-grid';
import type { ProductVariant } from '@/components/sales/product-grid';
import { PaymentOverlay } from '@/components/sales/payment-overlay';
import { SuccessScreen } from '@/components/sales/success-screen';
import { SessionOpenModal } from '@/components/sales/session-open-modal';
import { useActiveSession, useOpenPosSession } from '@/hooks/sales/use-pos';
import { BalcaoCart } from './_components/balcao-cart';

// =============================================================================
// MAIN PAGE (wraps with CartProvider)
// =============================================================================

export default function BalcaoPage() {
  return (
    <CartProvider>
      <BalcaoTerminal />
    </CartProvider>
  );
}

// =============================================================================
// TERMINAL COMPONENT
// =============================================================================

function BalcaoTerminal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const terminalId = searchParams.get('terminalId') ?? '';

  // Session management
  const requiresSession = !!terminalId;
  const { data: activeSession, isLoading: isLoadingSession } =
    useActiveSession(terminalId);
  const openSession = useOpenPosSession();

  const [showSessionModal, setShowSessionModal] = useState(false);

  // Payment flow
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    changeAmount: number;
    saleCode: string;
    payments: Array<{ method: string; amount: number }>;
  } | null>(null);

  // Mobile cart badge visibility
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Cart context
  const { activeOrder, items, itemCount } = useCartData();
  const { addItem, newCart } = useCartActions();

  const total = activeOrder?.grandTotal ?? 0;

  // Check session on mount
  useEffect(() => {
    if (requiresSession && !isLoadingSession && !activeSession) {
      setShowSessionModal(true);
    }
  }, [requiresSession, isLoadingSession, activeSession]);

  // Auto-create draft order if none exists
  useEffect(() => {
    if (!activeOrder && !showSuccess) {
      newCart().catch(() => {
        // Silent — may fail if not authenticated yet
      });
    }
    // Only on mount / after success reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle product tap
  const handleAddToCart = useCallback(
    (variant: ProductVariant) => {
      addItem(variant.id);
    },
    [addItem]
  );

  // Handle charge button
  const handleCharge = useCallback(() => {
    if (!activeOrder || items.length === 0) return;
    setShowPayment(true);
  }, [activeOrder, items]);

  // Handle payment success
  const handlePaymentSuccess = useCallback(
    (result: { changeAmount: number; saleCode: string }) => {
      setShowPayment(false);
      setSuccessData({
        changeAmount: result.changeAmount,
        saleCode: result.saleCode,
        payments: [],
      });
      setShowSuccess(true);
    },
    []
  );

  // Handle new sale
  const handleNewSale = useCallback(async () => {
    setShowSuccess(false);
    setSuccessData(null);
    await newCart();
  }, [newCart]);

  // Handle session open
  const handleOpenSession = useCallback(
    (openingBalance: number) => {
      if (!terminalId) return;
      openSession.mutate(
        { terminalId, openingBalance },
        {
          onSuccess: () => {
            setShowSessionModal(false);
          },
        }
      );
    },
    [terminalId, openSession]
  );

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/sales/pos')}
            className="h-9 px-2"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-violet-600 dark:text-violet-400" />
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Balcao Rapido
            </h1>
          </div>
        </div>

        {/* Mobile cart badge - visible below lg */}
        <button
          type="button"
          onClick={() => setShowMobileCart(true)}
          className={cn(
            'relative flex h-14 items-center gap-2 rounded-xl px-4 lg:hidden',
            'bg-violet-600 text-white font-bold shadow-sm',
            items.length === 0 && 'opacity-50'
          )}
        >
          <ShoppingCart className="size-5" />
          {itemCount > 0 && (
            <span className="text-sm">
              {formatCurrency(total)}
            </span>
          )}
          {itemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Content: Split Screen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <ProductGrid onAddToCart={handleAddToCart} />
        </div>

        {/* Right: Cart Panel — desktop only */}
        <div className="hidden w-[380px] shrink-0 lg:flex">
          <BalcaoCart onCharge={handleCharge} className="w-full" />
        </div>
      </div>

      {/* Mobile Cart Bottom Sheet */}
      {showMobileCart && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileCart(false)}
          />
          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-950">
            {/* Drag Handle */}
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            </div>
            <BalcaoCart
              onCharge={() => {
                setShowMobileCart(false);
                handleCharge();
              }}
              className="max-h-[80vh] border-l-0"
            />
          </div>
        </div>
      )}

      {/* Session Open Modal */}
      <SessionOpenModal
        isOpen={showSessionModal}
        onClose={() => {
          setShowSessionModal(false);
          if (!activeSession) {
            router.push('/sales/pos');
          }
        }}
        onConfirm={handleOpenSession}
        isPending={openSession.isPending}
      />

      {/* Payment Overlay */}
      <PaymentOverlay
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={total}
        orderId={activeOrder?.id ?? ''}
        terminalMode="FAST_CHECKOUT"
        posSessionId={activeSession?.id}
        onSuccess={handlePaymentSuccess}
      />

      {/* Success Screen */}
      <SuccessScreen
        isOpen={showSuccess}
        saleCode={successData?.saleCode ?? ''}
        total={total}
        changeAmount={successData?.changeAmount ?? 0}
        payments={successData?.payments ?? []}
        onNewSale={handleNewSale}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}
