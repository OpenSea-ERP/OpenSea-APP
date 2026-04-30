import type { Meta, StoryObj } from '@storybook/react';
import { SalesKPICards } from './sales-kpi-cards';
import type { SalesDashboardData } from '@/hooks/sales/use-sales-dashboard';

/**
 * `SalesKPICards` — quatro cards de métricas (Faturamento, Pedidos, Ticket
 * Médio, Conversão) usados no topo do dashboard de vendas. Componente
 * puramente visual: recebe `data` (já agregado) + `isLoading`. Nenhum hook
 * de fetch — a story só varia o objeto.
 */
const meta = {
  title: 'Modules/Sales/SalesKPICards',
  component: SalesKPICards,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Linha de KPIs do dashboard de vendas. Os números chegam prontos do hook `useSalesDashboard` — a story testa apenas a apresentação (cores por accent, skeleton, fallback sem dados).',
      },
    },
  },
} satisfies Meta<typeof SalesKPICards>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseData: SalesDashboardData = {
  monthlyRevenue: 184_530.55,
  monthlyOrderCount: 312,
  averageTicket: 591.45,
  conversionRate: 38.7,
  ordersByStage: {},
  dailySales: [],
  totalCustomers: 1450,
  openDeals: 27,
  pendingOrders: 14,
  recentOrders: [],
};

export const Default: Story = {
  args: {
    data: baseData,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    data: undefined,
    isLoading: true,
  },
};

export const HighVolume: Story = {
  name: 'High volume (loja agressiva)',
  args: {
    data: {
      ...baseData,
      monthlyRevenue: 2_847_900.0,
      monthlyOrderCount: 4821,
      averageTicket: 590.94,
      conversionRate: 64.2,
      pendingOrders: 87,
    },
    isLoading: false,
  },
};

export const SlowMonth: Story = {
  name: 'Slow month (poucos pedidos)',
  args: {
    data: {
      ...baseData,
      monthlyRevenue: 4_320.5,
      monthlyOrderCount: 9,
      averageTicket: 480.06,
      conversionRate: 8.3,
      pendingOrders: 2,
    },
    isLoading: false,
  },
};

export const Empty: Story = {
  name: 'Empty (sem dados — retorna null)',
  parameters: {
    docs: {
      description: {
        story:
          'Quando `data` é `undefined` e `isLoading` é `false`, o componente retorna `null` (early return). A story renderiza um placeholder textual.',
      },
    },
  },
  render: () => (
    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      Sem dados — componente retorna null
    </div>
  ),
};
