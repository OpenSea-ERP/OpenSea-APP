'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScanLine, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CartProvider,
  useCartData,
  useCartActions,
} from '@/providers/cart-provider';
import { ProductGrid } from '@/components/sales/product-grid';
import type { ProductVariant } from '@/components/sales/product-grid';
import { PaymentOverlay } from '@/components/sales/payment-overlay';
import { SuccessScreen } from '@/components/sales/success-screen';
import {
  useDeviceTerminal,
  useOpenTotemSession,
} from '@/hooks/sales';
import { formatCurrency } from '@/lib/utils';

export default function TotemPage() {
  return (
    <CartProvider>
      <TotemTerminal />
    </CartProvider>
  );
}

function TotemTerminal() {
  const router = useRouter();
  const { terminal, currentSession, isLoading } = useDeviceTerminal();
  const openTotem = useOpenTotemSession();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [totemCode, setTotemCode] = useState('');

  const [showWelcome, setShowWelcome] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    changeAmount: number;
    saleCode: string;
  } | null>(null);

  const { activeOrder, items } = useCartData();
  const { addItem, newCart } = useCartActions();

  const total = activeOrder?.grandTotal ?? 0;
  const hasSession = !!currentSession;

  // If terminal isn't TOTEM, redirect away
  useEffect(() => {
    if (!isLoading && terminal && terminal.mode !== 'TOTEM') {
      router.replace('/sales/pos');
    }
  }, [isLoading, terminal, router]);

  const handleStart = useCallback(async () => {
    setShowWelcome(false);
    if (!activeOrder) {
      await newCart().catch(() => {});
    }
  }, [activeOrder, newCart]);

  const handleAddToCart = useCallback(
    (variant: ProductVariant) => {
      addItem(variant.id);
    },
    [addItem]
  );

  const handleCheckout = useCallback(() => {
    if (!activeOrder || items.length === 0) return;
    setShowPayment(true);
  }, [activeOrder, items]);

  const handleOpenTotem = useCallback(async () => {
    if (totemCode.trim().length < 4) return;
    await openTotem.mutateAsync({ totemCode: totemCode.trim().toUpperCase() });
    setShowOpenModal(false);
    setTotemCode('');
  }, [totemCode, openTotem]);

  const handlePaymentSuccess = useCallback(
    (result: { changeAmount: number; saleCode: string }) => {
      setShowPayment(false);
      setSuccessData(result);
      setShowSuccess(true);
    },
    []
  );

  const handleNewSale = useCallback(async () => {
    setShowSuccess(false);
    setSuccessData(null);
    setShowWelcome(true);
    await newCart().catch(() => {});
  }, [newCart]);

  // Welcome screen (no session OR before user starts)
  if (!hasSession || showWelcome) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-950/40 dark:via-slate-950 dark:to-orange-950/40 p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl shadow-amber-500/30 mb-6">
            <ScanLine className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">OpenSea PDV</h1>
          <p className="text-lg text-muted-foreground mb-8">
            {hasSession
              ? 'Toque para iniciar o atendimento'
              : 'Bem-vindo!'}
          </p>

          {hasSession ? (
            <Button
              size="lg"
              className="h-14 px-10 text-lg"
              onClick={handleStart}
            >
              Iniciar Atendimento
            </Button>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Este totem ainda não está em operação.
              </p>
              <div className="flex flex-col gap-3 items-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  ─── ou ───
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowOpenModal(true)}
                >
                  Admin: Abrir Totem
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Open Totem modal */}
        <Dialog open={showOpenModal} onOpenChange={setShowOpenModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Totem</DialogTitle>
              <DialogDescription>
                Informe o código do totem para iniciar a operação.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="totem-code">Código do totem</Label>
              <Input
                id="totem-code"
                value={totemCode}
                onChange={e =>
                  setTotemCode(e.target.value.toUpperCase().slice(0, 8))
                }
                placeholder="ABCD1234"
                className="font-mono text-center text-2xl tracking-widest h-14"
                maxLength={8}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowOpenModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleOpenTotem}
                disabled={openTotem.isPending || totemCode.trim().length < 4}
              >
                {openTotem.isPending ? 'Abrindo...' : 'Abrir Totem'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Self-service shopping screen
  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-border bg-white dark:bg-slate-900 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
            <ScanLine className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">{terminal?.terminalName}</h1>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setShowWelcome(true);
          }}
        >
          Cancelar
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <ProductGrid onAddToCart={handleAddToCart} />
      </div>

      {/* Floating cart bar */}
      {items.length > 0 && (
        <div className="border-t border-border bg-white dark:bg-slate-900 p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {items.length} item(ns)
                </p>
                <p className="font-mono font-bold text-2xl">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="h-14 px-8 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleCheckout}
            >
              Finalizar Compra
            </Button>
          </div>
        </div>
      )}

      <PaymentOverlay
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={total}
        orderId={activeOrder?.id ?? ''}
        terminalMode="FAST_CHECKOUT"
        posSessionId={currentSession?.id}
        expectedVersion={activeOrder?.version ?? 0}
        onSuccess={handlePaymentSuccess}
      />

      <SuccessScreen
        isOpen={showSuccess}
        saleCode={successData?.saleCode ?? ''}
        total={total}
        changeAmount={successData?.changeAmount ?? 0}
        payments={[]}
        onNewSale={handleNewSale}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}
