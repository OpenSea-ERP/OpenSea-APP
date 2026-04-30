import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SessionCloseModal } from './session-close-modal';

/**
 * `SessionCloseModal` — wizard de 3 etapas para fechamento de caixa:
 * Contagem → Conferência → Confirmação. Mostra diferença entre valor
 * esperado e contado (verde se confere, rose se diverge).
 *
 * Touch targets: Numpad e botões 56px+ (uso em pé, jornada longa).
 */
const meta = {
  title: 'Modules/Sales/SessionCloseModal',
  component: SessionCloseModal,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Wizard de fechamento de caixa em 3 passos. Etapa 2 mostra breakdown por forma de pagamento — auditável e visível antes da confirmação.',
      },
    },
  },
} satisfies Meta<typeof SessionCloseModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseBreakdown = [
  { method: 'Dinheiro', total: 432.5, count: 8 },
  { method: 'PIX', total: 1245.9, count: 14 },
  { method: 'Cartão Crédito', total: 2180.0, count: 9 },
  { method: 'Cartão Débito', total: 480.0, count: 4 },
];

function InteractiveTemplate({
  expectedBalance,
  breakdown,
  isPending,
}: {
  expectedBalance: number;
  breakdown: typeof baseBreakdown;
  isPending?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <SessionCloseModal
      isOpen={open}
      onClose={() => setOpen(false)}
      expectedBalance={expectedBalance}
      breakdown={breakdown}
      onConfirm={() => setOpen(false)}
      isPending={isPending}
    />
  );
}

export const Default: Story = {
  render: () => (
    <InteractiveTemplate expectedBalance={4338.4} breakdown={baseBreakdown} />
  ),
};

export const NoBreakdown: Story = {
  name: 'No breakdown (turno sem vendas)',
  render: () => <InteractiveTemplate expectedBalance={150.0} breakdown={[]} />,
};

export const Pending: Story = {
  name: 'Pending (fechando caixa)',
  render: () => (
    <InteractiveTemplate
      expectedBalance={4338.4}
      breakdown={baseBreakdown}
      isPending
    />
  ),
};

export const HighVolume: Story = {
  name: 'High volume (300+ transações no dia)',
  render: () => (
    <InteractiveTemplate
      expectedBalance={32_485.7}
      breakdown={[
        { method: 'Dinheiro', total: 4820.5, count: 87 },
        { method: 'PIX', total: 12_445.2, count: 142 },
        { method: 'Cartão Crédito', total: 11_220.0, count: 56 },
        { method: 'Cartão Débito', total: 4000.0, count: 21 },
      ]}
    />
  ),
};
