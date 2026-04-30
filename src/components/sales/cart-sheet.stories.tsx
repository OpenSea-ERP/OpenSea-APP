import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  ArrowLeftRight,
  CreditCard,
  Minus,
  Plus,
  Send,
  ShoppingCart,
  Trash2,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CartSheet } from './cart-sheet';
import { cn, formatCurrency } from '@/lib/utils';

/**
 * `CartSheet` — slide-over lateral do PDV com a lista de itens, identificação
 * de cliente, summary financeiro e CTAs (Enviar para Caixa / Cobrar).
 *
 * **Constraint de Storybook:** o componente real depende de `CartProvider`
 * (`@/providers/cart-provider`) — sem ele os hooks `useCartData`/`useCartActions`
 * ficam mudos (fallback safe-import) e o sheet abre vazio. Para storiar os
 * estados ricos (com itens, cliente, draft count), usamos uma **réplica
 * visual** com o mesmo markup (mesmos `Sheet`, `Badge`, `ScrollArea` e ícones)
 * — pattern já adotado em `tenant-switcher.stories.tsx`.
 *
 * Touch targets: botões de quantidade `h-9 w-9` (36px) — abaixo do alvo POS
 * ideal (44px). **Gap registrado**: aumentar para 44px em revisão futura.
 */
const meta = {
  title: 'Modules/Sales/CartSheet',
  component: CartSheet,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Drawer do carrinho do PDV. Componente real consome `CartProvider`; aqui usamos réplica visual para storiar estados (vazio, com itens, com cliente, com desconto, draft).',
      },
    },
  },
} satisfies Meta<typeof CartSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

interface MockCartItem {
  id: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface ReplicaProps {
  items: MockCartItem[];
  customer: { name: string } | null;
  saleCode: string | null;
  discount: number;
  draftCount: number;
}

/** Synthetic visual replica — same markup as CartSheet, no provider. */
function CartSheetReplica({
  items,
  customer,
  saleCode,
  discount,
  draftCount,
}: ReplicaProps) {
  const [open, setOpen] = useState(true);
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const total = Math.max(0, subtotal - discount);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        showCloseButton
        className="sm:max-w-md w-full flex flex-col p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-violet-500" />
            <SheetTitle className="text-lg font-bold">Carrinho</SheetTitle>
            {saleCode && (
              <Badge
                variant="outline"
                className="ml-1 text-xs font-mono border-violet-300 text-violet-600 dark:border-violet-500/40 dark:text-violet-400"
              >
                {saleCode}
              </Badge>
            )}
            {draftCount > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Em espera: {draftCount}
              </Badge>
            )}
          </div>
          <SheetDescription className="sr-only">
            Lista de itens do carrinho do PDV com cliente, totais e ações.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-3 border-b border-border/50">
          {customer ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {customer.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
              >
                Alterar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-muted-foreground"
            >
              <User className="w-4 h-4" />
              Identificar cliente
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Carrinho vazio
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Adicione produtos ao carrinho para iniciar uma venda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {items.map(item => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {item.name}
                      </p>
                      {item.sku && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          SKU: {item.sku}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(item.price)} /un
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(item.subtotal)}
                      </p>
                      <button
                        type="button"
                        className="text-rose-500 hover:text-rose-600 p-0.5 rounded transition-colors"
                        aria-label={`Remover ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      disabled={item.quantity <= 1}
                      className={cn(
                        'h-9 w-9 rounded-full flex items-center justify-center border transition-colors',
                        'border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed'
                      )}
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className={cn(
                        'h-9 w-9 rounded-full flex items-center justify-center border transition-colors',
                        'border-border hover:bg-accent'
                      )}
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <SheetFooter className="flex-col gap-3 border-t border-border/50 p-4">
            <div className="w-full space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                  <span>Desconto</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-foreground pt-1 border-t border-border/50">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              <Button variant="outline" className="w-full gap-2">
                <Send className="w-4 h-4" />
                Enviar para Caixa
              </Button>
              <Button className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                <CreditCard className="w-4 h-4" />
                Cobrar
              </Button>
            </div>
            {draftCount > 0 && (
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full pt-1"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Trocar carrinho
              </button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

export const Empty: Story = {
  name: 'Empty (carrinho vazio)',
  render: () => (
    <CartSheetReplica
      items={[]}
      customer={null}
      saleCode={null}
      discount={0}
      draftCount={0}
    />
  ),
};

export const WithItems: Story = {
  name: 'With items (3 produtos)',
  render: () => (
    <CartSheetReplica
      items={[
        {
          id: 'i-1',
          name: 'Coca-Cola 350ml',
          sku: 'BEB-COCA-350',
          price: 6.5,
          quantity: 2,
          subtotal: 13.0,
        },
        {
          id: 'i-2',
          name: 'Pão Francês (kg)',
          sku: 'PAD-FR-001',
          price: 18.9,
          quantity: 1,
          subtotal: 18.9,
        },
        {
          id: 'i-3',
          name: 'Queijo Mussarela 500g',
          sku: 'LAT-MUSS-500',
          price: 32.5,
          quantity: 1,
          subtotal: 32.5,
        },
      ]}
      customer={null}
      saleCode="V-0142"
      discount={0}
      draftCount={0}
    />
  ),
};

export const WithCustomerAndDiscount: Story = {
  name: 'With customer + discount',
  render: () => (
    <CartSheetReplica
      items={[
        {
          id: 'i-1',
          name: 'Camiseta Algodão Premium',
          sku: 'CAM-001',
          price: 89.9,
          quantity: 2,
          subtotal: 179.8,
        },
        {
          id: 'i-2',
          name: 'Calça Jeans Slim',
          sku: 'CAL-SL-42',
          price: 199.9,
          quantity: 1,
          subtotal: 199.9,
        },
      ]}
      customer={{ name: 'João Silva' }}
      saleCode="V-0143"
      discount={37.97}
      draftCount={0}
    />
  ),
};

export const WithDraftCarts: Story = {
  name: 'With draft carts (2 em espera)',
  render: () => (
    <CartSheetReplica
      items={[
        {
          id: 'i-1',
          name: 'Sanduíche Natural',
          sku: 'LAN-SN-001',
          price: 14.5,
          quantity: 3,
          subtotal: 43.5,
        },
      ]}
      customer={{ name: 'Maria Oliveira' }}
      saleCode="V-0144"
      discount={0}
      draftCount={2}
    />
  ),
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <CartSheetReplica
      items={[
        {
          id: 'i-1',
          name: 'Coca-Cola 350ml',
          sku: 'BEB-COCA-350',
          price: 6.5,
          quantity: 1,
          subtotal: 6.5,
        },
      ]}
      customer={null}
      saleCode="V-0145"
      discount={0}
      draftCount={0}
    />
  ),
};
