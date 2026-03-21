'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GridLoading } from '@/components/shared/grid-loading';
import {
  useActiveSession,
  useOpenPosSession,
  useClosePosSession,
} from '@/hooks/sales';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  DollarSign,
  LogOut,
  ArrowLeft,
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export default function PosCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const terminalId = params.terminalId as string;

  const { data: session, isLoading: sessionLoading } =
    useActiveSession(terminalId);
  const openSession = useOpenPosSession();
  const closeSession = useClosePosSession();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input
  useEffect(() => {
    if (session && searchRef.current) {
      searchRef.current.focus();
    }
  }, [session]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'F5') {
        e.preventDefault();
        // Remove last item
        setCart(prev => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddToCart = useCallback(
    (product: { id: string; name: string; sku: string; price: number }) => {
      setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          return prev.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            sku: product.sku,
            unitPrice: product.price,
            quantity: 1,
          },
        ];
      });
      setSearchQuery('');
      searchRef.current?.focus();
    },
    []
  );

  const handleRemoveItem = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

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

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const grandTotal = subtotal;

  const handleOpenSession = async () => {
    const balance = parseFloat(openingBalance) || 0;
    await openSession.mutateAsync({
      terminalId,
      openingBalance: balance,
    });
    setOpeningBalance('');
  };

  const handleCloseSession = async () => {
    if (!session) return;
    await closeSession.mutateAsync({
      sessionId: session.id,
      terminalId,
      data: {
        closingBalance: 0,
      },
    });
    router.push('/sales/pos');
  };

  // Session opening screen
  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <GridLoading />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Card className="w-full max-w-md p-8 bg-white dark:bg-slate-800/60 border border-border">
          <div className="text-center mb-6">
            <DollarSign className="mx-auto h-12 w-12 text-primary mb-3" />
            <h2 className="text-xl font-bold">Abrir Caixa</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Informe o valor de abertura do caixa
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Valor de Abertura (R$)
              </label>
              <Input
                type="number"
                placeholder="0,00"
                value={openingBalance}
                onChange={e => setOpeningBalance(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOpenSession()}
                min="0"
                step="0.01"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleOpenSession}
              disabled={openSession.isPending}
            >
              {openSession.isPending ? 'Abrindo...' : 'Abrir Caixa'}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/sales/pos')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Main POS checkout (Fast Checkout mode)
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Left panel — Search & products */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/sales/pos')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">PDV - Caixa Rapido</h1>
              <p className="text-xs text-muted-foreground">
                Sessao #{session.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleCloseSession}>
            <LogOut className="mr-2 h-4 w-4" />
            Fechar Caixa
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Buscar produto (F2) — codigo de barras, SKU ou nome..."
            className="pl-10 h-12 text-lg"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                // Demo: add a mock product for testing
                handleAddToCart({
                  id: `demo-${Date.now()}`,
                  name: searchQuery,
                  sku: `SKU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                  price: Math.round(Math.random() * 100 * 100) / 100,
                });
              }
            }}
          />
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: 'F2', label: 'Buscar' },
            { key: 'F5', label: 'Remover item' },
            { key: 'F10', label: 'Finalizar' },
          ].map(shortcut => (
            <Badge key={shortcut.key} variant="outline" className="text-xs">
              <kbd className="font-mono mr-1">{shortcut.key}</kbd>
              {shortcut.label}
            </Badge>
          ))}
        </div>

        {/* Recent / catalog area (placeholder) */}
        <div className="flex-1 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <ShoppingCart className="mx-auto h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">
              Escaneie ou busque um produto para adicionar
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — Cart */}
      <div className="w-[400px] bg-white dark:bg-slate-800/60 border-l border-border flex flex-col">
        {/* Cart header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Carrinho</h2>
            <Badge variant="secondary">{cart.length} itens</Badge>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Carrinho vazio
            </p>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.sku}</p>
                  <p className="text-sm font-semibold mt-1">
                    R$ {(item.unitPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-rose-500 hover:text-rose-600"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart summary */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>TOTAL</span>
            <span className="text-primary">R$ {grandTotal.toFixed(2)}</span>
          </div>

          <Button
            className="w-full h-14 text-lg font-bold"
            disabled={cart.length === 0}
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Finalizar Venda (F10)
          </Button>
        </div>
      </div>
    </div>
  );
}
