import type { Meta, StoryObj } from '@storybook/react';
import { DeliveryStatusBadge } from './delivery-status-badge';

const meta = {
  title: 'Modules/Devices/DeliveryStatusBadge',
  component: DeliveryStatusBadge,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Chip semântico de status de entrega de webhook (Phase 11). Mapeia 4 estados — DELIVERED (esmeralda) / PENDING (céu) / FAILED (âmbar — em retry) / DEAD (rosa) — com ícone Lucide e paleta dual-theme.',
      },
    },
  },
} satisfies Meta<typeof DeliveryStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Entregue: Story = {
  args: { status: 'DELIVERED' },
};

export const Pendente: Story = {
  args: { status: 'PENDING' },
};

export const EmRetry: Story = {
  args: { status: 'FAILED' },
};

export const Morta: Story = {
  args: { status: 'DEAD' },
};

export const TodosEstados: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <DeliveryStatusBadge status="DELIVERED" />
      <DeliveryStatusBadge status="PENDING" />
      <DeliveryStatusBadge status="FAILED" />
      <DeliveryStatusBadge status="DEAD" />
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <DeliveryStatusBadge status="DELIVERED" />
      <DeliveryStatusBadge status="PENDING" />
      <DeliveryStatusBadge status="FAILED" />
      <DeliveryStatusBadge status="DEAD" />
    </div>
  ),
};
