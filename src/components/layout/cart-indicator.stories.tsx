import type { Meta, StoryObj } from '@storybook/react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartIndicator } from './cart-indicator';

/**
 * `CartIndicator` é o ícone do carrinho na navbar com badge de contagem.
 *
 * **Constraint de Storybook:** o componente lê `itemCount` via
 * `useCartDataSafe`, que tenta `require('@/providers/cart-provider')`. Quando
 * o `CartProvider` não está montado, o hook retorna `{ itemCount: 0 }` por
 * fallback (try/catch no próprio componente). Como o provider real depende de
 * múltiplos hooks de PDV (queries autenticadas + localStorage), não montamos
 * ele aqui.
 *
 * - **Default:** renderiza o componente real (badge fica oculto, `itemCount = 0`).
 * - **WithItems / WithLargeCount / WithCheckout:** réplicas visuais do mesmo
 *   markup com `itemCount` controlado por prop, para storiar o badge sem
 *   provider. Os botões são meramente visuais (não abrem o `CartSheet`).
 */
const meta = {
  title: 'Layout/CartIndicator',
  component: CartIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Ícone do carrinho na navbar com badge de contagem. Default usa o componente real (sem provider, badge oculto). Variantes com badge usam réplicas visuais — ver doc inline.',
      },
    },
  },
} satisfies Meta<typeof CartIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background flex items-center justify-center p-8">
    {children}
  </div>
);

/**
 * Synthetic visual replica — same markup as CartIndicator, but with itemCount
 * driven by prop for badge variants. Click is no-op (no CartSheet).
 */
function CartIndicatorPreview({ itemCount }: { itemCount: number }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-xl relative"
      aria-label="Carrinho"
    >
      <ShoppingCart className="w-5 h-5" />
      {itemCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
        >
          {itemCount > 9 ? '9+' : itemCount}
        </motion.div>
      )}
    </Button>
  );
}

export const Default: Story = {
  name: 'Default (sem itens — componente real)',
  render: () => wrap(<CartIndicator />),
};

export const WithItems: Story = {
  name: 'WithItems (3 itens — réplica visual)',
  render: () => wrap(<CartIndicatorPreview itemCount={3} />),
};

export const WithLargeCount: Story = {
  name: 'WithLargeCount (9+ — réplica visual)',
  render: () => wrap(<CartIndicatorPreview itemCount={42} />),
};

export const WithCheckout: Story = {
  name: 'WithCheckout (preview com label — réplica visual)',
  render: () =>
    wrap(
      <div className="flex items-center gap-3">
        <CartIndicatorPreview itemCount={5} />
        <span className="text-sm text-muted-foreground">
          5 itens prontos para envio ao caixa
        </span>
      </div>
    ),
};
