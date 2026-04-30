import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { Timeline, type TimelineItemData } from './timeline';

const meta = {
  title: 'Shared/Timeline/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Timeline reutilizável para histórico de auditoria, atividade de entidades, etc. Suporta agrupamento por data, conector visual, variantes (default/compact), badges, mudanças de campo (old → new), avatar do usuário e ação inline.',
      },
    },
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

const NOW = new Date();
const HOURS_AGO = (h: number) =>
  new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString();
const DAYS_AGO = (d: number) =>
  new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

const baseItems: TimelineItemData[] = [
  {
    id: '1',
    type: 'create',
    title: 'Produto criado',
    description: 'Camiseta Algodão Premium foi adicionada ao catálogo.',
    timestamp: HOURS_AGO(1),
    user: { id: 'u1', name: 'Maria Silva' },
  },
  {
    id: '2',
    type: 'update',
    title: 'Preço atualizado',
    timestamp: HOURS_AGO(3),
    user: { id: 'u2', name: 'João Souza' },
    changes: [
      {
        field: 'price',
        label: 'Preço',
        oldValue: 'R$ 79,90',
        newValue: 'R$ 89,90',
      },
    ],
  },
  {
    id: '3',
    type: 'success',
    title: 'Pedido confirmado',
    description: 'Pedido #4231 confirmado e enviado para separação.',
    timestamp: HOURS_AGO(8),
    badge: { label: 'Confirmado', variant: 'default' },
    user: { id: 'u1', name: 'Maria Silva' },
  },
  {
    id: '4',
    type: 'warning',
    title: 'Estoque baixo',
    description: 'Variante CAM-001-M-AZ atingiu o limite mínimo (5 unidades).',
    timestamp: DAYS_AGO(1),
    badge: { label: 'Atenção', variant: 'secondary' },
  },
  {
    id: '5',
    type: 'delete',
    title: 'Variante removida',
    description:
      'CAM-001-XG-AZ removida (sem movimentação nos últimos 6 meses).',
    timestamp: DAYS_AGO(2),
    user: { id: 'u3', name: 'Carla Dias' },
  },
];

const wrap = (children: React.ReactNode) => (
  <div className="max-w-2xl">{children}</div>
);

export const Default: Story = {
  render: () => wrap(<Timeline items={baseItems} />),
};

export const Grouped: Story = {
  render: () => wrap(<Timeline items={baseItems} grouped />),
};

export const Compact: Story = {
  render: () => wrap(<Timeline items={baseItems} variant="compact" />),
};

export const WithActions: Story = {
  render: () =>
    wrap(
      <Timeline
        items={baseItems.slice(0, 3).map(item => ({
          ...item,
          action: (
            <Button size="sm" variant="ghost">
              Ver detalhes
            </Button>
          ),
          onClick: () => alert(`Click ${item.id}`),
        }))}
      />
    ),
};

export const Empty: Story = {
  render: () => wrap(<Timeline items={[]} />),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => wrap(<Timeline items={baseItems} grouped />),
};
