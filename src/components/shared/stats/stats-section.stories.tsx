import type { Meta, StoryObj } from '@storybook/react';
import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsSection } from './stats-section';

const meta = {
  title: 'Shared/Stats/StatsSection',
  component: StatsSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Stats expansível com cards. Os stats são passados via prop `stats: StatCard[]`. Por padrão `defaultExpanded=false`; nas stories abrimos via `defaultExpanded` para visualização. **Gaps documentados:** sem prop `loading` nativa (story `WithLoading` simula via skeleton dentro de `value`); sem estado `empty` próprio (story `Empty` passa array vazio — o cabeçalho aparece, mas nenhum card é renderizado).',
      },
    },
  },
} satisfies Meta<typeof StatsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-background min-h-[320px] p-6">{children}</div>
);

export const Default: Story = {
  render: () => (
    <Wrap>
      <StatsSection
        defaultExpanded
        stats={[
          {
            label: 'Faturamento',
            value: 'R$ 124.500',
            trend: 12,
            icon: <DollarSign className="w-5 h-5" />,
          },
          {
            label: 'Pedidos',
            value: 348,
            trend: -3,
            icon: <ShoppingCart className="w-5 h-5" />,
          },
        ]}
      />
    </Wrap>
  ),
};

export const FourCards: Story = {
  render: () => (
    <Wrap>
      <StatsSection
        defaultExpanded
        title="Visão geral"
        stats={[
          {
            label: 'Faturamento',
            value: 'R$ 124.500',
            trend: 12,
            icon: <DollarSign className="w-5 h-5" />,
          },
          {
            label: 'Pedidos',
            value: 348,
            trend: -3,
            icon: <ShoppingCart className="w-5 h-5" />,
          },
          {
            label: 'Produtos ativos',
            value: 1240,
            trend: 8,
            icon: <Package className="w-5 h-5" />,
          },
          {
            label: 'Clientes',
            value: 5821,
            trend: 21,
            icon: <Users className="w-5 h-5" />,
          },
        ]}
      />
    </Wrap>
  ),
};

export const WithLoading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '**Gap de API:** o componente não tem prop `isLoading`. Aqui passamos `<Skeleton />` no `value` (que aceita `string | number`, então usamos string vazia + um truque visual via icon). Recomenda-se adicionar `isLoading?: boolean` para um skeleton padronizado.',
      },
    },
  },
  render: () => (
    <Wrap>
      <StatsSection
        defaultExpanded
        title="Carregando"
        stats={[
          {
            label: 'Faturamento',
            value: '—',
            icon: <Skeleton className="w-5 h-5 rounded" />,
          },
          {
            label: 'Pedidos',
            value: '—',
            icon: <Skeleton className="w-5 h-5 rounded" />,
          },
          {
            label: 'Produtos ativos',
            value: '—',
            icon: <Skeleton className="w-5 h-5 rounded" />,
          },
          {
            label: 'Clientes',
            value: '—',
            icon: <Skeleton className="w-5 h-5 rounded" />,
          },
        ]}
      />
    </Wrap>
  ),
};

export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '**Gap:** sem estado `empty` nativo — o cabeçalho clicável fica visível, mas nenhum card é renderizado. Recomenda-se adicionar uma EmptyState ou prop `emptyText`.',
      },
    },
  },
  render: () => (
    <Wrap>
      <StatsSection defaultExpanded title="Sem dados" stats={[]} />
      <p className="text-sm text-muted-foreground mt-2">
        Nenhuma métrica disponível para o período selecionado.
      </p>
    </Wrap>
  ),
};
