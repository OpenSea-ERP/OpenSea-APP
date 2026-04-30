import type { Meta, StoryObj } from '@storybook/react';
import type { Variant } from '@/types/stock';
import { VariantList } from './variant-list';

/**
 * `VariantList` exibe variantes de produto em formato tabular com:
 * swatch de cor, nome + referência, ícones de status (fora-de-linha,
 * desativado, alertas de reposição), faixa de estoque, custo + margem,
 * preço final e ações (editar/excluir).
 *
 * Componente pure-props (memo): toda a interação é delegada via callbacks.
 */
const meta = {
  title: 'Modules/Stock/VariantList',
  component: VariantList,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Tabela de variantes da página de detalhe do produto. Tooltips em status icons (`outOfLine`, `isActive=false`, alertas de reposição) e ações por linha (Editar/Excluir). Suporta empty state com CTA de criação.',
      },
    },
  },
} satisfies Meta<typeof VariantList>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-[400px] p-6">{children}</div>
);

const noop = () => {};

const baseVariant: Variant = {
  id: 'v-1',
  productId: 'p-1',
  name: 'Camiseta básica - Preto - P',
  price: 89.9,
  costPrice: 32.5,
  profitMargin: 63.85,
  attributes: {},
  colorHex: '#0f172a',
  reference: 'CAM-PT-P',
  outOfLine: false,
  isActive: true,
  createdAt: '2026-04-01T10:00:00Z',
};

const sampleVariants: Variant[] = [
  baseVariant,
  {
    ...baseVariant,
    id: 'v-2',
    name: 'Camiseta básica - Branco - M',
    reference: 'CAM-BR-M',
    colorHex: '#f8fafc',
    price: 89.9,
    costPrice: 32.5,
    profitMargin: 63.85,
    minStock: 10,
    maxStock: 100,
    reorderPoint: 15,
    reorderQuantity: 50,
  },
  {
    ...baseVariant,
    id: 'v-3',
    name: 'Camiseta básica - Vermelho - G',
    reference: 'CAM-VM-G',
    colorHex: '#dc2626',
    price: 99.9,
    costPrice: 38.0,
    profitMargin: 61.96,
    outOfLine: true,
  },
  {
    ...baseVariant,
    id: 'v-4',
    name: 'Camiseta premium - Azul Marinho - GG',
    reference: 'CAM-AZ-GG',
    colorHex: '#1e3a8a',
    price: 129.9,
    costPrice: 52.0,
    profitMargin: 59.97,
    isActive: false,
  },
  {
    ...baseVariant,
    id: 'v-5',
    name: 'Camiseta básica - Sem cor definida - U',
    reference: 'CAM-NC-U',
    colorHex: undefined,
    price: 79.9,
  },
];

export const Default: Story = {
  render: () =>
    wrap(
      <VariantList
        variants={sampleVariants}
        onEdit={noop}
        onDelete={noop}
        onAdd={noop}
      />
    ),
};

export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado vazio: oferece CTA "Criar Primeira Variante" centralizado.',
      },
    },
  },
  render: () =>
    wrap(
      <VariantList variants={[]} onEdit={noop} onDelete={noop} onAdd={noop} />
    ),
};

export const SingleVariant: Story = {
  render: () =>
    wrap(
      <VariantList
        variants={[sampleVariants[0]]}
        onEdit={noop}
        onDelete={noop}
        onAdd={noop}
      />
    ),
};

export const WithStockAlerts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Todas as variantes possuem `minStock`/`maxStock`/`reorderPoint` — exibe ícone de alerta amarelo no nome.',
      },
    },
  },
  render: () =>
    wrap(
      <VariantList
        variants={sampleVariants.map(v => ({
          ...v,
          minStock: 5,
          maxStock: 50,
          reorderPoint: 10,
          reorderQuantity: 25,
        }))}
        onEdit={noop}
        onDelete={noop}
        onAdd={noop}
      />
    ),
};

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`isLoading` desabilita as ações por linha (botões Editar/Excluir) durante mutações.',
      },
    },
  },
  render: () =>
    wrap(
      <VariantList
        variants={sampleVariants.slice(0, 3)}
        onEdit={noop}
        onDelete={noop}
        onAdd={noop}
        isLoading
      />
    ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () =>
    wrap(
      <VariantList
        variants={sampleVariants}
        onEdit={noop}
        onDelete={noop}
        onAdd={noop}
      />
    ),
};
