import type { Meta, StoryObj } from '@storybook/react';
import { SuccessScreen } from './success-screen';

/**
 * `SuccessScreen` — fullscreen overlay exibido após `receivePayment` retornar
 * sucesso no PDV. Mostra checkmark animado (framer-motion), código da venda,
 * total, troco e breakdown de pagamentos. CTA "Nova Venda" reseta o fluxo.
 *
 * Touch targets: botão CTA `h-14` (56px) — confortável para toque rápido em
 * tablets de PDV.
 */
const meta = {
  title: 'Modules/Sales/SuccessScreen',
  component: SuccessScreen,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Tela de confirmação de venda do PDV. Animações framer-motion encadeadas (checkmark → título → troco → cards → CTA) dão sensação de fechamento.',
      },
    },
  },
} satisfies Meta<typeof SuccessScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    saleCode: 'PDV-2026-04-30-0142',
    total: 145.8,
    changeAmount: 4.2,
    payments: [
      { method: 'CASH', amount: 100.0 },
      { method: 'PIX', amount: 50.0 },
    ],
    onNewSale: () => {},
    onClose: () => {},
  },
};

export const NoChange: Story = {
  name: 'No change (pagamento exato)',
  args: {
    isOpen: true,
    saleCode: 'PDV-2026-04-30-0143',
    total: 89.9,
    changeAmount: 0,
    payments: [{ method: 'CREDIT_CARD', amount: 89.9 }],
    onNewSale: () => {},
    onClose: () => {},
  },
};

export const SplitPayment: Story = {
  name: 'Split payment (3 formas)',
  args: {
    isOpen: true,
    saleCode: 'PDV-2026-04-30-0144',
    total: 1250.0,
    changeAmount: 0,
    payments: [
      { method: 'CREDIT_CARD', amount: 800.0 },
      { method: 'PIX', amount: 350.0 },
      { method: 'STORE_CREDIT', amount: 100.0 },
    ],
    onNewSale: () => {},
    onClose: () => {},
  },
};

export const LargeChange: Story = {
  name: 'Large change (cliente pagou R$ 200 em conta de R$ 6,50)',
  args: {
    isOpen: true,
    saleCode: 'PDV-2026-04-30-0145',
    total: 6.5,
    changeAmount: 193.5,
    payments: [{ method: 'CASH', amount: 200.0 }],
    onNewSale: () => {},
    onClose: () => {},
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: {
    isOpen: true,
    saleCode: 'PDV-2026-04-30-0146',
    total: 45.9,
    changeAmount: 0,
    payments: [{ method: 'PIX', amount: 45.9 }],
    onNewSale: () => {},
    onClose: () => {},
  },
};
