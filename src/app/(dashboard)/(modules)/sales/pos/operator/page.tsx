'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  ShoppingCart,
  Search,
  Plus,
  RotateCcw,
} from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageActionBar } from '@/components/layout/page-action-bar';
import type { BreadcrumbItemData } from '@/components/layout/page-breadcrumb';
import {
  CartProvider,
  useCartData,
  useCartActions,
} from '@/providers/cart-provider';
import { ProductGrid } from '@/components/sales/product-grid';
import type { ProductVariant } from '@/components/sales/product-grid';
import { PaymentOverlay } from '@/components/sales/payment-overlay';
import { SuccessScreen } from '@/components/sales/success-screen';
import { CashMovementModal } from '@/components/sales/cash-movement-modal';
import { PosCustomerWizard } from '@/components/sales/pos-customer-wizard';
import {
  useDeviceTerminal,
  useOpenPosSession,
  useCreatePosCashMovement,
} from '@/hooks/sales';
import { BalcaoCart } from './_components/balcao-cart';
import { CashierQueue } from './_components/cashier-queue';
import type { QueuedOrder } from './_components/cashier-queue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// =============================================================================
// BREADCRUMBS
// =============================================================================

const BREADCRUMBS: BreadcrumbItemData[] = [
  { label: 'Vendas', href: '/sales' },
  { label: 'POS', href: '/sales/pos' },
  { label: 'Operador' },
];

// =============================================================================
// PAGE WRAPPER
// =============================================================================

export default function OperatorPage() {
  return (
    <CartProvider>
      <OperatorTerminal />
    </CartProvider>
  );
}

// =============================================================================
// OPERATOR TERMINAL
// =============================================================================

function OperatorTerminal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { terminal, currentSession, isReady, isLoading } = useDeviceTerminal();
  const openSession = useOpenPosSession();
  const cashMovement = useCreatePosCashMovement();

  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [successData, setSuccessData] = useState<{
    changeAmount: number;
    saleCode: string;
  } | null>(null);

  // Queue order being charged (cashier mode)
  const [queueOrder, setQueueOrder] = useState<QueuedOrder | null>(null);

  // Cash movement modals
  const [cashMovementType, setCashMovementType] = useState<
    'WITHDRAWAL' | 'SUPPLY' | null
  >(null);

  // Customer identification wizard
  const [showCustomerWizard, setShowCustomerWizard] = useState(false);

  const { activeOrder, items, itemCount } = useCartData();
  const { addItem, newCart, setCustomer, switchCart } = useCartActions();

  const total = queueOrder?.grandTotal ?? activeOrder?.grandTotal ?? 0;

  // Redirect away if not paired
  useEffect(() => {
    if (!isLoading && !terminal) {
      router.replace('/sales/pos');
    }
  }, [isLoading, terminal, router]);

  // Auto-open session if terminal requires it and none exists
  useEffect(() => {
    if (!isLoading && terminal && terminal.requiresSession && !currentSession && isReady === false) {
      openSession
        .mutateAsync({
          terminalId: terminal.id,
          openingBalance: 0,
        })
        .catch(() => {
          // If auto-open fails, redirect to manual open
          router.replace('/sales/pos/session/open');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, terminal?.id, currentSession?.id]);

  // Auto-create draft order if needed (non-cashier mode)
  useEffect(() => {
    if (terminal?.mode !== 'CASHIER' && !activeOrder && !showSuccess && isReady) {
      newCart().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminal?.mode, isReady]);

  const handleAddToCart = useCallback(
    (variant: ProductVariant) => {
      addItem(variant.id);
    },
    [addItem]
  );

  const handleCharge = useCallback(() => {
    if (!activeOrder || items.length === 0) return;
    setQueueOrder(null);
    setShowPayment(true);
  }, [activeOrder, items]);

  const handleChargeQueueOrder = useCallback((order: QueuedOrder) => {
    setQueueOrder(order);
    setShowPayment(true);
  }, []);

  const handleSendToCashier = useCallback(async () => {
    if (!activeOrder || items.length === 0) return;
    setSuccessData({ changeAmount: 0, saleCode: activeOrder.id ?? '' });
    setShowSuccess(true);
  }, [activeOrder, items]);

  const handlePaymentSuccess = useCallback(
    (result: { changeAmount: number; saleCode: string }) => {
      setShowPayment(false);
      setSuccessData(result);
      setShowSuccess(true);
      if (queueOrder) {
        queryClient.invalidateQueries({ queryKey: ['pos-cashier-queue'] });
        setQueueOrder(null);
      }
    },
    [queueOrder, queryClient]
  );

  const handleNewSale = useCallback(async () => {
    setShowSuccess(false);
    setSuccessData(null);
    await newCart();
  }, [newCart]);

  const handleCashMovement = useCallback(
    async (data: { amount: number; reason: string }) => {
      if (!currentSession || !cashMovementType) return;
      await cashMovement.mutateAsync({
        sessionId: currentSession.id,
        type: cashMovementType,
        amount: data.amount,
        reason: data.reason || undefined,
      });
      setCashMovementType(null);
    },
    [currentSession, cashMovementType, cashMovement]
  );

  const handleSelectCustomer = useCallback(
    (customerId: string, _customerName: string) => {
      setCustomer(customerId);
    },
    [setCustomer]
  );

  if (!terminal) {
    return null;
  }

  const mode = terminal.mode;
  const isCashier = mode === 'CASHIER';
  const showProductGrid =
    mode === 'SALES_ONLY' || mode === 'SALES_WITH_CHECKOUT';
  const canCharge = mode === 'SALES_WITH_CHECKOUT' || mode === 'CASHIER';

  return (
    <div className="flex h-dvh flex-col">
      {/* Action Bar */}
      <div className="shrink-0 border-b border-border px-4 py-2">
        <PageActionBar
          breadcrumbItems={BREADCRUMBS}
          actions={
            <div className="flex items-center gap-2">
              {/* Cart actions (non-cashier mode) */}
              {showProductGrid && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 px-2.5">
                        <RotateCcw className="h-4 w-4" />
                        <span className="hidden md:inline ml-1">
                          Resgatar Carrinho
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() => {
                          const code = window.prompt(
                            'Código do carrinho ou ID do pedido:'
                          );
                          if (code?.trim()) {
                            switchCart(code.trim());
                          }
                        }}
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Por código do carrinho
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5"
                    onClick={() => newCart()}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">Nova Venda</span>
                  </Button>
                </>
              )}

              {/* Cash movement buttons (when session is open) */}
              {currentSession && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5"
                    onClick={() => setCashMovementType('SUPPLY')}
                  >
                    <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                    <span className="hidden md:inline ml-1">Suprimento</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5"
                    onClick={() => setCashMovementType('WITHDRAWAL')}
                  >
                    <ArrowUpCircle className="h-4 w-4 text-rose-600" />
                    <span className="hidden md:inline ml-1">Sangria</span>
                  </Button>
                </>
              )}

              {/* Close session */}
              {currentSession && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2.5"
                  onClick={() => router.push('/sales/pos/session/close')}
                >
                  <Lock className="h-4 w-4" />
                  <span className="hidden md:inline ml-1">Fechar Caixa</span>
                </Button>
              )}

              {/* Mobile cart toggle */}
              {showProductGrid && (
                <button
                  type="button"
                  onClick={() => setShowMobileCart(true)}
                  className={cn(
                    'relative flex h-9 items-center gap-2 rounded-lg px-3 lg:hidden',
                    'bg-violet-600 text-white font-semibold shadow-sm',
                    items.length === 0 && 'opacity-50'
                  )}
                >
                  <ShoppingCart className="size-4" />
                  {itemCount > 0 && (
                    <span className="text-sm">{formatCurrency(total)}</span>
                  )}
                  {itemCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                      {itemCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          }
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {showProductGrid ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <ProductGrid onAddToCart={handleAddToCart} />
            </div>
            <div className="hidden w-[380px] shrink-0 lg:flex">
              <BalcaoCart
                onCharge={canCharge ? handleCharge : handleSendToCashier}
                onIdentifyCustomer={() => setShowCustomerWizard(true)}
                className="w-full"
              />
            </div>
          </>
        ) : isCashier ? (
          <div className="flex-1 overflow-y-auto p-4">
            <CashierQueue onChargeOrder={handleChargeQueueOrder} />
          </div>
        ) : null}
      </div>

      {/* Mobile cart sheet */}
      {showMobileCart && showProductGrid && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileCart(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-950">
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            </div>
            <BalcaoCart
              onCharge={() => {
                setShowMobileCart(false);
                if (canCharge) handleCharge();
                else handleSendToCashier();
              }}
              onIdentifyCustomer={() => {
                setShowMobileCart(false);
                setShowCustomerWizard(true);
              }}
              className="max-h-[80vh] border-l-0"
            />
          </div>
        </div>
      )}

      {/* Payment Overlay */}
      {canCharge && (
        <PaymentOverlay
          isOpen={showPayment}
          onClose={() => {
            setShowPayment(false);
            setQueueOrder(null);
          }}
          total={total}
          orderId={queueOrder?.id ?? activeOrder?.id ?? ''}
          terminalMode="FAST_CHECKOUT"
          posSessionId={currentSession?.id}
          expectedVersion={activeOrder?.version ?? 0}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Success Screen */}
      <SuccessScreen
        isOpen={showSuccess}
        saleCode={successData?.saleCode ?? ''}
        total={total}
        changeAmount={successData?.changeAmount ?? 0}
        payments={[]}
        onNewSale={handleNewSale}
        onClose={() => setShowSuccess(false)}
      />

      {/* Cash Movement Modal */}
      {cashMovementType && (
        <CashMovementModal
          isOpen={!!cashMovementType}
          onClose={() => setCashMovementType(null)}
          type={cashMovementType}
          onConfirm={handleCashMovement}
          isPending={cashMovement.isPending}
        />
      )}

      {/* Customer Identification Wizard */}
      <PosCustomerWizard
        open={showCustomerWizard}
        onOpenChange={setShowCustomerWizard}
        onSelectCustomer={handleSelectCustomer}
        allowAnonymous={terminal.allowAnonymous}
      />
    </div>
  );
}
